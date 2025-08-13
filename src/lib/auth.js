// Lightweight custom Auth0 integration (dev fallback)
// NOTE: This is a pared-down implementation to restore functionality; for production use the official SDK once stable.
import { isEmailVerified, createUnverifiedResponse } from './emailVerification';
import crypto from 'node:crypto';
import { extractRoles } from './roles';
import prisma from './prisma';

// Exportable constants for reuse (logout route needs them)
export const BASE_URL = (process.env.AUTH0_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const AUTH0_ISSUER = process.env.AUTH0_ISSUER_BASE_URL || `https://${process.env.AUTH0_DOMAIN}`;
export const CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const SCOPE = process.env.AUTH0_SCOPE || 'openid profile email';
const SESSION_COOKIE = 'shifter_session';
const SESSION_HMAC_SECRET = (process.env.AUTH0_SECRET || 'dev_secret').slice(0,64);
const STATE_COOKIE = 'shifter_oauth_state';
const NONCE_COOKIE = 'shifter_oauth_nonce';

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
}

function sign(data) {
  return b64url(crypto.createHmac('sha256', SESSION_HMAC_SECRET).update(data).digest());
}

function decodeIdToken(idToken) {
  try {
    const payload = idToken.split('.')[1];
    const buf = Buffer.from(payload.replace(/-/g,'+').replace(/_/g,'/'), 'base64');
    return JSON.parse(buf.toString('utf8'));
  } catch (e) {
    console.error('decodeIdToken error', e);
    return null;
  }
}

function parseCookies(header) {
  const out = {}; if (!header) return out;
  header.split(/; */).forEach(kv => { const idx = kv.indexOf('='); if (idx>0) out[decodeURIComponent(kv.slice(0,idx).trim())] = decodeURIComponent(kv.slice(idx+1).trim()); });
  return out;
}

function buildSetCookie({ name, value, maxAge, httpOnly = true }) {
  const attrs = [ `${name}=${encodeURIComponent(value)}` ];
  if (httpOnly) attrs.push('HttpOnly');
  attrs.push('Path=/');
  if (maxAge) attrs.push(`Max-Age=${maxAge}`);
  if (BASE_URL.startsWith('https://')) attrs.push('Secure');
  attrs.push('SameSite=Lax');
  return attrs.join('; ');
}

export async function startLogin(request) {
  const state = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${BASE_URL}/api/auth/callback`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: SCOPE,
    state,
    nonce
  });
  // Support forcing credential prompt: /api/auth/login?prompt=login or ?force=1
  try {
    const reqUrl = new URL(request.url);
    if (reqUrl.searchParams.get('prompt')) {
      params.set('prompt', reqUrl.searchParams.get('prompt'));
    } else if (reqUrl.searchParams.get('force') === '1') {
      params.set('prompt', 'login');
    }
  } catch {}
  const authUrl = `${AUTH0_ISSUER}/authorize?${params.toString()}`;
  
  // Always set fresh cookies, overwriting any existing ones
  const cookies = [
    buildSetCookie({ name: STATE_COOKIE, value: state, maxAge: 600 }), // 10 minutes
    buildSetCookie({ name: NONCE_COOKIE, value: nonce, maxAge: 600 })
  ];
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      'Set-Cookie': cookies
    }
  });
}

export async function handleCallback(request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code) return Response.json({ error: 'missing_code' }, { status: 400 });
    
    const cookies = parseCookies(request.headers.get('cookie') || '');
    const storedState = cookies[STATE_COOKIE];
    
    // Enhanced state validation with better error handling
    if (!storedState) {
      console.warn('No stored state cookie found - user may have cookies disabled or auth flow expired');
      return Response.json({ error: 'state_missing', message: 'Authentication expired. Please try logging in again.' }, { status: 400 });
    }
    
    if (storedState !== state) {
      console.warn('State mismatch:', { stored: storedState, received: state });
      // Clear potentially stale cookies and redirect to start fresh
      const clearCookies = [
        `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
        `${NONCE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
      ];
      return new Response(null, { 
        status: 302, 
        headers: { 
          Location: '/api/auth/login', 
          'Set-Cookie': clearCookies 
        } 
      });
    }
    const tokenResp = await fetch(`${AUTH0_ISSUER}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: `${BASE_URL}/api/auth/callback`
      })
    });
    if (!tokenResp.ok) {
      const txt = await tokenResp.text();
      return Response.json({ error: 'token_error', detail: txt }, { status: 500 });
    }
    const tokens = await tokenResp.json();
    const user = decodeIdToken(tokens.id_token) || {};
  const roles = extractRoles(user);
  const enrichedUser = { ...user, roles };
  // Persist / update user record with email verification status (Prisma store)
  try {
    if (user.sub) {
      await prisma.user.upsert({
        where: { id: user.sub },
        update: {
          name: user.name || user.nickname || null,
          email: user.email || null,
          role: roles[0] || null,
          emailVerified: user.email_verified ? true : false
        },
        create: {
          id: user.sub,
          name: user.name || user.nickname || null,
          email: user.email || null,
          role: roles[0] || null,
          emailVerified: user.email_verified ? true : false
        }
      });
    }
  } catch (persistErr) {
    console.warn('User persistence failed', persistErr);
  }
  const sessionPayload = JSON.stringify({ user: enrichedUser, access_token: tokens.access_token, id_token: tokens.id_token, exp: user.exp });
  const sig = sign(sessionPayload);
  const sessionData = b64url(sessionPayload) + '.' + sig;
  const sessionCookie = buildSetCookie({ name: SESSION_COOKIE, value: sessionData, maxAge: 60 * 60 * 8 });
    // Clear transient cookies
    const clearState = `${STATE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    const clearNonce = `${NONCE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    return new Response(null, { status: 302, headers: { Location: '/', 'Set-Cookie': [sessionCookie, clearState, clearNonce] } });
  } catch (e) {
    console.error('callback error', e);
    return Response.json({ error: 'callback_failed', message: e.message }, { status: 500 });
  }
}

export function buildLogoutResponse({ sso } = {}) {
  const clearCookies = [
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    `${NONCE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
  ];
  
  if (sso && AUTH0_ISSUER && CLIENT_ID && BASE_URL) {
    // Auth0 logout (must whitelist BASE_URL in Allowed Logout URLs)
    const logoutUrl = `${AUTH0_ISSUER}/v2/logout?client_id=${encodeURIComponent(CLIENT_ID)}&returnTo=${encodeURIComponent(BASE_URL)}`;
    console.log('SSO Logout URL:', logoutUrl); // Debug log
    return new Response(null, { status: 302, headers: { Location: logoutUrl, 'Set-Cookie': clearCookies } });
  }
  
  // Fallback to local logout
  console.log('Local logout - redirecting to:', BASE_URL || '/');
  return new Response(null, { status: 302, headers: { Location: BASE_URL || '/', 'Set-Cookie': clearCookies } });
}

export function clearSession(opts) { return buildLogoutResponse(opts); }

export function readSession(request) {
  try {
    const cookies = parseCookies(request.headers.get('cookie') || '');
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return null;
  const [b64, sig] = raw.split('.');
  if (!b64 || !sig) return null;
  const json = Buffer.from(b64.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString('utf8');
  const expected = sign(json);
  if (expected !== sig) return null;
  const data = JSON.parse(json);
    if (data.exp && Date.now()/1000 > data.exp) return null;
    return data;
  } catch (e) {
    return null;
  }
}

export async function getSession(request) {
  const data = readSession(request);
  if (!data) return null;
  // Recompute roles (future-proof if env logic changes)
  const roles = extractRoles(data.user);
  return { user: { ...data.user, roles }, accessToken: data.access_token, idToken: data.id_token };
}

export const withApiAuthRequired = (handler) => async (request) => {
  const session = await getSession(request);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return handler(request, session);
};

export async function getSessionFromRequest(req) { return getSession(req); }

export function withEmailVerification(handler) {
  return withApiAuthRequired(async (request, session) => {
    if (!isEmailVerified(session?.user)) {
      return createUnverifiedResponse();
    }
    return handler(request, session);
  });
}
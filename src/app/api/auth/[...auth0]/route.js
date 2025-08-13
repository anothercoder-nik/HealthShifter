import { handleAuth } from '@auth0/nextjs-auth0';

// Use built-in handler which maps login/logout/callback/me automatically
export const GET = handleAuth();
export const POST = handleAuth();

export const dynamic = 'force-dynamic';

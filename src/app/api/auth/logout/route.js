import { clearSession } from '../../../../lib/auth';

// Logout endpoint
// - Local session clear:  GET /api/auth/logout
// - Full Auth0 SSO logout: GET /api/auth/logout?sso=1  (redirects via Auth0 and returns to BASE_URL)
export async function GET(request) {
	const url = new URL(request.url);
	const sso = url.searchParams.get('sso') === '1';
	return clearSession({ sso });
}

export async function POST(request) {
	const url = new URL(request.url);
	const sso = url.searchParams.get('sso') === '1';
	return clearSession({ sso });
}

export const dynamic = 'force-dynamic';

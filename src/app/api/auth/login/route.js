import { startLogin } from '../../../../lib/auth';

export async function GET(request) {
	try {
		return await startLogin(request);
	} catch (e) {
		console.error('handleLogin failure', e);
		return Response.json({ error: 'login_failed', message: e?.message, stack: e?.stack }, { status: 500 });
	}
}

export const dynamic = 'force-dynamic';

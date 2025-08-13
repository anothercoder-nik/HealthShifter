import { getSession } from '../../../../lib/auth';

export async function GET(request) {
	try {
		console.log('ME route introspection start');
		const session = await getSession(request);
		if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 });
		return Response.json(session.user);
	} catch (e) {
		console.error('ME route failure', e);
		return Response.json({ error: 'me_failed', message: e?.message }, { status: 500 });
	}
}

export const dynamic = 'force-dynamic';

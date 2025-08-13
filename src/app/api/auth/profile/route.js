import { getSession } from '../../../../lib/auth';

export async function GET(request) {
	const session = await getSession(request);
	if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
	return Response.json(session.user);
}

export const dynamic = 'force-dynamic';

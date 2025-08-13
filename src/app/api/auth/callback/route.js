import { handleCallback } from '../../../../lib/auth';

export async function GET(request) {
  try {
    console.log('Callback hit with url', request.url);
  return await handleCallback(request);
  } catch (e) {
    console.error('handleCallback failure', e);
    return Response.json({ error: 'callback_failed', message: e?.message, stack: e?.stack }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

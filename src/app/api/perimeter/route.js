import prisma from "../../../lib/prisma";
import { getSession } from "../../../lib/auth";
import { extractRoles } from "../../../lib/roles";

export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: 'perimeter' } });
  return Response.json(setting ? JSON.parse(setting.value) : null);
}

export async function POST(request) {
  const session = await getSession(request);
  const roles = extractRoles(session?.user);
  if (!session || !roles.includes('manager')) {
    return new Response('Forbidden', { status: 403 });
  }
  const body = await request.json();
  // Accept either old or new field names
  const lat = Number(body.latitude ?? body.lat);
  const lng = Number(body.longitude ?? body.lng);
  const radius = Number(body.radius ?? body.radiusMeters ?? body.radiusMeters); // unify
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return Response.json({ error: 'invalid_coordinates' }, { status: 400 });
  }
  const value = JSON.stringify({ latitude: lat, longitude: lng, radius });
  await prisma.setting.upsert({
    where: { key: 'perimeter' },
    update: { value },
    create: { key: 'perimeter', value }
  });
  return Response.json({ ok: true });
}

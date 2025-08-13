import prisma from "../../../lib/prisma";
import dayjs from "dayjs";
import { getSession, withApiAuthRequired } from "../../../lib/auth";
import { insidePerimeter } from "../../../lib/geo";
import crypto from "node:crypto";
import { extractRoles } from "../../../lib/roles";

export const GET = withApiAuthRequired(async function shiftsHandler(request) {
  const session = await getSession(request);
  const userId = session?.user?.sub;
  const roles = extractRoles(session?.user);
  const isManager = roles.includes("manager");
  let shifts;
  if (isManager) {
    // For managers, show all shifts with user names
    shifts = await prisma.shift.findMany({
      orderBy: { clockInAt: 'desc' },
      include: { user: true }
    });
    // Transform to match expected format and convert BigInt to numbers
    shifts = shifts.map(s => ({
      ...s,
      clockInAt: Number(s.clockInAt),
      clockOutAt: s.clockOutAt ? Number(s.clockOutAt) : null,
      userName: s.user?.name,
      userEmail: s.user?.email
    }));
  } else if (userId) {
    shifts = await prisma.shift.findMany({
      where: { userId },
      orderBy: { clockInAt: 'desc' }
    });
    // Convert BigInt to numbers for JSON serialization
    shifts = shifts.map(s => ({
      ...s,
      clockInAt: Number(s.clockInAt),
      clockOutAt: s.clockOutAt ? Number(s.clockOutAt) : null
    }));
  } else {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json(shifts);
});

export const POST = withApiAuthRequired(async function shiftsPostHandler(request) {
  const session = await getSession(request);
  if (!session?.user?.sub) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.sub;
  
  // Ensure user exists with proper name and email
  await prisma.user.upsert({
    where: { id: userId },
    update: {
      name: session.user.name || session.user.nickname || 'Unknown User',
      email: session.user.email || null,
      role: extractRoles(session.user)[0] || 'employee',
      emailVerified: session.user.email_verified ? true : false
    },
    create: {
      id: userId,
      name: session.user.name || session.user.nickname || 'Unknown User',
      email: session.user.email || null,
      role: extractRoles(session.user)[0] || 'employee',
      emailVerified: session.user.email_verified ? true : false
    }
  });

  const body = await request.json();
  const { action, latitude, longitude, lat, lng, note, clockInNote, shiftId } = body || {};
  // Normalize coordinates and note
  const coordLat = latitude ?? lat;
  const coordLng = longitude ?? lng;
  const clockNote = note ?? clockInNote ?? null;

  if (action === "clockIn" || action === "in") {
    // Check if office is active (manager turned on the lights)
    const officeStatus = await prisma.officeStatus.findUnique({
      where: { id: 'office' }
    });
    
    if (!officeStatus || !officeStatus.isActive) {
      return new Response("Office is closed - Contact manager to open office", { status: 403 });
    }

    // geofence check
    const perimeter = await prisma.setting.findUnique({ where: { key: 'perimeter' } });
    if (perimeter) {
      try {
        const raw = JSON.parse(perimeter.value);
        // Support new unified schema { latitude, longitude, radius }
        // and legacy schemas { lat, lng, radiusMeters } or { centerLat, centerLng, radius }
        const clat = Number(raw.latitude ?? raw.lat ?? raw.centerLat);
        const clng = Number(raw.longitude ?? raw.lng ?? raw.centerLng);
        const radius = Number(raw.radius ?? raw.radiusMeters);
        if (!Number.isNaN(clat) && !Number.isNaN(clng) && !Number.isNaN(radius) && radius > 0) {
          const ok = insidePerimeter(Number(coordLat), Number(coordLng), clat, clng, radius);
          if (!ok) return new Response("Outside perimeter", { status: 403 });
        }
      } catch (e) {
        // If perimeter parse fails we skip enforcement rather than block clock in
        console.error('Perimeter parse error', e);
      }
    }
    const id = crypto.randomUUID();
    const now = dayjs().valueOf();
    const shift = await prisma.shift.create({
      data: {
        id,
        userId,
        clockInAt: now,
        clockInLat: coordLat ?? null,
        clockInLng: coordLng ?? null,
        clockInNote: clockNote
      }
    });
    return Response.json({ ok: true, id, clockInAt: now });
  }

  if (action === "clockOut" || action === "out") {
    // Check if office is active (manager turned on the lights)
    const officeStatus = await prisma.officeStatus.findUnique({
      where: { id: 'office' }
    });
    
    if (!officeStatus || !officeStatus.isActive) {
      return new Response("Office is closed - Contact manager to open office", { status: 403 });
    }

    const open = await prisma.shift.findFirst({
      where: { userId, clockOutAt: null },
      orderBy: { clockInAt: 'desc' }
    });
    if (!open) return new Response("No active shift", { status: 400 });
    const now = dayjs().valueOf();
    await prisma.shift.update({
      where: { id: open.id },
      data: {
        clockOutAt: now,
        clockOutLat: coordLat ?? null,
        clockOutLng: coordLng ?? null,
        clockOutNote: clockNote
      }
    });
    return Response.json({ ok: true, id: open.id, clockOutAt: now });
  }

  return new Response("Bad Request", { status: 400 });
});

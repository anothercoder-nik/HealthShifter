import prisma from "../../../lib/prisma";
import dayjs from "dayjs";

export async function GET() {
  const oneWeekAgo = dayjs().subtract(7, "day").valueOf();
  const shifts = await prisma.shift.findMany({
    where: { clockInAt: { gte: oneWeekAgo } }
  });

  // Convert BigInt timestamps to numbers for processing
  const shiftsWithNumbers = shifts.map(s => ({
    ...s,
    clockInAt: Number(s.clockInAt),
    clockOutAt: s.clockOutAt ? Number(s.clockOutAt) : null
  }));

  // Avg hours per day (over last 7 days)
  const byDay = new Map();
  shiftsWithNumbers.forEach((s) => {
    const day = dayjs(s.clockInAt).format("YYYY-MM-DD");
    const dur = (s.clockOutAt ? s.clockOutAt : Date.now()) - s.clockInAt;
    byDay.set(day, (byDay.get(day) || 0) + dur);
  });
  const avgHoursPerDay = Array.from(byDay.values()).reduce((a, b) => a + b, 0) / Math.max(byDay.size, 1) / 3600000;

  // Number of people clocking in each day
  const peoplePerDay = new Map();
  shiftsWithNumbers.forEach((s) => {
    const day = dayjs(s.clockInAt).format("YYYY-MM-DD");
    const set = peoplePerDay.get(day) || new Set();
    set.add(s.userId);
    peoplePerDay.set(day, set);
  });
  const peoplePerDayCounts = Array.from(peoplePerDay.entries()).map(([day, set]) => ({ day, count: set.size }));

  // Total hours per staff over last week
  const byUser = new Map();
  shiftsWithNumbers.forEach((s) => {
    const dur = (s.clockOutAt ? s.clockOutAt : Date.now()) - s.clockInAt;
    byUser.set(s.userId, (byUser.get(s.userId) || 0) + dur);
  });
  const totalHoursPerStaff = Array.from(byUser.entries()).map(([userId, ms]) => ({ userId, hours: ms / 3600000 }));

  return Response.json({
    avgHoursPerDay,
    peoplePerDay: peoplePerDayCounts,
    totalHoursPerStaff,
  });
}

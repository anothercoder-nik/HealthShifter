import { createSchema, createYoga } from "graphql-yoga";
import { getSession } from "../../../lib/auth";
import prisma from "../../../lib/prisma";
import crypto from "node:crypto";

const typeDefs = /* GraphQL */ `

  type Setting {
    key: String!
    value: String!
  }

  type OfficeStatus {
    id: ID!
    isActive: Boolean!
    activatedBy: String
    activatedAt: Int
    updatedAt: Int!
  }

  type User {
    id: ID!
    email: String
    name: String
    role: String
  }

  type Shift {
    id: ID!
    userId: String!
    user: User
    clockInAt: Int!
    clockInLat: Float
    clockInLng: Float
    clockInNote: String
    clockOutAt: Int
    clockOutLat: Float
    clockOutLng: Float
    clockOutNote: String
  }

  type Metrics {
    avgHoursPerDay: Float!
    peoplePerDay: [PeopleDay!]!
    totalHoursPerStaff: [StaffHours!]!
  }
  type PeopleDay { day: String!, count: Int! }
  type StaffHours { userId: String!, userName: String!, hours: Float! }

  type Query {
    me: String
    emailVerified: Boolean!
  userEmailVerified(id: String!): Boolean!
    officeStatus: OfficeStatus
    shifts: [Shift!]!
    perimeter: Setting
    metrics: Metrics!
  }

  input PerimeterInput { lat: Float!, lng: Float!, radiusMeters: Int! }
  input ClockInput { lat: Float, lng: Float, note: String }

  type Mutation {
    setPerimeter(input: PerimeterInput!): Boolean!
    clockIn(input: ClockInput): Shift!
    clockOut(input: ClockInput): Shift!
  }
`;

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
  const session = await getSession(context.request);
      if (session?.user) {
        console.log('=== SESSION DEBUG ===');
        console.log('email_verified:', session.user.email_verified);
        console.log('email:', session.user.email);
        console.log('updated_at:', session.user.updated_at);
        console.log('All user props:', Object.keys(session.user));
        console.log('===================');
      }
      return session?.user?.name || session?.user?.email || session?.user?.sub || null;
    },
    emailVerified: async (parent, args, context) => {
  const session = await getSession(context.request);
      return session?.user?.email_verified || false;
    },
    userEmailVerified: async (_p, { id }, context) => {
      const session = await getSession(context.request);
      if (!session) throw new Error("Unauthorized");
      // Allow managers to query any user, others only themselves
      const isManager = (session.user.roles || []).includes('manager');
      if (!isManager && session.user.sub !== id) throw new Error("Forbidden");
      const user = await prisma.user.findUnique({ where: { id } });
      return !!(user && user.emailVerified);
    },
    officeStatus: async () => {
      let officeStatus = await prisma.officeStatus.findUnique({
        where: { id: 'office' }
      });
      
      // Create default office status if it doesn't exist
      if (!officeStatus) {
        officeStatus = await prisma.officeStatus.create({
          data: {
            id: 'office',
            isActive: false,
            updatedAt: Math.floor(Date.now() / 1000)
          }
        });
      }
      
      // Convert BigInt to numbers for GraphQL
      return {
        ...officeStatus,
        activatedAt: officeStatus.activatedAt ? Number(officeStatus.activatedAt) : null,
        updatedAt: Number(officeStatus.updatedAt)
      };
    },
    shifts: async (parent, args, context) => {
      const session = await getSession(context.request);
      if (!session?.user?.sub) throw new Error("Unauthorized");
      const isManager = (session.user.roles || []).includes("manager") || session.user.role === "manager";
      let shifts;
      if (isManager) {
        shifts = await prisma.shift.findMany({
          include: { user: true },
          orderBy: { clockInAt: "desc" }
        });
      } else {
        shifts = await prisma.shift.findMany({
          where: { userId: session.user.sub },
          include: { user: true },
          orderBy: { clockInAt: "desc" }
        });
      }

      // Convert BigInt to numbers for GraphQL
      return shifts.map(s => ({
        ...s,
        clockInAt: Number(s.clockInAt),
        clockOutAt: s.clockOutAt ? Number(s.clockOutAt) : null
      }));
    },
    perimeter: () => prisma.setting.findUnique({ where: { key: "perimeter" } }),
    metrics: async (parent, args, context) => {
      const session = await getSession(context.request);
      const isManager = (session?.user?.roles || []).includes("manager");
      if (!isManager) throw new Error("Manager access required");

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get all completed shifts from last 7 days
      const shifts = await prisma.shift.findMany({
        where: {
          clockInAt: { gte: sevenDaysAgo.getTime() },
          clockOutAt: { not: null }
        },
        include: { user: true },
        orderBy: { clockInAt: 'desc' }
      });

      // Calculate average hours per day
      const dailyHours = {};
      const dailyCounts = {};
      const staffHours = {};

      shifts.forEach(shift => {
        const clockIn = new Date(Number(shift.clockInAt));
        const clockOut = new Date(Number(shift.clockOutAt));
        const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
        const day = clockIn.toISOString().split('T')[0];

        // Daily hours
        if (!dailyHours[day]) dailyHours[day] = 0;
        dailyHours[day] += hours;

        // Daily counts
        if (!dailyCounts[day]) dailyCounts[day] = new Set();
        dailyCounts[day].add(shift.userId);

        // Staff hours
        if (!staffHours[shift.userId]) {
          staffHours[shift.userId] = {
            userId: shift.userId,
            userName: shift.user?.name || shift.user?.email || 'Unknown',
            hours: 0
          };
        }
        staffHours[shift.userId].hours += hours;
      });

      // Calculate averages
      const avgHoursPerDay = Object.keys(dailyHours).length > 0
        ? Object.values(dailyHours).reduce((a, b) => a + b, 0) / Object.keys(dailyHours).length
        : 0;

      // Format people per day
      const peoplePerDay = Object.entries(dailyCounts).map(([day, userSet]) => ({
        day,
        count: userSet.size
      })).sort((a, b) => a.day.localeCompare(b.day));

      // Format staff hours
      const totalHoursPerStaff = Object.values(staffHours)
        .sort((a, b) => b.hours - a.hours);

      return {
        avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
        peoplePerDay,
        totalHoursPerStaff
      };
    }
  },
  Mutation: {
    setPerimeter: async (parent, { input }, context) => {
      const session = await getSession(context.request);
      const roles = session?.user?.roles || [];
      if (!session || !roles.includes("manager")) throw new Error("Forbidden");
      await prisma.setting.upsert({
        where: { key: "perimeter" },
        update: { value: JSON.stringify(input) },
        create: { key: "perimeter", value: JSON.stringify(input) }
      });
      return true;
    },
    clockIn: async (parent, { input }, context) => {
      const session = await getSession(context.request);
      if (!session?.user?.sub) throw new Error("Unauthorized");
      if (session.user.email_verified === false) throw new Error("Email not verified");
      const id = crypto.randomUUID();
      const now = Math.trunc(Date.now());
      return prisma.shift.create({
        data: {
          id,
          userId: session.user.sub,
          clockInAt: now,
          clockInLat: input?.lat ?? null,
          clockInLng: input?.lng ?? null,
          clockInNote: input?.note ?? null,
        }
      });
    },
    clockOut: async (_p, { input }, context) => {
      const session = await getSession(context.request);
      if (!session?.user?.sub) throw new Error("Unauthorized");
      if (session.user.email_verified === false) throw new Error("Email not verified");
      const open = await prisma.shift.findFirst({ where: { userId: session.user.sub, clockOutAt: null }, orderBy: { clockInAt: "desc" } });
      if (!open) throw new Error("No active shift");
      return prisma.shift.update({
        where: { id: open.id },
        data: {
          clockOutAt: Math.trunc(Date.now()),
          clockOutLat: input?.lat ?? null,
          clockOutLng: input?.lng ?? null,
          clockOutNote: input?.note ?? null,
        }
      });
    }
  }
};

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Request, Response },
  maskedErrors: false,
});

export { yoga as GET, yoga as POST };

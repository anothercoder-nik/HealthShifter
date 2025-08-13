let prismaInstance = null;
try {
	const { PrismaClient } = require("@prisma/client");
	const globalForPrisma = globalThis;
	prismaInstance = globalForPrisma.prisma || new PrismaClient();
	if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaInstance;
} catch (e) {
	console.warn("Prisma initialization failed – have you run 'npx prisma generate'? GraphQL endpoint will return an error until generated.");
	prismaInstance = new Proxy({}, {
		get() {
			throw new Error("Prisma client not generated. Run 'npx prisma generate'.");
		}
	});
}

export const prisma = prismaInstance;
export default prismaInstance;

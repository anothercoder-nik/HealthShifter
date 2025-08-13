// Quick script to verify database migration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if tables exist by querying them
    const userCount = await prisma.user.count();
    const settingCount = await prisma.setting.count();
    const shiftCount = await prisma.shift.count();
    
    console.log(`📊 Database stats:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Settings: ${settingCount}`);
    console.log(`   Shifts: ${shiftCount}`);
    
    console.log('✅ All tables accessible via Prisma');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

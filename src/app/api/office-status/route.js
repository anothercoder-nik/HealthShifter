import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { withApiAuthRequired, getSession } from '../../../lib/auth';
import { extractRoles } from '../../../lib/roles';

export async function GET() {
  try {
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

    return NextResponse.json({
      isActive: officeStatus.isActive,
      activatedBy: officeStatus.activatedBy,
      activatedAt: officeStatus.activatedAt ? Number(officeStatus.activatedAt) : null,
      updatedAt: Number(officeStatus.updatedAt)
    });
  } catch (error) {
    console.error('Error fetching office status:', error);
    return NextResponse.json({ error: 'Failed to fetch office status' }, { status: 500 });
  }
}

export const POST = withApiAuthRequired(async function officeStatusHandler(request) {
  const session = await getSession(request);
  const userId = session?.user?.sub;
  const roles = extractRoles(session?.user);
  const isManager = roles.includes("manager");

  // Only managers can control office status
  if (!isManager) {
    return NextResponse.json({ error: 'Unauthorized - Manager access required' }, { status: 403 });
  }

  try {
    const { isActive } = await request.json();
    
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    
    const updatedStatus = await prisma.officeStatus.upsert({
      where: { id: 'office' },
      update: {
        isActive,
        activatedBy: userId,
        activatedAt: isActive ? now : null,
        updatedAt: now
      },
      create: {
        id: 'office',
        isActive,
        activatedBy: userId,
        activatedAt: isActive ? now : null,
        updatedAt: now
      }
    });

    return NextResponse.json({
      success: true,
      isActive: updatedStatus.isActive,
      activatedBy: updatedStatus.activatedBy,
      activatedAt: updatedStatus.activatedAt ? Number(updatedStatus.activatedAt) : null,
      message: isActive ? 'Office is now OPEN - Employees can clock in' : 'Office is now CLOSED - Employees cannot clock in'
    });
  } catch (error) {
    console.error('Error updating office status:', error);
    return NextResponse.json({ error: 'Failed to update office status' }, { status: 500 });
  }
});

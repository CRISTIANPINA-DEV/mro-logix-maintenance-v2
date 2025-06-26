import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.companyId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const count = await prisma.wheelRotation.count({
      where: {
        companyId: session.user.companyId,
        nextRotationDue: {
          gte: today,
          lt: tomorrow,
        },
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Error fetching today\'s wheel rotation count:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch count' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 
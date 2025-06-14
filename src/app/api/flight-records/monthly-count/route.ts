import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function GET() {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the start and end of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Count flight records for the current month, filtered by company
    const count = await prisma.flightRecord.count({
      where: {
        companyId: session.user.companyId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    return NextResponse.json({
      success: true,
      count,
      month: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    });
  } catch (error) {
    console.error('Error fetching monthly flight count:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch monthly flight count' },
      { status: 500 }
    );
  }
} 
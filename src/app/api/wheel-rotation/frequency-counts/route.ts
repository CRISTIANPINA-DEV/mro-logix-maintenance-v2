import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { addDays, addWeeks, addMonths, addYears, startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.companyId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const nextWeek = addWeeks(today, 1);
    const nextMonth = addMonths(today, 1);
    const nextQuarter = addMonths(today, 3);
    const nextYear = addYears(today, 1);

    // Get counts for different time periods
    const [
      todayCount,
      thisWeekCount,
      thisMonthCount,
      thisQuarterCount,
      thisYearCount,
      overdueCount,
      totalActiveCount,
      frequencyBreakdown
    ] = await Promise.all([
      // Today
      prisma.wheelRotation.count({
        where: {
          companyId: session.user.companyId,
          nextRotationDue: {
            gte: today,
            lt: tomorrow,
          },
          isActive: true,
        },
      }),
      
      // This week (next 7 days)
      prisma.wheelRotation.count({
        where: {
          companyId: session.user.companyId,
          nextRotationDue: {
            gte: today,
            lt: nextWeek,
          },
          isActive: true,
        },
      }),
      
      // This month (next 30 days)
      prisma.wheelRotation.count({
        where: {
          companyId: session.user.companyId,
          nextRotationDue: {
            gte: today,
            lt: nextMonth,
          },
          isActive: true,
        },
      }),
      
      // This quarter (next 90 days)
      prisma.wheelRotation.count({
        where: {
          companyId: session.user.companyId,
          nextRotationDue: {
            gte: today,
            lt: nextQuarter,
          },
          isActive: true,
        },
      }),
      
      // This year (next 365 days)
      prisma.wheelRotation.count({
        where: {
          companyId: session.user.companyId,
          nextRotationDue: {
            gte: today,
            lt: nextYear,
          },
          isActive: true,
        },
      }),
      
      // Overdue (past due)
      prisma.wheelRotation.count({
        where: {
          companyId: session.user.companyId,
          nextRotationDue: {
            lt: today,
          },
          isActive: true,
        },
      }),
      
      // Total active wheels
      prisma.wheelRotation.count({
        where: {
          companyId: session.user.companyId,
          isActive: true,
        },
      }),
      
      // Breakdown by frequency
      prisma.wheelRotation.groupBy({
        by: ['rotationFrequency'],
        where: {
          companyId: session.user.companyId,
          isActive: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    return NextResponse.json({ 
      success: true, 
      data: {
        today: todayCount,
        thisWeek: thisWeekCount,
        thisMonth: thisMonthCount,
        thisQuarter: thisQuarterCount,
        thisYear: thisYearCount,
        overdue: overdueCount,
        totalActive: totalActiveCount,
        frequencyBreakdown: frequencyBreakdown.reduce((acc, item) => {
          acc[item.rotationFrequency] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
      }
    });
  } catch (error) {
    console.error('Error fetching wheel rotation frequency counts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch counts' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
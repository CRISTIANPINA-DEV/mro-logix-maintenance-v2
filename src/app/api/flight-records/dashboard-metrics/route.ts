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

    const companyId = session.user.companyId;

    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() - today.getDay() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Previous month for comparison
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    
    // Two months ago for additional comparison
    const startOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const endOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
    
    // Three months ago for additional comparison
    const startOfThreeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const endOfThreeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 0, 23, 59, 59, 999);
    
    // Year to date
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    // Last 30 days for trending
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Parallel queries for better performance
    const [
      totalFlights,
      monthlyFlights,
      weeklyFlights,
      dailyFlights,
      flightsWithDefects,
      monthlyDefects,
      previousMonthFlights,
      previousMonthDefects,
      twoMonthsAgoFlights,
      threeMonthsAgoFlights,
      yearToDateFlights,
      last30DaysFlights,
      uniqueStations,
      uniqueAirlines,
      recentFlights
    ] = await Promise.all([
      // Total flights count
      prisma.flightRecord.count({
        where: { companyId }
      }),

      // Monthly flights count
      prisma.flightRecord.count({
        where: {
          companyId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // Weekly flights count
      prisma.flightRecord.count({
        where: {
          companyId,
          date: {
            gte: startOfWeek,
            lte: endOfWeek,
          },
        },
      }),

      // Today's flights count
      prisma.flightRecord.count({
        where: {
          companyId,
          date: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0),
            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0),
          },
        },
      }),

      // Total flights with defects
      prisma.flightRecord.count({
        where: {
          companyId,
          hasDefect: true
        }
      }),

      // Monthly flights with defects
      prisma.flightRecord.count({
        where: {
          companyId,
          hasDefect: true,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // Previous month flights count
      prisma.flightRecord.count({
        where: {
          companyId,
          date: {
            gte: startOfPrevMonth,
            lte: endOfPrevMonth,
          },
        },
      }),

      // Previous month flights with defects
      prisma.flightRecord.count({
        where: {
          companyId,
          hasDefect: true,
          date: {
            gte: startOfPrevMonth,
            lte: endOfPrevMonth,
          },
        },
      }),

      // Two months ago flights count
      prisma.flightRecord.count({
        where: {
          companyId,
          date: {
            gte: startOfTwoMonthsAgo,
            lte: endOfTwoMonthsAgo,
          },
        },
      }),

      // Three months ago flights count
      prisma.flightRecord.count({
        where: {
          companyId,
          date: {
            gte: startOfThreeMonthsAgo,
            lte: endOfThreeMonthsAgo,
          },
        },
      }),

      // Year to date flights
      prisma.flightRecord.count({
        where: {
          companyId,
          date: {
            gte: startOfYear,
            lte: endOfMonth,
          },
        },
      }),

      // Last 30 days flights
      prisma.flightRecord.count({
        where: {
          companyId,
          date: {
            gte: thirtyDaysAgo,
          },
        },
      }),

      // Unique stations count
      prisma.flightRecord.groupBy({
        by: ['station'],
        where: { companyId },
        _count: true
      }),

      // Unique airlines count
      prisma.flightRecord.groupBy({
        by: ['airline'],
        where: { companyId },
        _count: true
      }),

      // Recent flights (last 5)
      prisma.flightRecord.findMany({
        where: { companyId },
        select: {
          id: true,
          date: true,
          airline: true,
          fleet: true,
          tail: true,
          station: true,
          hasDefect: true,
          createdAt: true
        },
        orderBy: { date: 'desc' },
        take: 5
      })
    ]);

    // Calculate defect rates
    const defectRate = totalFlights > 0 ? (flightsWithDefects / totalFlights) * 100 : 0;
    const monthlyDefectRate = monthlyFlights > 0 ? (monthlyDefects / monthlyFlights) * 100 : 0;
    const previousMonthDefectRate = previousMonthFlights > 0 ? (previousMonthDefects / previousMonthFlights) * 100 : 0;
    
    // Calculate month-over-month change
    const monthOverMonthChange = previousMonthFlights > 0 
      ? ((monthlyFlights - previousMonthFlights) / previousMonthFlights) * 100 
      : 0;
    
    // Calculate monthly trend (positive/negative/neutral)
    const monthlyTrend = monthOverMonthChange > 5 ? 'up' : 
                        monthOverMonthChange < -5 ? 'down' : 'stable';

    // Days passed in current month for progress calculation
    const currentDate = new Date();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const daysPassed = currentDate.getDate();
    const monthProgress = (daysPassed / daysInMonth) * 100;

    // Previous month name
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthName = previousMonthDate.toLocaleString('en-US', { month: 'long' });
    
    // Two months ago name
    const twoMonthsAgoDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const twoMonthsAgoName = twoMonthsAgoDate.toLocaleString('en-US', { month: 'long' });
    
    // Three months ago name
    const threeMonthsAgoDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const threeMonthsAgoName = threeMonthsAgoDate.toLocaleString('en-US', { month: 'long' });

    // Prepare response data
    const metrics = {
      totalFlights,
      monthlyFlights,
      weeklyFlights,
      dailyFlights,
      flightsWithDefects,
      monthlyDefects,
      previousMonthFlights,
      previousMonthDefects,
      twoMonthsAgoFlights,
      threeMonthsAgoFlights,
      yearToDateFlights,
      last30DaysFlights,
      defectRate: Math.round(defectRate * 100) / 100,
      monthlyDefectRate: Math.round(monthlyDefectRate * 100) / 100,
      previousMonthDefectRate: Math.round(previousMonthDefectRate * 100) / 100,
      monthOverMonthChange: Math.round(monthOverMonthChange * 100) / 100,
      monthlyTrend,
      monthProgress: Math.round(monthProgress * 100) / 100,
      uniqueStations: uniqueStations.length,
      uniqueAirlines: uniqueAirlines.length,
      recentFlights,
      currentMonth: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      previousMonthName,
      twoMonthsAgoName,
      threeMonthsAgoName,
      topStations: uniqueStations
        .sort((a, b) => b._count - a._count)
        .slice(0, 3)
        .map(station => ({
          name: station.station,
          count: station._count
        })),
      topAirlines: uniqueAirlines
        .sort((a, b) => b._count - a._count)
        .slice(0, 3)
        .map(airline => ({
          name: airline.airline,
          count: airline._count
        }))
    };

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching flight dashboard metrics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch flight metrics' },
      { status: 500 }
    );
  }
}
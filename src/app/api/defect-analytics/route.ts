import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';

interface AnalyticsData {
  totalFleetCount: number;
  totalLogPageNoCount: number;
  topSystemsAffected: {
    name: string;
    count: number;
  }[];
  heatmapData: { date: string; count: number }[];
  donutChartData: { name: string; value: number }[];
  fleetTypeChartData: { name: string; value: number }[];
}

interface ApiResponse {
  success: boolean;
  data?: AnalyticsData;
  message?: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = {
      id: session.user.id,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      companyId: session.user.companyId
    };

    // Get months parameter from URL, default to 12 months if not provided
    const searchParams = request.nextUrl.searchParams;
    const monthsParam = searchParams.get('months') || '12';
    
    // Calculate the date range based on the months parameter
    const endDate = new Date();
    const startDate = monthsParam === 'all' 
      ? new Date(endDate.getFullYear() - 2, endDate.getMonth()) 
      : new Date(endDate.getFullYear(), endDate.getMonth() - (parseInt(monthsParam) || 12));
    
    // Base where clause for company filtering
    const baseWhere = {
      companyId: currentUser.companyId,
      hasDefect: true
    };

    // 1. Total Fleet Count (distinct fleets from records with defects) - filtered by company
    const distinctFleetsWithDefects = await prisma.flightRecord.findMany({
      where: { 
        ...baseWhere,
        fleet: { not: "" } 
      }, 
      distinct: ['fleet'],
      select: { fleet: true },
    });
    const totalFleetCount = distinctFleetsWithDefects.length;

    // 2. Total LogPageNo Count (for records with defects and non-empty logPageNo) - filtered by company
    const totalLogPageNoCount = await prisma.flightRecord.count({
      where: {
        ...baseWhere,
        AND: [
          { NOT: { logPageNo: null } }, 
          { logPageNo: { not: "" } }
        ]
      },
    });

    // 3. SystemAffected with the most appearances (for records with defects and non-empty systemAffected) - filtered by company
    const systemAffectedCounts = await prisma.flightRecord.groupBy({
      by: ['systemAffected'],
      _count: {
        systemAffected: true,
      },
      where: {
        ...baseWhere,
        AND: [
          { NOT: { systemAffected: null } }, 
          { systemAffected: { not: "" } }
        ]
      },
      orderBy: {
        _count: {
          systemAffected: 'desc',
        },
      },
      take: 3,
    });

    const topSystemsAffected = systemAffectedCounts.map((system: { systemAffected: string | null; _count: { systemAffected: number } }) => ({
      name: system.systemAffected || 'N/A',
      count: system._count.systemAffected
    }));

    // 4. Data for Heatmap (defects per day for the requested time period) - filtered by company
    const defectsByDayRaw = await prisma.flightRecord.groupBy({
      by: ['createdAt'], // Group by the date part of createdAt
      _count: {
        id: true,
      },
      where: {
        ...baseWhere,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    // Process defectsByDay to be { date: 'YYYY-MM-DD', count: X }
    // And aggregate counts for the same day, as Prisma groupBy on DateTime includes time
    const heatmapDataMap = new Map<string, number>();
    defectsByDayRaw.forEach((item: { createdAt: Date; _count: { id: number } }) => {
      // Convert createdAt to YYYY-MM-DD string for grouping
      const dateStr = item.createdAt.toISOString().split('T')[0];
      heatmapDataMap.set(dateStr, (heatmapDataMap.get(dateStr) || 0) + item._count.id);
    });
    const heatmapData = Array.from(heatmapDataMap).map(([date, count]) => ({ date, count }));

    // 5. Data for Donut Chart (distribution of systemAffected for records with defects) - filtered by company
    const systemAffectedDistributionRaw = await prisma.flightRecord.groupBy({
      by: ['systemAffected'],
      _count: {
        id: true, // Counting based on the number of records (defects)
      },
      where: {
        ...baseWhere,
        AND: [
          { NOT: { systemAffected: null } }, 
          { systemAffected: { not: "" } }
        ]
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10, // Limit to top 10 systems
    });

    const donutChartData = systemAffectedDistributionRaw
      .filter((item: { systemAffected: string | null; _count: { id: number } }): item is { systemAffected: string; _count: { id: number } } => 
        item.systemAffected !== null && item.systemAffected !== '') // Ensure systemAffected is not null
      .map((item) => ({
        name: item.systemAffected,
        value: item._count.id,
      }));

    // 6. Data for Fleet Type Chart (distribution of fleet types with most log pages) - filtered by company
    const fleetTypeDistributionRaw = await prisma.flightRecord.groupBy({
      by: ['fleet'],
      _count: {
        id: true, // Count records instead
      },
      where: {
        ...baseWhere,
        fleet: { not: "" },
        logPageNo: { not: "" }
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 8, // Limit to top 8 fleet types for better visualization
    });

    const fleetTypeChartData = fleetTypeDistributionRaw
      .filter((item: { fleet: string; _count: { id: number } }) => item.fleet) // Ensure fleet is not null
      .map((item: { fleet: string; _count: { id: number } }) => ({
        name: item.fleet,
        value: item._count.id,
      }));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        totalFleetCount,
        totalLogPageNoCount,
        topSystemsAffected,
        heatmapData,
        donutChartData,
        fleetTypeChartData,
      },
    });
  } catch (error) {
    console.error('Error fetching defect analytics:', error);
    // It's good practice to type the error or at least check its instance
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to fetch defect analytics data', error: errorMessage }, { status: 500 });
  }
}

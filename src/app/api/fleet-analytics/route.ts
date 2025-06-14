import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// GET /api/fleet-analytics - Get summary of all fleet types and their affected systems count
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

    const currentUser = {
      id: session.user.id,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      companyId: session.user.companyId
    };

    // Base where clause for company filtering
    const baseWhere = {
      companyId: currentUser.companyId,
      hasDefect: true
    };

    // Get all distinct fleet types that have defects - filtered by company
    const fleetTypes = await prisma.flightRecord.groupBy({
      by: ['fleet'],
      where: {
        ...baseWhere,
        fleet: { not: "" }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // For each fleet type, get the count of affected systems - filtered by company
    const fleetAnalytics = await Promise.all(
      fleetTypes.map(async (fleet: { fleet: string; _count: { id: number } }) => {
        const affectedSystems = await prisma.flightRecord.groupBy({
          by: ['systemAffected'],
          where: {
            companyId: currentUser.companyId,
            fleet: fleet.fleet,
            hasDefect: true,
            systemAffected: { not: "" }
          },
          _count: {
            id: true
          }
        });

        return {
          fleetType: fleet.fleet,
          totalDefects: fleet._count.id,
          affectedSystemsCount: affectedSystems.length,
          affectedSystems: affectedSystems
            .filter((system: { systemAffected: string | null; _count: { id: number } }): system is { systemAffected: string; _count: { id: number } } => 
              system.systemAffected !== null && system.systemAffected !== '')
            .map((system) => ({
              system: system.systemAffected,
              count: system._count.id
            }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: fleetAnalytics
    });
  } catch (error) {
    console.error('Error fetching fleet analytics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch fleet analytics' },
      { status: 500 }
    );
  }
}

// GET /api/fleet-analytics/[fleetType] - Get detailed analysis for a specific fleet type
export async function POST(request: Request) {
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

    const { fleetType } = await request.json();

    if (!fleetType) {
      return NextResponse.json(
        { success: false, message: 'Fleet type is required' },
        { status: 400 }
      );
    }

    // Get detailed system analysis for the specific fleet type - filtered by company
    const systemAnalysis = await prisma.flightRecord.groupBy({
      by: ['systemAffected'],
      where: {
        companyId: currentUser.companyId,
        fleet: fleetType,
        hasDefect: true,
        systemAffected: { not: "" }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Get additional fleet statistics - filtered by company
    const fleetStats = await prisma.flightRecord.groupBy({
      by: ['fleet'],
      where: {
        companyId: currentUser.companyId,
        fleet: fleetType,
        hasDefect: true
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        fleetType,
        totalDefects: fleetStats[0]?._count.id || 0,
        systems: systemAnalysis
          .filter((system: { systemAffected: string | null; _count: { id: number } }): system is { systemAffected: string; _count: { id: number } } => 
            system.systemAffected !== null && system.systemAffected !== '')
          .map((system) => ({
            system: system.systemAffected,
            count: system._count.id
          }))
      }
    });
  } catch (error) {
    console.error('Error fetching fleet type analysis:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch fleet type analysis' },
      { status: 500 }
    );
  }
}

// POST /api/fleet-analytics/system-records - Get flight records for a specific fleet type and system
export async function PUT(request: Request) {
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

    const { fleetType, system } = await request.json();

    if (!fleetType || !system) {
      return NextResponse.json(
        { success: false, message: 'Fleet type and system are required' },
        { status: 400 }
      );
    }

    // Get flight records for the specific fleet type and system - filtered by company
    const records = await prisma.flightRecord.findMany({
      where: {
        companyId: currentUser.companyId,
        fleet: fleetType,
        systemAffected: system,
        hasDefect: true
      },
      select: {
        airline: true,
        fleet: true,
        tail: true,
        date: true,
        discrepancyNote: true,
        id: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        fleetType,
        system,
        records
      }
    });
  } catch (error) {
    console.error('Error fetching system records:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch system records' },
      { status: 500 }
    );
  }
} 
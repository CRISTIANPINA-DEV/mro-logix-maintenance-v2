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

    // Get distinct stations that have flight records, filtered by company
    const stationsWithRecords = await prisma.flightRecord.findMany({
      where: {
        companyId: session.user.companyId,
        station: {
          not: "",
        }
      },
      distinct: ['station'],
      select: {
        station: true
      }
    });

    return NextResponse.json({
      success: true,
      count: stationsWithRecords.length,
      stations: stationsWithRecords.map((s: { station: string }) => s.station)
    });
  } catch (error) {
    console.error('Error fetching stations count:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch stations count' },
      { status: 500 }
    );
  }
} 
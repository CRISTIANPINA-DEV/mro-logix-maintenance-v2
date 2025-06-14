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

    // Get the most recent temperature control record from the user's company
    const latestRecord = await prisma.temperatureControl.findFirst({
      where: {
        companyId: session.user.companyId
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        temperature: true,
        humidity: true,
        location: true,
        customLocation: true,
        date: true,
        time: true,
        createdAt: true,
        employeeName: true
      }
    });

    if (!latestRecord) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No temperature records found'
      });
    }

    // Format the response
    const formattedRecord = {
      ...latestRecord,
      displayLocation: latestRecord.location === 'Other' ? latestRecord.customLocation : latestRecord.location
    };

    return NextResponse.json({
      success: true,
      data: formattedRecord
    });
  } catch (error) {
    console.error('Error fetching latest temperature record:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
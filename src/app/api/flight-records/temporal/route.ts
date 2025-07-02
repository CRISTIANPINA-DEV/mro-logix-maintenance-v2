import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';
import { canUserAddTemporalFlightRecords, canUserDeletePendingFlights } from '@/lib/user-permissions';

export async function POST(request: Request) {
  try {
    // Authenticate user to get user ID and company info for activity logging
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

    // Check if user has permission to add temporal flight records
    const canAdd = await canUserAddTemporalFlightRecords(currentUser.id);
    if (!canAdd) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to add temporal flight records' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    
    // Extract and validate required form data for temporal flights
    const date = formData.get('date') as string;
    const airline = formData.get('airline') as string;
    const station = formData.get('station') as string;
    const flightNumber = formData.get('flightNumber') as string;
    
    // Validate required fields
    if (!date || !airline || !station || !flightNumber) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Fix the date timezone issue by properly handling the date
    let correctedDate;
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      correctedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    } else {
      correctedDate = new Date();
    }
    
    console.log(`Creating temporal flight record - Date: ${date}, Corrected: ${correctedDate.toISOString()}`);
    
    // Check if temporal flight already exists for this combination
    const existingTemporal = await prisma.flightRecord.findFirst({
      where: {
        companyId: currentUser.companyId,
        date: correctedDate,
        station: station,
        airline: airline,
        flightNumber: flightNumber,
        isTemporary: true
      }
    });

    if (existingTemporal) {
      return NextResponse.json(
        { success: false, message: 'A temporal flight record with these details already exists' },
        { status: 400 }
      );
    }

    // Create temporal flight record in database
    const temporalFlight = await prisma.flightRecord.create({
      data: {
        companyId: currentUser.companyId,
        date: correctedDate,
        airline: airline,
        station: station,
        flightNumber: flightNumber,
        isTemporary: true,
        // Set minimal defaults for required fields
        fleet: '', // Will be filled when completing
        service: '', // Will be filled when completing
        hasTime: false,
        hasDefect: false,
        hasAttachments: false,
        hasComment: false,
        riiRequired: false,
        hasPartReplaced: false,
        technician: `${currentUser.firstName} ${currentUser.lastName}`,
        username: session.user.username || ''
      }
    });

    // Log activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: currentUser.id,
      action: 'ADDED_FLIGHT_RECORD',
      resourceType: 'FLIGHT_RECORD',
      resourceId: temporalFlight.id,
      resourceTitle: `Temporal Flight: ${airline} ${flightNumber} - ${station}`,
      metadata: {
        airline,
        flightNumber,
        station,
        date: correctedDate.toISOString(),
        isTemporary: true,
        companyId: currentUser.companyId
      },
      ...requestInfo
    });

    return NextResponse.json({
      success: true,
      message: 'Temporal flight record created successfully',
      data: {
        id: temporalFlight.id,
        date: temporalFlight.date,
        airline: temporalFlight.airline,
        station: temporalFlight.station,
        flightNumber: temporalFlight.flightNumber,
        isTemporary: temporalFlight.isTemporary
      }
    });

  } catch (error) {
    console.error('Error creating temporal flight record:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create temporal flight record' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    // Build where clause
    const whereClause: any = {
      companyId: session.user.companyId,
      isTemporary: true
    };

    // Filter by date if provided
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const targetDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      whereClause.date = targetDate;
    }

    // Get temporal flights
    const temporalFlights = await prisma.flightRecord.findMany({
      where: whereClause,
      select: {
        id: true,
        date: true,
        airline: true,
        station: true,
        flightNumber: true,
        isTemporary: true,
        createdAt: true
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: temporalFlights
    });

  } catch (error) {
    console.error('Error fetching temporal flights:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch temporal flights' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Flight ID is required' },
        { status: 400 }
      );
    }

    // Check if user has permission to delete pending flights
    const canDelete = await canUserDeletePendingFlights(session.user.id);
    if (!canDelete) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to delete pending flights' },
        { status: 403 }
      );
    }

    // Find the temporal flight record
    const temporalFlight = await prisma.flightRecord.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId,
        isTemporary: true
      }
    });

    if (!temporalFlight) {
      return NextResponse.json(
        { success: false, message: 'Temporal flight record not found' },
        { status: 404 }
      );
    }

    // Delete the temporal flight record
    await prisma.flightRecord.delete({
      where: { id: id }
    });

    // Log activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: session.user.id,
      action: 'DELETED_FLIGHT_RECORD',
      resourceType: 'FLIGHT_RECORD',
      resourceId: temporalFlight.id,
      resourceTitle: `Temporal Flight: ${temporalFlight.airline} ${temporalFlight.flightNumber} - ${temporalFlight.station}`,
      metadata: {
        airline: temporalFlight.airline,
        flightNumber: temporalFlight.flightNumber,
        station: temporalFlight.station,
        date: temporalFlight.date.toISOString(),
        companyId: session.user.companyId
      },
      ...requestInfo
    });

    return NextResponse.json({
      success: true,
      message: 'Temporal flight record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting temporal flight record:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete temporal flight record' },
      { status: 500 }
    );
  }
}
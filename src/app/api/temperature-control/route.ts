import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';
import { canUserAddTemperatureRecord, canUserDeleteTemperatureRecord } from '@/lib/user-permissions';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user to get user ID and company info for activity logging
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has permission to add temperature records
    const canAdd = await canUserAddTemperatureRecord(session.user.id);
    if (!canAdd) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to add temperature records' },
        { status: 403 }
      );
    }

    const currentUser = {
      id: session.user.id,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      companyId: session.user.companyId
    };

    const formData = await request.formData();
    
    const date = formData.get('date') as string;
    const location = formData.get('location') as string;
    const customLocation = formData.get('customLocation') as string;
    const time = formData.get('time') as string;
    const temperature = formData.get('temperature') as string;
    const humidity = formData.get('humidity') as string;
    const employeeName = formData.get('employeeName') as string;
    const hasComment = formData.get('hasComment') as string;
    const comment = formData.get('comment') as string;

    // Validation
    if (!date || !location || !time || !temperature || !humidity || !employeeName || !hasComment) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create temperature control record with company isolation
    const temperatureControl = await prisma.temperatureControl.create({
      data: {
        companyId: currentUser.companyId,
        date: new Date(date),
        location: location,
        customLocation: location === 'Other' ? customLocation : null,
        time: time,
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        employeeName: employeeName,
        hasComment: hasComment === 'Yes',
        comment: hasComment === 'Yes' ? comment : null,
      },
    });

    // Log the activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: currentUser.id,
      action: 'ADDED_TEMPERATURE_CONTROL',
      resourceType: 'TEMPERATURE_CONTROL',
      resourceId: temperatureControl.id,
      resourceTitle: `Temperature Control: ${location === 'Other' ? customLocation : location} at ${time}`,
      metadata: {
        location: location === 'Other' ? customLocation : location,
        time,
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        employeeName,
        hasComment: hasComment === 'Yes',
        companyId: currentUser.companyId
      },
      ...requestInfo
    });

    return NextResponse.json({
      success: true,
      message: 'Temperature control record saved successfully',
      data: temperatureControl,
    });
  } catch (error) {
    console.error('Error saving temperature control record:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const countOnly = searchParams.get('count') === 'true';

    // Build where clause for search with company isolation
    const where = {
      companyId: session.user.companyId,
      ...(search && {
        OR: [
          { location: { contains: search, mode: 'insensitive' as const } },
          { customLocation: { contains: search, mode: 'insensitive' as const } },
          { employeeName: { contains: search, mode: 'insensitive' as const } },
          { comment: { contains: search, mode: 'insensitive' as const } },
        ],
      })
    };

    // Get total count
    const total = await prisma.temperatureControl.count({ where });
    
    // If count only is requested, return just the total
    if (countOnly) {
      return NextResponse.json({
        success: true,
        data: {
          total
        },
      });
    }

    const skip = (page - 1) * limit;

    // Get records filtered by company
    const records = await prisma.temperatureControl.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching temperature control records:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate the ID
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Temperature control record ID is required' },
        { status: 400 }
      );
    }

    // Check if the record exists and belongs to the user's company
    const record = await prisma.temperatureControl.findFirst({
      where: { 
        id: id,
        companyId: currentUser.companyId
      }
    });

    if (!record) {
      return NextResponse.json(
        { success: false, message: 'Temperature control record not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete temperature records
    const canDelete = await canUserDeleteTemperatureRecord(session.user.id);
    if (!canDelete) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to delete temperature records' },
        { status: 403 }
      );
    }

    // Delete the temperature control record
    await prisma.temperatureControl.delete({
      where: { id: id }
    });

    // Log the activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: currentUser.id,
      action: 'DELETED_TEMPERATURE_CONTROL',
      resourceType: 'TEMPERATURE_CONTROL',
      resourceId: id,
      resourceTitle: `Temperature Control: ${record.location === 'Other' ? record.customLocation : record.location} at ${record.time}`,
      metadata: {
        location: record.location === 'Other' ? record.customLocation : record.location,
        time: record.time,
        temperature: record.temperature,
        humidity: record.humidity,
        employeeName: record.employeeName,
        companyId: currentUser.companyId
      },
      ...requestInfo
    });

    return NextResponse.json({
      success: true,
      message: 'Temperature control record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting temperature control record:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

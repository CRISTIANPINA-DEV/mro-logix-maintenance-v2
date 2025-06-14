import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';

// GET - Fetch current configuration
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

    let config = await prisma.temperatureHumidityConfig.findFirst({
      where: { 
        isActive: true,
        companyId: currentUser.companyId
      }
    });

    // If no config exists for this company, create default one
    if (!config) {
      config = await prisma.temperatureHumidityConfig.create({
        data: {
          companyId: currentUser.companyId,
          tempNormalMin: 0,
          tempNormalMax: 24,
          tempMediumMin: 25,
          tempMediumMax: 35,
          tempHighMin: 36,
          humidityNormalMin: 0,
          humidityNormalMax: 35,
          humidityMediumMin: 36,
          humidityMediumMax: 65,
          humidityHighMin: 66,
          isActive: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching temperature humidity config:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update configuration
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    
    const {
      tempNormalMin,
      tempNormalMax,
      tempMediumMin,
      tempMediumMax,
      tempHighMin,
      humidityNormalMin,
      humidityNormalMax,
      humidityMediumMin,
      humidityMediumMax,
      humidityHighMin
    } = body;

    // Validation
    if (
      tempNormalMin === undefined || tempNormalMax === undefined ||
      tempMediumMin === undefined || tempMediumMax === undefined || tempHighMin === undefined ||
      humidityNormalMin === undefined || humidityNormalMax === undefined ||
      humidityMediumMin === undefined || humidityMediumMax === undefined || humidityHighMin === undefined
    ) {
      return NextResponse.json(
        { success: false, message: 'Missing required configuration values' },
        { status: 400 }
      );
    }

    // Validate ranges make sense
    if (tempNormalMin >= tempNormalMax || tempMediumMin >= tempMediumMax) {
      return NextResponse.json(
        { success: false, message: 'Invalid temperature ranges: minimum values must be less than maximum values' },
        { status: 400 }
      );
    }

    if (humidityNormalMin >= humidityNormalMax || humidityMediumMin >= humidityMediumMax) {
      return NextResponse.json(
        { success: false, message: 'Invalid humidity ranges: minimum values must be less than maximum values' },
        { status: 400 }
      );
    }

    // Find existing config for this company or create new one
    let config = await prisma.temperatureHumidityConfig.findFirst({
      where: { 
        isActive: true,
        companyId: currentUser.companyId
      }
    });

    if (config) {
      // Update existing config
      config = await prisma.temperatureHumidityConfig.update({
        where: { id: config.id },
        data: {
          tempNormalMin: parseFloat(tempNormalMin),
          tempNormalMax: parseFloat(tempNormalMax),
          tempMediumMin: parseFloat(tempMediumMin),
          tempMediumMax: parseFloat(tempMediumMax),
          tempHighMin: parseFloat(tempHighMin),
          humidityNormalMin: parseFloat(humidityNormalMin),
          humidityNormalMax: parseFloat(humidityNormalMax),
          humidityMediumMin: parseFloat(humidityMediumMin),
          humidityMediumMax: parseFloat(humidityMediumMax),
          humidityHighMin: parseFloat(humidityHighMin),
        }
      });
    } else {
      // Create new config for this company
      config = await prisma.temperatureHumidityConfig.create({
        data: {
          companyId: currentUser.companyId,
          tempNormalMin: parseFloat(tempNormalMin),
          tempNormalMax: parseFloat(tempNormalMax),
          tempMediumMin: parseFloat(tempMediumMin),
          tempMediumMax: parseFloat(tempMediumMax),
          tempHighMin: parseFloat(tempHighMin),
          humidityNormalMin: parseFloat(humidityNormalMin),
          humidityNormalMax: parseFloat(humidityNormalMax),
          humidityMediumMin: parseFloat(humidityMediumMin),
          humidityMediumMax: parseFloat(humidityMediumMax),
          humidityHighMin: parseFloat(humidityHighMin),
          isActive: true
        }
      });
    }

    // Log the activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: currentUser.id,
      action: 'UPDATED_TEMPERATURE_HUMIDITY_CONFIG',
      resourceType: 'TEMPERATURE_HUMIDITY_CONFIG',
      resourceId: config.id,
      resourceTitle: 'Temperature & Humidity Range Configuration',
      metadata: {
        tempRanges: {
          normal: `${tempNormalMin}-${tempNormalMax}°C`,
          medium: `${tempMediumMin}-${tempMediumMax}°C`,
          high: `>${tempHighMin}°C`
        },
        humidityRanges: {
          normal: `${humidityNormalMin}-${humidityNormalMax}%`,
          medium: `${humidityMediumMin}-${humidityMediumMax}%`,
          high: `>${humidityHighMin}%`
        },
        companyId: currentUser.companyId
      },
      ...requestInfo
    });

    return NextResponse.json({
      success: true,
      message: 'Temperature and humidity ranges updated successfully',
      data: config
    });
  } catch (error) {
    console.error('Error updating temperature humidity config:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 

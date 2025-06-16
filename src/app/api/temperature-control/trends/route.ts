import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

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
    const location = searchParams.get('location') || '';
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause with company isolation
    const where = {
      companyId: session.user.companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(location && location !== 'all' && {
        OR: [
          { location: location },
          { customLocation: location }
        ]
      })
    };

    // Get trend data ordered by creation date
    const records = await prisma.temperatureControl.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        date: true,
        time: true,
        temperature: true,
        humidity: true,
        location: true,
        customLocation: true,
        createdAt: true,
      },
    });

    // Get unique locations for the dropdown
    const allRecords = await prisma.temperatureControl.findMany({
      where: {
        companyId: session.user.companyId,
      },
      select: {
        location: true,
        customLocation: true,
      },
      distinct: ['location', 'customLocation'],
    });

    const locations = Array.from(new Set(
      allRecords.map(record => 
        record.location === 'Other' && record.customLocation 
          ? record.customLocation 
          : record.location
      )
    )).filter(Boolean).sort();

    // Format data for chart
    const chartData = records.map(record => ({
      id: record.id,
      date: record.createdAt.toISOString(),
      displayDate: new Date(record.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      time: record.time,
      temperature: record.temperature,
      humidity: record.humidity,
      location: record.location === 'Other' && record.customLocation 
        ? record.customLocation 
        : record.location,
      timestamp: record.createdAt.getTime(),
    }));

    // Calculate trend indicators
    const calculateTrend = (values: number[]) => {
      if (values.length < 2) return 0;
      const recent = values.slice(-Math.min(5, values.length));
      const older = values.slice(0, Math.min(5, values.length));
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      return recentAvg - olderAvg;
    };

    const temperatures = chartData.map(d => d.temperature);
    const humidities = chartData.map(d => d.humidity);

    const trends = {
      temperature: calculateTrend(temperatures),
      humidity: calculateTrend(humidities),
      temperatureDirection: calculateTrend(temperatures) > 0.5 ? 'up' : calculateTrend(temperatures) < -0.5 ? 'down' : 'stable',
      humidityDirection: calculateTrend(humidities) > 2 ? 'up' : calculateTrend(humidities) < -2 ? 'down' : 'stable',
    };

    return NextResponse.json({
      success: true,
      data: {
        chartData,
        locations,
        trends,
        summary: {
          totalRecords: chartData.length,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
          averages: {
            temperature: temperatures.length > 0 ? temperatures.reduce((a, b) => a + b, 0) / temperatures.length : 0,
            humidity: humidities.length > 0 ? humidities.reduce((a, b) => a + b, 0) / humidities.length : 0,
          }
        }
      },
    });
  } catch (error) {
    console.error('Error fetching temperature trends:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
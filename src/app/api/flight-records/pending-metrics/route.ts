import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;

    // Get current date for filtering
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // Get all pending flights (temporal flights)
    const allPendingFlights = await prisma.flightRecord.findMany({
      where: {
        companyId: companyId,
        isTemporary: true
      },
      select: {
        id: true,
        date: true,
        airline: true,
        station: true,
        flightNumber: true,
        createdAt: true
      },
      orderBy: [
        { date: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Get pending flights for today
    const todaysPendingFlights = allPendingFlights.filter(flight => {
      const flightDate = new Date(flight.date);
      return flightDate.getTime() === today.getTime();
    });

    // Get overdue flights (flights before today)
    const overdueFlights = allPendingFlights.filter(flight => {
      const flightDate = new Date(flight.date);
      return flightDate < today;
    });

    // Get upcoming flights (flights after today)
    const upcomingFlights = allPendingFlights.filter(flight => {
      const flightDate = new Date(flight.date);
      return flightDate > today;
    });

    // Get flights for this week (next 7 days from today)
    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setUTCDate(oneWeekFromNow.getUTCDate() + 7);
    
    const thisWeekFlights = allPendingFlights.filter(flight => {
      const flightDate = new Date(flight.date);
      return flightDate >= today && flightDate <= oneWeekFromNow;
    });

    // Get most active stations
    const stationCounts: Record<string, number> = {};
    allPendingFlights.forEach(flight => {
      stationCounts[flight.station] = (stationCounts[flight.station] || 0) + 1;
    });

    const topStations = Object.entries(stationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([station, count]) => ({ station, count }));

    // Get most active airlines
    const airlineCounts: Record<string, number> = {};
    allPendingFlights.forEach(flight => {
      airlineCounts[flight.airline] = (airlineCounts[flight.airline] || 0) + 1;
    });

    const topAirlines = Object.entries(airlineCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([airline, count]) => ({ airline, count }));

    // Calculate age metrics (how long flights have been pending)
    const pendingAges = allPendingFlights.map(flight => {
      const daysSinceCreated = Math.floor((now.getTime() - new Date(flight.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCreated;
    });

    const averageAge = pendingAges.length > 0 ? 
      Math.round(pendingAges.reduce((sum, age) => sum + age, 0) / pendingAges.length) : 0;

    const oldestPending = pendingAges.length > 0 ? Math.max(...pendingAges) : 0;

    // Get recent pending flights (last 5 created)
    const recentPendingFlights = allPendingFlights
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(flight => ({
        id: flight.id,
        date: flight.date.toISOString().split('T')[0],
        airline: flight.airline,
        station: flight.station,
        flightNumber: flight.flightNumber,
        createdAt: flight.createdAt,
        daysSinceCreated: Math.floor((now.getTime() - new Date(flight.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      }));

    const metrics = {
      totalPending: allPendingFlights.length,
      todaysPending: todaysPendingFlights.length,
      overduePending: overdueFlights.length,
      upcomingPending: upcomingFlights.length,
      thisWeekPending: thisWeekFlights.length,
      averageAge: averageAge,
      oldestPending: oldestPending,
      topStations: topStations,
      topAirlines: topAirlines,
      recentPendingFlights: recentPendingFlights,
      currentDate: today.toISOString().split('T')[0],
      uniqueStations: Object.keys(stationCounts).length,
      uniqueAirlines: Object.keys(airlineCounts).length
    };

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching pending flights metrics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pending flights metrics' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { addDays, addWeeks, addMonths, startOfDay, format, isAfter, isBefore } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.companyId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    
    const now = new Date();
    const today = startOfDay(now);
    const futureDate = addDays(today, days);

    // Get upcoming wheel rotations within the specified period
    const upcomingRotations = await prisma.wheelRotation.findMany({
      where: {
        companyId: session.user.companyId,
        nextRotationDue: {
          gte: today,
          lte: futureDate,
        },
        isActive: true,
      },
      select: {
        id: true,
        wheelSerialNumber: true,
        wheelPartNumber: true,
        airline: true,
        station: true,
        rotationFrequency: true,
        nextRotationDue: true,
        currentPosition: true,
        notes: true,
      },
      orderBy: {
        nextRotationDue: 'asc',
      },
    });

    // Get overdue rotations
    const overdueRotations = await prisma.wheelRotation.findMany({
      where: {
        companyId: session.user.companyId,
        nextRotationDue: {
          lt: today,
        },
        isActive: true,
      },
      select: {
        id: true,
        wheelSerialNumber: true,
        wheelPartNumber: true,
        airline: true,
        station: true,
        rotationFrequency: true,
        nextRotationDue: true,
        currentPosition: true,
        notes: true,
      },
      orderBy: {
        nextRotationDue: 'asc',
      },
    });

    // Group by urgency categories
    const categorized = {
      overdue: overdueRotations.map(r => ({
        ...r,
        daysOverdue: Math.abs(Math.floor((today.getTime() - new Date(r.nextRotationDue!).getTime()) / (1000 * 60 * 60 * 24))),
        urgency: 'critical' as const,
      })),
      today: upcomingRotations.filter(r => 
        r.nextRotationDue && 
        new Date(r.nextRotationDue).toDateString() === today.toDateString()
      ).map(r => ({ ...r, urgency: 'high' as const })),
      thisWeek: upcomingRotations.filter(r => {
        if (!r.nextRotationDue) return false;
        const dueDate = new Date(r.nextRotationDue);
        const weekEnd = addWeeks(today, 1);
        return isAfter(dueDate, today) && isBefore(dueDate, weekEnd);
      }).map(r => ({ ...r, urgency: 'medium' as const })),
      later: upcomingRotations.filter(r => {
        if (!r.nextRotationDue) return false;
        const dueDate = new Date(r.nextRotationDue);
        const weekEnd = addWeeks(today, 1);
        return isAfter(dueDate, weekEnd);
      }).map(r => ({ ...r, urgency: 'low' as const })),
    };

    // Generate summary stats
    const summary = {
      totalUpcoming: upcomingRotations.length,
      totalOverdue: overdueRotations.length,
      byFrequency: upcomingRotations.reduce((acc, r) => {
        acc[r.rotationFrequency] = (acc[r.rotationFrequency] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStation: upcomingRotations.reduce((acc, r) => {
        acc[r.station] = (acc[r.station] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({ 
      success: true, 
      data: {
        categorized,
        summary,
        period: {
          from: format(today, 'yyyy-MM-dd'),
          to: format(futureDate, 'yyyy-MM-dd'),
          days,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching upcoming wheel rotations:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch upcoming rotations' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
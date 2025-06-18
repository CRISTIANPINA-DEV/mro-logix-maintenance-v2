import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// GET all users who have activities within the company (admin only)
export async function GET() {
  try {
    // Authenticate user via NextAuth session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (session.user.privilege !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    // Get all unique users who have activities within the company
    const usersWithActivities = await prisma.user.findMany({
      where: {
        companyId: session.user.companyId,
        activities: {
          some: {} // Users who have at least one activity
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        _count: {
          select: {
            activities: true
          }
        }
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      users: usersWithActivities
    });
  } catch (error) {
    console.error('Error fetching users with activities:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
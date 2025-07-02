import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/manage - Get all users for admin management
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.privilege !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Fetch all users in the company with their permissions and activity count
    const users = await prisma.user.findMany({
      where: {
        companyId: session.user.companyId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        privilege: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            activities: true,
          }
        },
        permissions: {
          select: {
            id: true,
            canViewFlightRecords: true,
            canAddFlightRecords: true,
            canExportFlightRecords: true,
            canEditFlightRecords: true,
            canDeleteFlightRecords: true,
          }
        }
      },
      orderBy: {
        email: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users for management:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
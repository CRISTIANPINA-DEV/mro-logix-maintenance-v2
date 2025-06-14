import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET all user activities with pagination and filtering
export async function GET(request: Request) {
  try {
    // Authenticate user via NextAuth session
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const action = searchParams.get('action') || '';
    const resourceType = searchParams.get('resourceType') || '';

    // Build where clause for filtering - SECURITY: Filter by company ID for multi-tenant isolation
    const where: {
      companyId: string;
      action?: { contains: string; mode: 'insensitive' };
      resourceType?: string;
    } = {
      companyId: currentUser.companyId // SECURITY FIX: Filter by company ID instead of just user ID
    };
    
    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }
    if (resourceType) {
      where.resourceType = resourceType;
    }

    // Get total count
    const total = await prisma.userActivity.count({ where });

    const skip = (page - 1) * limit;

    // Get activities with user information - filtered by company
    const activities = await prisma.userActivity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
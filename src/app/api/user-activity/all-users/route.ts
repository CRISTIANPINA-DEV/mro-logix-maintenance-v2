import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// GET all users' activities within the company (admin only)
export async function GET(request: Request) {
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
    const userId = searchParams.get('userId') || '';

    // Build where clause for filtering - SECURITY: Filter by company ID for multi-tenant isolation
    const where: {
      companyId: string;
      userId?: string;
      action?: { contains: string; mode: 'insensitive' };
      resourceType?: string;
    } = {
      companyId: currentUser.companyId // Only activities within the same company
    };
    
    // If specific user is selected
    if (userId) {
      where.userId = userId;
    }
    
    if (action && action !== 'all_actions') {
      where.action = { contains: action, mode: 'insensitive' };
    }
    
    if (resourceType && resourceType !== 'all_resources') {
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
    console.error('Error fetching all users activities:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
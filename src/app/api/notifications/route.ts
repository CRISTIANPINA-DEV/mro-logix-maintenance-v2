import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Fetch notifications for the current user
export async function GET(request: NextRequest) {
  try {
    // Add CORS headers
    const headers = new Headers({
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Content-Type': 'application/json',
    });

    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json(auth.error, { status: auth.status, headers });
    }
    const currentUser = auth.user;

    if (!currentUser?.id || !currentUser?.companyId) {
      return NextResponse.json(
        { success: false, message: 'Invalid user session' },
        { status: 401, headers }
      );
    }

    // Get URL parameters
    const url = new URL(request.url);
    const archived = url.searchParams.get('archived');

    // Build the where clause
    const where = {
      userId: currentUser.id,
      companyId: currentUser.companyId,
      ...(archived !== null ? { isArchived: archived === 'true' } : {})
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: notifications
    }, { headers });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch notifications' },
      { 
        status: 500,
        headers: new Headers({
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
          'Content-Type': 'application/json',
        })
      }
    );
  }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    console.log('Creating new notification...');
    
    const auth = await requireAuth(request);
    if (auth.error) {
      console.error('Authentication error:', auth.error);
      return NextResponse.json(auth.error, { status: auth.status });
    }
    const currentUser = auth.user;
    console.log('Authenticated user:', { id: currentUser.id, companyId: currentUser.companyId });

    const body = await request.json();
    const { title, message, userId } = body;
    console.log('Notification request body:', { title, message, userId });

    // Validate required fields
    if (!title || !message || !userId) {
      console.error('Missing required fields:', { title, message, userId });
      return NextResponse.json(
        { success: false, message: 'Title, message and userId are required' },
        { status: 400 }
      );
    }

    // Verify the target user belongs to the same company
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId: currentUser.companyId
      }
    });

    if (!targetUser) {
      console.error('Target user not found or not in same company:', { userId, companyId: currentUser.companyId });
      return NextResponse.json(
        { success: false, message: 'Invalid target user' },
        { status: 400 }
      );
    }
    console.log('Target user found:', { id: targetUser.id, companyId: targetUser.companyId });

    // Create the notification
    console.log('Creating notification in database...');
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        userId,
        companyId: currentUser.companyId
      }
    });
    console.log('Notification created successfully:', notification);

    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: new Headers({
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
  });
} 
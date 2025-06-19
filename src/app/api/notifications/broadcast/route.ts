import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json(auth.error, { status: auth.status });
    }
    const currentUser = auth.user;

    // Get user session to check privileges
    const session = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { privilege: true }
    });

    // Check if user has admin privileges
    if (session?.privilege !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin privileges required to broadcast notifications' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { message, priority } = body;

    // Validate required fields
    if (!message || !priority) {
      return NextResponse.json(
        { success: false, message: 'Message and priority are required' },
        { status: 400 }
      );
    }

    // Get all users in the same company
    const companyUsers = await prisma.user.findMany({
      where: {
        companyId: currentUser.companyId,
        id: {
          not: currentUser.id // Exclude the sender
        }
      },
      select: {
        id: true
      }
    });

    // Create notifications for all users
    const notifications = await prisma.$transaction(
      companyUsers.map(user => 
        prisma.notification.create({
          data: {
            title: 'Company Notification',
            message,
            priority,
            userId: user.id,
            senderId: currentUser.id,
            companyId: currentUser.companyId,
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Notifications sent successfully',
      data: notifications
    });
  } catch (error) {
    console.error('Error broadcasting notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send notifications' },
      { status: 500 }
    );
  }
} 
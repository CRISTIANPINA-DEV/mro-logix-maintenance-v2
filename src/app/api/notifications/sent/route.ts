import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json(auth.error, { status: auth.status });
    }
    const currentUser = auth.user;

    // Get all notifications sent by the current user (including soft-deleted ones for read receipt counting)
    const notifications = await prisma.notification.findMany({
      where: {
        senderId: currentUser.id,
        companyId: currentUser.companyId,
        // Don't filter by deletedAt here - we need all notifications to count read receipts accurately
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        sender: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group notifications by message and createdAt to combine broadcast messages
    const groupedNotifications = notifications.reduce((acc, notification) => {
      // Create a unique key for each broadcast message using message and creation timestamp
      const key = `${notification.message}_${notification.createdAt.toISOString()}`;
      
      if (!acc[key]) {
        acc[key] = {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          senderId: notification.senderId,
          sender: notification.sender,
          createdAt: notification.createdAt,
          readReceipts: [],
        };
      }

      // Add read receipt if the notification has been read
      if (notification.isRead && notification.readAt) {
        acc[key].readReceipts.push({
          user: notification.user,
          readAt: notification.readAt,
        });
      }

      return acc;
    }, {} as Record<string, any>);

    // Convert the grouped notifications object to an array
    const transformedNotifications = Object.values(groupedNotifications)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: transformedNotifications,
    });
  } catch (error) {
    console.error('Error fetching sent notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sent notifications' },
      { status: 500 }
    );
  }
} 
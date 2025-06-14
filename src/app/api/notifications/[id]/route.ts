import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// PATCH - Update notification (mark as read/unread or archive/unarchive)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json(auth.error, { status: auth.status });
    }
    const currentUser = auth.user;

    const body = await request.json();
    const { isRead, isArchived } = body;

    // Get the resolved params
    const { id } = await params;

    // Find the notification and verify ownership
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: currentUser.id,
        companyId: currentUser.companyId
      }
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    // Update the notification
    const updatedNotification = await prisma.notification.update({
      where: {
        id,
        userId: currentUser.id,
      },
      data: {
        isRead: isRead !== undefined ? isRead : notification.isRead,
        isArchived: isArchived !== undefined ? isArchived : notification.isArchived
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: 'Notification updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json(auth.error, { status: auth.status });
    }
    const currentUser = auth.user;

    // Get the resolved params
    const { id } = await params;

    // Find the notification and verify ownership
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: currentUser.id,
        companyId: currentUser.companyId
      }
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the notification
    await prisma.notification.delete({
      where: {
        id,
        userId: currentUser.id,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete notification' },
      { status: 500 }
    );
  }
} 
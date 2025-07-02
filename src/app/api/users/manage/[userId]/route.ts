import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';

// GET /api/users/manage/[userId] - Get detailed user information
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
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

    // Fetch detailed user information
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        companyId: session.user.companyId, // Ensure company scoping
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
        permissions: true,
        _count: {
          select: {
            activities: true,
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/manage/[userId] - Delete user and all related data
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
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

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists in the same company
    const userToDelete = await prisma.user.findUnique({
      where: {
        id: userId,
        companyId: session.user.companyId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    });

    if (!userToDelete) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user (this will cascade delete all related records due to Prisma schema)
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    // Log the admin action
    const { ipAddress, userAgent } = getRequestInfo(request);
    await logActivity({
      userId: session.user.id,
      action: 'DELETED_USER',
      resourceType: 'USER',
      resourceId: userId,
      resourceTitle: `${userToDelete.firstName} ${userToDelete.lastName} (${userToDelete.email})`,
      metadata: {
        deletedUser: {
          id: userToDelete.id,
          name: `${userToDelete.firstName} ${userToDelete.lastName}`,
          email: userToDelete.email,
        }
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'User and all associated data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
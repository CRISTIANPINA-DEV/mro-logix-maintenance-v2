import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';

// POST /api/users/manage/[userId]/reset-password - Force password reset (admin only)
export async function POST(
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

    // Prevent admin from resetting their own password this way
    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot reset your own password using this method' },
        { status: 400 }
      );
    }

    // Check if user exists in the same company
    const userToReset = await prisma.user.findUnique({
      where: {
        id: userId,
        companyId: session.user.companyId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
      }
    });

    if (!userToReset) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Clear the user's password - this will force them to use the forgot password flow
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: '', // Clear password
        resetToken: null, // Clear any existing reset tokens
        resetTokenExpiry: null,
        tempPassword: null,
      },
    });

    // Log the admin action
    const { ipAddress, userAgent } = getRequestInfo(request);
    await logActivity({
      userId: session.user.id,
      action: 'UPDATED_USER',
      resourceType: 'USER',
      resourceId: userId,
      resourceTitle: `${userToReset.firstName} ${userToReset.lastName} (${userToReset.email})`,
      metadata: {
        action: 'force_password_reset',
        targetUser: {
          id: userToReset.id,
          name: `${userToReset.firstName} ${userToReset.lastName}`,
          email: userToReset.email,
        }
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'User password has been reset. User must use the "Forgot Password" feature to set a new password.',
    });
  } catch (error) {
    console.error('Error forcing password reset:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset user password' },
      { status: 500 }
    );
  }
}
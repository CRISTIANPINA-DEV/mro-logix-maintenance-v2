import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';
import { z } from 'zod';

const updateEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// PATCH /api/users/manage/[userId]/email - Update user email (admin only)
export async function PATCH(
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
    const body = await request.json();
    
    // Validate input
    const validation = updateEmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if user exists in the same company
    const userToUpdate = await prisma.user.findUnique({
      where: {
        id: userId,
        companyId: session.user.companyId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyId: true,
      }
    });

    if (!userToUpdate) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Validate email domain - must match admin's domain
    const adminEmailDomain = session.user.email.split('@')[1];
    const newEmailDomain = email.split('@')[1];
    
    if (adminEmailDomain !== newEmailDomain) {
      return NextResponse.json(
        { success: false, message: `Email domain must be @${adminEmailDomain}` },
        { status: 400 }
      );
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
        id: { not: userId }, // Exclude current user
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email is already in use' },
        { status: 400 }
      );
    }

    // Update user email
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        email: email,
        verified: false, // Reset verification status
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        verified: true,
      }
    });

    // Log the admin action
    const { ipAddress, userAgent } = getRequestInfo(request);
    await logActivity({
      userId: session.user.id,
      action: 'UPDATED_USER',
      resourceType: 'USER',
      resourceId: userId,
      resourceTitle: `${userToUpdate.firstName} ${userToUpdate.lastName}`,
      metadata: {
        action: 'email_update',
        oldEmail: userToUpdate.email,
        newEmail: email,
        targetUser: {
          id: userToUpdate.id,
          name: `${userToUpdate.firstName} ${userToUpdate.lastName}`,
        }
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'User email updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user email' },
      { status: 500 }
    );
  }
}
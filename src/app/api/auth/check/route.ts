import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Ensure all required user fields are present
    if (!session.user.firstName || !session.user.lastName) {
      return NextResponse.json(
        { success: false, message: 'User information is incomplete' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        email: session.user.email,
        username: session.user.username,
        companyId: session.user.companyId,
        fullName: `${session.user.firstName} ${session.user.lastName}`
      }
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check authentication status' },
      { status: 500 }
    );
  }
}

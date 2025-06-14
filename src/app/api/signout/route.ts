import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';

export async function POST(request: Request) {
  try {
    // Get the current session to log the activity
    const session = await getServerSession();
    
    // Log logout activity if we have a user session
    if (session?.user?.id) {
      const requestInfo = getRequestInfo(request);
      await logActivity({
        userId: session.user.id,
        action: 'LOGOUT',
        resourceType: 'AUTHENTICATION',
        resourceTitle: 'User logout',
        metadata: {
          logoutMethod: 'manual'
        },
        ...requestInfo
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Signed out successfully'
    });
  } catch (error) {
    console.error('Error signing out:', error);
    return NextResponse.json(
      { error: 'An error occurred while signing out' },
      { status: 500 }
    );
  }
} 
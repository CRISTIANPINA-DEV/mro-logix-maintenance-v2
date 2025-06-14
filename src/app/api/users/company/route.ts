import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Fetch all users in the current user's company
export async function GET(request: NextRequest) {
  try {
    console.log('Fetching company users...');
    
    const auth = await requireAuth(request);
    if (auth.error) {
      console.error('Authentication error:', auth.error);
      return NextResponse.json(auth.error, { status: auth.status });
    }
    const currentUser = auth.user;
    console.log('Authenticated user:', { id: currentUser.id, companyId: currentUser.companyId });

    const users = await prisma.user.findMany({
      where: {
        companyId: currentUser.companyId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true
      }
    });
    console.log(`Found ${users.length} users in company`);

    return NextResponse.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching company users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch company users' },
      { status: 500 }
    );
  }
} 
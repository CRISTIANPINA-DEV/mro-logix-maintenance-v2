import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// GET /api/users
// Returns total number of registered users in the current user's company.
export async function GET() {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Count users in the same company
    const count = await prisma.user.count({
      where: {
        companyId: session.user.companyId
      }
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Error fetching users count:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users count' }, { status: 500 });
  }
}

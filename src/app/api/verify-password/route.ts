import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { password, checkOnly } = await request.json();

    // 1. Get session from NextAuth
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // For checkOnly, just verify the session and return success
    if (checkOnly) {
      return NextResponse.json({ success: true });
    }

    // 2. Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // 4. Compare password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }

    // Success!
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify password' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  // No-op for now, or you can clear cookies if needed
  return NextResponse.json({ success: true });
} 

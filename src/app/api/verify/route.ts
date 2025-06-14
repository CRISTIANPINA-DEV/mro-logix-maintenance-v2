import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validatePin } from '@/lib/pinUtils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, pin } = body;
    
    if (!userId || !pin) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Validate the PIN
    const validation = validatePin(user.pin || '', pin, user.pinCreatedAt);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason },
        { status: 400 }
      );
    }
    
    // Update user as verified
    await prisma.user.update({
      where: { id: userId },
      data: {
        verified: true,
        pin: null,
        pinCreatedAt: null
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Email verification successful'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify user' },
      { status: 500 }
    );
  }
} 
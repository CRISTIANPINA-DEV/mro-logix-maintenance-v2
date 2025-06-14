import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePIN } from '@/lib/pinUtils';
import { sendPinEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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
    
    // Generate a new PIN
    const pin = generatePIN();
    const pinCreatedAt = new Date();
    
    // Update the user with the new PIN
    await prisma.user.update({
      where: { id: userId },
      data: {
        pin,
        pinCreatedAt
      }
    });
    
    // Send the new PIN via email
    await sendPinEmail(user.email, pin, user.firstName);
    
    return NextResponse.json({
      success: true,
      message: 'PIN resent successfully',
      pinCreatedAt: pinCreatedAt.toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('PIN resend error:', error);
    return NextResponse.json(
      { error: 'Failed to resend PIN' },
      { status: 500 }
    );
  }
} 
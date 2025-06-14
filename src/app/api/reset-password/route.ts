import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePIN } from '@/lib/pinUtils';
import { sendPinEmail } from '@/lib/email';
import { sendPasswordChangeConfirmationEmail } from '@/lib/password-reset-emails';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }
    
    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      },
      include: {
        company: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    
    // Generate a PIN for verification
    const pin = generatePIN();
    const pinCreatedAt = new Date();
    
    // Hash the new password but don't save it yet
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user with PIN and store the hashed password temporarily
    await prisma.user.update({
      where: { id: user.id },
      data: {
        pin,
        pinCreatedAt,
        tempPassword: hashedPassword, // Store the hashed password temporarily
        resetToken: null, // Clear the reset token
        resetTokenExpiry: null
      }
    });
    
    // Send verification PIN
    await sendPinEmail(user.email, pin, user.firstName);
    
    return NextResponse.json({
      success: true,
      userId: user.id,
      pinCreatedAt: pinCreatedAt.toISOString()
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

// Endpoint to verify PIN and complete password reset
export async function PUT(request: Request) {
  try {
    const { userId, pin } = await request.json();
    
    if (!userId || !pin) {
      return NextResponse.json(
        { error: 'User ID and PIN are required' },
        { status: 400 }
      );
    }
    
    // Find user and verify PIN
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
    
    // Check if PIN is valid and not expired (3 minutes)
    if (!user.pinCreatedAt) {
      return NextResponse.json(
        { error: 'PIN not found or expired' },
        { status: 400 }
      );
    }
    
    const pinAge = Date.now() - user.pinCreatedAt.getTime();
    if (user.pin !== pin || pinAge > 3 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Invalid or expired PIN' },
        { status: 400 }
      );
    }
    
    // Update the user's password with the temporary password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: user.tempPassword!, // Use the stored temporary password
        tempPassword: null, // Clear the temporary password
        pin: null, // Clear the PIN
        pinCreatedAt: null
      }
    });
    
    // Send confirmation email
    await sendPasswordChangeConfirmationEmail(user.email, user.firstName);
    
    return NextResponse.json({
      success: true,
      message: 'Password has been successfully reset'
    });
    
  } catch (error) {
    console.error('PIN verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify PIN' },
      { status: 500 }
    );
  }
} 
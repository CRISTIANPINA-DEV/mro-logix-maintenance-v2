import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/password-reset-emails';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    console.log('Processing password reset request for email:', email);
    
    // Find the user
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          company: true
        }
      });
      console.log('Database lookup result:', user ? 'User found' : 'User not found');
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }
    
    // Don't reveal if user exists or not
    if (!user) {
      console.log('No user found with email:', email);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.'
      });
    }
    
    console.log('Generating reset token for user:', user.id);
    
    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Save the reset token in the database
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry
        }
      });
      console.log('Reset token saved successfully');
    } catch (updateError) {
      console.error('Failed to save reset token:', updateError);
      return NextResponse.json(
        { error: 'Failed to process reset request' },
        { status: 500 }
      );
    }
    
    // Send the password reset email
    try {
      console.log('Attempting to send password reset email');
      const emailResult = await sendPasswordResetEmail(user.email, user.firstName, resetToken);
      
      if (!emailResult.success) {
        console.error('Failed to send email:', emailResult.error);
        // Cleanup the token since email failed
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken: null,
            resetTokenExpiry: null
          }
        });
        return NextResponse.json(
          { error: 'Failed to send reset instructions. Please try again later.' },
          { status: 500 }
        );
      }
      
      console.log('Password reset email sent successfully');
    } catch (emailError) {
      console.error('Error in email sending process:', emailError);
      // Cleanup the token since email failed
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null
        }
      });
      return NextResponse.json(
        { error: 'Failed to send reset instructions' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.'
    });
    
  } catch (error) {
    console.error('Unexpected error in password reset process:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePIN } from '@/lib/pinUtils';
import { sendPinEmail } from '@/lib/email';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, username, email, password } = body;
    
    // Validate input fields
    if (!firstName || !lastName || !username || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Extract company name from email domain
    const emailDomain = email.split('@')[1];
    if (!emailDomain) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Extract company name (remove .com, .org, etc.)
    const companyName = emailDomain.split('.')[0];
    
    // Find or create company first
    let company = await prisma.company.findFirst({
      where: { name: companyName }
    });
    
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: companyName
        }
      });
    }

    // Check if user already exists (email should be globally unique, username unique within company)
    const existingUserByEmail = await prisma.user.findFirst({
      where: { email }
    });
    
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const existingUserByUsername = await prisma.user.findFirst({
      where: { 
        username,
        companyId: company.id
      }
    });
    
    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Username already exists in your company' },
        { status: 409 }
      );
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate a PIN for email verification
    const pin = generatePIN();
    const pinCreatedAt = new Date();
    
    // Create the user in the database with company association
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        pin,
        pinCreatedAt,
        companyId: company.id
      }
    });
    
    // Send verification email
    await sendPinEmail(email, pin, firstName);
    
    return NextResponse.json({
      success: true,
      userId: user.id,
      companyName: company.name,
      pinCreatedAt: pinCreatedAt.toISOString()
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
} 
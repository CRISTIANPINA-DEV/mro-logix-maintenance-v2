import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { config } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generatePIN } from "@/lib/pinUtils";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(config);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { newEmail } = await req.json();
    if (!newEmail) {
      return NextResponse.json({ success: false, error: "New email is required" }, { status: 400 });
    }

    // Get current user with company info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Get all users from the same company to determine the organization's email domain
    const companyUsers = await prisma.user.findMany({
      where: { 
        companyId: currentUser.companyId,
        verified: true // Only consider verified users
      },
      select: { email: true }
    });

    // Extract domains from verified company emails
    const companyDomains = new Set(
      companyUsers.map(user => user.email.split('@')[1])
    );

    // Get domain from new email
    const newEmailDomain = newEmail.split('@')[1];

    // Check if the new email domain matches any of the company's domains
    if (!companyDomains.has(newEmailDomain)) {
      return NextResponse.json({ 
        success: false, 
        error: `Email domain must match your organization's domain(s): ${Array.from(companyDomains).join(', ')}` 
      }, { status: 400 });
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
      select: { id: true }
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email is already taken" }, { status: 400 });
    }

    // Generate a new PIN
    const pin = generatePIN();
    const pinCreatedAt = new Date();

    // Update user with temporary pin
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        pin,
        pinCreatedAt,
      }
    });

    // Send verification email
    await sendEmail({
      to: newEmail,
      subject: "Verify Your New Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your New Email Address</h2>
          <p>Hello,</p>
          <p>Please use the following PIN to verify your new email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f3f4f6; padding: 12px 24px; display: inline-block; border-radius: 4px; font-size: 24px; font-family: monospace;">
              ${pin}
            </div>
          </div>
          <p>This PIN will expire in 3 minutes.</p>
          <p>If you did not request this change, please ignore this email.</p>
          <p>Thank you,<br/>MRO Logix Team</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in change-email route:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process email change" },
      { status: 500 }
    );
  }
} 
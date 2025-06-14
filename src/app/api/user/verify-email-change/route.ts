import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { config } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(config);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { pin, newEmail } = await req.json();
    if (!pin || !newEmail) {
      return NextResponse.json({ success: false, error: "PIN and new email are required" }, { status: 400 });
    }

    // Get user with PIN
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { pin: true, pinCreatedAt: true, companyId: true }
    });

    if (!user || !user.pin || !user.pinCreatedAt) {
      return NextResponse.json({ success: false, error: "Invalid PIN" }, { status: 400 });
    }

    // Check if PIN is expired (3 minutes)
    const pinExpiry = new Date(user.pinCreatedAt);
    pinExpiry.setMinutes(pinExpiry.getMinutes() + 3);

    if (new Date() > pinExpiry) {
      return NextResponse.json({ success: false, error: "PIN has expired" }, { status: 400 });
    }

    // Verify PIN
    if (user.pin !== pin) {
      return NextResponse.json({ success: false, error: "Invalid PIN" }, { status: 400 });
    }

    // Check if new email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
      select: { id: true }
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email is already taken" }, { status: 400 });
    }

    // Update user email and clear PIN
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        email: newEmail,
        pin: null,
        pinCreatedAt: null
      }
    });

    // Create user activity log
    await prisma.userActivity.create({
      data: {
        userId: session.user.id,
        companyId: user.companyId,
        action: "EMAIL_CHANGE",
        resourceType: "USER",
        resourceId: session.user.id,
        resourceTitle: "Email Change",
        metadata: {
          details: `Email changed from ${session.user.email} to ${newEmail}`,
          oldEmail: session.user.email,
          newEmail: newEmail,
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in verify-email-change route:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify email change" },
      { status: 500 }
    );
  }
} 
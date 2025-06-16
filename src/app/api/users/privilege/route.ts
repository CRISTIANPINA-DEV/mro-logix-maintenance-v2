import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Debug session
    console.log("API - Update privilege session:", {
      hasSession: !!session,
      userPrivilege: session?.user?.privilege,
    });

    // Check if user is authenticated and has admin privileges
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }

    if (session.user.privilege !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Not admin" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, privilege } = body;

    // Debug request body
    console.log("API - Update privilege request:", { userId, privilege });

    // Validate input
    if (!userId || !privilege || !["admin", "reader-only"].includes(privilege)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Get the target user to verify they're in the same company
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        companyId: true,
        firstName: true,
        lastName: true,
      },
    });

    // Debug target user
    console.log("API - Target user:", targetUser);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "User not in your company" }, { status: 403 });
    }

    // Prevent changing own privilege
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot change your own privilege" }, { status: 400 });
    }

    // Update user privilege
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { privilege },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        privilege: true,
      },
    });

    // Debug updated user
    console.log("API - Updated user:", updatedUser);

    // Log the activity
    await logActivity({
      userId: session.user.id,
      action: "UPDATED_USER",
      resourceType: "USER",
      resourceId: userId,
      resourceTitle: `Updated privilege for ${targetUser.firstName} ${targetUser.lastName} to ${privilege}`,
      metadata: {
        userId,
        newPrivilege: privilege,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Privilege updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    // Detailed error logging
    console.error("[PATCH] /api/users/privilege error:", error);
    
    // Return more specific error messages based on the error type
    if ((error as any).code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: "Failed to update privilege",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { config } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get the authenticated session
    const session = await getServerSession(config);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile with company information
    const userProfile = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        verified: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        username: userProfile.username,
        verified: userProfile.verified,
        createdAt: userProfile.createdAt,
        company: {
          id: userProfile.company.id,
          name: userProfile.company.name,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 
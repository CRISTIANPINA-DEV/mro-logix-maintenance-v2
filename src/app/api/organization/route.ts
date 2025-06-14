import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user's company ID from the session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { companyId: true }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Fetch all users from the same company
    const organizationMembers = await prisma.user.findMany({
      where: {
        companyId: user.companyId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        createdAt: true
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    return NextResponse.json(organizationMembers);
  } catch (error) {
    console.error("[ORGANIZATION_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 
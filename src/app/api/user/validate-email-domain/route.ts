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

    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
    }

    // Get current user with company info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        companyId: true
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
    const newEmailDomain = email.split('@')[1];

    // Check if the new email domain matches any of the company's domains
    if (!companyDomains.has(newEmailDomain)) {
      return NextResponse.json({ 
        success: false, 
        error: `Email must use one of your organization's domains: ${Array.from(companyDomains).join(', ')}` 
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in validate-email-domain route:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate email domain" },
      { status: 500 }
    );
  }
} 
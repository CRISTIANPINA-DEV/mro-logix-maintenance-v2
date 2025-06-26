import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";
import { addDays, addMonths, addYears } from "date-fns";

const prisma = new PrismaClient();

// Calculate next rotation date based on frequency
function calculateNextRotationDate(fromDate: Date, frequency: string): Date {
  switch (frequency) {
    case "weekly":
      return addDays(fromDate, 7);
    case "monthly":
      return addMonths(fromDate, 1);
    case "quarterly":
      return addMonths(fromDate, 3);
    case "biannually":
      return addMonths(fromDate, 6);
    case "annually":
      return addYears(fromDate, 1);
    default:
      return addMonths(fromDate, 1);
  }
}

// GET - List all wheel rotations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("active");

    const whereClause: any = { companyId };
    if (isActive !== null) {
      whereClause.isActive = isActive === "true";
    }

    const wheelRotations = await prisma.wheelRotation.findMany({
      where: whereClause,
      include: {
        rotationHistory: {
          orderBy: { rotationDate: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(wheelRotations);
  } catch (error) {
    console.error("Error fetching wheel rotations:", error);
    return NextResponse.json(
      { error: "Failed to fetch wheel rotations" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create new wheel rotation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const data = await req.json();

    // Calculate first rotation due date
    const nextRotationDue = calculateNextRotationDate(
      new Date(data.arrivalDate),
      data.rotationFrequency
    );

    const wheelRotation = await prisma.wheelRotation.create({
      data: {
        companyId,
        arrivalDate: new Date(data.arrivalDate),
        station: data.station,
        airline: data.airline,
        wheelPartNumber: data.wheelPartNumber,
        wheelSerialNumber: data.wheelSerialNumber,
        currentPosition: 0, // Always starts at 0 degrees
        rotationFrequency: data.rotationFrequency,
        lastRotationDate: new Date(data.arrivalDate),
        nextRotationDue,
        notes: data.notes,
      },
    });

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: "ADDED_WHEEL_ROTATION",
      resourceType: "WHEEL_ROTATION",
      resourceId: wheelRotation.id,
      resourceTitle: `Added wheel ${data.wheelSerialNumber} for rotation tracking`,
      metadata: { airline: data.airline, partNumber: data.wheelPartNumber }
    });

    return NextResponse.json(wheelRotation);
  } catch (error) {
    console.error("Error creating wheel rotation:", error);
    return NextResponse.json(
      { error: "Failed to create wheel rotation" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 
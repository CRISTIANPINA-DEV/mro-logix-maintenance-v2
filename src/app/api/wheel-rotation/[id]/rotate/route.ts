import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";
import { addDays, addMonths, addYears } from "date-fns";

const prisma = new PrismaClient();

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

// POST - Add rotation record
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { id } = await params;

    // Get current wheel rotation
    const wheelRotation = await prisma.wheelRotation.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId,
      },
    });

    if (!wheelRotation) {
      return NextResponse.json(
        { error: "Wheel rotation not found" },
        { status: 404 }
      );
    }

    // Create rotation history record
    const rotationHistory = await prisma.wheelRotationHistory.create({
      data: {
        companyId: session.user.companyId,
        wheelRotationId: id,
        rotationDate: new Date(data.rotationDate || new Date()),
        previousPosition: wheelRotation.currentPosition,
        newPosition: data.newPosition,
        performedBy: data.performedBy || session.user.name,
        notes: data.notes,
      },
    });

    // Update wheel rotation with new position and dates
    const nextRotationDue = calculateNextRotationDate(
      new Date(data.rotationDate || new Date()),
      wheelRotation.rotationFrequency
    );

    await prisma.wheelRotation.update({
      where: { id: id },
      data: {
        currentPosition: data.newPosition,
        lastRotationDate: new Date(data.rotationDate || new Date()),
        nextRotationDue,
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "ROTATED_WHEEL",
      resourceType: "WHEEL_ROTATION",
      resourceId: wheelRotation.id,
      resourceTitle: `Rotated wheel ${wheelRotation.wheelSerialNumber} from ${wheelRotation.currentPosition}° to ${data.newPosition}°`
    });

    return NextResponse.json(rotationHistory);
  } catch (error) {
    console.error("Error creating rotation record:", error);
    return NextResponse.json(
      { error: "Failed to create rotation record" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 
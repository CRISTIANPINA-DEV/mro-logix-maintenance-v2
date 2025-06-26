import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";

const prisma = new PrismaClient();

// GET - Get specific wheel details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const wheelRotation = await prisma.wheelRotation.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId,
      },
      include: {
        rotationHistory: {
          orderBy: { rotationDate: "desc" },
        },
      },
    });

    if (!wheelRotation) {
      return NextResponse.json(
        { error: "Wheel rotation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(wheelRotation);
  } catch (error) {
    console.error("Error fetching wheel rotation:", error);
    return NextResponse.json(
      { error: "Failed to fetch wheel rotation" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update wheel rotation
export async function PUT(
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

    const wheelRotation = await prisma.wheelRotation.update({
      where: {
        id: id,
        companyId: session.user.companyId,
      },
      data: {
        station: data.station,
        airline: data.airline,
        wheelPartNumber: data.wheelPartNumber,
        wheelSerialNumber: data.wheelSerialNumber,
        rotationFrequency: data.rotationFrequency,
        notes: data.notes,
        isActive: data.isActive,
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "UPDATED_WHEEL_ROTATION",
      resourceType: "WHEEL_ROTATION",
      resourceId: wheelRotation.id,
      resourceTitle: `Updated wheel ${wheelRotation.wheelSerialNumber} information`
    });

    return NextResponse.json(wheelRotation);
  } catch (error) {
    console.error("Error updating wheel rotation:", error);
    return NextResponse.json(
      { error: "Failed to update wheel rotation" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete wheel rotation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const wheelRotation = await prisma.wheelRotation.delete({
      where: {
        id: id,
        companyId: session.user.companyId,
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "DELETED_WHEEL_ROTATION",
      resourceType: "WHEEL_ROTATION",
      resourceId: wheelRotation.id,
      resourceTitle: `Deleted wheel ${wheelRotation.wheelSerialNumber} from rotation tracking`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting wheel rotation:", error);
    return NextResponse.json(
      { error: "Failed to delete wheel rotation" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteTechnicianTrainingFile } from "@/lib/s3";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the training record exists and belongs to the user's company
    const training = await prisma.technicianTraining.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        Attachment: true,
      },
    });

    if (!training) {
      return NextResponse.json(
        { error: "Training record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(training);
  } catch (error) {
    console.error("Error fetching training record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the training record with attachments and verify company ownership
    const training = await prisma.technicianTraining.findFirst({
      where: { 
        id,
        companyId: session.user.companyId
      },
      include: {
        Attachment: true,
      },
    });

    if (!training) {
      return NextResponse.json(
        { error: "Training record not found" },
        { status: 404 }
      );
    }

    // Delete attachments from S3 if any
    if (training.hasAttachments && training.Attachment.length > 0) {
      const deletePromises = training.Attachment.map((attachment) =>
        deleteTechnicianTrainingFile(attachment.fileKey)
      );
      await Promise.all(deletePromises);
    }

    // Delete the training record (this will cascade delete attachments)
    await prisma.technicianTraining.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting training record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteIncomingInspectionFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Validate the ID
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Inspection ID is required' },
        { status: 400 }
      );
    }

    // Fetch the inspection filtered by company
    const inspection = await prisma.incomingInspection.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId
      },
      include: {
        StockInventory: true,
        Attachment: true,
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { success: false, message: 'Inspection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: inspection });
  } catch (error) {
    console.error('Error fetching inspection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspection' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user to get user ID and company info for activity logging
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const companyId = session.user.companyId;

    const { id } = await params;
    
    // Validate the ID
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Inspection ID is required' },
        { status: 400 }
      );
    }

    // First get the inspection to handle attachments (filtered by company)
    const inspection = await prisma.incomingInspection.findFirst({
      where: { 
        id: id,
        companyId: companyId
      },
      include: { Attachment: true }
    });

    if (!inspection) {
      return NextResponse.json(
        { success: false, message: 'Inspection not found' },
        { status: 404 }
      );
    }

    // Delete all attachments from S3
    const deleteAttachmentPromises = inspection.Attachment.map(async (attachment) => {
      try {
        await deleteIncomingInspectionFile(attachment.fileKey);
      } catch (error) {
        console.error(`Error deleting attachment ${attachment.fileKey}:`, error);
      }
    });

    await Promise.all(deleteAttachmentPromises);

    // Use a transaction to delete both attachments and the inspection record
    await prisma.$transaction(async (tx) => {
      // Delete all attachments first (database records)
      if (inspection.Attachment.length > 0) {
        await tx.incomingInspectionAttachment.deleteMany({
          where: {
            incomingInspectionId: id
          }
        });
      }
      
      // Then delete the inspection record
      await tx.incomingInspection.delete({
        where: {
          id: id
        }
      });
    });

    // Log the activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: userId,
      action: 'DELETED_INCOMING_INSPECTION',
      resourceType: 'INCOMING_INSPECTION',
      resourceId: id,
      resourceTitle: `Incoming Inspection: ${inspection.partNo || 'N/A'} - ${inspection.serialNo || 'N/A'}`,
      metadata: {
        inspector: inspection.inspector,
        partNo: inspection.partNo,
        serialNo: inspection.serialNo,
        stockInventoryId: inspection.stockInventoryId,
        hadAttachments: inspection.Attachment.length > 0,
        attachmentCount: inspection.Attachment.length,
        companyId: companyId
      },
      ...requestInfo
    });

    return NextResponse.json({ 
      success: true,
      message: 'Inspection deleted successfully',
      id: id
    });
      } catch (error) {
      console.error('Error deleting inspection:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to delete inspection',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
} 
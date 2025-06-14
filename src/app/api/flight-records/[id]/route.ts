import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteFlightRecordFile, uploadFlightRecordFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Validate the ID
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Flight record ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch the flight record with its attachments, filtered by company
    const record = await prisma.flightRecord.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId
      },
      include: {
        Attachment: true,
        PartReplacement: true
      }
    });
    
    if (!record) {
      return NextResponse.json(
        { success: false, message: 'Flight record not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      record
    });
  } catch (error) {
    console.error('Error fetching flight record:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch flight record' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    
    // Validate the ID
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Flight record ID is required' },
        { status: 400 }
      );
    }
    
    // First, find the flight record with its attachments to check if any files need to be deleted
    // Filter by company to ensure user can only delete records from their company
    const record = await prisma.flightRecord.findFirst({
      where: {
        id: id,
        companyId: companyId
      },
      include: {
        Attachment: true
      }
    });
    
    if (!record) {
      return NextResponse.json(
        { success: false, message: 'Flight record not found' },
        { status: 404 }
      );
    }
    
    // Track deletion status of files
    const fileResults = [];
    
    // Delete any attached files from S3 first
    if (record.hasAttachments && record.Attachment.length > 0) {
      console.log(`Deleting ${record.Attachment.length} attachment(s) for flight record ${id}`);
      
      // Delete each file from S3
      for (const attachment of record.Attachment) {
        try {
          await deleteFlightRecordFile(attachment.fileKey);
          fileResults.push({
            fileKey: attachment.fileKey,
            success: true
          });
        } catch (fileError) {
          console.error(`Error deleting file ${attachment.fileKey}:`, fileError);
          fileResults.push({
            fileKey: attachment.fileKey,
            success: false,
            error: fileError instanceof Error ? fileError.message : 'Unknown error'
          });
        }
      }
    }
    
    // Use a transaction to delete both attachments and the flight record
    await prisma.$transaction(async (tx) => {
      // Delete all attachments first (database records)
      if (record.hasAttachments) {
        await tx.attachment.deleteMany({
          where: {
            flightRecordId: id
          }
        });
      }
      
      // Then delete the flight record
      await tx.flightRecord.delete({
        where: {
          id: id
        }
      });
    });
    
    // Log the activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: userId,
      action: 'DELETED_FLIGHT_RECORD',
      resourceType: 'FLIGHT_RECORD',
      resourceId: id,
      resourceTitle: `Flight Record: ${record.airline} ${record.fleet} - ${record.tail || 'N/A'} (${record.station})`,
      metadata: {
        airline: record.airline,
        fleet: record.fleet,
        tail: record.tail || null,
        station: record.station,
        service: record.service,
        hadAttachments: record.hasAttachments,
        attachmentCount: record.Attachment.length,
        companyId: companyId
      },
      ...requestInfo
    });
    
    return NextResponse.json({
      success: true,
      message: 'Flight record deleted successfully',
      id: id,
      fileResults: fileResults.length > 0 ? fileResults : undefined
    });
  } catch (error) {
    console.error('Error deleting flight record:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete flight record',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
  }
  const companyId = session.user.companyId;

  // Parse FormData
  const formData = await request.formData();
  // Extract fields
  const airline = formData.get("airline") as string;
  const fleet = formData.get("fleet") as string;
  const flightNumber = formData.get("flightNumber") as string;
  const tail = formData.get("tail") as string;
  const station = formData.get("station") as string;
  const service = formData.get("service") as string;
  const date = formData.get("date") as string;
  const hasTime = formData.get("hasTime") === "true";
  const blockTime = formData.get("blockTime") as string;
  const outTime = formData.get("outTime") as string;
  const hasDefect = formData.get("hasDefect") === "true";
  const logPageNo = formData.get("logPageNo") as string;
  const discrepancyNote = formData.get("discrepancyNote") as string;
  const rectificationNote = formData.get("rectificationNote") as string;
  const systemAffected = formData.get("systemAffected") as string;
  const defectStatus = formData.get("defectStatus") as string;
  const riiRequired = formData.get("riiRequired") === "true";
  const inspectedBy = formData.get("inspectedBy") as string;
  const fixingManual = formData.get("fixingManual") as string;
  const manualReference = formData.get("manualReference") as string;
  const hasPartReplaced = formData.get("hasPartReplaced") === "true";
  const hasAttachments = formData.get("hasAttachments") === "true";
  const hasComment = formData.get("hasComment") === "true";
  const comment = formData.get("comment") as string;
  const technician = formData.get("technician") as string;
  const username = formData.get("username") as string;

  // Extract deleted attachment IDs
  const deletedAttachmentIdsJson = formData.get("deletedAttachmentIds") as string;
  const deletedAttachmentIds = deletedAttachmentIdsJson ? JSON.parse(deletedAttachmentIdsJson) as string[] : [];

  // Extract part replacements
  const partReplacementsJson = formData.get("partReplacements") as string;
  const partReplacements = partReplacementsJson ? JSON.parse(partReplacementsJson) : [];

  try {
    // Use a transaction to handle all database operations
    const result = await prisma.$transaction(async (tx) => {
      // Handle deleted attachments first
      if (deletedAttachmentIds.length > 0) {
        // Get the attachments to be deleted
        const attachmentsToDelete = await tx.attachment.findMany({
          where: {
            id: { in: deletedAttachmentIds },
            flightRecordId: id,
            companyId: companyId
          }
        });

        // Delete files from S3
        for (const attachment of attachmentsToDelete) {
          try {
            await deleteFlightRecordFile(attachment.fileKey);
          } catch (fileError) {
            console.error(`Error deleting file ${attachment.fileKey}:`, fileError);
            // Continue with other deletions even if one fails
          }
        }

        // Delete attachment records from database
        await tx.attachment.deleteMany({
          where: {
            id: { in: deletedAttachmentIds },
            flightRecordId: id,
            companyId: companyId
          }
        });
      }

      // Handle new file uploads
      const files = formData.getAll("files") as File[];
      if (files.length > 0) {
        for (const file of files) {
          if (file instanceof File && file.size > 0) {
            // Upload file to S3
            const fileKey = await uploadFlightRecordFile(file, id, companyId);
            
            // Create attachment record in database
            await tx.attachment.create({
              data: {
                companyId: companyId,
                fileName: file.name,
                fileKey,
                fileSize: file.size,
                fileType: file.type,
                flightRecordId: id,
              },
            });
          }
        }
      }

      // Handle part replacements
      if (partReplacements.length > 0) {
        // Delete existing part replacements
        await tx.partReplacement.deleteMany({
          where: {
            flightRecordId: id,
            companyId: companyId
          }
        });

        // Create new part replacements
        for (const part of partReplacements) {
          if (part.pnOff || part.snOff || part.pnOn || part.snOn) {
            await tx.partReplacement.create({
              data: {
                companyId: companyId,
                pnOff: part.pnOff || "",
                snOff: part.snOff || "",
                pnOn: part.pnOn || "",
                snOn: part.snOn || "",
                flightRecordId: id,
              },
            });
          }
        }
      }

      // Update the flight record
      const updated = await tx.flightRecord.update({
        where: { id, companyId },
        data: {
          airline,
          fleet,
          flightNumber,
          tail,
          station,
          service,
          date: date ? new Date(date) : undefined,
          hasTime,
          blockTime,
          outTime,
          hasDefect,
          logPageNo,
          discrepancyNote,
          rectificationNote,
          systemAffected,
          defectStatus,
          riiRequired,
          inspectedBy,
          fixingManual,
          manualReference,
          hasPartReplaced,
          hasAttachments,
          hasComment,
          comment,
          technician,
          username,
        },
        include: {
          Attachment: true,
          PartReplacement: true
        }
      });

      return updated;
    });

    return NextResponse.json({ success: true, record: result });
  } catch (error) {
    console.error('Error updating flight record:', error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to update record",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadFlightRecordFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';

// Maximum file size limit (250MB in bytes)
const MAX_UPLOAD_SIZE_BYTES = 250 * 1024 * 1024;

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = {
      id: session.user.id,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      companyId: session.user.companyId
    };

    const { id } = await params;

    // Find the temporal flight record
    const existingTemporal = await prisma.flightRecord.findFirst({
      where: {
        id: id,
        companyId: currentUser.companyId,
        isTemporary: true
      }
    });

    if (!existingTemporal) {
      return NextResponse.json(
        { success: false, message: 'Temporal flight record not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    
    // Extract all form data (similar to original route but updating existing record)
    const fleet = formData.get('fleet') as string;
    const service = formData.get('service') as string;
    const tail = formData.get('tail') as string;
    const hasTime = formData.get('hasTime') === 'yes';
    const blockTime = formData.get('blockTime') as string;
    const outTime = formData.get('outTime') as string;
    const hasDefect = formData.get('hasDefect') === 'yes';
    const logPageNo = formData.get('logPageNo') as string;
    const discrepancyNote = formData.get('discrepancyNote') as string;
    const rectificationNote = formData.get('rectificationNote') as string;
    const systemAffected = formData.get('systemAffected') as string;
    const defectStatus = formData.get('defectStatus') as string;
    const fixingManual = formData.get('fixingManual') as string;
    const manualReference = formData.get('manualReference') as string;
    const riiRequired = formData.get('riiRequired') === 'yes';
    const inspectedBy = formData.get('inspectedBy') as string;
    const etopsFlight = formData.get('etopsFlight') as string;
    const hasPartReplaced = formData.get('hasPartReplaced') === 'yes';
    const hasAttachments = formData.get('hasAttachments') === 'yes';
    const hasComment = formData.get('hasComment') === 'yes';
    const comment = formData.get('comment') as string;
    const technician = formData.get('technician') as string;
    const username = formData.get('username') as string;
    
    // Validate required fields for completion
    if (!fleet || !service) {
      return NextResponse.json(
        { success: false, message: 'Fleet and Service are required for completion' },
        { status: 400 }
      );
    }
    
    // Extract part replacements
    let partReplacements: Array<{ pnOff: string; snOff: string; pnOn: string; snOn: string }> = [];
    if (hasPartReplaced) {
      const partReplacementsJson = formData.get('partReplacements') as string;
      if (partReplacementsJson) {
        partReplacements = JSON.parse(partReplacementsJson);
      }
    }
    
    // Handle file uploads if any
    let fileEntries: File[] = [];
    if (hasAttachments) {
      const files = formData.getAll('files') as File[];
      fileEntries = files.filter(file => file.size > 0);
      
      // Check total file size
      const totalSize = fileEntries.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > MAX_UPLOAD_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, message: `Total upload size exceeds 250MB limit` },
          { status: 400 }
        );
      }
    }

    // Update the flight record to complete it
    const updatedFlightRecord = await prisma.flightRecord.update({
      where: { id: id },
      data: {
        fleet,
        service,
        tail: tail || null,
        hasTime,
        blockTime: hasTime ? blockTime : null,
        outTime: hasTime ? outTime : null,
        hasDefect,
        logPageNo: hasDefect ? logPageNo : null,
        discrepancyNote: hasDefect ? discrepancyNote : null,
        rectificationNote: hasDefect ? rectificationNote : null,
        systemAffected: hasDefect ? systemAffected : null,
        defectStatus: hasDefect ? defectStatus : null,
        riiRequired: hasDefect ? riiRequired : false,
        inspectedBy: hasDefect && riiRequired ? inspectedBy : null,
        etopsFlight: etopsFlight || null,
        fixingManual: hasDefect && defectStatus ? fixingManual : null,
        manualReference: hasDefect && defectStatus ? manualReference : null,
        hasPartReplaced: hasDefect ? hasPartReplaced : false,
        hasAttachments,
        hasComment,
        comment: hasComment ? comment : null,
        technician: technician || null,
        username: username || null,
        isTemporary: false // Mark as no longer temporary
      }
    });

    // Handle part replacements
    if (hasDefect && hasPartReplaced && partReplacements.length > 0) {
      // First delete any existing part replacements
      await prisma.partReplacement.deleteMany({
        where: { flightRecordId: id }
      });
      
      // Create new part replacements
      await prisma.partReplacement.createMany({
        data: partReplacements.map(part => ({
          companyId: currentUser.companyId,
          flightRecordId: id,
          pnOff: part.pnOff || null,
          snOff: part.snOff || null,
          pnOn: part.pnOn || null,
          snOn: part.snOn || null
        }))
      });
    }

    // Handle file uploads
    if (hasAttachments && fileEntries.length > 0) {
      // First delete any existing attachments
      await prisma.attachment.deleteMany({
        where: { flightRecordId: id }
      });

      // Upload new files and create attachment records
      for (const file of fileEntries) {
        try {
          const fileKey = await uploadFlightRecordFile(file, id, currentUser.companyId);
          await prisma.attachment.create({
            data: {
              companyId: currentUser.companyId,
              fileName: file.name,
              fileKey: fileKey,
              fileSize: file.size,
              fileType: file.type,
              flightRecordId: id
            }
          });
        } catch (uploadError) {
          console.error(`Error uploading file ${file.name}:`, uploadError);
          // Continue with other files even if one fails
        }
      }
    }

    // Log activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: currentUser.id,
      action: 'UPDATED_FLIGHT_RECORD',
      resourceType: 'FLIGHT_RECORD',
      resourceId: updatedFlightRecord.id,
      resourceTitle: `Completed Flight: ${updatedFlightRecord.airline} ${updatedFlightRecord.flightNumber} - ${updatedFlightRecord.station}`,
      metadata: {
        airline: updatedFlightRecord.airline,
        flightNumber: updatedFlightRecord.flightNumber,
        station: updatedFlightRecord.station,
        fleet: updatedFlightRecord.fleet,
        service: updatedFlightRecord.service,
        date: updatedFlightRecord.date.toISOString(),
        hasDefect: updatedFlightRecord.hasDefect,
        hasAttachments: updatedFlightRecord.hasAttachments,
        companyId: currentUser.companyId
      },
      ...requestInfo
    });

    return NextResponse.json({
      success: true,
      message: 'Flight record completed successfully',
      data: updatedFlightRecord
    });

  } catch (error) {
    console.error('Error completing temporal flight record:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to complete flight record' },
      { status: 500 }
    );
  }
}
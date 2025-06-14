import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadFlightRecordFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';

// Maximum file size limit (250MB in bytes)
const MAX_UPLOAD_SIZE_BYTES = 250 * 1024 * 1024;

// Updated with technician field support
export async function POST(request: Request) {
  try {
    // Authenticate user to get user ID and company info for activity logging
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

    const formData = await request.formData();
    
    // Extract and validate required form data
    const date = formData.get('date') as string;
    const airline = formData.get('airline') as string;
    const fleet = formData.get('fleet') as string;
    const flightNumber = formData.get('flightNumber') as string;
    const station = formData.get('station') as string;
    const service = formData.get('service') as string;
    
    // Validate required fields
    if (!date || !airline || !fleet || !station || !service) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Extract optional form data
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
    const hasPartReplaced = formData.get('hasPartReplaced') === 'yes';
    const hasAttachments = formData.get('hasAttachments') === 'yes';
    const hasComment = formData.get('hasComment') === 'yes';
    const comment = formData.get('comment') as string;
    const technician = formData.get('technician') as string;
    const username = formData.get('username') as string;
    
    // Extract part replacements
    let partReplacements: Array<{ pnOff: string; snOff: string; pnOn: string; snOn: string }> = [];
    if (hasPartReplaced) {
      const partReplacementsJson = formData.get('partReplacements') as string;
      if (partReplacementsJson) {
        partReplacements = JSON.parse(partReplacementsJson);
      }
    }
    
    // Fix the date timezone issue by properly handling the date
    // Parse the date correctly to prevent timezone offset issues
    let correctedDate;
    if (date) {
      // Split the date string into parts (YYYY-MM-DD format from input)
      const [year, month, day] = date.split('-').map(Number);
      
      // Create date with local timezone (using UTC date constructor with local values)
      correctedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    } else {
      correctedDate = new Date();
    }
    
    console.log(`Original date string: ${date}, Corrected date: ${correctedDate.toISOString()}`);
    
    // Create flight record in database
    let flightRecord;
    try {
      console.log('Creating flight record with data:', {
        date: correctedDate,
        airline,
        fleet,
        hasDefect,
        hasPartReplaced,
        partReplacements
      });

      flightRecord = await prisma.flightRecord.create({
        data: {
          companyId: currentUser.companyId,
          date: correctedDate,
          airline,
          fleet,
          flightNumber: flightNumber || null,
          tail: tail || null,
          station,
          service,
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
          fixingManual: hasDefect && defectStatus ? fixingManual : null,
          manualReference: hasDefect && defectStatus ? manualReference : null,
          hasPartReplaced: hasDefect ? hasPartReplaced : false,
          hasAttachments,
          hasComment,
          comment: hasComment ? comment : null,
          technician: technician || null,
          username: username || null,
          PartReplacement: hasDefect && hasPartReplaced && partReplacements.length > 0 ? {
            create: partReplacements.map(part => ({
              companyId: currentUser.companyId,
              pnOff: part.pnOff || null,
              snOff: part.snOff || null,
              pnOn: part.pnOn || null,
              snOn: part.snOn || null
            }))
          } : undefined
        },
        include: {
          PartReplacement: true
        }
      });

      console.log('Successfully created flight record:', flightRecord);
    } catch (dbError) {
      console.error('Detailed database error:', {
        error: dbError,
        errorMessage: dbError instanceof Error ? dbError.message : 'Unknown error',
        errorStack: dbError instanceof Error ? dbError.stack : undefined
      });
      return NextResponse.json(
        { success: false, message: 'Database error while creating flight record', error: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    // Handle file uploads if there are attachments
    if (hasAttachments) {
      const fileEntries = formData.getAll('files') as File[];
      
      // Calculate total size of files
      const totalSize = fileEntries.reduce((sum, file) => sum + file.size, 0);
      
      // Check if total size exceeds the limit
      if (totalSize > MAX_UPLOAD_SIZE_BYTES) {
        // Delete the flight record we just created since we can't add the attachments
        await prisma.flightRecord.delete({
          where: { id: flightRecord.id }
        });
        
        return NextResponse.json(
          { success: false, message: `Total upload size (${(totalSize / (1024 * 1024)).toFixed(2)}MB) exceeds the 250MB limit` },
          { status: 400 }
        );
      }
      
      const attachmentPromises = fileEntries.map(async (file) => {
        // Upload file to S3 and get the file key with company-based folder structure
        const fileKey = await uploadFlightRecordFile(file, flightRecord.id, currentUser.companyId);
        
        // Create attachment record in database
        return prisma.attachment.create({
          data: {
            companyId: currentUser.companyId,
            fileName: file.name,
            fileKey,
            fileSize: file.size,
            fileType: file.type,
            flightRecordId: flightRecord.id,
          },
        });
      });
      
      // Wait for all file uploads and database entries to complete
      await Promise.all(attachmentPromises);
    }
    
    // Log the activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: currentUser.id,
      action: 'ADDED_FLIGHT_RECORD',
      resourceType: 'FLIGHT_RECORD',
      resourceId: flightRecord.id,
      resourceTitle: `Flight Record: ${airline} ${fleet} - ${tail || 'N/A'} (${station})`,
      metadata: {
        airline,
        fleet,
        tail: tail || null,
        station,
        service,
        hasDefect,
        technician: technician || null,
        companyId: currentUser.companyId
      },
      ...requestInfo
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Flight record created successfully',
      flightRecordId: flightRecord.id 
    });
  } catch (error) {
    console.error('Error creating flight record:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create flight record' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch flight records filtered by company
    const records = await prisma.flightRecord.findMany({
      where: {
        companyId: session.user.companyId
      },
      include: {
        Attachment: true,
        PartReplacement: true
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    return NextResponse.json({
      success: true,
      records,
    });
  } catch (error) {
    console.error('Error fetching flight records:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch flight records' },
      { status: 500 }
    );
  }
} 
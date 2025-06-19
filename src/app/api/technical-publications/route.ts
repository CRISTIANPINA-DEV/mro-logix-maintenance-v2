import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadTechnicalPublicationFile, deleteTechnicalPublicationFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';

// Maximum file size limit (50MB in bytes)
const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;

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

    // Check if user has admin privileges
    if (session.user.privilege !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin privileges required to create technical publications' },
        { status: 403 }
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
    const revisionDate = formData.get('revisionDate') as string;
    const manualDescription = formData.get('manualDescription') as string;
    const revisionNumber = formData.get('revisionNumber') as string;
    const owner = formData.get('owner') as string;
    const comment = formData.get('comment') as string; // Optional comment field
    
    // Validate required fields
    if (!revisionDate || !manualDescription || !revisionNumber || !owner) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Fix the date timezone issue by properly handling the date
    let correctedRevisionDate;
    if (revisionDate) {
      const [year, month, day] = revisionDate.split('-').map(Number);
      correctedRevisionDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    } else {
      correctedRevisionDate = new Date();
    }
    
    // Check if file is provided
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'File is required' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds the 50MB limit` },
        { status: 400 }
      );
    }
    
    // Create technical publication record in database
    let technicalPublication;
    try {
      technicalPublication = await prisma.technicalPublication.create({
        data: {
          companyId: currentUser.companyId,
          revisionDate: correctedRevisionDate,
          manualDescription,
          revisionNumber,
          owner,
          comment: comment || null, // Store comment if provided, otherwise null
          hasAttachments: true,
          uploadedBy: currentUser.id
        }
      });

      console.log('Successfully created technical publication record:', technicalPublication);
    } catch (dbError) {
      console.error('Detailed database error:', {
        error: dbError,
        errorMessage: dbError instanceof Error ? dbError.message : 'Unknown error',
        errorStack: dbError instanceof Error ? dbError.stack : undefined
      });
      return NextResponse.json(
        { success: false, message: 'Database error while creating technical publication record', error: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Handle file upload
    try {
      // Upload file to S3 and get the file key
      const fileKey = await uploadTechnicalPublicationFile(file, technicalPublication.id, currentUser.companyId);
      
      // Create attachment record in database
      await prisma.technicalPublicationAttachment.create({
        data: {
          companyId: currentUser.companyId,
          fileName: file.name,
          fileKey,
          fileSize: file.size,
          fileType: file.type,
          technicalPublicationId: technicalPublication.id,
          uploadedBy: currentUser.id,
        },
      });

      // Create initial revision history entry
      await prisma.technicalPublicationRevision.create({
        data: {
          companyId: currentUser.companyId,
          technicalPublicationId: technicalPublication.id,
          changeType: 'CREATED',
          changeDescription: `Technical publication created with attachment: ${file.name}`,
          newValues: {
            revisionDate,
            manualDescription,
            revisionNumber,
            owner,
            comment: comment || '',
            attachments: [{
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type
            }]
          },
          attachmentFileName: file.name,
          attachmentAction: 'ADDED',
          modifiedBy: currentUser.id
        }
      });
    } catch (uploadError) {
      // Delete the technical publication record if file upload fails
      await prisma.technicalPublication.delete({
        where: { id: technicalPublication.id }
      });
      
      console.error('File upload error:', uploadError);
      return NextResponse.json(
        { success: false, message: 'Failed to upload file' },
        { status: 500 }
      );
    }
    
    // Log the activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: currentUser.id,
      action: 'ADDED_TECHNICAL_PUBLICATION',
      resourceType: 'TECHNICAL_PUBLICATION',
      resourceId: technicalPublication.id,
      resourceTitle: `Technical Publication: ${manualDescription} - Rev ${revisionNumber}`,
      metadata: {
        manualDescription,
        revisionNumber,
        owner,
        fileName: file.name,
        fileSize: file.size,
        companyId: currentUser.companyId
      },
      ...requestInfo
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Technical publication created successfully',
      technicalPublicationId: technicalPublication.id 
    });
  } catch (error) {
    console.error('Error creating technical publication:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create technical publication' },
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

    // Fetch technical publication records filtered by company
    const records = await prisma.technicalPublication.findMany({
      where: {
        companyId: session.user.companyId
      },
      include: {
        attachments: true
      },
      orderBy: {
        revisionDate: 'desc',
      },
    });
    
    return NextResponse.json({
      success: true,
      records,
    });
  } catch (error) {
    console.error('Error fetching technical publications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch technical publications' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Authenticate user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    if (session.user.privilege !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin privileges required to edit technical publications' },
        { status: 403 }
      );
    }

    const currentUser = {
      id: session.user.id,
      companyId: session.user.companyId
    };

    const formData = await request.formData();
    
    // Extract record ID
    const id = formData.get('id') as string;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Extract and validate required form data
    const revisionDate = formData.get('revisionDate') as string;
    const manualDescription = formData.get('manualDescription') as string;
    const revisionNumber = formData.get('revisionNumber') as string;
    const owner = formData.get('owner') as string;
    const comment = formData.get('comment') as string; // Optional comment field
    
    // Validate required fields
    if (!revisionDate || !manualDescription || !revisionNumber || !owner) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the record exists and belongs to the user's company
    const existingRecord = await prisma.technicalPublication.findFirst({
      where: {
        id,
        companyId: currentUser.companyId
      }
    });

    if (!existingRecord) {
      return NextResponse.json(
        { success: false, message: 'Technical publication not found' },
        { status: 404 }
      );
    }
    
    // Fix the date timezone issue
    let correctedRevisionDate;
    if (revisionDate) {
      const [year, month, day] = revisionDate.split('-').map(Number);
      correctedRevisionDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    } else {
      correctedRevisionDate = new Date();
    }
    
    // Update technical publication record
    const updatedRecord = await prisma.technicalPublication.update({
      where: { id },
      data: {
        revisionDate: correctedRevisionDate,
        manualDescription,
        revisionNumber,
        owner,
        comment: comment || null, // Update comment if provided, otherwise null
        updatedAt: new Date()
      }
    });
    
    // Log the activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: currentUser.id,
      action: 'UPDATED_TECHNICAL_PUBLICATION',
      resourceType: 'TECHNICAL_PUBLICATION',
      resourceId: updatedRecord.id,
      resourceTitle: `Technical Publication: ${manualDescription} - Rev ${revisionNumber}`,
      metadata: {
        manualDescription,
        revisionNumber,
        owner,
        companyId: currentUser.companyId
      },
      ...requestInfo
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Technical publication updated successfully',
      record: updatedRecord
    });
  } catch (error) {
    console.error('Error updating technical publication:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update technical publication' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Authenticate user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    if (session.user.privilege !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin privileges required to delete technical publications' },
        { status: 403 }
      );
    }

    const currentUser = {
      id: session.user.id,
      companyId: session.user.companyId
    };

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Verify the record exists and belongs to the user's company
    const existingRecord = await prisma.technicalPublication.findFirst({
      where: {
        id,
        companyId: currentUser.companyId
      },
      include: {
        attachments: true
      }
    });

    if (!existingRecord) {
      return NextResponse.json(
        { success: false, message: 'Technical publication not found' },
        { status: 404 }
      );
    }

    // Delete files from storage first
    if (existingRecord.attachments && existingRecord.attachments.length > 0) {
      const deleteFilePromises = existingRecord.attachments.map(async (attachment) => {
        try {
          await deleteTechnicalPublicationFile(attachment.fileKey);
          console.log(`Successfully deleted file: ${attachment.fileName}`);
        } catch (error) {
          console.error(`Failed to delete file ${attachment.fileName}:`, error);
          // Continue with deletion even if file deletion fails
        }
      });
      
      await Promise.allSettled(deleteFilePromises);
    }

    // Delete the record (attachments will be cascade deleted due to the schema relationship)
    await prisma.technicalPublication.delete({
      where: { id }
    });
    
    // Log the activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: currentUser.id,
      action: 'DELETED_TECHNICAL_PUBLICATION',
      resourceType: 'TECHNICAL_PUBLICATION',
      resourceId: existingRecord.id,
      resourceTitle: `Technical Publication: ${existingRecord.manualDescription} - Rev ${existingRecord.revisionNumber}`,
      metadata: {
        manualDescription: existingRecord.manualDescription,
        revisionNumber: existingRecord.revisionNumber,
        owner: existingRecord.owner,
        filesDeleted: existingRecord.attachments?.length || 0,
        companyId: currentUser.companyId
      },
      ...requestInfo
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Technical publication and associated files deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting technical publication:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete technical publication' },
      { status: 500 }
    );
  }
} 
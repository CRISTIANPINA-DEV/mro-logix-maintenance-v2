import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteTechnicalPublicationFile, uploadTechnicalPublicationFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch the specific technical publication record
    const record = await prisma.technicalPublication.findFirst({
      where: {
        id,
        companyId: session.user.companyId
      },
      include: {
        attachments: true
      }
    });

    if (!record) {
      return NextResponse.json(
        { success: false, message: 'Technical publication not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      record,
    });
  } catch (error) {
    console.error('Error fetching technical publication:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch technical publication' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const formData = await request.formData();

    // Extract and validate required form data
    const revisionDate = formData.get('revisionDate') as string;
    const manualDescription = formData.get('manualDescription') as string;
    const revisionNumber = formData.get('revisionNumber') as string;
    const owner = formData.get('owner') as string;
    const comment = formData.get('comment') as string; // Optional comment field
    const file = formData.get('file') as File | null; // Optional new file
    
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

    // Track changes for revision history
    const changes: any = {};
    const changedFields: any = {};
    let hasChanges = false;

    // Check for field changes
    if (existingRecord.revisionDate.toISOString().split('T')[0] !== revisionDate) {
      changes.revisionDate = { old: existingRecord.revisionDate.toISOString().split('T')[0], new: revisionDate };
      changedFields.revisionDate = { old: existingRecord.revisionDate.toISOString().split('T')[0], new: revisionDate };
      hasChanges = true;
    }
    if (existingRecord.manualDescription !== manualDescription) {
      changes.manualDescription = { old: existingRecord.manualDescription, new: manualDescription };
      changedFields.manualDescription = { old: existingRecord.manualDescription, new: manualDescription };
      hasChanges = true;
    }
    if (existingRecord.revisionNumber !== revisionNumber) {
      changes.revisionNumber = { old: existingRecord.revisionNumber, new: revisionNumber };
      changedFields.revisionNumber = { old: existingRecord.revisionNumber, new: revisionNumber };
      hasChanges = true;
    }
    if (existingRecord.owner !== owner) {
      changes.owner = { old: existingRecord.owner, new: owner };
      changedFields.owner = { old: existingRecord.owner, new: owner };
      hasChanges = true;
    }
    if ((existingRecord.comment || '') !== (comment || '')) {
      changes.comment = { old: existingRecord.comment || '', new: comment || '' };
      changedFields.comment = { old: existingRecord.comment || '', new: comment || '' };
      hasChanges = true;
    }

    // Handle file replacement if a new file is provided
    let fileReplaced = false;
    let oldFileName = '';
    if (file && file.size > 0) {
      try {
        // Store old file name for revision tracking
        if (existingRecord.attachments && existingRecord.attachments.length > 0) {
          oldFileName = existingRecord.attachments[0].fileName;
        }

        // Delete old attachment files from storage
        if (existingRecord.attachments && existingRecord.attachments.length > 0) {
          const deleteFilePromises = existingRecord.attachments.map(async (attachment) => {
            try {
              await deleteTechnicalPublicationFile(attachment.fileKey);
              console.log(`Successfully deleted old file: ${attachment.fileName}`);
            } catch (error) {
              console.error(`Failed to delete old file ${attachment.fileName}:`, error);
            }
          });
          await Promise.allSettled(deleteFilePromises);

          // Delete old attachment records from database
          await prisma.technicalPublicationAttachment.deleteMany({
            where: {
              technicalPublicationId: id
            }
          });
        }

        // Upload new file
        const fileKey = await uploadTechnicalPublicationFile(file, id, currentUser.companyId);
        
        // Create new attachment record
        await prisma.technicalPublicationAttachment.create({
          data: {
            companyId: currentUser.companyId,
            technicalPublicationId: id,
            fileName: file.name,
            fileKey: fileKey,
            fileSize: file.size,
            fileType: file.type,
            uploadedBy: currentUser.id
          }
        });

        fileReplaced = true;
        hasChanges = true;
        console.log(`Successfully uploaded new file: ${file.name}`);
      } catch (error) {
        console.error('Error handling file replacement:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to replace attachment file' },
          { status: 500 }
        );
      }
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
        comment: comment || null,
        updatedAt: new Date()
      },
      include: {
        attachments: true
      }
    });

    // Create revision history entry if there were changes
    if (hasChanges) {
      let changeDescription = '';
      let changeType = 'UPDATED';
      
      if (fileReplaced) {
        changeType = 'ATTACHMENT_REPLACED';
        changeDescription = `Attachment replaced: "${oldFileName}" → "${file!.name}"`;
        if (Object.keys(changedFields).length > 0) {
          changeDescription += ` and updated fields: ${Object.keys(changedFields).join(', ')}`;
        }
      } else {
        changeDescription = `Updated fields: ${Object.keys(changedFields).join(', ')}`;
      }

      await prisma.technicalPublicationRevision.create({
        data: {
          companyId: currentUser.companyId,
          technicalPublicationId: id,
          changeType,
          changeDescription,
          changedFields: Object.keys(changedFields).length > 0 ? changedFields : null,
          previousValues: {
            revisionDate: existingRecord.revisionDate.toISOString().split('T')[0],
            manualDescription: existingRecord.manualDescription,
            revisionNumber: existingRecord.revisionNumber,
            owner: existingRecord.owner,
            comment: existingRecord.comment || '',
            attachments: existingRecord.attachments?.map(att => ({
              fileName: att.fileName,
              fileSize: att.fileSize,
              fileType: att.fileType
            })) || []
          },
          newValues: {
            revisionDate,
            manualDescription,
            revisionNumber,
            owner,
            comment: comment || '',
            attachments: fileReplaced ? [{
              fileName: file!.name,
              fileSize: file!.size,
              fileType: file!.type
            }] : (existingRecord.attachments?.map(att => ({
              fileName: att.fileName,
              fileSize: att.fileSize,
              fileType: att.fileType
            })) || [])
          },
          attachmentFileName: fileReplaced ? file!.name : null,
          attachmentAction: fileReplaced ? 'REPLACED' : null,
          modifiedBy: currentUser.id
        }
      });
    }
    
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
        fileReplaced,
        changesCount: Object.keys(changedFields).length,
        companyId: currentUser.companyId
      },
      ...requestInfo
    });
    
    return NextResponse.json({ 
      success: true, 
      message: fileReplaced 
        ? 'Technical publication and attachment updated successfully'
        : 'Technical publication updated successfully',
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

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
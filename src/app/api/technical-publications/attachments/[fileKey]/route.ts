import { NextResponse } from 'next/server';
import { getTechnicalPublicationFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileKey: string }> }
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

    const { fileKey } = await params;
    
    // Decode the file key (it might be URL encoded)
    const decodedFileKey = decodeURIComponent(fileKey);

    // Verify the attachment belongs to the user's company
    const attachment = await prisma.technicalPublicationAttachment.findFirst({
      where: {
        fileKey: decodedFileKey,
        companyId: session.user.companyId
      },
      include: {
        technicalPublication: true
      }
    });

    if (!attachment) {
      return NextResponse.json(
        { success: false, message: 'File not found or access denied' },
        { status: 404 }
      );
    }

    // Download the file from S3
    const fileBlob = await getTechnicalPublicationFile(decodedFileKey);
    
    if (!fileBlob) {
      return NextResponse.json(
        { success: false, message: 'File not found in storage' },
        { status: 404 }
      );
    }

    // Log the download activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: session.user.id,
      action: 'DOWNLOADED_TECHNICAL_PUBLICATION',
      resourceType: 'TECHNICAL_PUBLICATION',
      resourceId: attachment.technicalPublication.id,
      resourceTitle: `Technical Publication: ${attachment.technicalPublication.manualDescription} - Rev ${attachment.technicalPublication.revisionNumber} (File: ${attachment.fileName})`,
      metadata: {
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        fileType: attachment.fileType,
        manualDescription: attachment.technicalPublication.manualDescription,
        revisionNumber: attachment.technicalPublication.revisionNumber,
        companyId: session.user.companyId
      },
      ...requestInfo
    });

    // Convert blob to array buffer
    const arrayBuffer = await fileBlob.arrayBuffer();
    
    // Return the file with appropriate headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': attachment.fileType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
        'Content-Length': attachment.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading technical publication file:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to download file' },
      { status: 500 }
    );
  }
} 
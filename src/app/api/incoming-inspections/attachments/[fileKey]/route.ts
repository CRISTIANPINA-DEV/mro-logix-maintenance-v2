import { NextResponse } from 'next/server';
import { getIncomingInspectionFile } from '@/lib/s3';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { canUserViewIncomingInspections } from '@/lib/user-permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileKey: string }> }
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

    // Check if user has permission to view incoming inspections
    const canView = await canUserViewIncomingInspections(session.user.id);
    if (!canView) {
      return NextResponse.json(
        { success: false, message: 'Permission denied' },
        { status: 403 }
      );
    }

    // Await the params to get the actual values
    const { fileKey: rawFileKey } = await params;
    
    // Decode the fileKey (it will be URL encoded from the frontend)
    const fileKey = decodeURIComponent(rawFileKey);
    
    // Validate the file key
    if (!fileKey) {
      return NextResponse.json(
        { success: false, message: 'File key is required' },
        { status: 400 }
      );
    }
    
    // Find the attachment in the database, filtered by company
    const attachment = await prisma.incomingInspectionAttachment.findFirst({
      where: {
        fileKey: fileKey,
        companyId: session.user.companyId
      }
    });
    
    if (!attachment) {
      console.error(`Attachment not found for fileKey: ${fileKey}`);
      return NextResponse.json(
        { success: false, message: 'Attachment not found in database' },
        { status: 404 }
      );
    }
    
    // Get the file from S3
    const fileData = await getIncomingInspectionFile(fileKey);
    
    if (!fileData) {
      console.error(`File data not found for fileKey: ${fileKey}`);
      return NextResponse.json(
        { success: false, message: 'File not found in storage' },
        { status: 404 }
      );
    }
    
    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', attachment.fileType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.fileName)}"`);
    headers.set('Cache-Control', 'no-cache');
    
    return new NextResponse(fileData, {
      status: 200,
      headers
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error downloading attachment:', errorMessage);
    return NextResponse.json(
      { success: false, message: `Failed to download attachment: ${errorMessage}` },
      { status: 500 }
    );
  }
} 
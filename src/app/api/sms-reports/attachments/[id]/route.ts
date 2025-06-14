import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSMSReportFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';

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

    // Get the attachment record from database, filtered by company
    const attachment = await prisma.sMSReportAttachment.findFirst({
      where: { 
        id,
        companyId: session.user.companyId
      },
      include: {
        SMSReport: {
          select: {
            id: true,
            reportNumber: true,
            reportTitle: true
          }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json(
        { success: false, message: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Get the file from S3
    const fileBuffer = await getSMSReportFile(attachment.fileKey);

    if (!fileBuffer) {
      return NextResponse.json(
        { success: false, message: 'File not found in storage' },
        { status: 404 }
      );
    }

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.fileType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
        'Content-Length': attachment.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading SMS report attachment:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
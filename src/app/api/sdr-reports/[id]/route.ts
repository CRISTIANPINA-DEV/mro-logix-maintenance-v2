import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteSDRReportFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';

// GET - Fetch single SDR report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Check if the SDR report exists and belongs to the user's company
    const sdrReport = await prisma.sDRReport.findFirst({
      where: { 
        id,
        companyId: session.user.companyId
      },
      include: {
        Attachment: true,
      },
    });

    if (!sdrReport) {
      return NextResponse.json(
        { error: 'SDR report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(sdrReport);
  } catch (error) {
    console.error('Error fetching SDR report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SDR report' },
      { status: 500 }
    );
  }
}

// DELETE - Delete SDR report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // First, get the report with its attachments and verify company ownership
    const sdrReport = await prisma.sDRReport.findFirst({
      where: { 
        id,
        companyId: session.user.companyId
      },
      include: {
        Attachment: true,
      },
    });

    if (!sdrReport) {
      return NextResponse.json(
        { error: 'SDR report not found' },
        { status: 404 }
      );
    }

    // Delete all attachments from S3
    for (const attachment of sdrReport.Attachment) {
      try {
        await deleteSDRReportFile(attachment.fileKey);
      } catch (error) {
        console.error(`Failed to delete file ${attachment.fileKey}:`, error);
        // Continue with deletion even if S3 deletion fails
      }
    }

    // Delete the report (this will cascade delete attachments due to Prisma schema)
    await prisma.sDRReport.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'SDR report deleted successfully' });
  } catch (error) {
    console.error('Error deleting SDR report:', error);
    return NextResponse.json(
      { error: 'Failed to delete SDR report' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteSMSReportFile } from '@/lib/s3';
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

    // Check if the SMS report exists and belongs to the user's company
    const smsReport = await prisma.sMSReport.findFirst({
      where: { 
        id,
        companyId: session.user.companyId
      },
      include: {
        Attachment: {
          select: {
            id: true,
            fileName: true,
            fileKey: true,
            fileSize: true,
            fileType: true,
            createdAt: true
          }
        }
      }
    });

    if (!smsReport) {
      return NextResponse.json(
        { success: false, message: 'SMS report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: smsReport
    });
  } catch (error) {
    console.error('Error fetching SMS report:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
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

    const currentUser = {
      id: session.user.id,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      companyId: session.user.companyId
    };

    const { id } = await params;

    // First, get the SMS report with its attachments and verify company ownership
    const smsReport = await prisma.sMSReport.findFirst({
      where: { 
        id,
        companyId: currentUser.companyId
      },
      include: {
        Attachment: true
      }
    });

    if (!smsReport) {
      return NextResponse.json(
        { success: false, message: 'SMS report not found' },
        { status: 404 }
      );
    }

    // Delete all attachments from S3
    if (smsReport.Attachment.length > 0) {
      const deletePromises = smsReport.Attachment.map(async (attachment) => {
        try {
          await deleteSMSReportFile(attachment.fileKey);
        } catch (error) {
          console.error(`Error deleting file ${attachment.fileKey}:`, error);
          // Continue with other deletions even if one fails
        }
      });
      
      await Promise.allSettled(deletePromises);
    }

    // Delete the SMS report (this will cascade delete attachments from DB)
    await prisma.sMSReport.delete({
      where: { id }
    });

    // Log the activity
    try {
      const requestInfo = await getRequestInfo(request);
      await logActivity({
        userId: currentUser.id,
        action: 'DELETED_SMS_REPORT',
        resourceType: 'SMS_REPORT',
        resourceId: id,
        resourceTitle: `Deleted SMS report ${smsReport.reportNumber}: ${smsReport.reportTitle}`,
        metadata: {
          reportNumber: smsReport.reportNumber,
          reportTitle: smsReport.reportTitle,
          companyId: currentUser.companyId
        },
        ...requestInfo
      });
    } catch (activityError) {
      console.error('Error logging activity:', activityError);
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'SMS report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting SMS report:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
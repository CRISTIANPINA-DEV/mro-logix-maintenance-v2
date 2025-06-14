import { NextRequest, NextResponse } from 'next/server';
import { getAuditFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/audits/files/[fileKey] - Download audit file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileKey: string }> }
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

    const companyId = session.user.companyId;

    const { fileKey: paramFileKey } = await params;
    // Decode the file key (in case it's URL encoded)
    const fileKey = decodeURIComponent(paramFileKey);
    
    // Verify the file belongs to the user's company by checking audit attachments
    const attachment = await prisma.auditAttachment.findFirst({
      where: {
        fileKey: fileKey,
        audit: {
          companyId: companyId
        }
      }
    });

    if (!attachment) {
      // Also check corrective action attachments
      const correctiveActionAttachment = await prisma.correctiveActionAttachment.findFirst({
        where: {
          fileKey: fileKey,
          correctiveAction: {
            finding: {
              audit: {
                companyId: companyId
              }
            }
          }
        }
      });

      if (!correctiveActionAttachment) {
        // Also check audit finding attachments
        const findingAttachment = await prisma.auditFindingAttachment.findFirst({
          where: {
            fileKey: fileKey,
            finding: {
              audit: {
                companyId: companyId
              }
            }
          }
        });

        if (!findingAttachment) {
          return NextResponse.json(
            { error: 'File not found' },
            { status: 404 }
          );
        }
      }
    }
    
    // Get file from S3
    const fileBuffer = await getAuditFile(fileKey);
    
    if (!fileBuffer) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Extract filename from the file key
    const parts = fileKey.split('/');
    const fileName = parts[parts.length - 1];
    
    // Extract original filename (remove timestamp prefix if present)
    const originalFileName = fileName.includes('-') 
      ? fileName.substring(fileName.indexOf('-') + 1)
      : fileName;

    // Determine content type based on file extension
    const getContentType = (filename: string): string => {
      const ext = filename.toLowerCase().split('.').pop();
      switch (ext) {
        case 'pdf':
          return 'application/pdf';
        case 'doc':
          return 'application/msword';
        case 'docx':
          return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls':
          return 'application/vnd.ms-excel';
        case 'xlsx':
          return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'gif':
          return 'image/gif';
        case 'txt':
          return 'text/plain';
        case 'csv':
          return 'text/csv';
        default:
          return 'application/octet-stream';
      }
    };

    const contentType = getContentType(originalFileName);

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${originalFileName}"`,
        'Content-Length': fileBuffer.size.toString(),
        'Cache-Control': 'private, no-cache'
      }
    });

  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
} 
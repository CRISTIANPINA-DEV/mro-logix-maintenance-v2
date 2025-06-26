import { NextResponse } from 'next/server';
import { getOilServiceFile } from '@/lib/s3';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

async function handleFileRequest(
  request: Request,
  { params }: { params: Promise<{ fileKey: string }> },
  isHeadRequest: boolean = false
) {
  try {
    // Authenticate user to get company info
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error('Unauthorized access attempt to oil consumption file download');
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!session.user.companyId) {
      console.error('User missing company ID:', session.user.id);
      return NextResponse.json(
        { success: false, message: 'Company ID required' },
        { status: 400 }
      );
    }

    // Await the params to get the actual values
    const { fileKey: rawFileKey } = await params;
    
    // Decode the fileKey multiple times to handle nested URL encoding
    let fileKey = rawFileKey;
    try {
      // Handle multiple levels of URL encoding
      while (fileKey !== decodeURIComponent(fileKey)) {
        fileKey = decodeURIComponent(fileKey);
      }
    } catch (error) {
      console.error('Error decoding fileKey:', rawFileKey, error);
      fileKey = rawFileKey; // Fallback to original if decoding fails
    }
    
    console.log('Oil consumption file download request:', {
      userId: session.user.id,
      companyId: session.user.companyId,
      rawFileKey,
      decodedFileKey: fileKey
    });
    
    // Validate the file key
    if (!fileKey) {
      console.error('Empty file key provided');
      return NextResponse.json(
        { success: false, message: 'File key is required' },
        { status: 400 }
      );
    }
    
    // Find the attachment in the database, filtered by company
    const attachment = await prisma.oilServiceAttachment.findFirst({
      where: {
        fileKey: fileKey,
        companyId: session.user.companyId
      },
      include: {
        OilServiceRecord: {
          select: {
            id: true,
            airline: true,
            fleet: true,
            date: true
          }
        }
      }
    });
    
    if (!attachment) {
      console.error('Oil service attachment not found:', {
        fileKey,
        companyId: session.user.companyId,
        userId: session.user.id
      });
      
      // Also try to search with the raw file key in case of encoding issues
      const attachmentRaw = await prisma.oilServiceAttachment.findFirst({
        where: {
          fileKey: rawFileKey,
          companyId: session.user.companyId
        }
      });
      
      if (!attachmentRaw) {
        return NextResponse.json(
          { success: false, message: 'Attachment not found in database' },
          { status: 404 }
        );
      } else {
        // Use the raw file key if found
        fileKey = rawFileKey;
      }
    }
    
    console.log('Found oil service attachment:', {
      attachmentId: attachment?.id,
      fileName: attachment?.fileName,
      fileKey: fileKey,
      recordId: attachment?.OilServiceRecord?.id
    });
    
    // Get the file from S3/Supabase
    const fileData = await getOilServiceFile(fileKey);
    
    if (!fileData) {
      console.error('File data not found in storage:', {
        fileKey,
        attachmentId: attachment?.id,
        companyId: session.user.companyId
      });
      return NextResponse.json(
        { success: false, message: 'File not found in storage' },
        { status: 404 }
      );
    }
    
    console.log('Successfully retrieved file data:', {
      fileKey,
      fileName: attachment?.fileName,
      fileSize: fileData.size,
      fileType: attachment?.fileType
    });
    
    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', attachment?.fileType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment?.fileName || 'download')}"`);
    headers.set('Content-Length', fileData.size.toString());
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // For HEAD requests, return only headers without body
    if (isHeadRequest) {
      return new NextResponse(null, {
        status: 200,
        headers
      });
    }
    
    return new NextResponse(fileData, {
      status: 200,
      headers
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error downloading oil service attachment:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { success: false, message: `Failed to download attachment: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileKey: string }> }
) {
  return handleFileRequest(request, { params }, false);
}

export async function HEAD(
  request: Request,
  { params }: { params: Promise<{ fileKey: string }> }
) {
  return handleFileRequest(request, { params }, true);
} 
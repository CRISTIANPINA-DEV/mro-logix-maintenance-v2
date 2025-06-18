import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { getAirportIdFile } from '@/lib/s3';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileKey: string }> }
) {
  const { fileKey } = await params;
  
  try {
    // Authenticate user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Decode the fileKey (in case it was URL encoded)
    const decodedFileKey = decodeURIComponent(fileKey);
    
    // Get the file from Supabase storage
    const fileBlob = await getAirportIdFile(decodedFileKey);
    
    if (!fileBlob) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Get the file name from the fileKey (last part after the last slash)
    const fileName = decodedFileKey.split('/').pop() || 'download';
    
    // Create response with proper headers
    const response = new NextResponse(fileBlob);
    response.headers.set('Content-Type', fileBlob.type || 'application/octet-stream');
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return response;
  } catch (error) {
    console.error('Error downloading airport ID file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
} 
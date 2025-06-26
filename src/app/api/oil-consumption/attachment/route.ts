import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { uploadOilServiceFile } from '@/lib/s3';

// POST /oil-consumption/attachment - Upload file for existing oil service record
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const companyId = session.user.companyId;
  const userId = session.user.id;
  const formData = await req.formData();
  const oilServiceRecordId = formData.get('oilServiceRecordId');
  const file = formData.get('file');
  if (!oilServiceRecordId || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file or record ID' }, { status: 400 });
  }
  
  try {
    const fileKey = await uploadOilServiceFile(file, oilServiceRecordId as string, companyId);
    
    const attachment = await prisma.oilServiceAttachment.create({
      data: {
        companyId,
        oilServiceRecordId: oilServiceRecordId as string,
        fileName: file.name,
        fileKey,
        fileSize: file.size,
        fileType: file.type,
      },
    });
    
    await prisma.oilServiceRecord.update({
      where: { id: oilServiceRecordId as string, companyId },
      data: { hasAttachments: true },
    });
    
    return NextResponse.json(attachment);
  } catch (error) {
    console.error('Error uploading oil service file:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// DELETE /oil-consumption/attachment - Delete a file attachment
export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const companyId = session.user.companyId;
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing attachment ID' }, { status: 400 });
  }
  const attachment = await prisma.oilServiceAttachment.delete({
    where: { id, companyId },
  });
  return NextResponse.json(attachment);
}

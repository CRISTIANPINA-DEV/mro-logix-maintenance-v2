import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { uploadOilServiceFile, deleteOilServiceFile } from '@/lib/s3';

// GET /oil-consumption/:id - Fetch single oil service record
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const record = await prisma.oilServiceRecord.findUnique({
      where: { id, companyId },
      include: { Attachment: true },
    });
    if (!record) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching oil service record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /oil-consumption/:id - Update oil service record
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const data = await req.json();
    const record = await prisma.oilServiceRecord.update({
      where: { id, companyId },
      data,
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating oil service record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /oil-consumption/:id - Delete oil service record and attachments
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const companyId = session.user.companyId;
  const resolvedParams = await params;
  const recordId = resolvedParams.id;

  try {
    // First, get the record with attachments to delete files from storage
    const record = await prisma.oilServiceRecord.findFirst({
      where: {
        id: recordId,
        companyId: companyId
      },
      include: {
        Attachment: true
      }
    });

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Delete all associated files from storage
    for (const attachment of record.Attachment) {
      try {
        await deleteOilServiceFile(attachment.fileKey);
      } catch (error) {
        console.error(`Failed to delete file ${attachment.fileKey}:`, error);
        // Continue with deletion even if file deletion fails
      }
    }

    // Delete the record (this will cascade delete attachments due to foreign key constraints)
    await prisma.oilServiceRecord.delete({
      where: {
        id: recordId
      }
    });

    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting oil service record:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}

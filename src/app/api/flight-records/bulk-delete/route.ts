import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function DELETE(request: Request) {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No records selected for deletion' },
        { status: 400 }
      );
    }

    // First, verify all records belong to the user's company
    const recordsToDelete = await prisma.flightRecord.findMany({
      where: {
        id: { in: ids },
        companyId: session.user.companyId
      },
      select: { id: true }
    });

    const validIds = recordsToDelete.map(record => record.id);

    if (validIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid records found for deletion' },
        { status: 404 }
      );
    }

    // First, delete all attachments associated with these flight records
    await prisma.attachment.deleteMany({
      where: {
        flightRecordId: {
          in: validIds
        },
        companyId: session.user.companyId
      }
    });

    // Then delete the flight records
    await prisma.flightRecord.deleteMany({
      where: {
        id: {
          in: validIds
        },
        companyId: session.user.companyId
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${validIds.length} record(s)`
    });
  } catch (error) {
    console.error('Error deleting flight records:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete records' },
      { status: 500 }
    );
  }
} 
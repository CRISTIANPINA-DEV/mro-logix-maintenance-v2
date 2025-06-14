import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteStockInventoryFile } from '@/lib/s3';
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

    // Validate the request
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No records selected for deletion' },
        { status: 400 }
      );
    }

    // First, fetch all records with their attachments and incoming inspections, filtered by company
    const records = await prisma.stockInventory.findMany({
      where: {
        id: {
          in: ids
        },
        companyId: session.user.companyId
      },
      include: {
        Attachment: true,
        IncomingInspection: {
          include: {
            Attachment: true
          }
        }
      }
    });

    if (records.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No records found' },
        { status: 404 }
      );
    }

    // Track deletion status
    const results = {
      totalRecords: records.length,
      deletedRecords: 0,
      failedRecords: 0,
      fileResults: [] as Array<{
        fileKey: string;
        type: string;
        success: boolean;
        error?: string;
      }>
    };

    // Delete files from S3 first
    for (const record of records) {
      if (record.hasAttachments && record.Attachment.length > 0) {
        for (const attachment of record.Attachment) {
          try {
            await deleteStockInventoryFile(attachment.fileKey);
            results.fileResults.push({
              fileKey: attachment.fileKey,
              type: 'stock-inventory',
              success: true
            });
          } catch (fileError) {
            console.error(`Error deleting file ${attachment.fileKey}:`, fileError);
            results.fileResults.push({
              fileKey: attachment.fileKey,
              type: 'stock-inventory',
              success: false,
              error: fileError instanceof Error ? fileError.message : 'Unknown error'
            });
          }
        }
      }
    }

    // Use a transaction to handle the database operations
    await prisma.$transaction(async (tx) => {
      // Update all related incoming inspections
      for (const record of records) {
        if (record.IncomingInspection && record.IncomingInspection.length > 0) {
          await tx.incomingInspection.updateMany({
            where: {
              stockInventoryId: record.id
            },
            data: {
              stockInventoryDeleted: true,
              stockInventoryId: null,
              partNo: record.partNo,
              serialNo: record.serialNo,
              description: record.description
            }
          });
        }
      }

      // Delete the stock inventory records (only those belonging to the user's company)
      const deleteResult = await tx.stockInventory.deleteMany({
        where: {
          id: {
            in: records.map(r => r.id) // Only delete the records we found (already filtered by company)
          }
        }
      });

      results.deletedRecords = deleteResult.count;
    });

    results.failedRecords = results.totalRecords - results.deletedRecords;

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${results.deletedRecords} record(s)`,
      results
    });
  } catch (error) {
    console.error('Error in bulk delete operation:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete records',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
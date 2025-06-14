import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteStockInventoryFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {  
  try {
    const { id } = await params;
    
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Validate the ID
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Stock inventory record ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch the stock inventory record with its attachments, filtered by company
    const record = await prisma.stockInventory.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId
      },
      include: {
        Attachment: true
      }
    });
    
    if (!record) {
      return NextResponse.json(
        { success: false, message: 'Stock inventory record not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      record
    });
  } catch (error) {
    console.error('Error fetching stock inventory record:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch stock inventory record' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;
    
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Validate the ID
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Stock inventory record ID is required' },
        { status: 400 }
      );
    }

    // First, find the stock inventory record with its attachments and incoming inspections, filtered by company
    const record = await prisma.stockInventory.findFirst({
      where: {
        id: id,
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
    
    if (!record) {
      return NextResponse.json(
        { success: false, message: 'Stock inventory record not found' },
        { status: 404 }
      );
    }

    // Track deletion status of files
    const fileResults = [];
    
    // Delete stock inventory files from S3
    if (record.hasAttachments && record.Attachment.length > 0) {
      console.log(`Deleting ${record.Attachment.length} stock inventory attachment(s) for record ${id}`);
      
      // Delete each file from S3
      for (const attachment of record.Attachment) {
        try {
          await deleteStockInventoryFile(attachment.fileKey);
          fileResults.push({
            fileKey: attachment.fileKey,
            type: 'stock-inventory',
            success: true
          });
        } catch (fileError) {
          console.error(`Error deleting stock inventory file ${attachment.fileKey}:`, fileError);
          fileResults.push({
            fileKey: attachment.fileKey,
            type: 'stock-inventory',
            success: false,
            error: fileError instanceof Error ? fileError.message : 'Unknown error'
          });
        }
      }
    }

    // Use a transaction to handle the deletion and updates
    await prisma.$transaction(async (tx) => {
      // First, update all related incoming inspections to store part information
      // and mark the stock inventory as deleted
      if (record.IncomingInspection && record.IncomingInspection.length > 0) {
        await tx.incomingInspection.updateMany({
          where: {
            stockInventoryId: id
          },
          data: {
            stockInventoryDeleted: true,
            stockInventoryId: null, // Remove the foreign key constraint
            // Copy part information from stock inventory
            partNo: record.partNo,
            serialNo: record.serialNo,
            description: record.description
          }
        });
      }

      // Now we can safely delete the stock inventory record
      await tx.stockInventory.delete({
        where: {
          id: id
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Stock inventory record deleted successfully. Related incoming inspections have been updated.',
      id: id,
      fileResults: fileResults.length > 0 ? fileResults : undefined
    });
  } catch (error) {
    console.error('Error deleting stock inventory record:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete stock inventory record',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
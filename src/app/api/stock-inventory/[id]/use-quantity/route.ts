import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { usedQuantity, purpose, notes } = body;

    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate inputs
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Stock inventory record ID is required' },
        { status: 400 }
      );
    }

    if (!usedQuantity || usedQuantity <= 0) {
      return NextResponse.json(
        { success: false, message: 'Used quantity must be a positive number' },
        { status: 400 }
      );
    }

    // Use a transaction to handle the quantity update and history creation atomically
    const result = await prisma.$transaction(async (tx) => {
      // First, fetch the current stock inventory record
      const stockItem = await tx.stockInventory.findFirst({
        where: {
          id: id,
          companyId: session.user.companyId
        }
      });

      if (!stockItem) {
        throw new Error('Stock inventory record not found');
      }

      // Check if there's enough quantity available
      if (stockItem.quantity < usedQuantity) {
        throw new Error(`Insufficient quantity. Available: ${stockItem.quantity}, Requested: ${usedQuantity}`);
      }

      // Calculate new remaining quantity
      const newQuantity = stockItem.quantity - usedQuantity;

      // Update the stock inventory with new quantity
      const updatedStockItem = await tx.stockInventory.update({
        where: { id: id },
        data: {
          quantity: newQuantity,
          updatedAt: new Date()
        }
      });

      // Create usage history record
      const usageRecord = await tx.stockInventoryUsageHistory.create({
        data: {
          companyId: session.user.companyId,
          stockInventoryId: id,
          usedQuantity: usedQuantity,
          remainingQuantity: newQuantity,
          usedBy: session.user.id,
          usedByName: session.user.name || session.user.email || 'Unknown User',
          purpose: purpose || null,
          notes: notes || null,
          usedAt: new Date()
        }
      });

      return { updatedStockItem, usageRecord };
    });

    // Log the activity
    await logActivity({
      userId: session.user.id,
      action: 'UPDATED_STOCK_INVENTORY',
      resourceType: 'STOCK_INVENTORY',
      resourceId: id,
      resourceTitle: `Used ${usedQuantity} units of ${result.updatedStockItem.partNo}`,
      metadata: {
        usedQuantity,
        remainingQuantity: result.updatedStockItem.quantity,
        purpose: purpose || null,
        partNo: result.updatedStockItem.partNo,
        serialNo: result.updatedStockItem.serialNo
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully used ${usedQuantity} units. ${result.updatedStockItem.quantity} units remaining.`,
      data: {
        usedQuantity,
        remainingQuantity: result.updatedStockItem.quantity,
        usageRecord: result.usageRecord,
        stockItem: result.updatedStockItem
      }
    });

  } catch (error) {
    console.error('Error using stock quantity:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('Insufficient quantity') || error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: 'Failed to use stock quantity' },
      { status: 500 }
    );
  }
}
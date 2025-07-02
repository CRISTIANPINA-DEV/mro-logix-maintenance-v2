import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // First verify that the stock inventory record exists and belongs to the company
    const stockItem = await prisma.stockInventory.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId
      }
    });

    if (!stockItem) {
      return NextResponse.json(
        { success: false, message: 'Stock inventory record not found' },
        { status: 404 }
      );
    }

    // Fetch usage history for this stock item
    const usageHistory = await prisma.stockInventoryUsageHistory.findMany({
      where: {
        stockInventoryId: id,
        companyId: session.user.companyId
      },
      orderBy: {
        usedAt: 'desc' // Most recent first
      }
    });

    // Calculate usage statistics
    const stats = {
      totalUsageRecords: usageHistory.length,
      totalQuantityUsed: usageHistory.reduce((sum, record) => sum + record.usedQuantity, 0),
      currentQuantity: stockItem.quantity,
      lastUsedAt: usageHistory.length > 0 ? usageHistory[0].usedAt : null,
      lastUsedBy: usageHistory.length > 0 ? usageHistory[0].usedByName : null,
      uniqueUsers: [...new Set(usageHistory.map(record => record.usedByName))].length
    };

    // Group usage by date for summary view
    const usageByDate = usageHistory.reduce((acc, record) => {
      const date = new Date(record.usedAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          totalUsed: 0,
          recordCount: 0,
          users: new Set()
        };
      }
      acc[date].totalUsed += record.usedQuantity;
      acc[date].recordCount += 1;
      acc[date].users.add(record.usedByName);
      return acc;
    }, {} as Record<string, any>);

    // Convert Set to Array for JSON serialization
    const dailySummary = Object.values(usageByDate).map((day: any) => ({
      ...day,
      users: Array.from(day.users)
    }));

    return NextResponse.json({
      success: true,
      data: {
        stockItem: {
          id: stockItem.id,
          partNo: stockItem.partNo,
          serialNo: stockItem.serialNo,
          description: stockItem.description,
          currentQuantity: stockItem.quantity
        },
        usageHistory,
        statistics: stats,
        dailySummary
      }
    });

  } catch (error) {
    console.error('Error fetching usage history:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch usage history' },
      { status: 500 }
    );
  }
}
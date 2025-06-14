import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function GET() {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch all stock inventory records that have expiration dates, filtered by company
    const records = await prisma.stockInventory.findMany({
      where: {
        companyId: session.user.companyId,
        hasExpireDate: true,
        expireDate: {
          not: null
        }
      },
      select: {
        id: true,
        expireDate: true,
        hasInspection: true,
        inspectionResult: true
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    let expiredCount = 0;
    let expiringSoonCount = 0;

    records.forEach(record => {
      if (!record.expireDate) return;

      // Skip failed inspection items as they're already unusable
      if (record.hasInspection && record.inspectionResult === "Failed") return;

      const expiryDate = new Date(record.expireDate);
      expiryDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        expiredCount++;
      } else if (diffDays <= 30) {
        expiringSoonCount++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        expiredCount,
        expiringSoonCount,
        totalWithExpiry: records.length
      }
    });
  } catch (error) {
    console.error('Error fetching expiry status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
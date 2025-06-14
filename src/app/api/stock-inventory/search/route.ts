import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Get all filter parameters
    const filters = {
      partNo: searchParams.get('partNo'),
      serialNo: searchParams.get('serialNo'),
      description: searchParams.get('description'),
      location: searchParams.get('location'),
      type: searchParams.get('type'),
      station: searchParams.get('station'),
      owner: searchParams.get('owner'),
      hasExpireDate: searchParams.get('hasExpireDate') === 'true',
      hasInspection: searchParams.get('hasInspection') === 'true',
      inspectionResult: searchParams.get('inspectionResult'),
    };

    // Build the where clause based on provided filters with company isolation
    const whereClause: Prisma.StockInventoryWhereInput = {
      companyId: session.user.companyId,
      AND: [],
    };

    // Add text-based filters
    const textFilters = [
      { field: 'partNo', customField: null },
      { field: 'serialNo', customField: null },
      { field: 'description', customField: null },
      { field: 'location', customField: 'customLocation' },
      { field: 'type', customField: 'customType' },
      { field: 'station', customField: 'customStation' },
      { field: 'owner', customField: 'customOwner' },
    ];

    textFilters.forEach(({ field, customField }) => {
      const value = filters[field as keyof typeof filters];
      if (value) {
        const conditions = [{ [field]: { contains: value, mode: 'insensitive' } }];
        if (customField) {
          conditions.push({ [customField]: { contains: value, mode: 'insensitive' } });
        }
        (whereClause.AND as Prisma.StockInventoryWhereInput[]).push({ OR: conditions });
      }
    });

    // Add boolean filters
    if (filters.hasExpireDate) {
      (whereClause.AND as Prisma.StockInventoryWhereInput[]).push({ hasExpireDate: true });
    }
    if (filters.hasInspection) {
      (whereClause.AND as Prisma.StockInventoryWhereInput[]).push({ hasInspection: true });
    }

    // Add inspection result filter
    if (filters.inspectionResult) {
      (whereClause.AND as Prisma.StockInventoryWhereInput[]).push({ inspectionResult: filters.inspectionResult });
    }

    // If no filters are provided, return all items from the company (limited to 10)
    if ((whereClause.AND as Prisma.StockInventoryWhereInput[]).length === 0) {
      const allItems = await prisma.stockInventory.findMany({
        where: {
          companyId: session.user.companyId
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });
      console.log('No filters provided, returning all items for company:', allItems.length);
      return NextResponse.json({ success: true, data: allItems });
    }

    console.log('Searching with filters:', filters);

    const searchResults = await prisma.stockInventory.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    console.log('Search results found:', searchResults.length);
    if (searchResults.length === 0) {
      console.log('No results found for filters:', filters);
    } else {
      console.log('First result:', {
        partNo: searchResults[0].partNo,
        serialNo: searchResults[0].serialNo,
        description: searchResults[0].description,
      });
    }

    return NextResponse.json({ success: true, data: searchResults });
  } catch (error) {
    console.error('Error searching stock inventory:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to search stock inventory' },
      { status: 500 }
    );
  }
} 
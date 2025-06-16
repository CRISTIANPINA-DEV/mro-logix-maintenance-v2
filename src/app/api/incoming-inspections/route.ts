import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadIncomingInspectionFile } from '@/lib/s3';
import { parseLocalDate } from '@/lib/utils';
import { getServerSession } from '@/lib/auth';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';
import { canUserViewIncomingInspections, canUserAddIncomingInspections } from '@/lib/user-permissions';

export async function POST(request: Request) {
  try {
    // Authenticate user to get user ID and company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has permission to add incoming inspections
    const canAdd = await canUserAddIncomingInspections(session.user.id);
    if (!canAdd) {
      return NextResponse.json(
        { success: false, message: 'Permission denied' },
        { status: 403 }
      );
    }

    const currentUser = {
      id: session.user.id,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      companyId: session.user.companyId
    };

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const data = JSON.parse(formData.get('data') as string);

    // Fix: Parse date as local date to prevent timezone shifting
    const inspectionDate = parseLocalDate(data.inspectionDate);

    // If we have a stock inventory ID, fetch its details first (filtered by company)
    let stockInventoryData = null;
    if (data.stockInventoryId) {
      stockInventoryData = await prisma.stockInventory.findFirst({
        where: { 
          id: data.stockInventoryId,
          companyId: currentUser.companyId
        },
        select: {
          partNo: true,
          serialNo: true,
          description: true
        }
      });
    }

    // Create the inspection record with the correct field names
    const inspection = await prisma.incomingInspection.create({
      data: {
        companyId: currentUser.companyId,
        inspectionDate: inspectionDate,
        inspector: data.inspector,
        // Use the correct stockInventoryId field
        stockInventoryId: data.stockInventoryId || null,
        // Store part information from stock inventory if available
        partNo: stockInventoryData?.partNo || null,
        serialNo: stockInventoryData?.serialNo || null,
        description: stockInventoryData?.description || null,
        // Inspection checklist fields
        productMatch: data.productMatch,
        productSpecs: data.productSpecs,
        batchNumber: data.batchNumber,
        productObservations: data.productObservations,
        quantityMatch: data.quantityMatch,
        physicalCondition: data.physicalCondition,
        expirationDate: data.expirationDate,
        serviceableExpiry: data.serviceableExpiry,
        physicalDefects: data.physicalDefects,
        suspectedUnapproved: data.suspectedUnapproved,
        quantityObservations: data.quantityObservations,
        esdSensitive: data.esdSensitive,
        inventoryRecorded: data.inventoryRecorded,
        temperatureControl: data.temperatureControl,
        handlingObservations: data.handlingObservations,
        hasAttachments: files.length > 0,
      },
      include: {
        StockInventory: true,
        Attachment: true
      }
    });

    // Upload files if any
    if (files.length > 0) {
      const attachmentPromises = files.map(async (file) => {
        const fileKey = await uploadIncomingInspectionFile(file, inspection.id, currentUser.companyId);
        return prisma.incomingInspectionAttachment.create({
          data: {
            companyId: currentUser.companyId,
            fileName: file.name,
            fileKey,
            fileSize: file.size,
            fileType: file.type,
            incomingInspectionId: inspection.id,
          },
        });
      });

      await Promise.all(attachmentPromises);
    }

    // Log the activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: currentUser.id,
      action: 'ADDED_INCOMING_INSPECTION',
      resourceType: 'INCOMING_INSPECTION',
      resourceId: inspection.id,
      resourceTitle: `Incoming Inspection: ${inspection.partNo || 'N/A'} - ${inspection.serialNo || 'N/A'}`,
      metadata: {
        inspector: inspection.inspector,
        partNo: inspection.partNo,
        serialNo: inspection.serialNo,
        stockInventoryId: inspection.stockInventoryId,
        companyId: currentUser.companyId
      },
      ...requestInfo
    });

    return NextResponse.json({ success: true, data: inspection });
  } catch (error) {
    console.error('Error creating incoming inspection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create incoming inspection'
      },
      { status: 500 }
    );
  }
}

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

    // Check if user has permission to view incoming inspections
    const canView = await canUserViewIncomingInspections(session.user.id);
    if (!canView) {
      return NextResponse.json(
        { success: false, message: 'Permission denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const stockInventoryId = searchParams.get('stockInventoryId');

    // Build where clause with company filtering
    const whereClause: any = {
      companyId: session.user.companyId
    };

    if (stockInventoryId) {
      whereClause.stockInventoryId = stockInventoryId;
    }

    const inspections = await prisma.incomingInspection.findMany({
      where: whereClause,
      include: {
        Attachment: true,
        StockInventory: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: inspections });
  } catch (error) {
    console.error('Error fetching incoming inspections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incoming inspections' },
      { status: 500 }
    );
  }
} 
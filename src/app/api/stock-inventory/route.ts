import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadStockInventoryFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';

// Maximum file size limit (250MB in bytes)
const MAX_UPLOAD_SIZE_BYTES = 250 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    // Authenticate user to get user ID and company info for activity logging
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = {
      id: session.user.id,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      companyId: session.user.companyId
    };

    const formData = await request.formData();
    
    // Extract and validate required form data
    const incomingDate = formData.get('incomingDate') as string;
    const station = formData.get('station') as string;
    const owner = formData.get('owner') as string;
    const description = formData.get('description') as string;
    const partNo = formData.get('partNo') as string;
    const serialNo = formData.get('serialNo') as string;
    const quantity = formData.get('quantity') as string;
    const type = formData.get('type') as string;
    const location = formData.get('location') as string;
    
    // Validate required fields
    if (!incomingDate || !station || !owner || !description || !partNo || !serialNo || !quantity || !type || !location) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Extract optional form data
    const customStation = formData.get('customStation') as string;
    const customOwner = formData.get('customOwner') as string;
    const hasExpireDate = formData.get('hasExpireDate') === 'yes';
    const expireDate = formData.get('expireDate') as string;
    const customType = formData.get('customType') as string;
    const customLocation = formData.get('customLocation') as string;
    const hasInspection = formData.get('hasInspection') === 'yes';
    const inspectionResult = formData.get('inspectionResult') as string;
    const inspectionFailure = formData.get('inspectionFailure') as string;
    const customFailure = formData.get('customFailure') as string;
    const hasComment = formData.get('hasComment') === 'yes';
    const comment = formData.get('comment') as string;
    const hasAttachments = formData.get('hasAttachments') === 'yes';
    const technician = formData.get('technician') as string;
    
    // Fix the date timezone issue by properly handling the date
    let correctedIncomingDate;
    if (incomingDate) {
      const [year, month, day] = incomingDate.split('-').map(Number);
      correctedIncomingDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    } else {
      correctedIncomingDate = new Date();
    }

    let correctedExpireDate = null;
    if (hasExpireDate && expireDate) {
      const [year, month, day] = expireDate.split('-').map(Number);
      correctedExpireDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    }
    
    // Create stock inventory record in database
    let stockInventory;
    try {
      stockInventory = await prisma.stockInventory.create({
        data: {
          companyId: currentUser.companyId,
          incomingDate: correctedIncomingDate,
          station: station === "Other" ? customStation! : station,
          owner: owner === "Other" ? customOwner! : owner,
          description,
          partNo,
          serialNo,
          quantity,
          hasExpireDate,
          expireDate: correctedExpireDate,
          type: type === "Other" ? customType! : type,
          location: location === "Other" ? customLocation! : location,
          hasInspection,
          inspectionResult: hasInspection ? inspectionResult : null,
          inspectionFailure: hasInspection && inspectionResult === "Failed" ? inspectionFailure : null,
          customFailure: hasInspection && inspectionResult === "Failed" && inspectionFailure === "Other" ? customFailure : null,
          hasComment,
          comment: hasComment ? comment : null,
          hasAttachments,
          technician: technician || null
        }
      });

      console.log('Successfully created stock inventory record:', stockInventory);
    } catch (dbError) {
      console.error('Detailed database error:', {
        error: dbError,
        errorMessage: dbError instanceof Error ? dbError.message : 'Unknown error',
        errorStack: dbError instanceof Error ? dbError.stack : undefined
      });
      return NextResponse.json(
        { success: false, message: 'Database error while creating stock inventory record', error: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }
      // Handle file uploads if there are attachments
    if (hasAttachments) {
      const fileEntries = formData.getAll('files') as File[];
      
      // Calculate total size of files
      const totalSize = fileEntries.reduce((sum, file) => sum + file.size, 0);
      
      // Check if total size exceeds the limit
      if (totalSize > MAX_UPLOAD_SIZE_BYTES) {
        // Delete the stock inventory record we just created since we can't add the attachments
        await prisma.stockInventory.delete({
          where: { id: stockInventory.id }
        });
        
        return NextResponse.json(
          { success: false, message: `Total upload size (${(totalSize / (1024 * 1024)).toFixed(2)}MB) exceeds the 250MB limit` },
          { status: 400 }
        );
      }
      
      const attachmentPromises = fileEntries.map(async (file) => {
        // Upload file to S3 and get the file key
        const fileKey = await uploadStockInventoryFile(file, stockInventory.id, currentUser.companyId);
        
        // Create attachment record in database
        return prisma.stockInventoryAttachment.create({
          data: {
            companyId: currentUser.companyId,
            fileName: file.name,
            fileKey,
            fileSize: file.size,
            fileType: file.type,
            stockInventoryId: stockInventory.id,
          },
        });
      });
      
      // Wait for all file uploads and database entries to complete
      await Promise.all(attachmentPromises);
    }
    
    // Log the activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: currentUser.id,
      action: 'ADDED_STOCK_INVENTORY',
      resourceType: 'STOCK_INVENTORY',
      resourceId: stockInventory.id,
      resourceTitle: `Stock Inventory: ${partNo} - ${description}`,
      metadata: {
        partNo,
        serialNo,
        description,
        quantity,
        station: station === "Other" ? customStation : station,
        owner: owner === "Other" ? customOwner : owner,
        type: type === "Other" ? customType : type,
        technician: technician || null,
        companyId: currentUser.companyId
      },
      ...requestInfo
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stock inventory record created successfully',
      stockInventoryId: stockInventory.id 
    });
  } catch (error) {
    console.error('Error creating stock inventory record:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create stock inventory record' },
      { status: 500 }
    );
  }
}

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

    // Fetch stock inventory records filtered by company
    const records = await prisma.stockInventory.findMany({
      where: {
        companyId: session.user.companyId
      },
      include: {
        Attachment: true,
        IncomingInspection: true
      },
      orderBy: {
        incomingDate: 'desc',
      },
    });
    
    return NextResponse.json({
      success: true,
      records,
    });
  } catch (error) {
    console.error('Error fetching stock inventory records:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch stock inventory records' },
      { status: 500 }
    );
  }
} 
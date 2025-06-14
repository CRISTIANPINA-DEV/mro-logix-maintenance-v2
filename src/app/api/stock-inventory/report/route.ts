import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';

// Define column mapping from frontend keys to Excel headers and data extraction
const COLUMN_MAPPING = {
  incomingDate: {
    header: 'Incoming Date',
    extract: (record: any) => format(new Date(record.incomingDate), 'MMM dd, yyyy'),
    width: 12
  },
  station: {
    header: 'Station',
    extract: (record: any) => record.station,
    width: 10
  },
  owner: {
    header: 'Owner',
    extract: (record: any) => record.owner,
    width: 12
  },
  description: {
    header: 'Description',
    extract: (record: any) => record.description,
    width: 30
  },
  partNo: {
    header: 'Part No',
    extract: (record: any) => record.partNo,
    width: 15
  },
  serialNo: {
    header: 'Serial No',
    extract: (record: any) => record.serialNo,
    width: 15
  },
  quantity: {
    header: 'Quantity',
    extract: (record: any) => record.quantity,
    width: 10
  },
  type: {
    header: 'Type',
    extract: (record: any) => record.type,
    width: 12
  },
  location: {
    header: 'Location',
    extract: (record: any) => record.location,
    width: 12
  },
  expireDate: {
    header: 'Expire Date',
    extract: (record: any) => record.hasExpireDate && record.expireDate 
      ? format(new Date(record.expireDate), 'MMM dd, yyyy')
      : 'N/A',
    width: 12
  },
  inspectionResult: {
    header: 'Inspection Result',
    extract: (record: any) => record.hasInspection 
      ? record.inspectionResult 
      : 'N/A',
    width: 15
  },
  inspectionFailure: {
    header: 'Inspection Failure',
    extract: (record: any) => record.hasInspection && record.inspectionResult === 'Failed'
      ? (record.inspectionFailure === 'Other' ? record.customFailure : record.inspectionFailure)
      : 'N/A',
    width: 20
  },
  comments: {
    header: 'Comments',
    extract: (record: any) => record.hasComment && record.comment 
      ? record.comment 
      : 'N/A',
    width: 30
  },
  attachments: {
    header: 'Attachments',
    extract: (record: any) => record.hasAttachments && record.Attachment.length > 0
      ? record.Attachment.map((a: any) => a.fileName).join(', ')
      : 'N/A',
    width: 30
  }
};

export async function POST(request: Request) {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { startDate, endDate, owner, selectedColumns } = await request.json();

    // Validate dates
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Validate selectedColumns
    if (!selectedColumns || typeof selectedColumns !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Selected columns are required' },
        { status: 400 }
      );
    }

    // Build the query with company isolation
    const where: Prisma.StockInventoryWhereInput = {
      companyId: session.user.companyId,
      incomingDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    // Add owner filter if specified
    if (owner) {
      where.owner = owner;
    }

    // Fetch the data filtered by company
    const records = await prisma.stockInventory.findMany({
      where,
      include: {
        Attachment: true,
      },
      orderBy: {
        incomingDate: 'desc',
      },
    });

    // Get selected column keys
    const selectedColumnKeys = Object.keys(selectedColumns).filter(key => selectedColumns[key]);
    
    // Prepare data for Excel with only selected columns
    const excelData = records.map((record: any) => {
      const row: Record<string, any> = {};
      
      selectedColumnKeys.forEach(columnKey => {
        const columnConfig = COLUMN_MAPPING[columnKey as keyof typeof COLUMN_MAPPING];
        if (columnConfig) {
          row[columnConfig.header] = columnConfig.extract(record);
        }
      });
      
      return row;
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths based on selected columns
    const colWidths = selectedColumnKeys.map(columnKey => {
      const columnConfig = COLUMN_MAPPING[columnKey as keyof typeof COLUMN_MAPPING];
      return { wch: columnConfig?.width || 15 };
    });
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Inventory Report');

    // Generate buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="stock-inventory-report-${startDate}-to-${endDate}.xlsx"`);

    return new NextResponse(excelBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate report' },
      { status: 500 }
    );
  }
} 
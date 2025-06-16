import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, owner, selectedColumns } = body;

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 });
    }

    // Build the where clause for filtering
    const whereClause: any = {
      companyId: session.user.companyId,
      incomingDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (owner) {
      whereClause.owner = owner;
    }

    // Fetch stock inventory records
    const records = await prisma.stockInventory.findMany({
      where: whereClause,
      include: {
        Attachment: true,
        IncomingInspection: true,
      },
      orderBy: {
        incomingDate: 'desc',
      },
    });

    // For now, return a simple text-based PDF representation
    // In a real implementation, you would use a library like puppeteer or jsPDF
    const pdfContent = generatePdfContent(records, selectedColumns, startDate, endDate, owner);

    // Log the activity
    await logActivity({
      userId: session.user.id,
      action: "GENERATED_PDF",
      resourceType: "STOCK_INVENTORY",
      resourceId: "bulk",
      resourceTitle: `Generated PDF report for stock inventory from ${startDate} to ${endDate}`,
      metadata: {
        startDate,
        endDate,
        owner,
        recordCount: records.length,
      },
    });

    // Return the PDF content as a blob
    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="stock-inventory-report-${startDate}-to-${endDate}.pdf"`,
      },
    });

  } catch (error) {
    console.error("[POST] /api/stock-inventory/pdf error:", error);
    return NextResponse.json({ 
      error: "Failed to generate PDF",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

function generatePdfContent(records: any[], selectedColumns: Record<string, boolean>, startDate: string, endDate: string, owner: string | null): string {
  // This is a placeholder implementation
  // In a real application, you would use a proper PDF generation library
  
  let content = `Stock Inventory Report\n`;
  content += `Generated on: ${new Date().toLocaleDateString()}\n`;
  content += `Period: ${startDate} to ${endDate}\n`;
  if (owner) {
    content += `Owner: ${owner}\n`;
  }
  content += `Total Records: ${records.length}\n\n`;

  // Add headers
  const headers = Object.entries(selectedColumns)
    .filter(([_, selected]) => selected)
    .map(([key, _]) => key);

  content += headers.join('\t') + '\n';

  // Add data rows
  records.forEach(record => {
    const row = headers.map(header => {
      switch (header) {
        case 'incomingDate':
          return new Date(record.incomingDate).toLocaleDateString();
        case 'station':
          return record.station || '';
        case 'owner':
          return record.owner || '';
        case 'description':
          return record.description || '';
        case 'partNo':
          return record.partNo || '';
        case 'serialNo':
          return record.serialNo || '';
        case 'quantity':
          return record.quantity || '';
        case 'type':
          return record.type || '';
        case 'location':
          return record.location || '';
        case 'expireDate':
          return record.hasExpireDate && record.expireDate ? new Date(record.expireDate).toLocaleDateString() : '';
        case 'inspectionResult':
          return record.hasInspection ? record.inspectionResult || '' : '';
        case 'inspectionFailure':
          return record.hasInspection && record.inspectionResult === 'Failed' ? record.inspectionFailure || '' : '';
        case 'comments':
          return record.hasComment ? record.comment || '' : '';
        case 'attachments':
          return record.hasAttachments ? record.Attachment.length.toString() : '0';
        default:
          return '';
      }
    });
    content += row.join('\t') + '\n';
  });

  // Convert to a simple PDF-like format (this is just a placeholder)
  // In reality, you would use a proper PDF library
  return content;
} 
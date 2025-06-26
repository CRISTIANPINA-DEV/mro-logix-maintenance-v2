import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { uploadOilServiceFile } from '@/lib/s3';

// POST: Create new oil service record
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const companyId = session.user.companyId;
  const userId = session.user.id;

  const formData = await req.formData();
  const date = formData.get('date');
  const airline = formData.get('airline');
  const fleet = formData.get('fleet');
  const tailNumber = formData.get('tailNumber');
  const flightNumber = formData.get('flightNumber');
  const station = formData.get('station');
  const serviceType = formData.get('serviceType');
  const enginePosition = formData.get('enginePosition');
  const engineModel = formData.get('engineModel');
  const hydraulicSystem = formData.get('hydraulicSystem');
  const oilAmount = formData.get('oilAmount');
  const oilType = formData.get('oilType');
  const files = formData.getAll('files');

  // Validate required fields
  if (!date || !airline || !fleet || !serviceType || !oilAmount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate oil amount is a valid number
  const oilAmountFloat = parseFloat(oilAmount as string);
  if (isNaN(oilAmountFloat) || oilAmountFloat <= 0) {
    return NextResponse.json({ error: 'Invalid oil amount' }, { status: 400 });
  }

  // Generate 8-character Service ID
  const generateServiceId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const serviceId = generateServiceId();

  // Create OilServiceRecord with proper date handling (avoid timezone conversion)
  const dateString = date as string;
  const [year, month, day] = dateString.split('-').map(Number);
  const recordDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date constructor

  const record = await prisma.oilServiceRecord.create({
    data: {
      id: serviceId,
      companyId,
      date: recordDate,
      airline: airline as string,
      fleet: fleet as string,
      tailNumber: tailNumber ? (tailNumber as string) : null,
      flightNumber: flightNumber ? (flightNumber as string) : null,
      station: station ? (station as string) : null,
      serviceType: serviceType as string,
      enginePosition: enginePosition ? (enginePosition as string) : null,
      engineModel: engineModel ? (engineModel as string) : null,
      hydraulicSystem: hydraulicSystem ? (hydraulicSystem as string) : null,
      oilAmount: oilAmountFloat,
      oilType: oilType ? (oilType as string) : null,
      hasAttachments: files.length > 0,
    },
  });

  // Handle file uploads
  let uploadedFiles = [];
  if (files && files.length > 0) {
    for (const file of files) {
      if (!(file instanceof File)) continue;
      const fileKey = await uploadOilServiceFile(file, record.id, companyId);
      if (fileKey) {
        const attachment = await prisma.oilServiceAttachment.create({
          data: {
            companyId,
            oilServiceRecordId: record.id,
            fileName: file.name,
            fileKey,
            fileSize: file.size,
            fileType: file.type,
          },
        });
        uploadedFiles.push(attachment);
      }
    }
  }

  return NextResponse.json({ record, attachments: uploadedFiles });
}

// GET: List/search oil service records with enhanced analytics
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const companyId = session.user.companyId;

  const url = new URL(req.url);
  const search = url.searchParams.get('search');
  const serviceType = url.searchParams.get('serviceType');
  const sortBy = url.searchParams.get('sortBy') || 'date'; // date, oilAmount, airline, fleet
  const sortOrder = url.searchParams.get('sortOrder') || 'desc'; // asc, desc
  const limit = url.searchParams.get('limit');
  const analytics = url.searchParams.get('analytics') === 'true';

  const where: any = { companyId };
  if (serviceType && serviceType !== 'all') {
    where.serviceType = serviceType;
  }
  if (search) {
    where.OR = [
      { airline: { contains: search, mode: 'insensitive' } },
      { fleet: { contains: search, mode: 'insensitive' } },
      { tailNumber: { contains: search, mode: 'insensitive' } },
      { flightNumber: { contains: search, mode: 'insensitive' } },
      { station: { contains: search, mode: 'insensitive' } },
      { engineModel: { contains: search, mode: 'insensitive' } },
      { hydraulicSystem: { contains: search, mode: 'insensitive' } },
      { oilType: { contains: search, mode: 'insensitive' } },
      { id: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Build orderBy object
  let orderBy: any = {};
  switch (sortBy) {
    case 'oilAmount':
      orderBy = { oilAmount: sortOrder };
      break;
    case 'airline':
      orderBy = { airline: sortOrder };
      break;
    case 'fleet':
      orderBy = { fleet: sortOrder };
      break;
    case 'serviceType':
      orderBy = { serviceType: sortOrder };
      break;
    case 'date':
    default:
      orderBy = { date: sortOrder };
      break;
  }

  const queryOptions: any = {
    where,
    include: { Attachment: true },
    orderBy,
  };

  if (limit) {
    queryOptions.take = parseInt(limit);
  }

  try {
    const records = await prisma.oilServiceRecord.findMany(queryOptions);

    // If analytics requested, include additional computed fields
    if (analytics) {
      // Calculate some basic analytics for each record
      const enhancedRecords = records.map(record => {
        // You could add computed fields here like:
        // - daysFromToday
        // - consumptionCategory (high/normal/low)
        // - etc.
        const daysFromToday = Math.floor((new Date().getTime() - new Date(record.date).getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...record,
          daysFromToday,
          consumptionCategory: record.oilAmount > 5 ? 'high' : record.oilAmount > 2 ? 'normal' : 'low'
        };
      });

      return NextResponse.json(enhancedRecords);
    }

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching oil consumption records:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

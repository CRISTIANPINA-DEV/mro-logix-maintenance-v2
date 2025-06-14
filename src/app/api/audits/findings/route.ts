import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// GET /api/audits/findings - Get all findings with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;

    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get('auditId');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const where: any = {
      audit: {
        companyId: companyId
      }
    };
    
    if (auditId) where.auditId = auditId;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { findingNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [findings, total] = await Promise.all([
      prisma.auditFinding.findMany({
        where,
        include: {
          audit: {
            select: {
              id: true,
              title: true,
              auditNumber: true,
              type: true
            }
          },
          correctiveActions: {
            include: {
              attachments: true
            }
          },
          attachments: true,
          _count: {
            select: {
              correctiveActions: true,
              attachments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditFinding.count({ where })
    ]);

    return NextResponse.json({
      findings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCount: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching audit findings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit findings' },
      { status: 500 }
    );
  }
}

// POST /api/audits/findings - Create a new finding
export async function POST(request: NextRequest) {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;
    const body = await request.json();
    
    // Verify the audit belongs to the user's company
    const audit = await prisma.audit.findFirst({
      where: {
        id: body.auditId,
        companyId: companyId
      }
    });

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }
    
    // Generate finding number within the audit
    const existingFindings = await prisma.auditFinding.findMany({
      where: { 
        auditId: body.auditId,
        audit: {
          companyId: companyId
        }
      },
      select: { findingNumber: true }
    });

    const findingNumbers = existingFindings.map(f => 
      parseInt(f.findingNumber.split('-')[1]) || 0
    );
    const nextNumber = Math.max(0, ...findingNumbers) + 1;
    const findingNumber = `F-${String(nextNumber).padStart(3, '0')}`;

    const finding = await prisma.auditFinding.create({
      data: {
        companyId,
        findingNumber,
        title: body.title,
        description: body.description,
        severity: body.severity,
        status: body.status || 'OPEN',
        category: body.category,
        standardReference: body.standardReference,
        evidence: body.evidence,
        rootCause: body.rootCause,
        riskAssessment: body.riskAssessment,
        immediateAction: body.immediateAction,
        auditId: body.auditId,
        discoveredDate: body.discoveredDate ? new Date(body.discoveredDate) : new Date(),
        targetCloseDate: body.targetCloseDate ? new Date(body.targetCloseDate) : null,
        actualCloseDate: body.actualCloseDate ? new Date(body.actualCloseDate) : null,
        verifiedDate: body.verifiedDate ? new Date(body.verifiedDate) : null,
        verifiedBy: body.verifiedBy
      },
      include: {
        audit: {
          select: {
            id: true,
            title: true,
            auditNumber: true,
            type: true
          }
        },
        correctiveActions: true,
        attachments: true,
        _count: {
          select: {
            correctiveActions: true,
            attachments: true
          }
        }
      }
    });

    return NextResponse.json(finding, { status: 201 });
  } catch (error) {
    console.error('Error creating audit finding:', error);
    return NextResponse.json(
      { error: 'Failed to create audit finding' },
      { status: 500 }
    );
  }
} 
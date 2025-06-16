import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';
import { getUserPermissions } from '@/lib/user-permissions';

// GET /api/audits - Get all audits with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has permission to access audits
    const permissions = await getUserPermissions(session.user.id);
    if (!permissions?.canSeeAuditManagement) {
      return NextResponse.json(
        { success: false, message: 'Permission denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    // Build where clause with company isolation
    const where: any = {
      companyId: session.user.companyId
    };
    
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { auditNumber: { contains: search, mode: 'insensitive' } },
        { leadAuditor: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [audits, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        include: {
          findings: {
            select: {
              id: true,
              severity: true,
              status: true
            }
          },
          _count: {
            select: {
              findings: true,
              attachments: true,
              checklistItems: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.audit.count({ where })
    ]);

    return NextResponse.json({
      audits,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCount: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching audits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audits' },
      { status: 500 }
    );
  }
}

// POST /api/audits - Create a new audit
export async function POST(request: NextRequest) {
  try {
    // Authenticate user to get user ID and company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has permission to access audits
    const permissions = await getUserPermissions(session.user.id);
    if (!permissions?.canSeeAuditManagement) {
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

    const body = await request.json();
    
    // Generate audit number (format: AUD-YYYY-0001) within the company
    const currentYear = new Date().getFullYear();
    const lastAudit = await prisma.audit.findFirst({
      where: {
        companyId: currentUser.companyId,
        auditNumber: {
          startsWith: `AUD-${currentYear}-`
        }
      },
      orderBy: {
        auditNumber: 'desc'
      }
    });

    let auditNumber;
    if (lastAudit) {
      const lastNumber = parseInt(lastAudit.auditNumber.split('-')[2]);
      auditNumber = `AUD-${currentYear}-${String(lastNumber + 1).padStart(4, '0')}`;
    } else {
      auditNumber = `AUD-${currentYear}-0001`;
    }

    const audit = await prisma.audit.create({
      data: {
        companyId: currentUser.companyId,
        auditNumber,
        title: body.title,
        description: body.description,
        type: body.type,
        status: body.status || 'PLANNED',
        scope: body.scope,
        department: body.department,
        location: body.location,
        plannedStartDate: new Date(body.plannedStartDate),
        plannedEndDate: new Date(body.plannedEndDate),
        actualStartDate: body.actualStartDate ? new Date(body.actualStartDate) : null,
        actualEndDate: body.actualEndDate ? new Date(body.actualEndDate) : null,
        leadAuditor: body.leadAuditor,
        auditTeam: body.auditTeam || [],
        auditee: body.auditee,
        objectives: body.objectives,
        criteria: body.criteria,
        methodology: body.methodology,
        executiveSummary: body.executiveSummary,
        conclusions: body.conclusions,
        recommendations: body.recommendations,
        overallRating: body.overallRating,
        complianceRate: body.complianceRate,
        isRecurring: body.isRecurring || false,
        recurringFrequency: body.recurringFrequency,
        nextAuditDue: body.nextAuditDue ? new Date(body.nextAuditDue) : null
      },
      include: {
        findings: true,
        attachments: true,
        checklistItems: true,
        _count: {
          select: {
            findings: true,
            attachments: true,
            checklistItems: true
          }
        }
      }
    });

    // Log the activity
    const requestInfo = getRequestInfo(request);
    await logActivity({
      userId: currentUser.id,
      action: 'CREATED_AUDIT',
      resourceType: 'AUDIT',
      resourceId: audit.id,
      resourceTitle: `Audit: ${auditNumber} - ${audit.title}`,
      metadata: {
        auditNumber,
        title: audit.title,
        type: audit.type,
        status: audit.status,
        department: audit.department,
        leadAuditor: audit.leadAuditor,
        companyId: currentUser.companyId
      },
      ...requestInfo
    });

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    console.error('Error creating audit:', error);
    return NextResponse.json(
      { error: 'Failed to create audit' },
      { status: 500 }
    );
  }
} 
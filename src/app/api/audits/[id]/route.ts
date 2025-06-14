import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteAuditFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';

// GET /api/audits/[id] - Get a specific audit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = {
      id: session.user.id,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      companyId: session.user.companyId
    };

    // Get audit and verify it belongs to user's company
    const audit = await prisma.audit.findFirst({
      where: { 
        id,
        companyId: currentUser.companyId
      },
      include: {
        findings: {
          include: {
            correctiveActions: {
              include: {
                attachments: true
              }
            },
            attachments: true
          }
        },
        attachments: true,
        checklistItems: {
          orderBy: { itemNumber: 'asc' }
        },
        _count: {
          select: {
            findings: true,
            attachments: true,
            checklistItems: true
          }
        }
      }
    });

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(audit);
  } catch (error) {
    console.error('Error fetching audit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit' },
      { status: 500 }
    );
  }
}

// PUT /api/audits/[id] - Update a specific audit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = {
      id: session.user.id,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      companyId: session.user.companyId
    };

    // Verify audit belongs to user's company before updating
    const existingAudit = await prisma.audit.findFirst({
      where: { 
        id,
        companyId: currentUser.companyId
      }
    });

    if (!existingAudit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    const audit = await prisma.audit.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        status: body.status,
        scope: body.scope,
        department: body.department,
        location: body.location,
        plannedStartDate: body.plannedStartDate ? new Date(body.plannedStartDate) : undefined,
        plannedEndDate: body.plannedEndDate ? new Date(body.plannedEndDate) : undefined,
        actualStartDate: body.actualStartDate ? new Date(body.actualStartDate) : null,
        actualEndDate: body.actualEndDate ? new Date(body.actualEndDate) : null,
        leadAuditor: body.leadAuditor,
        auditTeam: body.auditTeam,
        auditee: body.auditee,
        objectives: body.objectives,
        criteria: body.criteria,
        methodology: body.methodology,
        executiveSummary: body.executiveSummary,
        conclusions: body.conclusions,
        recommendations: body.recommendations,
        overallRating: body.overallRating,
        complianceRate: body.complianceRate,
        isRecurring: body.isRecurring,
        recurringFrequency: body.recurringFrequency,
        nextAuditDue: body.nextAuditDue ? new Date(body.nextAuditDue) : null
      },
      include: {
        findings: {
          include: {
            correctiveActions: true,
            attachments: true
          }
        },
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

    return NextResponse.json(audit);
  } catch (error) {
    console.error('Error updating audit:', error);
    return NextResponse.json(
      { error: 'Failed to update audit' },
      { status: 500 }
    );
  }
}

// DELETE /api/audits/[id] - Delete a specific audit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = {
      id: session.user.id,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      companyId: session.user.companyId
    };

    // First, get audit and verify it belongs to user's company, along with all attachments to delete from S3
    const audit = await prisma.audit.findFirst({
      where: { 
        id,
        companyId: currentUser.companyId
      },
      include: {
        attachments: true,
        findings: {
          include: {
            attachments: true,
            correctiveActions: {
              include: {
                attachments: true
              }
            }
          }
        }
      }
    });

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    // Delete all associated files from S3
    const filesToDelete = [
      ...audit.attachments.map(att => att.fileKey),
      ...audit.findings.flatMap(finding => [
        ...finding.attachments.map(att => att.fileKey),
        ...finding.correctiveActions.flatMap(action => 
          action.attachments.map(att => att.fileKey)
        )
      ])
    ];

    // Delete files from S3 (don't wait for completion to avoid timeout)
    Promise.all(
      filesToDelete.map(fileKey => deleteAuditFile(fileKey).catch(console.error))
    );

    // Delete the audit (cascade will handle related records)
    await prisma.audit.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Audit deleted successfully' });
  } catch (error) {
    console.error('Error deleting audit:', error);
    return NextResponse.json(
      { error: 'Failed to delete audit' },
      { status: 500 }
    );
  }
} 
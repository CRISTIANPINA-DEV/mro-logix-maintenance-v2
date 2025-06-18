import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { deleteAuditFindingFile } from '@/lib/s3';

// GET /api/audits/findings/[id] - Get a specific finding
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { companyId } = session.user;

    const finding = await prisma.auditFinding.findFirst({
      where: { id, audit: { companyId } },
      include: {
        audit: { select: { id: true, title: true, auditNumber: true } },
        correctiveActions: true,
        attachments: true,
        _count: { select: { correctiveActions: true, attachments: true } }
      }
    });

    if (!finding) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }

    return NextResponse.json(finding);
  } catch (error) {
    console.error('Error fetching finding:', error);
    return NextResponse.json({ error: 'Failed to fetch finding' }, { status: 500 });
  }
}

// PUT /api/audits/findings/[id] - Update a specific finding
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { companyId } = session.user;
    
    const existingFinding = await prisma.auditFinding.findFirst({
      where: { id, audit: { companyId } }
    });

    if (!existingFinding) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }

    const body = await request.json();
    const finding = await prisma.auditFinding.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        severity: body.severity,
        status: body.status,
        category: body.category,
        standardReference: body.standardReference,
        evidence: body.evidence,
        rootCause: body.rootCause,
        riskAssessment: body.riskAssessment,
        immediateAction: body.immediateAction,
        targetCloseDate: body.targetCloseDate ? new Date(body.targetCloseDate) : null,
        actualCloseDate: body.actualCloseDate ? new Date(body.actualCloseDate) : null,
        verifiedDate: body.verifiedDate ? new Date(body.verifiedDate) : null,
        verifiedBy: body.verifiedBy,
      },
       include: {
        audit: { select: { id: true, title: true, auditNumber: true } },
        correctiveActions: true,
        attachments: true,
        _count: { select: { correctiveActions: true, attachments: true } }
      }
    });

    return NextResponse.json(finding);
  } catch (error) {
    console.error('Error updating finding:', error);
    return NextResponse.json({ error: 'Failed to update finding' }, { status: 500 });
  }
}

// DELETE /api/audits/findings/[id] - Delete a specific finding
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { companyId } = session.user;

    const finding = await prisma.auditFinding.findFirst({
      where: { id, audit: { companyId } },
      include: {
        attachments: true,
        correctiveActions: {
            include: {
                attachments: true
            }
        }
      }
    });

    if (!finding) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }

    // Collect all file keys to delete from S3
    const filesToDelete = [
      ...finding.attachments.map(att => att.fileKey),
      ...finding.correctiveActions.flatMap(ca => ca.attachments.map(att => att.fileKey))
    ];

    // Asynchronously delete files from S3
    Promise.all(
      filesToDelete.map(fileKey => deleteAuditFindingFile(fileKey).catch(console.error))
    );

    await prisma.auditFinding.delete({ where: { id } });

    return NextResponse.json({ message: 'Finding deleted successfully' });
  } catch (error) {
    console.error('Error deleting finding:', error);
    return NextResponse.json({ error: 'Failed to delete finding' }, { status: 500 });
  }
} 
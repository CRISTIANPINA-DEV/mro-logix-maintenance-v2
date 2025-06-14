import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteAuditFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';

// GET /api/audits/corrective-actions/[id] - Get a specific corrective action
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

    const companyId = session.user.companyId;

    const action = await prisma.correctiveAction.findFirst({
      where: { 
        id,
        finding: {
          audit: {
            companyId: companyId
          }
        }
      },
      include: {
        finding: {
          include: {
            audit: {
              select: {
                id: true,
                title: true,
                auditNumber: true,
                type: true
              }
            }
          }
        },
        attachments: true,
        _count: {
          select: {
            attachments: true
          }
        }
      }
    });

    if (!action) {
      return NextResponse.json(
        { error: 'Corrective action not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(action);
  } catch (error) {
    console.error('Error fetching corrective action:', error);
    return NextResponse.json(
      { error: 'Failed to fetch corrective action' },
      { status: 500 }
    );
  }
}

// PUT /api/audits/corrective-actions/[id] - Update a specific corrective action
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

    const companyId = session.user.companyId;

    // Verify the corrective action belongs to the user's company
    const existingAction = await prisma.correctiveAction.findFirst({
      where: {
        id,
        finding: {
          audit: {
            companyId: companyId
          }
        }
      }
    });

    if (!existingAction) {
      return NextResponse.json(
        { error: 'Corrective action not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    const action = await prisma.correctiveAction.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        assignedTo: body.assignedTo,
        assignedDate: body.assignedDate ? new Date(body.assignedDate) : undefined,
        targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
        completedDate: body.completedDate ? new Date(body.completedDate) : null,
        status: body.status,
        priority: body.priority,
        actionType: body.actionType,
        resources: body.resources,
        cost: body.cost ? parseFloat(body.cost) : null,
        progress: body.progress,
        verificationMethod: body.verificationMethod,
        verifiedBy: body.verifiedBy,
        verifiedDate: body.verifiedDate ? new Date(body.verifiedDate) : null,
        effectiveness: body.effectiveness
      },
      include: {
        finding: {
          include: {
            audit: {
              select: {
                id: true,
                title: true,
                auditNumber: true,
                type: true
              }
            }
          }
        },
        attachments: true,
        _count: {
          select: {
            attachments: true
          }
        }
      }
    });

    return NextResponse.json(action);
  } catch (error) {
    console.error('Error updating corrective action:', error);
    return NextResponse.json(
      { error: 'Failed to update corrective action' },
      { status: 500 }
    );
  }
}

// DELETE /api/audits/corrective-actions/[id] - Delete a specific corrective action
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

    const companyId = session.user.companyId;

    // First, get the corrective action to handle attachments (filtered by company)
    const action = await prisma.correctiveAction.findFirst({
      where: { 
        id,
        finding: {
          audit: {
            companyId: companyId
          }
        }
      },
      include: {
        attachments: true
      }
    });

    if (!action) {
      return NextResponse.json(
        { error: 'Corrective action not found' },
        { status: 404 }
      );
    }

    // Delete all associated files from S3
    const filesToDelete = action.attachments.map(att => att.fileKey);

    // Delete files from S3 (don't wait for completion to avoid timeout)
    Promise.all(
      filesToDelete.map(fileKey => deleteAuditFile(fileKey).catch(console.error))
    );

    // Delete the corrective action (cascade will handle attachments)
    await prisma.correctiveAction.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Corrective action deleted successfully' });
  } catch (error) {
    console.error('Error deleting corrective action:', error);
    return NextResponse.json(
      { error: 'Failed to delete corrective action' },
      { status: 500 }
    );
  }
} 
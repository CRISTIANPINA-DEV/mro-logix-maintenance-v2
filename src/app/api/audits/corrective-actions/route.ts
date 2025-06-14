import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// GET /api/audits/corrective-actions - Get all corrective actions with optional filtering
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
    const findingId = searchParams.get('findingId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const overdue = searchParams.get('overdue') === 'true';

    const where: any = {
      finding: {
        audit: {
          companyId: companyId
        }
      }
    };
    
    if (findingId) where.findingId = findingId;
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = { contains: assignedTo, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { actionNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { assignedTo: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (overdue) {
      where.AND = [
        { status: { not: 'COMPLETED' } },
        { targetDate: { lt: new Date() } }
      ];
    }

    const [actions, total] = await Promise.all([
      prisma.correctiveAction.findMany({
        where,
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
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.correctiveAction.count({ where })
    ]);

    return NextResponse.json({
      actions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCount: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching corrective actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch corrective actions' },
      { status: 500 }
    );
  }
}

// POST /api/audits/corrective-actions - Create a new corrective action
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
    
    // Verify the finding belongs to the user's company
    const finding = await prisma.auditFinding.findFirst({
      where: {
        id: body.findingId,
        audit: {
          companyId: companyId
        }
      }
    });

    if (!finding) {
      return NextResponse.json(
        { error: 'Finding not found' },
        { status: 404 }
      );
    }
    
    // Generate action number within the finding
    const existingActions = await prisma.correctiveAction.findMany({
      where: { 
        findingId: body.findingId,
        finding: {
          audit: {
            companyId: companyId
          }
        }
      },
      select: { actionNumber: true }
    });

    const actionNumbers = existingActions.map(a => 
      parseInt(a.actionNumber.split('-')[1]) || 0
    );
    const nextNumber = Math.max(0, ...actionNumbers) + 1;
    const actionNumber = `CA-${String(nextNumber).padStart(3, '0')}`;

    const action = await prisma.correctiveAction.create({
      data: {
        companyId,
        actionNumber,
        title: body.title,
        description: body.description,
        assignedTo: body.assignedTo,
        assignedDate: body.assignedDate ? new Date(body.assignedDate) : new Date(),
        targetDate: new Date(body.targetDate),
        completedDate: body.completedDate ? new Date(body.completedDate) : null,
        status: body.status || 'ASSIGNED',
        priority: body.priority || 'MEDIUM',
        actionType: body.actionType || 'CORRECTIVE',
        resources: body.resources,
        cost: body.cost ? parseFloat(body.cost) : null,
        progress: body.progress,
        verificationMethod: body.verificationMethod,
        verifiedBy: body.verifiedBy,
        verifiedDate: body.verifiedDate ? new Date(body.verifiedDate) : null,
        effectiveness: body.effectiveness,
        findingId: body.findingId
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

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error('Error creating corrective action:', error);
    return NextResponse.json(
      { error: 'Failed to create corrective action' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getServerSession } from '@/lib/auth';

// GET - Fetch a single technical query with responses
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if the technical query exists and belongs to the user's company
    const technicalQuery = await prisma.technicalQuery.findFirst({
      where: { 
        id,
        companyId: session.user.companyId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        resolvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        responses: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true
              }
            },
            updatedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true
              }
            },
            _count: {
              select: {
                votes: true
              }
            }
          },
          orderBy: [
            { isAcceptedAnswer: 'desc' },
            { upvotes: 'desc' },
            { createdAt: 'asc' }
          ]
        },
        attachments: true,
        _count: {
          select: {
            responses: true,
            votes: true
          }
        }
      }
    });

    if (!technicalQuery) {
      return NextResponse.json(
        { success: false, message: 'Technical query not found' },
        { status: 404 }
      );
    }

    // Increment view count only after confirming access
    await prisma.technicalQuery.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    return NextResponse.json({
      success: true,
      data: technicalQuery
    });

  } catch (error) {
    console.error('Error fetching technical query:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch technical query' },
      { status: 500 }
    );
  }
}

// PUT - Update a technical query
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json(auth.error, { status: auth.status });
    }
    const currentUser = auth.user;

    // Check if the technical query exists, belongs to the user's company, and user has permission to edit
    const existingQuery = await prisma.technicalQuery.findFirst({
      where: { 
        id,
        companyId: currentUser.companyId
      },
      select: { id: true, createdById: true, title: true }
    });

    if (!existingQuery) {
      return NextResponse.json(
        { success: false, message: 'Technical query not found' },
        { status: 404 }
      );
    }

    if (existingQuery.createdById !== currentUser.id) {
      return NextResponse.json(
        { success: false, message: 'You can only edit your own queries' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, category, priority, tags, status, isResolved } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { success: false, message: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Update the technical query
    const updatedQuery = await prisma.technicalQuery.update({
      where: { id },
      data: {
        title,
        description,
        category,
        priority,
        tags,
        status,
        isResolved,
        updatedById: currentUser.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    // Log the activity
    const requestInfo = await getRequestInfo(request);
    await logActivity({
      userId: currentUser.id,
      action: 'UPDATED_TECHNICAL_QUERY',
      resourceType: 'TECHNICAL_QUERY',
      resourceId: id,
      resourceTitle: updatedQuery.title,
      metadata: {
        companyId: currentUser.companyId,
        changes: {
          title,
          description,
          category,
          priority,
          tags,
          status,
          isResolved
        }
      },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent
    });

    return NextResponse.json({
      success: true,
      data: updatedQuery,
      message: 'Technical query updated successfully'
    });

  } catch (error) {
    console.error('Error updating technical query:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update technical query' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a technical query
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json(auth.error, { status: auth.status });
    }
    const currentUser = auth.user;

    // Check if the technical query exists, belongs to the user's company, and user has permission to delete
    const existingQuery = await prisma.technicalQuery.findFirst({
      where: { 
        id,
        companyId: currentUser.companyId
      },
      select: { id: true, createdById: true, title: true }
    });

    if (!existingQuery) {
      return NextResponse.json(
        { success: false, message: 'Technical query not found' },
        { status: 404 }
      );
    }

    if (existingQuery.createdById !== currentUser.id) {
      return NextResponse.json(
        { success: false, message: 'You can only delete your own queries' },
        { status: 403 }
      );
    }

    // Delete the technical query (this will cascade delete responses, votes, etc.)
    await prisma.technicalQuery.delete({
      where: { id }
    });

    // Log the activity
    const requestInfo = await getRequestInfo(request);
    await logActivity({
      userId: currentUser.id,
      action: 'DELETED_TECHNICAL_QUERY',
      resourceType: 'TECHNICAL_QUERY',
      resourceId: id,
      resourceTitle: existingQuery.title,
      metadata: {
        companyId: currentUser.companyId
      },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent
    });

    return NextResponse.json({
      success: true,
      message: 'Technical query deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting technical query:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete technical query' },
      { status: 500 }
    );
  }
} 
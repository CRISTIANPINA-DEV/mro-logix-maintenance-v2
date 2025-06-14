import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';

// GET - Fetch responses for a technical query
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user for company filtering
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json(auth.error, { status: auth.status });
    }
    const currentUser = auth.user;

    // Verify the technical query belongs to the user's company
    const technicalQuery = await prisma.technicalQuery.findFirst({
      where: {
        id: id,
        companyId: currentUser.companyId
      }
    });

    if (!technicalQuery) {
      return NextResponse.json(
        { success: false, message: 'Technical query not found' },
        { status: 404 }
      );
    }

    // Fetch responses for the technical query (filtered by company through the query relation)
    const responses = await prisma.technicalQueryResponse.findMany({
      where: { 
        technicalQueryId: id,
        technicalQuery: {
          companyId: currentUser.companyId
        }
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
        attachments: true,
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
    });

    return NextResponse.json({
      success: true,
      data: responses
    });

  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}

// POST - Create a new response to a technical query
export async function POST(
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

    // Check if the technical query exists and belongs to the user's company
    const technicalQuery = await prisma.technicalQuery.findFirst({
      where: { 
        id,
        companyId: currentUser.companyId
      },
      select: { id: true, title: true }
    });

    if (!technicalQuery) {
      return NextResponse.json(
        { success: false, message: 'Technical query not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content } = body;

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Response content is required' },
        { status: 400 }
      );
    }

    // Create the response
    const response = await prisma.technicalQueryResponse.create({
      data: {
        content: content.trim(),
        technicalQueryId: id,
        createdById: currentUser.id,
        companyId: currentUser.companyId
      },
      include: {
        createdBy: {
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
      action: 'CREATED_TECHNICAL_QUERY_RESPONSE',
      resourceType: 'TECHNICAL_QUERY',
      resourceId: id,
      resourceTitle: technicalQuery.title,
      metadata: {
        responseId: response.id,
        contentLength: content.length,
        companyId: currentUser.companyId
      },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent
    });

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Response created successfully'
    });

  } catch (error) {
    console.error('Error creating response:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create response' },
      { status: 500 }
    );
  }
} 
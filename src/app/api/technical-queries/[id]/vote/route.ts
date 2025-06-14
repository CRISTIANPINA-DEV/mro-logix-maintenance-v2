import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity, getRequestInfo } from '@/lib/activity-logger';
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';

// POST - Vote on a technical query
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
    const { voteType } = body; // "UP" or "DOWN"

    if (!voteType || !['UP', 'DOWN'].includes(voteType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid vote type. Must be UP or DOWN' },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const existingVote = await prisma.technicalQueryVote.findUnique({
      where: {
        technicalQueryId_userId: {
          technicalQueryId: id,
          userId: currentUser.id
        }
      }
    });

    let result;
    
    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Same vote type - remove the vote (toggle off)
        await prisma.technicalQueryVote.delete({
          where: { id: existingVote.id }
        });
        result = { action: 'removed', voteType };
      } else {
        // Different vote type - update the vote
        await prisma.technicalQueryVote.update({
          where: { id: existingVote.id },
          data: { voteType }
        });
        result = { action: 'updated', voteType, previousVoteType: existingVote.voteType };
      }
    } else {
      // No existing vote - create new vote
      await prisma.technicalQueryVote.create({
        data: {
          voteType,
          technicalQueryId: id,
          userId: currentUser.id,
          companyId: currentUser.companyId
        }
      });
      result = { action: 'created', voteType };
    }

    // Update the vote counts on the technical query
    const votes = await prisma.technicalQueryVote.groupBy({
      by: ['voteType'],
      where: { technicalQueryId: id },
      _count: { voteType: true }
    });

    const upvotes = votes.find(v => v.voteType === 'UP')?._count.voteType || 0;
    const downvotes = votes.find(v => v.voteType === 'DOWN')?._count.voteType || 0;

    await prisma.technicalQuery.update({
      where: { id },
      data: { upvotes, downvotes }
    });

    // Log the activity
    const requestInfo = await getRequestInfo(request);
    const actionMap = {
      'created': 'CREATED_TECHNICAL_QUERY_VOTE',
      'updated': 'UPDATED_TECHNICAL_QUERY_VOTE',
      'removed': 'REMOVED_TECHNICAL_QUERY_VOTE'
    } as const;
    
    await logActivity({
      userId: currentUser.id,
      action: actionMap[result.action as keyof typeof actionMap],
      resourceType: 'TECHNICAL_QUERY',
      resourceId: id,
      resourceTitle: technicalQuery.title,
      metadata: {
        voteType: result.voteType,
        action: result.action,
        upvotes,
        downvotes,
        companyId: currentUser.companyId
      },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        upvotes,
        downvotes,
        userVote: result.action === 'removed' ? null : result.voteType
      },
      message: `Vote ${result.action} successfully`
    });

  } catch (error) {
    console.error('Error processing vote:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process vote' },
      { status: 500 }
    );
  }
}

// GET - Get user's vote status for a technical query
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const auth = await requireAuth(request);
    if (auth.error) {
      // For GET requests, we return null vote instead of error
      return NextResponse.json({
        success: true,
        data: { userVote: null }
      });
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
      return NextResponse.json({
        success: true,
        data: { userVote: null }
      });
    }

    // Get user's vote
    const userVote = await prisma.technicalQueryVote.findUnique({
      where: {
        technicalQueryId_userId: {
          technicalQueryId: id,
          userId: currentUser.id
        }
      },
      select: { voteType: true }
    });

    return NextResponse.json({
      success: true,
      data: { userVote: userVote?.voteType || null }
    });

  } catch (error) {
    console.error('Error fetching vote status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch vote status' },
      { status: 500 }
    );
  }
} 
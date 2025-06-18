import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// GET /api/audits/corrective-actions/analytics - Get corrective action analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { companyId } = session.user;

    const actions = await prisma.correctiveAction.findMany({
      where: {
        finding: {
          audit: {
            companyId: companyId
          }
        }
      }
    });

    const totalActions = actions.length;
    const completedActions = actions.filter(a => a.status === 'COMPLETED' || a.status === 'VERIFIED').length;
    const inProgressActions = actions.filter(a => a.status === 'IN_PROGRESS').length;
    const overdueActions = actions.filter(a => new Date(a.targetDate) < new Date() && a.status !== 'COMPLETED' && a.status !== 'VERIFIED').length;
    const completionRate = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

    const statusBreakdown = actions.reduce((acc, action) => {
      acc[action.status] = (acc[action.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityBreakdown = actions.reduce((acc, action) => {
      acc[action.priority] = (acc[action.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const assignedToBreakdown = actions.reduce((acc, action) => {
      acc[action.assignedTo] = (acc[action.assignedTo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      summary: {
        totalActions,
        completedActions,
        inProgressActions,
        overdueActions,
        completionRate
      },
      statusBreakdown,
      priorityBreakdown,
      assignedToBreakdown
    });

  } catch (error) {
    console.error('Error fetching corrective action analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch corrective action analytics' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// GET /api/audits/findings/analytics - Get findings analytics and statistics
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
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // Get total findings count (filtered by company)
    const totalFindings = await prisma.auditFinding.count({
      where: {
        audit: {
          companyId: companyId
        }
      }
    });

    // Get findings by status (filtered by company)
    const statusBreakdown = await prisma.auditFinding.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      where: {
        audit: {
          companyId: companyId
        }
      }
    });

    // Get findings by severity (filtered by company)
    const severityBreakdown = await prisma.auditFinding.groupBy({
      by: ['severity'],
      _count: {
        id: true
      },
      where: {
        audit: {
          companyId: companyId
        }
      }
    });

    // Get findings by department (from audit) - filtered by company
    const findingsWithAudit = await prisma.auditFinding.findMany({
      where: {
        audit: {
          companyId: companyId
        }
      },
      include: {
        audit: {
          select: {
            department: true
          }
        }
      }
    });

    const departmentBreakdown = findingsWithAudit.reduce((acc, finding) => {
      const dept = finding.audit.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate summary metrics
    const openFindings = statusBreakdown.find(item => item.status === 'OPEN')?._count.id || 0;
    const verifiedFindings = statusBreakdown.find(item => item.status === 'VERIFIED')?._count.id || 0;
    const closedFindings = statusBreakdown.find(item => item.status === 'CLOSED')?._count.id || 0;
    const resolvedFindings = verifiedFindings + closedFindings;

    // Get overdue findings (past target close date and not closed/verified) - filtered by company
    const overdueFindings = await prisma.auditFinding.count({
      where: {
        status: {
          notIn: ['CLOSED', 'VERIFIED']
        },
        targetCloseDate: {
          lt: new Date()
        },
        audit: {
          companyId: companyId
        }
      }
    });

    const completionRate = totalFindings > 0 ? ((resolvedFindings / totalFindings) * 100) : 0;

    const summary = {
      totalFindings,
      openFindings,
      resolvedFindings,
      overdueFindings,
      completionRate: Math.round(completionRate * 100) / 100
    };

    // Convert arrays to objects for easier frontend consumption
    const statusBreakdownObj = statusBreakdown.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const severityBreakdownObj = severityBreakdown.reduce((acc, item) => {
      acc[item.severity] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      summary,
      statusBreakdown: statusBreakdownObj,
      severityBreakdown: severityBreakdownObj,
      departmentBreakdown
    });
  } catch (error) {
    console.error('Error fetching findings analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch findings analytics' },
      { status: 500 }
    );
  }
} 
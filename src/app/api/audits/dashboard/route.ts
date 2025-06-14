import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// Helper function to safely convert BigInt to number
const safeBigIntToNumber = (value: any): number => {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'string') {
    return parseInt(value, 10) || 0;
  }
  return Number(value) || 0;
};

// GET /api/audits/dashboard - Get dashboard metrics and statistics
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

    console.log('Dashboard API called');
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // Get audit counts by status (filtered by company)
    const auditCounts = await prisma.audit.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      where: {
        companyId: companyId
      }
    });

    // Get audit counts by type (filtered by company)
    const auditTypesCounts = await prisma.audit.groupBy({
      by: ['type'],
      _count: {
        id: true
      },
      where: {
        companyId: companyId
      }
    });

    // Get findings by severity (filtered by company through audit relation)
    const findingsBySeverity = await prisma.auditFinding.groupBy({
      by: ['severity'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: startDate
        },
        audit: {
          companyId: companyId
        }
      }
    });

    // Get open findings count (filtered by company)
    const openFindings = await prisma.auditFinding.count({
      where: {
        status: {
          in: ['OPEN', 'IN_PROGRESS']
        },
        audit: {
          companyId: companyId
        }
      }
    });

    // Get overdue corrective actions (filtered by company)
    const overdueActions = await prisma.correctiveAction.count({
      where: {
        status: {
          not: 'COMPLETED'
        },
        targetDate: {
          lt: new Date()
        },
        finding: {
          audit: {
            companyId: companyId
          }
        }
      }
    });

    // Get recent audits (filtered by company)
    const recentAudits = await prisma.audit.findMany({
      where: {
        companyId: companyId
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            findings: true,
            attachments: true
          }
        }
      }
    });

    // Get compliance metrics (filtered by company)
    const complianceMetrics = await prisma.audit.aggregate({
      _avg: {
        complianceRate: true
      },
      where: {
        companyId: companyId,
        complianceRate: {
          not: null
        },
        status: 'COMPLETED'
      }
    });

    // Get upcoming audits (filtered by company)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 30);
    
    const upcomingAudits = await prisma.audit.findMany({
      where: {
        companyId: companyId,
        plannedStartDate: {
          gte: new Date(),
          lte: upcomingDate
        },
        status: {
          in: ['PLANNED', 'IN_PROGRESS']
        }
      },
      orderBy: {
        plannedStartDate: 'asc'
      },
      take: 10
    });

    // Get audit completion trend (last 6 months) - wrapped in try-catch for better error handling
    let completionTrend: any[] = [];
    try {
      completionTrend = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "actualEndDate") as month,
          COUNT(*) as count
        FROM "Audit"
        WHERE "actualEndDate" >= NOW() - INTERVAL '6 months'
          AND "status" = 'COMPLETED'
          AND "companyId" = ${companyId}
        GROUP BY DATE_TRUNC('month', "actualEndDate")
        ORDER BY month DESC
      `;
    } catch (queryError) {
      console.warn('Failed to fetch completion trend data:', queryError);
      // Continue without completion trend data rather than failing the entire request
    }

    // Calculate key metrics (convert BigInt to number)
    const totalAudits = auditCounts.reduce((sum, item) => sum + safeBigIntToNumber(item._count.id), 0);
    const completedAudits = safeBigIntToNumber(auditCounts.find(item => item.status === 'COMPLETED')?._count.id || 0);
    const completionRate = totalAudits > 0 ? (completedAudits / totalAudits) * 100 : 0;

    return NextResponse.json({
      summary: {
        totalAudits,
        completedAudits,
        openFindings: safeBigIntToNumber(openFindings),
        overdueActions: safeBigIntToNumber(overdueActions),
        completionRate: Math.round(completionRate * 100) / 100,
        avgComplianceRate: complianceMetrics._avg.complianceRate 
          ? Math.round(complianceMetrics._avg.complianceRate * 100) / 100 
          : null
      },
      auditCounts: auditCounts.reduce((acc, item) => {
        acc[item.status] = safeBigIntToNumber(item._count.id);
        return acc;
      }, {} as Record<string, number>),
      auditTypes: auditTypesCounts.reduce((acc, item) => {
        acc[item.type] = safeBigIntToNumber(item._count.id);
        return acc;
      }, {} as Record<string, number>),
      findingsBySeverity: findingsBySeverity.reduce((acc, item) => {
        acc[item.severity] = safeBigIntToNumber(item._count.id);
        return acc;
      }, {} as Record<string, number>),
      recentAudits,
      upcomingAudits,
      completionTrend: completionTrend.map((item: any) => ({
        ...item,
        count: safeBigIntToNumber(item.count)
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Detailed error:', {
      message: errorMessage,
      stack: errorStack,
      error
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
} 
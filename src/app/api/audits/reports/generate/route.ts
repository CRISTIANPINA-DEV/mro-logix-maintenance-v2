import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { getServerSession } from '@/lib/auth';

interface ReportRequest {
  template: string;
  format: string;
  dateRange: {
    start: string;
    end: string;
  };
  filters: {
    auditTypes: string[];
    status: string[];
  };
}

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

    const body: ReportRequest = await request.json();
    const { template, format, dateRange, filters } = body;

    // Build query filters with company isolation
    const whereClause: any = {
      companyId: session.user.companyId
    };
    
    if (dateRange.start && dateRange.end) {
      whereClause.plannedStartDate = {
        gte: new Date(dateRange.start),
        lte: new Date(dateRange.end)
      };
    }
    
    if (filters.auditTypes.length > 0) {
      whereClause.type = { in: filters.auditTypes };
    }
    
    if (filters.status.length > 0) {
      whereClause.status = { in: filters.status };
    }

    // Fetch data based on template
    let reportData: any = {};
    
    switch (template) {
      case 'audit_summary':
        reportData = await generateAuditSummaryData(whereClause);
        break;
      case 'compliance_metrics':
        reportData = await generateComplianceMetricsData(whereClause);
        break;
      case 'findings_analysis':
        reportData = await generateFindingsAnalysisData(whereClause);
        break;
      case 'corrective_actions':
        reportData = await generateCorrectiveActionsData(whereClause);
        break;
      case 'regulatory_compliance':
        reportData = await generateRegulatoryComplianceData(whereClause);
        break;
      case 'management_summary':
        reportData = await generateManagementSummaryData(whereClause);
        break;
      default:
        throw new Error('Invalid report template');
    }

    // Generate report in requested format
    const reportFile = await generateReportFile(reportData, format, template);
    
    return new NextResponse(reportFile.content, {
      headers: {
        'Content-Type': reportFile.mimeType,
        'Content-Disposition': `attachment; filename="${reportFile.filename}"`,
      },
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateAuditSummaryData(whereClause: any) {
  const audits = await prisma.audit.findMany({
    where: whereClause,
    include: {
      findings: {
        include: {
          correctiveActions: true
        }
      },
      attachments: true,
      checklistItems: true
    },
    orderBy: { plannedStartDate: 'desc' }
  });

  const summary = {
    totalAudits: audits.length,
    completedAudits: audits.filter(a => a.status === 'COMPLETED').length,
    inProgressAudits: audits.filter(a => a.status === 'IN_PROGRESS').length,
    plannedAudits: audits.filter(a => a.status === 'PLANNED').length,
    totalFindings: audits.reduce((sum, audit) => sum + audit.findings.length, 0),
    criticalFindings: audits.reduce((sum, audit) => 
      sum + audit.findings.filter(f => f.severity === 'CRITICAL').length, 0
    ),
    openActions: audits.reduce((sum, audit) => 
      sum + audit.findings.reduce((actionSum, finding) => 
        actionSum + finding.correctiveActions.filter(action => action.status !== 'COMPLETED').length, 0
      ), 0
    )
  };

  return {
    summary,
    audits: audits.map(audit => ({
      ...audit,
      findingsCount: audit.findings.length,
      criticalFindingsCount: audit.findings.filter(f => f.severity === 'CRITICAL').length,
      openActionsCount: audit.findings.reduce((sum, finding) => 
        sum + finding.correctiveActions.filter(action => action.status !== 'COMPLETED').length, 0
      )
    }))
  };
}

async function generateComplianceMetricsData(whereClause: any) {
  const audits = await prisma.audit.findMany({
    where: whereClause,
    include: {
      findings: true
    }
  });

  const findings = audits.flatMap(audit => audit.findings);
  
  const metrics = {
    totalAudits: audits.length,
    completionRate: audits.length > 0 ? 
      (audits.filter(a => a.status === 'COMPLETED').length / audits.length) * 100 : 0,
    avgComplianceRate: audits.length > 0 ?
      audits.reduce((sum, audit) => sum + (audit.complianceRate || 0), 0) / audits.length : 0,
    findingsBySeverity: {
      CRITICAL: findings.filter(f => f.severity === 'CRITICAL').length,
      MAJOR: findings.filter(f => f.severity === 'MAJOR').length,
      MINOR: findings.filter(f => f.severity === 'MINOR').length,
      NON_CRITICAL: findings.filter(f => f.severity === 'NON_CRITICAL').length
    },
    auditTypes: audits.reduce((acc, audit) => {
      acc[audit.type] = (acc[audit.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return metrics;
}

async function generateFindingsAnalysisData(whereClause: any) {
  const audits = await prisma.audit.findMany({
    where: whereClause,
    include: {
      findings: {
        include: {
          correctiveActions: true
        }
      }
    }
  });

  const findings = audits.flatMap(audit => 
    audit.findings.map(finding => ({
      ...finding,
      auditTitle: audit.title,
      auditType: audit.type,
      auditDepartment: audit.department
    }))
  );

  const analysis = {
    totalFindings: findings.length,
    severityBreakdown: {
      CRITICAL: findings.filter(f => f.severity === 'CRITICAL').length,
      MAJOR: findings.filter(f => f.severity === 'MAJOR').length,
      MINOR: findings.filter(f => f.severity === 'MINOR').length,
      NON_CRITICAL: findings.filter(f => f.severity === 'NON_CRITICAL').length
    },
    statusBreakdown: {
      OPEN: findings.filter(f => f.status === 'OPEN').length,
      IN_PROGRESS: findings.filter(f => f.status === 'IN_PROGRESS').length,
      VERIFIED: findings.filter(f => f.status === 'VERIFIED').length,
      CLOSED: findings.filter(f => f.status === 'CLOSED').length,
      DEFERRED: findings.filter(f => f.status === 'DEFERRED').length
    },
    byDepartment: findings.reduce((acc, finding) => {
      const dept = finding.auditDepartment || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    trends: calculateFindingsTrends(findings)
  };

  return { analysis, findings };
}

async function generateCorrectiveActionsData(whereClause: any) {
  const actions = await prisma.correctiveAction.findMany({
    include: {
      finding: {
        include: {
          audit: true
        }
      },
      attachments: true
    }
  });

  const filteredActions = actions.filter(action => {
    const audit = action.finding.audit;
    // Apply filters based on whereClause
    if (whereClause.type && !whereClause.type.in.includes(audit.type)) return false;
    if (whereClause.status && !whereClause.status.in.includes(audit.status)) return false;
    if (whereClause.plannedStartDate) {
      const startDate = new Date(audit.plannedStartDate);
      if (startDate < whereClause.plannedStartDate.gte || 
          startDate > whereClause.plannedStartDate.lte) return false;
    }
    return true;
  });

  const summary = {
    totalActions: filteredActions.length,
    completedActions: filteredActions.filter(a => a.status === 'COMPLETED').length,
    inProgressActions: filteredActions.filter(a => a.status === 'IN_PROGRESS').length,
    overdueActions: filteredActions.filter(a => {
      const dueDate = new Date(a.targetDate);
      return a.status !== 'COMPLETED' && dueDate < new Date();
    }).length,
    avgResolutionTime: calculateAverageResolutionTime(filteredActions.filter(a => a.status === 'COMPLETED'))
  };

  return { summary, actions: filteredActions };
}

async function generateRegulatoryComplianceData(whereClause: any) {
  const audits = await prisma.audit.findMany({
    where: {
      ...whereClause,
      type: { in: ['REGULATORY', 'COMPLIANCE', 'EXTERNAL'] }
    },
    include: {
      findings: true
    }
  });

  const compliance = {
    totalRegulatoryAudits: audits.length,
    complianceRate: audits.length > 0 ?
      audits.reduce((sum, audit) => sum + (audit.complianceRate || 0), 0) / audits.length : 0,
    nonCompliantAudits: audits.filter(a => (a.complianceRate || 0) < 100).length,
    criticalIssues: audits.reduce((sum, audit) => 
      sum + audit.findings.filter(f => f.severity === 'CRITICAL').length, 0
    ),
    byRegulation: groupByRegulation(audits)
  };

  return { compliance, audits };
}

async function generateManagementSummaryData(whereClause: any) {
  const audits = await prisma.audit.findMany({
    where: whereClause,
    include: {
      findings: {
        include: {
          correctiveActions: true
        }
      }
    }
  });

  const executiveSummary = {
    auditOverview: {
      totalAudits: audits.length,
      completionRate: audits.length > 0 ? 
        (audits.filter(a => a.status === 'COMPLETED').length / audits.length) * 100 : 0,
      avgComplianceRate: audits.length > 0 ?
        audits.reduce((sum, audit) => sum + (audit.complianceRate || 0), 0) / audits.length : 0
    },
    riskAssessment: {
      criticalFindings: audits.reduce((sum, audit) => 
        sum + audit.findings.filter(f => f.severity === 'CRITICAL').length, 0
      ),
      majorFindings: audits.reduce((sum, audit) => 
        sum + audit.findings.filter(f => f.severity === 'MAJOR').length, 0
      ),
      overdueActions: audits.reduce((sum, audit) => 
        sum + audit.findings.reduce((actionSum, finding) => 
          actionSum + finding.correctiveActions.filter(action => {
            const dueDate = new Date(action.targetDate);
            return action.status !== 'COMPLETED' && dueDate < new Date();
          }).length, 0
        ), 0
      )
    },
    keyRecommendations: generateKeyRecommendations(audits)
  };

  return executiveSummary;
}

function calculateFindingsTrends(findings: any[]) {
  // Group findings by month
  const monthlyFindings = findings.reduce((acc, finding) => {
    const month = new Date(finding.discoveredDate).toISOString().substring(0, 7);
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return monthlyFindings;
}

function calculateAverageResolutionTime(completedActions: any[]): number {
  if (completedActions.length === 0) return 0;
  
  const totalDays = completedActions.reduce((sum, action) => {
    const created = new Date(action.createdAt);
    const completed = new Date(action.completedDate || action.updatedAt);
    const diffTime = Math.abs(completed.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return sum + diffDays;
  }, 0);
  
  return totalDays / completedActions.length;
}

function groupByRegulation(audits: any[]) {
  return audits.reduce((acc, audit) => {
    const regulation = audit.regulatoryReference || 'General';
    if (!acc[regulation]) {
      acc[regulation] = {
        count: 0,
        avgCompliance: 0,
        audits: []
      };
    }
    acc[regulation].count += 1;
    acc[regulation].audits.push(audit);
    return acc;
  }, {} as Record<string, any>);
}

function generateKeyRecommendations(audits: any[]): string[] {
  const recommendations: string[] = [];
  
  const criticalCount = audits.reduce((sum, audit) => 
    sum + audit.findings.filter((f: any) => f.severity === 'CRITICAL').length, 0
  );
  
  if (criticalCount > 0) {
    recommendations.push(`Address ${criticalCount} critical findings requiring immediate attention`);
  }
  
  const lowComplianceAudits = audits.filter(a => (a.complianceRate || 0) < 85);
  if (lowComplianceAudits.length > 0) {
    recommendations.push(`Review processes for ${lowComplianceAudits.length} audits with low compliance rates`);
  }
  
  const overdueActions = audits.reduce((sum, audit) => 
    sum + audit.findings.reduce((actionSum: number, finding: any) => 
      actionSum + finding.correctiveActions.filter((action: any) => {
        const dueDate = new Date(action.targetDate);
        return action.status !== 'COMPLETED' && dueDate < new Date();
      }).length, 0
    ), 0
  );
  
  if (overdueActions > 0) {
    recommendations.push(`Follow up on ${overdueActions} overdue corrective actions`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Continue current audit practices and maintain compliance standards');
  }
  
  return recommendations;
}

async function generateReportFile(data: any, format: string, template: string) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${template}-report-${timestamp}`;
  
  switch (format) {
    case 'excel':
      return generateExcelReport(data, `${filename}.xlsx`);
    case 'pdf':
      return generatePDFReport(data, `${filename}.pdf`);
    case 'html':
      return generateHTMLReport(data, `${filename}.html`);
    case 'word':
      return generateWordReport(data, `${filename}.docx`);
    default:
      throw new Error('Unsupported format');
  }
}

function generateExcelReport(data: any, filename: string) {
  const workbook = XLSX.utils.book_new();
  
  // Create summary sheet
  if (data.summary) {
    const summarySheet = XLSX.utils.json_to_sheet([data.summary]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }
  
  // Create data sheets based on content
  if (data.audits) {
    const auditSheet = XLSX.utils.json_to_sheet(data.audits);
    XLSX.utils.book_append_sheet(workbook, auditSheet, 'Audits');
  }
  
  if (data.findings) {
    const findingsSheet = XLSX.utils.json_to_sheet(data.findings);
    XLSX.utils.book_append_sheet(workbook, findingsSheet, 'Findings');
  }
  
  if (data.actions) {
    const actionsSheet = XLSX.utils.json_to_sheet(data.actions);
    XLSX.utils.book_append_sheet(workbook, actionsSheet, 'Corrective Actions');
  }
  
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return {
    content: excelBuffer,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename
  };
}

function generatePDFReport(data: any, filename: string) {
  // For now, return a simple text representation
  // In a real implementation, you'd use a PDF library like puppeteer or jsPDF
  const content = `
AUDIT REPORT
Generated on: ${new Date().toLocaleDateString()}

${JSON.stringify(data, null, 2)}
  `;
  
  return {
    content: Buffer.from(content),
    mimeType: 'application/pdf',
    filename
  };
}

function generateHTMLReport(data: any, filename: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Audit Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="section">
        <h2>Report Data</h2>
        <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>
</body>
</html>
  `;
  
  return {
    content: Buffer.from(html),
    mimeType: 'text/html',
    filename
  };
}

function generateWordReport(data: any, filename: string) {
  // For now, return a simple text representation
  // In a real implementation, you'd use a library like docx or mammoth
  const content = `
AUDIT REPORT
Generated on: ${new Date().toLocaleDateString()}

${JSON.stringify(data, null, 2)}
  `;
  
  return {
    content: Buffer.from(content),
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename
  };
} 
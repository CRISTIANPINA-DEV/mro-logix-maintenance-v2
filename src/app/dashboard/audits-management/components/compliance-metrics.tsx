"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target,
  BarChart3,
  PieChart,
  Download,
  RefreshCw
} from "lucide-react";

interface ComplianceData {
  summary: {
    totalAudits: number;
    completedAudits: number;
    openFindings: number;
    overdueActions: number;
    completionRate: number;
    avgComplianceRate: number | null;
  };
  auditCounts: Record<string, number>;
  auditTypes: Record<string, number>;
  findingsBySeverity: Record<string, number>;
  completionTrend: any[];
}

interface ComplianceMetric {
  title: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

const ComplianceMetrics: React.FC = () => {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('all');

  useEffect(() => {
    fetchComplianceData();
  }, [timeframe]);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/audits/dashboard?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch compliance data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Failed to load compliance metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateComplianceMetrics = (): ComplianceMetric[] => {
    if (!data) return [];

    const totalFindings = Object.values(data.findingsBySeverity).reduce((sum, count) => sum + count, 0);
    const criticalFindings = data.findingsBySeverity.CRITICAL || 0;
    const majorFindings = data.findingsBySeverity.MAJOR || 0;
    
    return [
      {
        title: "Overall Compliance Rate",
        value: data.summary.avgComplianceRate || 0,
        target: 95,
        unit: "%",
        trend: data.summary.avgComplianceRate && data.summary.avgComplianceRate > 90 ? 'up' : 'down',
        trendValue: 2.3,
        status: (data.summary.avgComplianceRate || 0) >= 95 ? 'good' : 
                (data.summary.avgComplianceRate || 0) >= 85 ? 'warning' : 'critical',
        description: "Percentage of audits meeting compliance standards"
      },
      {
        title: "Audit Completion Rate",
        value: data.summary.completionRate,
        target: 100,
        unit: "%",
        trend: data.summary.completionRate > 80 ? 'up' : 'down',
        trendValue: 1.8,
        status: data.summary.completionRate >= 90 ? 'good' : 
                data.summary.completionRate >= 75 ? 'warning' : 'critical',
        description: "Percentage of audits completed on schedule"
      },
      {
        title: "Critical Findings",
        value: criticalFindings,
        target: 0,
        unit: "",
        trend: criticalFindings === 0 ? 'stable' : 'up',
        trendValue: criticalFindings,
        status: criticalFindings === 0 ? 'good' : 
                criticalFindings <= 2 ? 'warning' : 'critical',
        description: "Number of critical compliance issues"
      },
      {
        title: "Open Actions",
        value: data.summary.openFindings,
        target: 5,
        unit: "",
        trend: data.summary.openFindings <= 5 ? 'down' : 'up',
        trendValue: -3,
        status: data.summary.openFindings <= 5 ? 'good' : 
                data.summary.openFindings <= 15 ? 'warning' : 'critical',
        description: "Number of open corrective actions"
      },
      {
        title: "Overdue Actions",
        value: data.summary.overdueActions,
        target: 0,
        unit: "",
        trend: data.summary.overdueActions === 0 ? 'stable' : 'up',
        trendValue: data.summary.overdueActions,
        status: data.summary.overdueActions === 0 ? 'good' : 
                data.summary.overdueActions <= 3 ? 'warning' : 'critical',
        description: "Number of overdue corrective actions"
      },
      {
        title: "Average Resolution Time",
        value: 14,
        target: 21,
        unit: "days",
        trend: 'down',
        trendValue: -2.5,
        status: 'good',
        description: "Average time to resolve audit findings"
      }
    ];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string, status: string) => {
    const colorClass = status === 'good' ? 'text-green-600' : 
                      status === 'warning' ? 'text-yellow-600' : 'text-red-600';
    
    switch (trend) {
      case 'up':
        return <TrendingUp className={`h-4 w-4 ${colorClass}`} />;
      case 'down':
        return <TrendingDown className={`h-4 w-4 ${colorClass}`} />;
      default:
        return <div className={`h-4 w-4 rounded-full bg-current ${colorClass}`} />;
    }
  };

  const renderSeverityChart = () => {
    if (!data) return null;

    const severities = Object.entries(data.findingsBySeverity);
    const total = severities.reduce((sum, [_, count]) => sum + count, 0);

    if (total === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
          <p>No findings in the selected period</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {severities.map(([severity, count]) => {
          const percentage = (count / total) * 100;
          const color = severity === 'CRITICAL' ? 'bg-red-500' :
                       severity === 'MAJOR' ? 'bg-orange-500' :
                       severity === 'MINOR' ? 'bg-yellow-500' :
                       severity === 'NON_CRITICAL' ? 'bg-blue-500' : 'bg-gray-500';
          
          return (
            <div key={severity} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{severity.replace('_', ' ')}</span>
                <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </div>
    );
  };

  const renderAuditTypesChart = () => {
    if (!data) return null;

    const types = Object.entries(data.auditTypes);
    const total = types.reduce((sum, [_, count]) => sum + count, 0);

    if (total === 0) return <div className="text-center text-gray-500 py-4">No audit data</div>;

    return (
      <div className="grid grid-cols-2 gap-4">
        {types.map(([type, count]) => {
          const percentage = (count / total) * 100;
          return (
            <div key={type} className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{count}</div>
              <div className="text-sm text-gray-600">{type}</div>
              <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
    );
  };

  const complianceMetrics = calculateComplianceMetrics();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading compliance metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Compliance Metrics Dashboard</CardTitle>
              <p className="text-gray-600 mt-1">Monitor audit performance and compliance KPIs</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="neutral" size="sm" onClick={fetchComplianceData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button variant="export" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {complianceMetrics.map((metric, index) => (
          <Card key={index} className={`border-l-4 ${getStatusColor(metric.status)}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{metric.title}</h3>
                  {getTrendIcon(metric.trend, metric.status)}
                </div>
                <Badge className={getStatusColor(metric.status)}>
                  {metric.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {metric.value.toFixed(metric.unit === '%' ? 1 : 0)}
                  </span>
                  <span className="text-lg text-gray-600">{metric.unit}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Target: {metric.target}{metric.unit}</span>
                  <span className={`flex items-center gap-1 ${
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metric.trend !== 'stable' && (
                      <>
                        {metric.trendValue > 0 ? '+' : ''}{metric.trendValue.toFixed(1)}
                        {metric.unit}
                      </>
                    )}
                  </span>
                </div>
                
                <Progress 
                  value={Math.min((metric.value / metric.target) * 100, 100)} 
                  className="h-2"
                />
                
                <p className="text-xs text-gray-500">{metric.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Findings by Severity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Findings by Severity
              </CardTitle>
              <Badge variant="outline">
                {Object.values(data?.findingsBySeverity || {}).reduce((sum, count) => sum + count, 0)} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {renderSeverityChart()}
          </CardContent>
        </Card>

        {/* Audit Types Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Audit Types Distribution
              </CardTitle>
              <Badge variant="outline">
                {Object.values(data?.auditTypes || {}).reduce((sum, count) => sum + count, 0)} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {renderAuditTypesChart()}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Compliance Trends Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Risk Areas</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-red-800">Critical Findings</p>
                    <p className="text-sm text-red-600">Immediate attention required</p>
                  </div>
                  <span className="text-xl font-bold text-red-600">
                    {data?.findingsBySeverity.CRITICAL || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="font-medium text-yellow-800">Overdue Actions</p>
                    <p className="text-sm text-yellow-600">Past due dates</p>
                  </div>
                  <span className="text-xl font-bold text-yellow-600">
                    {data?.summary.overdueActions || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Performance Indicators</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Completion Rate</span>
                    <span className="text-sm font-medium">{data?.summary.completionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={data?.summary.completionRate || 0} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Compliance Rate</span>
                    <span className="text-sm font-medium">{data?.summary.avgComplianceRate?.toFixed(1) || 'N/A'}%</span>
                  </div>
                  <Progress value={data?.summary.avgComplianceRate || 0} className="h-2" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Recommendations</h4>
              <div className="space-y-3 text-sm">
                {(data?.summary.avgComplianceRate || 0) < 85 && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-medium text-red-800">Urgent: Low Compliance Rate</p>
                    <p className="text-red-600">Review audit processes and training</p>
                  </div>
                )}
                
                {(data?.summary.overdueActions || 0) > 0 && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-medium text-yellow-800">Address Overdue Actions</p>
                    <p className="text-yellow-600">Follow up on pending corrective measures</p>
                  </div>
                )}
                
                {(data?.findingsBySeverity.CRITICAL || 0) > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-medium text-red-800">Critical Issues Present</p>
                    <p className="text-red-600">Immediate escalation required</p>
                  </div>
                )}
                
                {(data?.summary.avgComplianceRate || 0) >= 95 && (data?.summary.overdueActions || 0) === 0 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-medium text-green-800">Excellent Performance</p>
                    <p className="text-green-600">Maintain current standards</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceMetrics; 
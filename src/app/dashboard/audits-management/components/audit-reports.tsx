"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Download, 
  FileText, 
  BarChart3, 
  Calendar, 
  Filter,
  Eye,
  Settings,
  Share,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileImage,
  File,
  Plus,
  Shield,
  Users
} from "lucide-react";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'audit_summary' | 'compliance_metrics' | 'findings_analysis' | 'corrective_actions' | 'custom';
  icon: any;
  fields: string[];
  formats: string[];
}

interface ScheduledReport {
  id: string;
  name: string;
  template: string;
  frequency: string;
  recipients: string[];
  lastRun: string;
  nextRun: string;
  status: 'active' | 'paused' | 'error';
}

const AuditReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedAuditTypes, setSelectedAuditTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'audit_summary',
      name: 'Audit Summary Report',
      description: 'Comprehensive overview of all audits with key metrics and findings',
      type: 'audit_summary',
      icon: FileText,
      fields: ['auditDetails', 'findings', 'actions', 'timeline', 'compliance'],
      formats: ['pdf', 'excel', 'word', 'html']
    },
    {
      id: 'compliance_metrics',
      name: 'Compliance Metrics Dashboard',
      description: 'Key performance indicators and compliance trends analysis',
      type: 'compliance_metrics',
      icon: BarChart3,
      fields: ['kpis', 'trends', 'benchmarks', 'recommendations'],
      formats: ['pdf', 'excel', 'powerpoint', 'html']
    },
    {
      id: 'findings_analysis',
      name: 'Findings Analysis Report',
      description: 'Detailed analysis of audit findings by severity, type, and department',
      type: 'findings_analysis',
      icon: AlertTriangle,
      fields: ['findingsBreakdown', 'severity', 'rootCause', 'trends'],
      formats: ['pdf', 'excel', 'word']
    },
    {
      id: 'corrective_actions',
      name: 'Corrective Actions Tracking',
      description: 'Status and progress of all corrective actions and follow-ups',
      type: 'corrective_actions',
      icon: CheckCircle,
      fields: ['actionsList', 'progress', 'overdue', 'effectiveness'],
      formats: ['pdf', 'excel', 'html']
    },
    {
      id: 'regulatory_compliance',
      name: 'Regulatory Compliance Report',
      description: 'Compliance status against regulatory requirements and standards',
      type: 'custom',
      icon: Shield,
      fields: ['regulatory', 'compliance', 'gaps', 'remediation'],
      formats: ['pdf', 'word']
    },
    {
      id: 'management_summary',
      name: 'Executive Summary',
      description: 'High-level summary for senior management and stakeholders',
      type: 'custom',
      icon: Users,
      fields: ['executive', 'kpis', 'risks', 'recommendations'],
      formats: ['pdf', 'powerpoint']
    }
  ];

  const auditTypes = ['INTERNAL', 'EXTERNAL', 'SAFETY', 'COMPLIANCE', 'QUALITY', 'REGULATORY', 'CUSTOMER'];
  const auditStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DEFERRED'];

  useEffect(() => {
    fetchScheduledReports();
  }, []);

  const fetchScheduledReports = async () => {
    // Mock data for scheduled reports
    setScheduledReports([
      {
        id: '1',
        name: 'Monthly Compliance Report',
        template: 'compliance_metrics',
        frequency: 'monthly',
        recipients: ['manager@company.com', 'audit@company.com'],
        lastRun: '2024-01-15T10:00:00Z',
        nextRun: '2024-02-15T10:00:00Z',
        status: 'active'
      },
      {
        id: '2',
        name: 'Weekly Findings Summary',
        template: 'findings_analysis',
        frequency: 'weekly',
        recipients: ['team@company.com'],
        lastRun: '2024-01-22T09:00:00Z',
        nextRun: '2024-01-29T09:00:00Z',
        status: 'active'
      }
    ]);
  };

  const generateReport = async () => {
    if (!selectedTemplate) {
      setError('Please select a report template');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const reportData = {
        template: selectedTemplate,
        format: selectedFormat,
        dateRange,
        filters: {
          auditTypes: selectedAuditTypes,
          status: selectedStatus
        }
      };

      const response = await fetch('/api/audits/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const template = reportTemplates.find(t => t.id === selectedTemplate);
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `${template?.name || 'audit-report'}-${timestamp}.${selectedFormat}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      setError('Failed to generate report. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      case 'word': return <File className="h-4 w-4" />;
      case 'powerpoint': return <FileImage className="h-4 w-4" />;
      case 'html': return <FileText className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Audit Reports & Analytics</CardTitle>
              <p className="text-gray-600 mt-1">Generate comprehensive reports and schedule automated deliveries</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Report Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportTemplates.map((template) => {
                      const IconComponent = template.icon;
                      return (
                        <div
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`
                            p-4 border rounded-lg cursor-pointer transition-all
                            ${selectedTemplate === template.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <IconComponent className={`h-5 w-5 mt-1 ${
                              selectedTemplate === template.id ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{template.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {template.formats.map(format => (
                                  <Badge key={format} variant="outline" className="text-xs">
                                    {format.toUpperCase()}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Report Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Audit Types */}
                  <div>
                    <Label>Audit Types</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {auditTypes.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={selectedAuditTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAuditTypes(prev => [...prev, type]);
                              } else {
                                setSelectedAuditTypes(prev => prev.filter(t => t !== type));
                              }
                            }}
                          />
                          <Label htmlFor={type} className="text-sm">{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <Label>Audit Status</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {auditStatuses.map(status => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={status}
                            checked={selectedStatus.includes(status)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStatus(prev => [...prev, status]);
                              } else {
                                setSelectedStatus(prev => prev.filter(s => s !== status));
                              }
                            }}
                          />
                          <Label htmlFor={status} className="text-sm">{status}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generation Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Output Format</Label>
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            PDF Document
                          </div>
                        </SelectItem>
                        <SelectItem value="excel">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            Excel Spreadsheet
                          </div>
                        </SelectItem>
                        <SelectItem value="word">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4" />
                            Word Document
                          </div>
                        </SelectItem>
                        <SelectItem value="html">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            HTML Report
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Button 
                      onClick={generateReport} 
                      disabled={loading || !selectedTemplate}
                      variant="export"
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Generate Report
                        </>
                      )}
                    </Button>

                    <Button 
                      variant="neutral" 
                      onClick={() => setShowPreview(true)}
                      disabled={!selectedTemplate}
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Selected Template:</span>
                      <span className="font-medium">
                        {selectedTemplate ? reportTemplates.find(t => t.id === selectedTemplate)?.name : 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Output Format:</span>
                      <span className="font-medium">{selectedFormat.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date Range:</span>
                      <span className="font-medium">
                        {dateRange.start && dateRange.end 
                          ? `${dateRange.start} to ${dateRange.end}`
                          : 'All time'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Filters:</span>
                      <span className="font-medium">
                        {selectedAuditTypes.length + selectedStatus.length} applied
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Scheduled Reports</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledReports.map(report => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{report.name}</h4>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Template: {reportTemplates.find(t => t.id === report.template)?.name}</p>
                        <p>Frequency: {report.frequency}</p>
                        <p>Recipients: {report.recipients.join(', ')}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last run: {new Date(report.lastRun).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Next run: {new Date(report.nextRun).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="edit" size="sm">Edit</Button>
                      <Button variant="export" size="sm">Run Now</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Report Templates</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTemplates.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <Card key={template.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <IconComponent className="h-6 w-6 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          <div className="flex flex-wrap gap-1 mt-3">
                            {template.formats.map(format => (
                              <Badge key={format} variant="outline" className="text-xs">
                                {format}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Button variant="edit" size="sm">Edit</Button>
                            <Button variant="neutral" size="sm">Duplicate</Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditReports; 
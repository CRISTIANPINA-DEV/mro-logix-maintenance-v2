"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar,
  Users,
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  TrendingUp,
  Target,
  Activity,
  AlertCircle
} from "lucide-react";

interface Finding {
  id: string;
  findingNumber: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'NON_CRITICAL' | 'OBSERVATION';
  status: 'OPEN' | 'IN_PROGRESS' | 'VERIFIED' | 'CLOSED' | 'DEFERRED';
  category: string;
  discoveredDate: string;
  targetCloseDate: string;
  auditId: string;
  audit: {
    auditNumber: string;
    title: string;
    department: string;
  };
  correctiveActions: CorrectiveAction[];
  responsiblePerson: string;
  _count: {
    correctiveActions: number;
  };
}

interface CorrectiveAction {
  id: string;
  actionNumber: string;
  description: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'OVERDUE';
  assignedTo: string;
  targetDate: string;
  completedDate?: string;
  findingId: string;
}

interface FindingsData {
  summary: {
    totalFindings: number;
    openFindings: number;
    resolvedFindings: number;
    overdueFindings: number;
    completionRate: number;
  };
  severityBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  departmentBreakdown: Record<string, number>;
}

const FindingsManagement: React.FC = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingsData, setFindingsData] = useState<FindingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [showFindingDetail, setShowFindingDetail] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchFindings();
    fetchFindingsData();
  }, [searchTerm, severityFilter, statusFilter, departmentFilter]);

  const fetchFindings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (departmentFilter !== 'all') params.append('department', departmentFilter);

      const response = await fetch(`/api/audits/findings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch findings');
      
      const data = await response.json();
      setFindings(data.findings || []);
    } catch (err) {
      setError('Failed to load findings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFindingsData = async () => {
    try {
      const response = await fetch('/api/audits/findings/analytics');
      if (!response.ok) throw new Error('Failed to fetch findings data');
      
      const data = await response.json();
      setFindingsData(data);
    } catch (err) {
      console.error('Failed to load findings analytics:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'MAJOR': return 'bg-orange-500 text-white';
      case 'MINOR': return 'bg-yellow-500 text-white';
      case 'NON_CRITICAL': return 'bg-blue-500 text-white';
      case 'OBSERVATION': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800 border-red-200';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'VERIFIED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DEFERRED': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CLOSED': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'VERIFIED': return 'bg-purple-100 text-purple-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertCircle className="h-4 w-4" />;
      case 'MAJOR': return <AlertTriangle className="h-4 w-4" />;
      case 'MINOR': return <Clock className="h-4 w-4" />;
      case 'NON_CRITICAL': return <Activity className="h-4 w-4" />;
      case 'OBSERVATION': return <Eye className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'CLOSED' || status === 'VERIFIED') return false;
    return new Date(dueDate) < new Date();
  };

  const calculateDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const filteredFindings = findings.filter(finding => {
    const matchesSearch = !searchTerm || 
      finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.findingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading && !findingsData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading findings data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Findings Management</CardTitle>
              <p className="text-gray-600 mt-1">Track, manage, and resolve audit findings</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="export" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button variant="neutral" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Finding
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Finding</DialogTitle>
                  </DialogHeader>
                  <p className="text-gray-600">Finding creation form will be implemented here.</p>
                </DialogContent>
              </Dialog>
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Findings</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{findingsData?.summary.totalFindings}</div>
                <p className="text-xs text-muted-foreground">All identified findings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Findings</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{findingsData?.summary.openFindings}</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{findingsData?.summary.resolvedFindings}</div>
                <p className="text-xs text-muted-foreground">Successfully resolved</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{findingsData?.summary.overdueFindings}</div>
                <p className="text-xs text-muted-foreground">Past due date</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <Target className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{findingsData?.summary.completionRate.toFixed(1)}%</div>
                <Progress value={findingsData?.summary.completionRate} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Charts and Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Severity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Findings by Severity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(findingsData?.severityBreakdown || {}).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(severity)}>
                          {getSeverityIcon(severity)}
                          <span className="ml-1">{severity.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Findings by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(findingsData?.statusBreakdown || {}).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge className={getStatusColor(status)}>
                        {status.replace('_', ' ')}
                      </Badge>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Department Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Findings by Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(findingsData?.departmentBreakdown || {}).slice(0, 5).map(([dept, count]) => (
                    <div key={dept} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{dept}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="findings" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search findings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="MAJOR">Major</SelectItem>
                    <SelectItem value="MINOR">Minor</SelectItem>
                    <SelectItem value="NON_CRITICAL">Non-Critical</SelectItem>
                    <SelectItem value="OBSERVATION">Observation</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Findings List */}
          <Card>
            <CardHeader>
              <CardTitle>Findings ({filteredFindings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredFindings.map((finding) => (
                  <div key={finding.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{finding.title}</h4>
                          <Badge className={getSeverityColor(finding.severity)}>
                            {getSeverityIcon(finding.severity)}
                            <span className="ml-1">{finding.severity}</span>
                          </Badge>
                          <Badge className={getStatusColor(finding.status)}>
                            {finding.status.replace('_', ' ')}
                          </Badge>
                          {isOverdue(finding.targetCloseDate, finding.status) && (
                            <Badge className="bg-red-100 text-red-800">
                              {calculateDaysOverdue(finding.targetCloseDate)} days overdue
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{finding.findingNumber}</p>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{finding.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Audit: {finding.audit.auditNumber}</span>
                          <span>Department: {finding.audit.department}</span>
                          <span>Responsible: {finding.responsiblePerson}</span>
                          <span>Due: {new Date(finding.targetCloseDate).toLocaleDateString()}</span>
                          <span>{finding._count.correctiveActions} actions</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="neutral" 
                          size="sm"
                          onClick={() => {
                            setSelectedFinding(finding);
                            setShowFindingDetail(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="edit" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="delete" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredFindings.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No findings found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search terms</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Findings Analytics & Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Advanced analytics and trend analysis will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FindingsManagement; 
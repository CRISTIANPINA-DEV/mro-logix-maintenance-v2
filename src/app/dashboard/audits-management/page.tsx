"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AuditsManagementHeader from './audits-management-header';
import AuditDetailView from './components/audit-detail-view';
import EditAuditDialog from './components/edit-audit-dialog';
import AuditCalendar from './components/audit-calendar';
import ComplianceMetrics from './components/compliance-metrics';
import AuditReports from './components/audit-reports';
import NotificationsComponent from './components/notifications';
import FindingsManagement from './components/findings-management';
import { 
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw
} from "lucide-react";

interface DashboardData {
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
  recentAudits: any[];
  upcomingAudits: any[];
}

interface Audit {
  id: string;
  auditNumber: string;
  title: string;
  type: string;
  status: string;
  leadAuditor: string;
  plannedStartDate: string;
  plannedEndDate: string;  
  actualStartDate?: string;
  actualEndDate?: string;
  department?: string;
  description?: string;
  scope?: string;
  location?: string;
  auditee?: string;
  objectives?: string;
  criteria?: string;
  _count: {
    findings: number;
    attachments: number;
  };
}

export default function AuditsManagement() {
  const router = useRouter();
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [showAuditDetail, setShowAuditDetail] = useState(false);
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteConfirmAudit, setDeleteConfirmAudit] = useState<Audit | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);

  // Check permissions
  useEffect(() => {
    if (!permissionsLoading && !permissions?.canSeeAuditManagement) {
      router.push('/dashboard');
    }
  }, [permissions, permissionsLoading, router]);

  useEffect(() => {
    fetchDashboardData();
    if (activeTab === 'audits') {
      fetchAudits();
    }
  }, [activeTab]);

  // Auto-trigger search when search term changes
  useEffect(() => {
    if (activeTab === 'audits') {
      const debounceTimer = setTimeout(() => {
        fetchAudits();
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, statusFilter, typeFilter, activeTab]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/audits/dashboard');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Failed to load dashboard data');
      console.error('Dashboard fetch error:', errorMessage, err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      
      const response = await fetch(`/api/audits?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audits');
      const data = await response.json();
      setAudits(data.audits);
    } catch (err) {
      setError('Failed to load audits');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAudit = (auditId: string) => {
    setSelectedAuditId(auditId);
    setShowAuditDetail(true);
  };

  const handleCloseAuditDetail = () => {
    setShowAuditDetail(false);
    setSelectedAuditId(null);
  };

  const handleEditAudit = (audit: Audit) => {
    setEditingAudit(audit);
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingAudit(null);
  };

  const handleUpdateAudit = async (updatedAudit: Audit) => {
    try {
      setOperationLoading(true);
      const response = await fetch(`/api/audits/${updatedAudit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAudit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update audit');
      }

      // Refresh audits list
      await fetchAudits();
      
      // Refresh dashboard data only if we're on the dashboard tab or if status changed
      // This ensures dashboard stats are updated when audit status changes
      try {
        if (activeTab === 'dashboard') {
          await fetchDashboardData();
        }
      } catch (dashboardError) {
        console.warn('Failed to refresh dashboard data:', dashboardError);
        // Don't throw here - audit update was successful, dashboard refresh failure is not critical
      }
      
      // Close dialog and clear error
      setError(null);
      handleCloseEditDialog();
      
      // Optionally show a success toast
      console.log('Audit updated successfully');
    } catch (err: any) {
      console.error('Error updating audit:', err);
      throw err; // Re-throw to let the EditAuditDialog handle the error display
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteAudit = async (audit: Audit) => {
    setDeleteConfirmAudit(audit);
  };

  const confirmDeleteAudit = async () => {
    if (!deleteConfirmAudit) return;

    try {
      setOperationLoading(true);
      const response = await fetch(`/api/audits/${deleteConfirmAudit.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete audit');
      }

      // Refresh audits list
      await fetchAudits();
      
      // Refresh dashboard data
      await fetchDashboardData();
      
      setError(null);
      setDeleteConfirmAudit(null);
      
      console.log('Audit deleted successfully');
    } catch (err) {
      setError('Failed to delete audit');
      console.error(err);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setError(null);
    if (activeTab === 'dashboard') {
      await fetchDashboardData();
    } else if (activeTab === 'audits') {
      await fetchAudits();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'DEFERRED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'MAJOR': return 'bg-orange-100 text-orange-800';
      case 'MINOR': return 'bg-yellow-100 text-yellow-800';
      case 'NON_CRITICAL': return 'bg-blue-100 text-blue-800';
      case 'OBSERVATION': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading state while checking permissions
  if (permissionsLoading) {
    return (
      <div className="w-full max-w-full mx-auto px-2 pt-1 pb-10">
        <AuditsManagementHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has permission to access this page
  if (!permissions?.canSeeAuditManagement) {
    return null;
  }

  // Show loading state while fetching data
  if (loading && !dashboardData) {
    return (
      <div className="w-full max-w-full mx-auto px-2 pt-1 pb-10">
        <AuditsManagementHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading audit data...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleAuditCreated = async () => {
    // Refresh both dashboard data and audits list
    try {
      if (activeTab === 'dashboard') {
        await fetchDashboardData();
      }
      if (activeTab === 'audits') {
        await fetchAudits();
      }
    } catch (error) {
      console.error('Error refreshing data after audit creation:', error);
      // Set a more specific error message
      setError('Audit created successfully, but failed to refresh display data. Please refresh the page.');
    }
  };

  return (
    <div className="w-full max-w-full mx-auto px-2 pt-1 pb-10">
      <AuditsManagementHeader onAuditCreated={handleAuditCreated} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {dashboardData && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.summary.totalAudits}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.summary.completedAudits} completed
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Findings</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{dashboardData.summary.openFindings}</div>
                    <p className="text-xs text-muted-foreground">
                      Require attention
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overdue Actions</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{dashboardData.summary.overdueActions}</div>
                    <p className="text-xs text-muted-foreground">
                      Past due date
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.summary.avgComplianceRate?.toFixed(1) || 'N/A'}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average compliance
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts and Tables */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Audits</CardTitle>
                    <CardDescription>Latest audit activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.recentAudits.map((audit) => (
                        <div key={audit.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{audit.title}</p>
                            <p className="text-sm text-gray-600">{audit.auditNumber}</p>
                            <Badge className={`text-xs ${getStatusColor(audit.status)}`}>
                              {audit.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{audit._count.findings} findings</p>
                            <p className="text-xs text-gray-500">{audit.leadAuditor}</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="mt-2"
                              onClick={() => handleViewAudit(audit.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Audits</CardTitle>
                    <CardDescription>Scheduled for next 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.upcomingAudits.map((audit) => (
                        <div key={audit.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{audit.title}</p>
                            <p className="text-sm text-gray-600">{audit.auditNumber}</p>
                            <Badge className={`text-xs ${getStatusColor(audit.status)}`}>
                              {audit.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {new Date(audit.plannedStartDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">{audit.leadAuditor}</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="mt-2"
                              onClick={() => handleViewAudit(audit.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="audits" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search audits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PLANNED">Planned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="DEFERRED">Deferred</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INTERNAL">Internal</SelectItem>
                <SelectItem value="EXTERNAL">External</SelectItem>
                <SelectItem value="SAFETY">Safety</SelectItem>
                <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                <SelectItem value="QUALITY">Quality</SelectItem>
                <SelectItem value="REGULATORY">Regulatory</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchAudits} variant="neutral" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Audits List */}
          <Card>
            <CardHeader>
              <CardTitle>Audits List</CardTitle>
              <CardDescription>Manage and view all audits</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {audits.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <FileText className="h-12 w-12 mx-auto mb-2" />
                      <p>No audits found matching your criteria</p>
                    </div>
                  ) : (
                    audits.map((audit) => (
                      <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-medium">{audit.title}</p>
                            <Badge className={`text-xs ${getStatusColor(audit.status)}`}>
                              {audit.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {audit.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{audit.auditNumber}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Lead: {audit.leadAuditor}</span>
                            {audit.department && <span>Dept: {audit.department}</span>}
                            <span>{audit._count.findings} findings</span>
                            <span>
                              {new Date(audit.plannedStartDate).toLocaleDateString()} - {new Date(audit.plannedEndDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="neutral" 
                            size="sm"
                            onClick={() => handleViewAudit(audit.id)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="edit" 
                            size="sm"
                            onClick={() => handleEditAudit(audit)}
                            title="Edit Audit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="delete" 
                            size="sm"
                            onClick={() => handleDeleteAudit(audit)}
                            title="Delete Audit"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings">
          <FindingsManagement />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceMetrics />
        </TabsContent>

        <TabsContent value="schedule">
          <AuditCalendar onAuditSelect={(audit) => {
            setSelectedAuditId(audit.id);
            setShowAuditDetail(true);
          }} />
        </TabsContent>

        <TabsContent value="reports">
          <AuditReports />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsComponent />
        </TabsContent>
      </Tabs>

      {/* Edit Audit Dialog */}
      <EditAuditDialog
        audit={editingAudit}
        isOpen={showEditDialog}
        onClose={handleCloseEditDialog}
        onSave={handleUpdateAudit}
        loading={operationLoading}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmAudit && (
        <Dialog open={!!deleteConfirmAudit} onOpenChange={() => setDeleteConfirmAudit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Audit Confirmation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Are you sure you want to delete this audit?</p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{deleteConfirmAudit.title}</p>
                <p className="text-sm text-gray-600">{deleteConfirmAudit.auditNumber}</p>
                <p className="text-sm text-red-600 mt-2">
                  This action cannot be undone. All associated findings, corrective actions, and attachments will be permanently deleted.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="neutral" onClick={() => setDeleteConfirmAudit(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="delete" 
                  onClick={confirmDeleteAudit}
                  disabled={operationLoading}
                >
                  {operationLoading ? 'Deleting...' : 'Delete Audit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Audit Detail Modal */}
      {selectedAuditId && (
        <AuditDetailView
          auditId={selectedAuditId}
          isOpen={showAuditDetail}
          onClose={handleCloseAuditDetail}
        />
      )}
    </div>
  );
} 
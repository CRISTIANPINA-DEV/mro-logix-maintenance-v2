"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
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
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import EditCorrectiveActionDialog from './edit-corrective-action-dialog';

interface CorrectiveAction {
  id: string;
  actionNumber: string;
  title: string;
  description: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'OVERDUE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo: string;
  targetDate: string;
  completedDate?: string;
  findingId: string;
  finding: {
    findingNumber: string;
    title: string;
    audit: {
      auditNumber: string;
      title: string;
    }
  };
}

interface ActionsAnalytics {
  summary: {
    totalActions: number;
    completedActions: number;
    inProgressActions: number;
    overdueActions: number;
    completionRate: number;
  };
  statusBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  assignedToBreakdown: Record<string, number>;
}

const CorrectiveActionsManagement: React.FC = () => {
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [analytics, setAnalytics] = useState<ActionsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [actionToDelete, setActionToDelete] = useState<CorrectiveAction | null>(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter, assignedToFilter]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
        fetchData();
      }, 300);
      return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Parallel fetch for actions and analytics
      const [actionsResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/audits/corrective-actions?search=${searchTerm}&status=${statusFilter}&priority=${priorityFilter}&assignedTo=${assignedToFilter}`),
        fetch('/api/audits/corrective-actions/analytics')
      ]);

      if (!actionsResponse.ok) throw new Error('Failed to fetch corrective actions');
      const actionsData = await actionsResponse.json();
      setActions(actionsData.actions || []);

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      } else {
        console.warn('Could not fetch analytics data.');
      }
    } catch (err) {
      setError('Failed to load corrective actions data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAction = async () => {
    if (!actionToDelete) return;

    try {
      const response = await fetch(`/api/audits/corrective-actions/${actionToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete corrective action');
      }

      await fetchData(); // Refresh list
      setActionToDelete(null); // Close dialog

    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting.');
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'VERIFIED': return 'bg-purple-100 text-purple-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'HIGH': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'MEDIUM': return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'LOW': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <div />;
    }
  };

  const isOverdue = (targetDate: string, status: string) => {
    if (status === 'COMPLETED' || status === 'VERIFIED') return false;
    return new Date(targetDate) < new Date();
  };

  if (loading && !actions.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-green-600" /> Corrective Actions
              </CardTitle>
              <p className="text-gray-600 mt-1">Track and manage all corrective and preventive actions.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="export" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <Tabs defaultValue="list">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Actions List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Search actions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ASSIGNED">Assigned</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                 <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchData} variant="outline" size="icon" className="h-10 w-10"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finding</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading && !actions.length ? (
                      <tr><td colSpan={6} className="text-center p-8 text-gray-500">Loading...</td></tr>
                    ) : actions.length === 0 ? (
                        <tr><td colSpan={6} className="text-center p-8 text-gray-500">No corrective actions found.</td></tr>
                    ) : (
                      actions.map(action => (
                        <tr key={action.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{action.title}</div>
                            <div className="text-sm text-gray-500">{action.actionNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{action.finding.title}</div>
                            <div className="text-sm text-gray-500">{action.finding.findingNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(action.status)}>
                              {action.status.replace('_', ' ')}
                            </Badge>
                             {isOverdue(action.targetDate, action.status) && (
                                <Badge className={`${getStatusColor('OVERDUE')} ml-2`}>Overdue</Badge>
                             )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{action.assignedTo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(action.targetDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                            <EditCorrectiveActionDialog action={action} onActionUpdated={fetchData}>
                              <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                            </EditCorrectiveActionDialog>
                            <Button variant="ghost" size="icon" onClick={() => setActionToDelete(action)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-6">
          {analytics ? (
            <>
              {analytics.summary && (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{analytics.summary.totalActions}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{analytics.summary.completedActions}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">In Progress</CardTitle><Clock className="h-4 w-4 text-yellow-500" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{analytics.summary.inProgressActions}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Overdue</CardTitle><AlertCircle className="h-4 w-4 text-red-500" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{analytics.summary.overdueActions}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Completion Rate</CardTitle><Target className="h-4 w-4 text-blue-500" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{analytics.summary.completionRate.toFixed(1)}%</div><Progress value={analytics.summary.completionRate} className="mt-2" /></CardContent>
                  </Card>
                </div>
              )}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Card><CardHeader><CardTitle>By Status</CardTitle></CardHeader><CardContent>...</CardContent></Card>
                 <Card><CardHeader><CardTitle>By Priority</CardTitle></CardHeader><CardContent>...</CardContent></Card>
                 <Card><CardHeader><CardTitle>By Assignee</CardTitle></CardHeader><CardContent>...</CardContent></Card>
              </div>
            </>
          ) : (
            <Card><CardContent className="text-center p-8 text-gray-500">Analytics data is not available.</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
       <AlertDialog open={!!actionToDelete} onOpenChange={() => setActionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this action?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the corrective action titled "{actionToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAction} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CorrectiveActionsManagement; 
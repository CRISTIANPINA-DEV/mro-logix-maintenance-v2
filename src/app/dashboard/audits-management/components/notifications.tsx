"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Bell, 
  Mail, 
  Clock, 
  Users,
  Settings,
  Send,
  Eye,
  Trash2,
  Plus,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Search,
  MoreVertical,
  Archive,
  Star
} from "lucide-react";

interface Notification {
  id: string;
  type: 'audit_due' | 'finding_overdue' | 'action_required' | 'approval_needed' | 'status_change' | 'reminder';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  relatedAuditId?: string;
  actionUrl?: string;
  sender?: string;
  recipients: string[];
}

interface NotificationRule {
  id: string;
  name: string;
  trigger: string;
  conditions: any;
  recipients: string[];
  template: string;
  isActive: boolean;
  channels: ('email' | 'in_app' | 'sms')[];
}

const NotificationsComponent: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  useEffect(() => {
    fetchNotifications();
    fetchNotificationRules();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for notifications
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'audit_due',
          title: 'Safety Audit Due Tomorrow',
          message: 'The quarterly safety audit for Manufacturing Department is scheduled for tomorrow. Please ensure all documentation is prepared.',
          priority: 'high',
          status: 'unread',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          relatedAuditId: 'audit-001',
          actionUrl: '/audits/audit-001',
          recipients: ['auditor@company.com', 'manager@company.com']
        },
        {
          id: '2',
          type: 'finding_overdue',
          title: 'Critical Finding Overdue',
          message: 'Corrective action for critical finding CF-2024-001 is now 5 days overdue. Immediate attention required.',
          priority: 'urgent',
          status: 'unread',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          relatedAuditId: 'audit-002',
          actionUrl: '/audits/findings/CF-2024-001',
          recipients: ['responsible@company.com', 'supervisor@company.com']
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (err) {
      setError('Failed to load notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationRules = async () => {
    try {
      // Mock data for notification rules
      const mockRules: NotificationRule[] = [
        {
          id: '1',
          name: 'Audit Due Reminder',
          trigger: 'audit_due_soon',
          conditions: { daysBefore: 2 },
          recipients: ['auditor@company.com', 'manager@company.com'],
          template: 'audit_due_template',
          isActive: true,
          channels: ['email', 'in_app']
        }
      ];
      
      setRules(mockRules);
    } catch (err) {
      console.error('Failed to load notification rules:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, status: 'read' as const } : n)
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'audit_due': return <Calendar className="h-4 w-4" />;
      case 'finding_overdue': return <AlertTriangle className="h-4 w-4" />;
      case 'action_required': return <CheckCircle className="h-4 w-4" />;
      case 'approval_needed': return <Users className="h-4 w-4" />;
      case 'status_change': return <Settings className="h-4 w-4" />;
      case 'reminder': return <Clock className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesSearch = !searchQuery || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
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
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6" />
              <div>
                <CardTitle className="text-2xl">Notifications Center</CardTitle>
                <p className="text-gray-600 mt-1">
                  Manage audit notifications and alert preferences
                  {unreadCount > 0 && (
                    <Badge className="ml-2 bg-red-100 text-red-800">
                      {unreadCount} unread
                    </Badge>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        notification.status === 'unread' ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                          {getTypeIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-medium ${
                              notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {new Date(notification.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-2">
                            {notification.status === 'unread' && (
                              <Button
                                variant="neutral"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Mark as Read
                              </Button>
                            )}
                            
                            {notification.actionUrl && (
                              <Button
                                variant="neutral"
                                size="sm"
                                onClick={() => window.open(notification.actionUrl, '_blank')}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{rule.name}</h4>
                      <p className="text-sm text-gray-600">Trigger: {rule.trigger}</p>
                    </div>
                    <Switch checked={rule.isActive} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">In-App Notifications</Label>
                    <p className="text-sm text-gray-600">Show notifications in the application</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Email Address</Label>
                <Input placeholder="your.email@company.com" defaultValue="user@company.com" />
              </div>
              
              <Button variant="save">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsComponent; 
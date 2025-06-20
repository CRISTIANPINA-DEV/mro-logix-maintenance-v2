"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDistanceToNow } from 'date-fns';
import { Send, Clock, User, Eye, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  priority: string;
  senderId: string;
  sender: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  readReceipts: {
    user: {
      firstName: string;
      lastName: string;
    };
    readAt: string;
  }[];
}

export default function NotificationCenter() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('Low');
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingNotifications, setFetchingNotifications] = useState(false);

  // Check if user is admin
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.privilege !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Send className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600 text-center max-w-md">
          You need administrator privileges to access the Notification Center. Please contact your system administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  useEffect(() => {
    fetchSentNotifications();
  }, []);

  const fetchSentNotifications = async () => {
    try {
      setFetchingNotifications(true);
      const response = await fetch('/api/notifications/sent');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSentNotifications(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching sent notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sent notifications",
        variant: "destructive",
      });
    } finally {
      setFetchingNotifications(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          priority,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Notification sent to all employees",
        });
        setMessage('');
        // Fetch updated notifications after sending
        await fetchSentNotifications();
      } else {
        toast({
          title: "Error",
          description: "Failed to send notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  const openNotificationModal = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const closeNotificationModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Send Notification Card */}
      <Card className="shadow-sm border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            <Send className="h-5 w-5 text-blue-600" />
            Company-wide Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Priority:</span>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea
            placeholder="Enter your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px] resize-none border-gray-200 focus:border-blue-400"
          />
          <Button 
            onClick={handleSend} 
            disabled={loading}
            className="h-8 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to All Employees
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sent Notifications Card */}
      <Card className="shadow-sm border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            <Clock className="h-5 w-5 text-gray-600" />
            Sent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fetchingNotifications ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-sm text-gray-600">Loading notifications...</p>
            </div>
          ) : sentNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Send className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No notifications sent yet</p>
              <p className="text-sm text-gray-400 mt-1">Your sent notifications will appear here</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 py-3">Message</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-3 w-24">Priority</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-3 w-32">Sent</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-3 w-20 text-center">Reads</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-3 w-20">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sentNotifications.map((notification) => (
                    <TableRow 
                      key={notification.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="font-medium text-gray-900 text-sm">
                          {truncateMessage(notification.message)}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge 
                          variant={getPriorityVariant(notification.priority || 'low')}
                          className="text-xs font-medium"
                        >
                          {notification.priority || 'Low'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-3 w-3 text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">
                            {notification.readReceipts.length}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => openNotificationModal(notification)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-800">
              <Eye className="h-5 w-5 text-gray-600" />
              Notification Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Message
                    </h4>
                    <div className="bg-gray-50 p-4 border">
                      <p className="text-gray-800 leading-relaxed">{selectedNotification.message}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Sent
                      </h4>
                      <div className="bg-gray-50 p-3 border">
                        <p className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(selectedNotification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Priority</h4>
                      <div className="bg-gray-50 p-3 border flex items-center">
                        <Badge variant={getPriorityVariant(selectedNotification.priority || 'low')} className="text-sm">
                          {selectedNotification.priority || 'Low'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Sent by
                    </h4>
                    <div className="bg-gray-50 p-3 border">
                      <p className="text-sm text-gray-600">
                        {selectedNotification.sender ? 
                          `${selectedNotification.sender.firstName} ${selectedNotification.sender.lastName}` :
                          session?.user?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Read by ({selectedNotification.readReceipts.length})
                  </h4>
                  <div className="bg-gray-50 border p-4 max-h-80 overflow-y-auto">
                    {selectedNotification.readReceipts.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="mx-auto w-12 h-12 bg-gray-200 flex items-center justify-center mb-3">
                          <Eye className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">No reads yet</p>
                        <p className="text-xs text-gray-400 mt-1">This notification hasn't been read by anyone</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedNotification.readReceipts.map((receipt, index) => (
                          <div key={index} className="flex justify-between items-center py-3 px-3 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-800">
                                  {`${receipt.user.firstName} ${receipt.user.lastName}`}
                                </span>
                                <p className="text-xs text-gray-500">
                                  Read {formatDistanceToNow(new Date(receipt.readAt), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(receipt.readAt).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
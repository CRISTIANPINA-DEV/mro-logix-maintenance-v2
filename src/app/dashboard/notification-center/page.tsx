"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from 'date-fns';

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
  const { data: session } = useSession();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('Low');
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingNotifications, setFetchingNotifications] = useState(false);

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

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company-wide Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Enter your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={handleSend} disabled={loading}>
            {loading ? "Sending..." : "Send to All Employees"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {fetchingNotifications ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : sentNotifications.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No notifications sent yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {sentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="py-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedNotification(notification)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{notification.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${getPriorityColor(notification.priority || 'low')}`}>
                      {notification.priority || 'Low'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedNotification && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">Message</h4>
              <p>{selectedNotification.message}</p>
            </div>
            <div>
              <h4 className="font-medium">Sent</h4>
              <p>{formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}</p>
            </div>
            <div>
              <h4 className="font-medium">Priority</h4>
              <span className={`px-2 py-1 rounded text-sm ${getPriorityColor(selectedNotification.priority || 'low')}`}>
                {selectedNotification.priority || 'Low'}
              </span>
            </div>
            <div>
              <h4 className="font-medium">Sent by</h4>
              <p>{selectedNotification.sender ? 
                `${selectedNotification.sender.firstName} ${selectedNotification.sender.lastName}` :
                session?.user?.name || 'Unknown'}</p>
            </div>
            <div>
              <h4 className="font-medium">Read by</h4>
              <div className="space-y-2">
                {selectedNotification.readReceipts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No one has read this notification yet</p>
                ) : (
                  selectedNotification.readReceipts.map((receipt, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{`${receipt.user.firstName} ${receipt.user.lastName}`}</span>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(receipt.readAt), { addSuffix: true })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
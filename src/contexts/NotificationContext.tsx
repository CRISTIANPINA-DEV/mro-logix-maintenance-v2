import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  isArchived: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  archivedNotifications: Notification[];
  markAsRead: (id: string) => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  unarchiveNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [archivedNotifications, setArchivedNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    if (!session?.user?.id) {
      console.log('No active session, skipping notification fetch');
      return;
    }

    try {
      // Fetch active notifications
      const activeResponse = await fetch('/api/notifications?archived=false', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      // Fetch archived notifications
      const archivedResponse = await fetch('/api/notifications?archived=true', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!activeResponse.ok) {
        throw new Error(`Active notifications fetch failed: ${activeResponse.status}`);
      }
      
      if (!archivedResponse.ok) {
        throw new Error(`Archived notifications fetch failed: ${archivedResponse.status}`);
      }
      
      const activeData = await activeResponse.json();
      const archivedData = await archivedResponse.json();
      
      if (activeData.success && archivedData.success) {
        setNotifications(activeData.data);
        setArchivedNotifications(archivedData.data);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Reset notifications on error to prevent stale data
      setNotifications([]);
      setArchivedNotifications([]);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
        credentials: 'include',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const archiveNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isArchived: true }),
        credentials: 'include',
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === id);
        if (notification) {
          setNotifications(prev => prev.filter(n => n.id !== id));
          setArchivedNotifications(prev => [...prev, { ...notification, isArchived: true }]);
        }
      }
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  const unarchiveNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isArchived: false }),
        credentials: 'include',
      });

      if (response.ok) {
        const notification = archivedNotifications.find(n => n.id === id);
        if (notification) {
          setArchivedNotifications(prev => prev.filter(n => n.id !== id));
          setNotifications(prev => [...prev, { ...notification, isArchived: false }]);
        }
      }
    } catch (error) {
      console.error('Error unarchiving notification:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Remove from both active and archived notifications
        setNotifications(prev => prev.filter(n => n.id !== id));
        setArchivedNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        archivedNotifications,
        markAsRead,
        archiveNotification,
        unarchiveNotification,
        deleteNotification,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 
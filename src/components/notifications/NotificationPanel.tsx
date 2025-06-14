import { useNotifications } from "@/contexts/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import { 
  ArchiveIcon, 
  CheckIcon, 
  TrashIcon,
  AlertCircleIcon,
  UndoIcon,
  InboxIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function NotificationPanel() {
  const { 
    notifications, 
    archivedNotifications, 
    markAsRead, 
    archiveNotification, 
    unarchiveNotification,
    deleteNotification 
  } = useNotifications();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteNotification(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const NotificationList = ({ items, isArchived }: { items: typeof notifications, isArchived: boolean }) => {
    if (items.length === 0) {
      return (
        <div className="p-2 text-center text-muted-foreground">
          <AlertCircleIcon className="mx-auto h-6 w-6 mb-1" />
          <p className="text-sm">{isArchived ? "No archived notifications" : "No new notifications"}</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-border">
        {items.map((notification) => (
          <div
            key={notification.id}
            className={`px-3 py-2 ${
              !notification.isRead && !isArchived ? "bg-muted/50" : ""
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {!isArchived && !notification.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => markAsRead(notification.id)}
                    title="Mark as read"
                    className="h-7 w-7"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </Button>
                )}
                {isArchived ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => unarchiveNotification(notification.id)}
                    title="Unarchive"
                    className="h-7 w-7"
                  >
                    <UndoIcon className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => archiveNotification(notification.id)}
                    title="Archive"
                    className="h-7 w-7"
                  >
                    <ArchiveIcon className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteConfirmId(notification.id)}
                  className="text-destructive hover:text-destructive h-7 w-7"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-h-[500px] overflow-y-auto rounded-none border border-border">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-none">
          <TabsTrigger value="active" className="flex items-center gap-2 rounded-none data-[state=active]:rounded-none">
            <InboxIcon className="h-4 w-4" />
            Active
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2 rounded-none data-[state=active]:rounded-none">
            <ArchiveIcon className="h-4 w-4" />
            Archived
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="rounded-none">
          <NotificationList items={notifications} isArchived={false} />
        </TabsContent>
        <TabsContent value="archived" className="rounded-none">
          <NotificationList items={archivedNotifications} isArchived={true} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-100 text-black border border-red-700 hover:bg-red-200">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 
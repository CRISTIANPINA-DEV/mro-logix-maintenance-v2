"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { UpdateEmailModal } from "./UpdateEmailModal";
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Activity, 
  Key, 
  Trash2,
  Edit3,
  AlertTriangle
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  privilege: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    activities: number;
  };
  permissions?: any;
}

interface UserDetailModalProps {
  user: UserData;
  onClose: () => void;
}

export function UserDetailModal({ user, onClose }: UserDetailModalProps) {
  const [showUpdateEmail, setShowUpdateEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!confirm(`Are you sure you want to reset the password for ${user.firstName} ${user.lastName}? They will need to use the "Forgot Password" feature to set a new password.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/users/manage/${user.id}/reset-password`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    const confirmText = `Delete ${user.firstName} ${user.lastName}`;
    const userInput = prompt(
      `This action cannot be undone. This will permanently delete the user account and ALL associated data.\n\nType "${confirmText}" to confirm:`
    );

    if (userInput !== confirmText) {
      if (userInput !== null) {
        toast.error('Confirmation text does not match');
      }
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/users/manage/${user.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        onClose(); // Close modal and refresh list
      } else {
        toast.error(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const getPrivilegeBadge = (privilege: string) => {
    switch (privilege) {
      case "admin":
        return <Badge variant="destructive" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>;
      case "manager":
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Manager
        </Badge>;
      case "technician":
        return <Badge variant="outline" className="flex items-center gap-1">
          <User className="h-3 w-3" />
          Technician
        </Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1">
          <User className="h-3 w-3" />
          Reader Only
        </Badge>;
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Management
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* User Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <div className="mt-1">
                    {getPrivilegeBadge(user.privilege)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={user.verified ? "default" : "secondary"}>
                      {user.verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Activities</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{user._count.activities}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Account Dates */}
            <div className="space-y-3">
              <h4 className="font-medium">Account Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm">{format(new Date(user.createdAt), 'PPP')}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm">{format(new Date(user.updatedAt), 'PPP')}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Management Actions */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Management Actions
              </h4>
              
              <div className="grid gap-3">
                {/* Update Email */}
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => setShowUpdateEmail(true)}
                  disabled={loading}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Update Email Address
                </Button>

                {/* Reset Password */}
                <Button
                  variant="outline"
                  className="justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  onClick={handleResetPassword}
                  disabled={loading}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Force Password Reset
                </Button>

                {/* Delete User */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium text-red-800">Danger Zone</h5>
                      <p className="text-xs text-red-600">
                        This action cannot be undone. This will permanently delete the user and all associated data.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={handleDeleteUser}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User Account
                  </Button>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Email Modal */}
      {showUpdateEmail && (
        <UpdateEmailModal
          user={user}
          onClose={() => setShowUpdateEmail(false)}
          onSuccess={(newEmail) => {
            setShowUpdateEmail(false);
            // Update the user data in the parent component
            onClose();
          }}
        />
      )}
    </>
  );
}
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface UpdateEmailModalProps {
  user: UserData;
  onClose: () => void;
  onSuccess: (newEmail: string) => void;
}

export function UpdateEmailModal({ user, onClose, onSuccess }: UpdateEmailModalProps) {
  const { data: session } = useSession();
  const [email, setEmail] = useState(user.email);
  const [loading, setLoading] = useState(false);

  // Get admin's email domain for validation
  const adminEmailDomain = session?.user?.email?.split('@')[1] || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate domain
    const newEmailDomain = email.split('@')[1];
    if (newEmailDomain !== adminEmailDomain) {
      toast.error(`Email domain must be @${adminEmailDomain}`);
      return;
    }

    // Check if email is the same
    if (email === user.email) {
      toast.error('Please enter a different email address');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/users/manage/${user.id}/email`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        onSuccess(email);
      } else {
        toast.error(data.message || 'Failed to update email');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Update Email Address
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter new email address"
              disabled={loading}
              autoFocus
            />
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p>Email domain must be @{adminEmailDomain}</p>
                <p className="text-xs">User will need to verify the new email address.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Current Email</Label>
            <div className="text-sm p-2 bg-muted rounded border">
              {user.email}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">User</Label>
            <div className="text-sm p-2 bg-muted rounded border">
              {user.firstName} {user.lastName}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !email.trim() || email === user.email}
            >
              {loading ? "Updating..." : "Update Email"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
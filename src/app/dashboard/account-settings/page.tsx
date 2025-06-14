"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, User, Shield, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  verified: boolean;
  createdAt: string;
  company: {
    id: string;
    name: string;
  };
}

interface DomainValidationResponse {
  success: boolean;
  error?: string;
}

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/profile');
        const data = await response.json();

        if (data.success) {
          setProfile(data.profile);
        } else {
          throw new Error(data.error || 'Failed to fetch profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Validate email domain as user types
  useEffect(() => {
    const validateDomain = async () => {
      if (!newEmail || !newEmail.includes('@')) {
        setDomainError(null);
        return;
      }

      try {
        const response = await fetch('/api/user/validate-email-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newEmail })
        });

        const data: DomainValidationResponse = await response.json();
        setDomainError(data.success ? null : data.error || null);
      } catch (error) {
        console.error('Error validating email domain:', error);
      }
    };

    const debounceTimer = setTimeout(validateDomain, 500);
    return () => clearTimeout(debounceTimer);
  }, [newEmail]);

  const handleEmailChange = async () => {
    if (domainError) {
      return; // Don't proceed if there's a domain error
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/user/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your new email for the verification PIN.",
        });
        setIsEmailDialogOpen(false);
        setIsVerifyDialogOpen(true);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate email change",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPin = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/user/verify-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, newEmail })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Your email has been updated successfully.",
        });
        setIsVerifyDialogOpen(false);
        // Update profile with new email
        setProfile(prev => prev ? { ...prev, email: newEmail } : null);
        setNewEmail("");
        setPin("");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify PIN",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-xl font-semibold text-muted-foreground">Profile Not Found</div>
        <p className="text-sm text-muted-foreground">Unable to load your profile information.</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-sm text-muted-foreground mt-2">
            View your account information and company details.
          </p>
        </div>

        <Separator />

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Your personal information as registered in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">First Name</label>
                  <div className="mt-1 p-2 bg-muted/20 rounded-md">
                    {profile.firstName}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                  <div className="mt-1 p-2 bg-muted/20 rounded-md">
                    {profile.lastName}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <div className="mt-1 p-2 bg-muted/20 rounded-md">
                  {profile.username}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Identities */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Account Identities</CardTitle>
            </div>
            <CardDescription>Your account and company information.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <div className="mt-1 flex items-center gap-4">
                  <div className="flex-1 p-2 bg-muted/20 rounded-md">
                    {profile.email}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsEmailDialogOpen(true)}
                  >
                    Change Email
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <label className="text-sm font-medium text-muted-foreground">Company Information</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                    <div className="mt-1 p-2 bg-muted/20 rounded-md">
                      {profile.company.name}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company ID</label>
                    <div className="mt-1 p-2 bg-muted/20 rounded-md font-mono text-sm">
                      {profile.company.id}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Account Status</CardTitle>
            </div>
            <CardDescription>Your account verification and registration details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Verification Status</label>
                  <p className="text-sm text-muted-foreground">Account verification status</p>
                </div>
                <Badge variant={profile.verified ? "default" : "secondary"}>
                  {profile.verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Member Since</label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Change Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              Enter your new email address. We'll send a verification PIN to confirm the change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="new-email" className="text-sm font-medium">
                New Email Address
              </label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter your new email"
                className={domainError ? "border-destructive" : ""}
              />
              {domainError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{domainError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEmailDialogOpen(false);
                setNewEmail("");
                setDomainError(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEmailChange}
              disabled={!newEmail || isSubmitting || !!domainError}
            >
              {isSubmitting ? "Sending..." : "Send Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN Verification Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Email Change</DialogTitle>
            <DialogDescription>
              Enter the 8-digit PIN sent to your new email address ({newEmail}).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="pin" className="text-sm font-medium">
                Verification PIN
              </label>
              <Input
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 8-digit PIN"
                maxLength={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVerifyDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyPin}
              disabled={!pin || isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Verify PIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 
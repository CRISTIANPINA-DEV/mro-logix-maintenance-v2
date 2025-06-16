"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, EyeOff, Plane } from "lucide-react";
import { useRouter, redirect } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Package } from "lucide-react";
import { useSession } from "next-auth/react";

type RecordType = 'stock-inventory' | 'flight-records';

export default function ManageDataRecordsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session && session.user.privilege !== 'admin') {
      redirect('/dashboard');
    }
  }, [session]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid password");
      }

      setIsAuthenticated(true);
      setIsPasswordDialogOpen(false);
      
      // If a specific record type was selected, navigate to it
      if (selectedRecordType) {
        router.push(`/dashboard/manage-data-records/${selectedRecordType}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setPassword("");
      setSelectedRecordType(null);
    }
  };

  const handleManageClick = (recordType: RecordType) => {
    setSelectedRecordType(recordType);
    setIsPasswordDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Data Records</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Stock Inventory Bulk Deletion Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-red-500" />
              Stock Inventory Records
            </CardTitle>
            <CardDescription>
              Manage and bulk delete stock inventory records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Delete multiple stock inventory records at once. This action cannot be undone.
            </p>
            <Button 
              variant="destructive"
              onClick={() => handleManageClick('stock-inventory')}
            >
              Manage Stock Inventory Records
            </Button>
          </CardContent>
        </Card>

        {/* Flight Records Bulk Deletion Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-red-500" />
              Flight Records
            </CardTitle>
            <CardDescription>
              Manage and bulk delete flight records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Delete multiple flight records at once. This action cannot be undone.
            </p>
            <Button 
              variant="destructive"
              onClick={() => handleManageClick('flight-records')}
            >
              Manage Flight Records
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Password Protection Dialog */}
      <Dialog 
        open={isPasswordDialogOpen} 
        onOpenChange={(open) => {
          setIsPasswordDialogOpen(open);
          if (!open) {
            setPassword("");
            setSelectedRecordType(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
            <DialogDescription>
              Please enter your account password to access the data management section.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit}>
            <div className="py-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsPasswordDialogOpen(false);
                  setPassword("");
                  setSelectedRecordType(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
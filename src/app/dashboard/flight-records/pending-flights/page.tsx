"use client";

import { useState, useCallback, useEffect } from "react";
import { CompleteTemporalFlightForm } from "../CompleteTemporalFlightForm";
import { TemporalFlightsList } from "../TemporalFlightsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, AlertTriangle, Info } from "lucide-react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface TemporalFlight {
  id: string;
  date: string;
  airline: string;
  station: string;
  flightNumber: string;
  isTemporary: boolean;
  createdAt: string;
}

export default function PendingFlightsPage() {
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [selectedTemporalFlight, setSelectedTemporalFlight] = useState<TemporalFlight | null>(null);
  const [temporalRefreshTrigger, setTemporalRefreshTrigger] = useState(0);
  
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const { data: session } = useSession();
  const router = useRouter();

  // Check permissions and redirect if needed
  useEffect(() => {
    if (!permissionsLoading && permissions && !permissions.canViewFlightRecords) {
      router.push("/dashboard");
    }
  }, [permissions, permissionsLoading, router]);

  const handleCompleteTemporalFlight = useCallback((temporalFlight: TemporalFlight) => {
    setSelectedTemporalFlight(temporalFlight);
    setShowCompleteForm(true);
  }, []);

  const handleCompleteSuccess = useCallback(() => {
    setSelectedTemporalFlight(null);
    setShowCompleteForm(false);
    setTemporalRefreshTrigger(prev => prev + 1);
  }, []);

  const handleCloseCompleteForm = useCallback(() => {
    setShowCompleteForm(false);
    setSelectedTemporalFlight(null);
  }, []);

  const handleTemporalFlightUpdate = useCallback(() => {
    setTemporalRefreshTrigger(prev => prev + 1);
  }, []);

  // Show loading state while checking permissions
  if (permissionsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have permission
  if (permissions && !permissions.canViewFlightRecords) {
    const isAdmin = session?.user?.privilege === "admin";
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              {isAdmin
                ? "You don't have permission to view the Pending Flight Records page. Please contact your administrator."
                : "You need admin privilege to access this page. Please contact your administrator."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-4">
      {/* Header */}
      <Card className="w-full mb-6">
        <header>
          <div className="w-full max-w-full mx-auto px-4">
            <div className="flex flex-col sm:flex-row min-h-16 py-3 sm:py-0 sm:h-16 items-start sm:items-center justify-between w-full gap-3 sm:gap-0">
              <div className="w-full sm:w-auto flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                  asChild
                >
                  <Link href="/dashboard/flight-records">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back to Flight Records</span>
                    <span className="sm:hidden">Back</span>
                  </Link>
                </Button>
                <h1 className="text-xl sm:text-2xl font-bold">
                  <div className="flex items-center gap-2">
                    <Clock size={20} strokeWidth={1.5} className="text-orange-500 sm:size-6" />
                    <span className="bg-orange-100 text-orange-600 px-2 py-1 text-sm sm:px-3 sm:py-1 sm:text-base rounded-[4px] border border-orange-500 shadow-md">
                      Pending Flight Records
                    </span>
                  </div>
                </h1>
              </div>
            </div>
          </div>
        </header>
      </Card>

      {showCompleteForm && selectedTemporalFlight ? (
        <CompleteTemporalFlightForm 
          temporalFlight={selectedTemporalFlight}
          onClose={handleCloseCompleteForm}
          onSuccess={handleCompleteSuccess}
        />
      ) : (
        <>
          {/* Mobile Layout Message */}
          <div className="sm:hidden bg-blue-50 border border-blue-100 rounded-none p-3">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Info className="h-4 w-4" />
              <p>You&apos;re viewing a simplified layout. For all details, switch to desktop view.</p>
            </div>
          </div>

          {/* Temporal Flights List */}
          <TemporalFlightsList 
            onComplete={handleCompleteTemporalFlight}
            refreshTrigger={temporalRefreshTrigger}
            onUpdate={handleTemporalFlightUpdate}
          />
        </>
      )}
    </div>
  );
}
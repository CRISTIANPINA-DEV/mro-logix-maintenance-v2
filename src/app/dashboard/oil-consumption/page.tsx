"use client";

import { useState, useCallback, useEffect } from "react";
import { UpliftOilForm } from "./UpliftOilForm";
import OilConsumptionHeader from './oil-consumption-header';
import { OilConsumptionDashboard } from './oil-consumption-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OilConsumptionPage() {
  const [showUpliftForm, setShowUpliftForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const { data: session } = useSession();
  const router = useRouter();

  // Check permissions and redirect if needed (using flight records permission as placeholder)
  useEffect(() => {
    if (!permissionsLoading && permissions && !permissions.canViewFlightRecords) {
      router.push("/dashboard");
    }
  }, [permissions, permissionsLoading, router]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
    } finally {
      setLoading(false);
    }
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
                ? "You don't have permission to view the Oil Consumption page. Please contact your administrator."
                : "You need admin privilege to access this page. Please contact your administrator."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-4">
      <OilConsumptionHeader 
        showForm={showUpliftForm} 
        onUpliftOilClick={() => setShowUpliftForm(true)}
        selectedStation={selectedStation}
        onStationChange={setSelectedStation}
      />

      {showUpliftForm ? (
        <UpliftOilForm 
          onClose={() => setShowUpliftForm(false)} 
          onSuccess={handleRefresh}
        />
      ) : (
        <OilConsumptionDashboard 
          loading={loading}
          onRefresh={handleRefresh}
          selectedStation={selectedStation}
          onStationChange={setSelectedStation}
        />
      )}
    </div>
  );
}

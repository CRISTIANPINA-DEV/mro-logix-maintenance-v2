"use client";

import { useState, useCallback, useEffect } from "react";
import { AddFlightForm } from "./AddFlightForm";
import { AddTemporalFlightForm } from "./AddTemporalFlightForm";
import { FlightRecordsList } from "./FlightRecordsList";
import { FlightRecordsFilters } from "./flight-records-filters";
import FlightRecordsHeader from './flight-records-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityIcon, AlertTriangle, Info } from "lucide-react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function FlightRecordsPage() {
  const [showForm, setShowForm] = useState(false);
  const [showTemporalForm, setShowTemporalForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stationFilter, setStationFilter] = useState("all_stations");
  const [serviceFilter, setServiceFilter] = useState("all_services");
  const [defectFilter, setDefectFilter] = useState("all_defects");
  const [stationList, setStationList] = useState<string[]>([]);
  const [serviceList, setServiceList] = useState<string[]>([]);
  
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const { data: session } = useSession();
  const router = useRouter();

  // Check permissions and redirect if needed
  useEffect(() => {
    if (!permissionsLoading && permissions && !permissions.canViewFlightRecords) {
      router.push("/dashboard");
    }
  }, [permissions, permissionsLoading, router]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      // Trigger a re-fetch of the data
      // This will be handled by the FlightRecordsList component
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTemporalFlightSuccess = useCallback(() => {
    // Refresh the main flight records list in case any were completed
    handleRefresh();
  }, [handleRefresh]);

  const handleCloseForms = useCallback(() => {
    setShowForm(false);
    setShowTemporalForm(false);
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
                ? "You don't have permission to view the Flight Records page. Please contact your administrator."
                : "You need admin privilege to access this page. Please contact your administrator."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 pt-3 pb-6 space-y-4">
      <FlightRecordsHeader 
        showForm={showForm || showTemporalForm} 
        onAddFlightClick={() => setShowForm(true)} 
        onAddTemporalFlightClick={() => setShowTemporalForm(true)}
      />

      {showForm ? (
        <AddFlightForm onClose={handleCloseForms} />
      ) : showTemporalForm ? (
        <AddTemporalFlightForm 
          onClose={handleCloseForms} 
          onSuccess={handleTemporalFlightSuccess}
        />
      ) : (
        <>
          <FlightRecordsFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            stationFilter={stationFilter}
            onStationFilterChange={setStationFilter}
            serviceFilter={serviceFilter}
            onServiceFilterChange={setServiceFilter}
            defectFilter={defectFilter}
            onDefectFilterChange={setDefectFilter}
            onRefresh={handleRefresh}
            loading={loading}
            stationList={stationList}
            serviceList={serviceList}
          />

          {/* Mobile Layout Message */}
          <div className="sm:hidden bg-blue-50 border border-blue-100 rounded-none p-3">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Info className="h-4 w-4" />
              <p>You&apos;re viewing a simplified layout. For all details, switch to desktop view.</p>
            </div>
          </div>

          <FlightRecordsList
            searchTerm={searchTerm}
            stationFilter={stationFilter}
            serviceFilter={serviceFilter}
            defectFilter={defectFilter}
            onLoadingChange={setLoading}
            onStationListChange={setStationList}
            onServiceListChange={setServiceList}
          />
        </>
      )}
    </div>
  );
}
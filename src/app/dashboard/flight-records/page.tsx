"use client";

import { useState, useCallback } from "react";
import { AddFlightForm } from "./AddFlightForm";
import { FlightRecordsList } from "./FlightRecordsList";
import { FlightRecordsFilters } from "./flight-records-filters";
import FlightRecordsHeader from './flight-records-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityIcon } from "lucide-react";

export default function FlightRecordsPage() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stationFilter, setStationFilter] = useState("all_stations");
  const [serviceFilter, setServiceFilter] = useState("all_services");
  const [defectFilter, setDefectFilter] = useState("all_defects");
  const [stationList, setStationList] = useState<string[]>([]);
  const [serviceList, setServiceList] = useState<string[]>([]);

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <FlightRecordsHeader showForm={showForm} onAddFlightClick={() => setShowForm(true)} />

      {showForm ? (
        <AddFlightForm onClose={() => setShowForm(false)} />
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
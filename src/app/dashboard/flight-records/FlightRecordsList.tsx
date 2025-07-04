"use client";

import { useState, useEffect, useMemo } from "react";
import { PlaneTakeoff, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useIsTabletLandscape } from "@/hooks/use-tablet-landscape";

interface Attachment {
  id: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  fileType: string;
}

interface FlightRecord {
  id: string;
  date: string;
  airline: string;
  flightNumber: string | null;
  fleet: string;
  tail: string;
  station: string;
  service: string;
  hasTime: boolean;
  blockTime: string | null;
  outTime: string | null;
  hasDefect: boolean;
  logPageNo: string | null;
  discrepancyNote: string | null;
  rectificationNote: string | null;
  systemAffected: string | null;
  hasAttachments: boolean;
  technician: string | null;
  username: string | null;
  Attachment: Attachment[];
  createdAt: string;
}

interface FlightRecordsListProps {
  searchTerm: string;
  stationFilter: string;
  serviceFilter: string;
  defectFilter: string;
  onLoadingChange: (loading: boolean) => void;
  onStationListChange: (stations: string[]) => void;
  onServiceListChange: (services: string[]) => void;
}

export function FlightRecordsList({
  searchTerm,
  stationFilter,
  serviceFilter,
  defectFilter,
  onLoadingChange,
  onStationListChange,
  onServiceListChange
}: FlightRecordsListProps) {
  const [records, setRecords] = useState<FlightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const isTabletLandscape = useIsTabletLandscape();

  useEffect(() => {
    const fetchFlightRecords = async () => {
      try {
        setLoading(true);
        onLoadingChange(true);
        const response = await fetch('/api/flight-records');
        const data = await response.json();
        
        if (data.success) {
          setRecords(data.records);
          const uniqueStations = Array.from(new Set(data.records.map((r: FlightRecord) => r.station))).sort() as string[];
          const uniqueServices = Array.from(new Set(data.records.map((r: FlightRecord) => r.service))).sort() as string[];
          onStationListChange(uniqueStations);
          onServiceListChange(uniqueServices);
        }
      } catch (error) {
        console.error('Error fetching flight records:', error);
      } finally {
        setLoading(false);
        onLoadingChange(false);
      }
    };

    fetchFlightRecords();
  }, [onLoadingChange, onStationListChange, onServiceListChange]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Search term filter
      const lowerSearchTerm = searchTerm.toLowerCase();
      const dateFormatted = formatDate(record.date).toLowerCase();
      const matchesSearch = searchTerm === "" || 
        record.airline.toLowerCase().includes(lowerSearchTerm) ||
        record.fleet.toLowerCase().includes(lowerSearchTerm) ||
        (record.tail && record.tail.toLowerCase().includes(lowerSearchTerm)) ||
        record.station.toLowerCase().includes(lowerSearchTerm) ||
        record.service.toLowerCase().includes(lowerSearchTerm) ||
        (record.username && record.username.toLowerCase().includes(lowerSearchTerm)) ||
        (record.flightNumber && record.flightNumber.toLowerCase().includes(lowerSearchTerm)) ||
        dateFormatted.includes(lowerSearchTerm) ||
        record.id.toLowerCase().includes(lowerSearchTerm) ||
        (record.hasDefect && (
          (record.logPageNo && record.logPageNo.toLowerCase().includes(lowerSearchTerm)) ||
          (record.discrepancyNote && record.discrepancyNote.toLowerCase().includes(lowerSearchTerm)) ||
          (record.rectificationNote && record.rectificationNote.toLowerCase().includes(lowerSearchTerm)) ||
          (record.systemAffected && record.systemAffected.toLowerCase().includes(lowerSearchTerm))
        ));

      // Station filter
      const matchesStation = stationFilter === "all_stations" || record.station === stationFilter;

      // Service filter
      const matchesService = serviceFilter === "all_services" || record.service === serviceFilter;

      // Defect filter
      const matchesDefect = 
        defectFilter === "all_defects" || 
        (defectFilter === "with_defects" && record.hasDefect) ||
        (defectFilter === "without_defects" && !record.hasDefect);

      return matchesSearch && matchesStation && matchesService && matchesDefect;
    });
  }, [records, searchTerm, stationFilter, serviceFilter, defectFilter]);

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 space-y-4 overflow-x-auto max-w-full">
          <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (filteredRecords.length === 0 && !loading) {
    return (
      <div className="border rounded-none p-8 bg-card text-center">
        <PlaneTakeoff className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {searchTerm || stationFilter !== "all_stations" || 
           serviceFilter !== "all_services" || defectFilter !== "all_defects" 
            ? "No records match your filters" 
            : "No flight records yet"}
        </h3>
        <p className="text-muted-foreground">
          {searchTerm || stationFilter !== "all_stations" || 
           serviceFilter !== "all_services" || defectFilter !== "all_defects"
            ? "Try adjusting your filters or search terms."
            : "Your flight records will appear here once you add them."}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-none bg-card overflow-hidden">
      {/* Header Row */}
      <div className="py-2 px-3 border-b-[0.5px] sticky top-0 bg-card z-10">
        {isTabletLandscape ? (
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              <div className="grid grid-cols-[120px_100px_250px_120px_100px_100px_100px_100px_100px_120px] gap-x-4 gap-y-1 text-sm font-semibold items-center">
                <div className="min-w-[100px]">Date</div>
                <div className="min-w-[60px]">Station</div>
                <div className="min-w-[150px]">Airline</div>
                <div className="min-w-[80px]">Flight #</div>
                <div className="min-w-[100px]">Fleet</div>
                <div className="min-w-[90px]">Tail</div>
                <div className="min-w-[70px]">Service</div>
                <div className="min-w-[50px]">Defect</div>
                <div className="min-w-[80px]">Log Page No</div>
                <div className="min-w-[90px]">Technician</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-x-4 gap-y-2 text-sm font-semibold items-center">
            <div className="xl:col-span-1 min-w-[100px]">Date</div>
            <div className="xl:col-span-1 min-w-[60px]">Station</div>
            <div className="xl:col-span-1 min-w-[150px]">Airline</div>
            <div className="xl:col-span-1 min-w-[80px]">Flight #</div>
            <div className="xl:col-span-1 min-w-[100px]">Fleet</div>
            <div className="xl:col-span-1 min-w-[90px]">Tail</div>
            <div className="xl:col-span-1 min-w-[70px]">Service</div>
            <div className="xl:col-span-1 min-w-[50px]">Defect</div>
            <div className="xl:col-span-1 min-w-[80px]">Log Page No</div>
            <div className="xl:col-span-1 min-w-[90px]">Technician</div>
          </div>
        )}
      </div>

      {/* Limited View Message for Tablet Landscape */}
      {isTabletLandscape && (
        <div className="py-2 px-4 bg-blue-50 text-blue-700 text-sm text-center border-b">
          <p>You&apos;re viewing a simplified layout optimized for tablets. For all details, tap the Action button or switch to desktop view.</p>
        </div>
      )}

      {/* Data Rows */}
      {filteredRecords.map((record) => (
        <div key={record.id} className="py-2 px-3 border-b-[0.5px] last:border-b-0 even:bg-gray-100 odd:bg-blue-50 hover:bg-accent hover:cursor-pointer transition-colors duration-200">
          {isTabletLandscape ? (
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                <div className="grid grid-cols-[120px_100px_250px_120px_100px_100px_100px_100px_100px_120px] gap-x-4 gap-y-1 text-sm items-center hover:text-accent-foreground">
                  <div className="min-w-[100px] whitespace-nowrap">{formatDate(record.date)}</div>
                  <div className="min-w-[60px]">{record.station}</div>
                  <div className="min-w-[150px] break-words">{record.airline}</div>
                  <div className="min-w-[80px]"><Link href={`/dashboard/flight-records/${record.id}`} className="text-gray-900 decoration-blue-600 hover:decoration-blue-800 underline">{record.flightNumber || '-'}</Link></div>
                  <div className="min-w-[100px]">{record.fleet}</div>
                  <div className="min-w-[90px]"><Link href={`/dashboard/flight-records/${record.id}`} className="text-gray-900 decoration-blue-600 hover:decoration-blue-800 underline">{record.tail || "-"}</Link></div>
                  <div className="min-w-[70px]">{record.service === 'AOG' ? (
                    <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-red-100 text-red-800 leading-tight">
                      {record.service}
                    </span>
                  ) : (
                    record.service
                  )}</div>
                  <div className="min-w-[50px]">{record.hasDefect ? (
                    <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-orange-100 text-yellow-800 leading-tight">
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-green-100 text-green-800 leading-tight">
                      No
                    </span>
                  )}</div>
                  <div className="min-w-[80px]">{record.logPageNo || "-"}</div>
                  <div className="min-w-[90px]">{record.username || "-"}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-x-4 gap-y-1 text-sm items-center hover:text-accent-foreground">
              <div className="xl:col-span-1 min-w-[100px] truncate">{formatDate(record.date)}</div>
              <div className="xl:col-span-1 min-w-[60px] truncate">{record.station}</div>
              <div className="xl:col-span-1 min-w-[150px] truncate" title={record.airline}>{record.airline.length > 12 ? record.airline.substring(0, 12) + '...' : record.airline}</div>
              <div className="xl:col-span-1 min-w-[80px] truncate"><Link href={`/dashboard/flight-records/${record.id}`} className="text-gray-900 decoration-blue-600 hover:decoration-blue-800 underline">{record.flightNumber || '-'}</Link></div>
              <div className="xl:col-span-1 min-w-[100px] truncate">{record.fleet}</div>
              <div className="xl:col-span-1 min-w-[90px] truncate"><Link href={`/dashboard/flight-records/${record.id}`} className="text-gray-900 decoration-blue-600 hover:decoration-blue-800 underline">{record.tail || "-"}</Link></div>
              <div className="xl:col-span-1 min-w-[70px] truncate">{record.service === 'AOG' ? (
                <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-red-100 text-red-800 leading-tight">
                  {record.service}
                </span>
              ) : (
                record.service
              )}</div>
              <div className="xl:col-span-1 min-w-[50px] truncate">{record.hasDefect ? (
                <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-orange-100 text-yellow-800 leading-tight">
                  Yes
                </span>
              ) : (
                <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-green-100 text-green-800 leading-tight">
                  No
                </span>
              )}</div>
              <div className="xl:col-span-1 min-w-[80px] truncate">{record.logPageNo || "-"}</div>
              <div className="xl:col-span-1 min-w-[90px]">{record.username || "-"}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
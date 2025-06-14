"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

interface FleetTypeAnalysis {
  fleetType: string;
  totalDefects: number;
  systems: Array<{
    system: string;
    count: number;
  }>;
}

interface SystemRecord {
  airline: string;
  fleet: string;
  tail: string;
  date: string;
  discrepancyNote: string;
  id: string;
}

interface SystemDetails {
  system: string;
  records: SystemRecord[];
}

export default function FleetTypeAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [fleetData, setFleetData] = useState<FleetTypeAnalysis | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<SystemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSystem, setLoadingSystem] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFleetTypeAnalysis = async () => {
      try {
        const fleetType = decodeURIComponent(params.fleetType as string);
        const response = await fetch("/api/fleet-analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fleetType }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch fleet type analysis");
        }

        setFleetData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (params.fleetType) {
      fetchFleetTypeAnalysis();
    }
  }, [params.fleetType]);

  const handleSystemClick = async (system: string) => {
    if (selectedSystem?.system === system) {
      setSelectedSystem(null);
      return;
    }

    setLoadingSystem(true);
    try {
      const fleetType = decodeURIComponent(params.fleetType as string);
      const response = await fetch("/api/fleet-analytics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fleetType, system }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch system records");
      }

      setSelectedSystem({
        system,
        records: result.data.records
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoadingSystem(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {loading ? (
            <Skeleton className="h-9 w-64" />
          ) : (
            `${fleetData?.fleetType} Analysis`
          )}
        </h1>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ) : fleetData ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Affected Systems</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>System</TableHead>
                      <TableHead className="text-right">Defect Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fleetData.systems.map((system) => (
                      <React.Fragment key={system.system}>
                        <TableRow 
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleSystemClick(system.system)}
                        >
                          <TableCell className="font-medium flex items-center gap-2">
                            {selectedSystem?.system === system.system ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            {system.system}
                          </TableCell>
                          <TableCell className="text-right">
                            {system.count}
                          </TableCell>
                        </TableRow>
                        {selectedSystem?.system === system.system && (
                          <TableRow>
                            <TableCell colSpan={2} className="p-0">
                              {loadingSystem ? (
                                <div className="p-4">
                                  <Skeleton className="h-10 w-full mb-2" />
                                  <Skeleton className="h-10 w-full mb-2" />
                                  <Skeleton className="h-10 w-full" />
                                </div>
                              ) : (
                                <div className="p-4 border-t">
                                  <h3 className="font-semibold mb-4">Affected Aircraft</h3>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Airline</TableHead>
                                        <TableHead>Tail Number</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Discrepancy</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedSystem.records.map((record, index) => (
                                        <TableRow key={`${record.tail}-${index}`}>
                                          <TableCell>{record.airline}</TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <Link 
                                                href={`/dashboard/flight-records/${record.id}`}
                                                className="text-gray-900 decoration-blue-600 hover:decoration-blue-800 underline"
                                              >
                                                {record.tail}
                                              </Link>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 w-6 p-0"
                                                asChild
                                              >
                                                <Link href={`/dashboard/flight-records/${record.id}`}>
                                                  <FileText className="h-4 w-4" />
                                                  <span className="sr-only">View Details</span>
                                                </Link>
                                              </Button>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            {new Date(record.date).toLocaleDateString()}
                                          </TableCell>
                                          <TableCell className="max-w-md truncate">
                                            {record.discrepancyNote}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>
            No analysis data available for this fleet type.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 
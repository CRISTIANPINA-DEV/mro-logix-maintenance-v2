"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FleetAnalytics {
  fleetType: string;
  totalDefects: number;
  affectedSystemsCount: number;
  affectedSystems: Array<{
    system: string;
    count: number;
  }>;
}

export default function FleetAnalyticsPage() {
  const [fleetData, setFleetData] = useState<FleetAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFleetAnalytics = async () => {
      try {
        const response = await fetch("/api/fleet-analytics");
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch fleet analytics");
        }

        setFleetData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFleetAnalytics();
  }, []);

  const handleFleetClick = (fleetType: string) => {
    router.push(`/dashboard/fleet-analytics/${encodeURIComponent(fleetType)}`);
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
      <h1 className="text-3xl font-bold mb-6">Fleet Analytics</h1>
      
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : fleetData.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>
            No fleet analytics data available at the moment.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fleet Type</TableHead>
                <TableHead className="text-right">Affected Systems</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fleetData.map((fleet) => (
                <TableRow 
                  key={fleet.fleetType}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleFleetClick(fleet.fleetType)}
                >
                  <TableCell className="font-medium">
                    {fleet.fleetType}
                  </TableCell>
                  <TableCell className="text-right">
                    {fleet.affectedSystemsCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 
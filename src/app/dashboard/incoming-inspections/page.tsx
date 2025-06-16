"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InspectionChecklistForm } from "./inspection-checklist-form";
import { IncomingInspectionsHeader } from "./incoming-inspections-header";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDateSafely } from "@/lib/utils";
import { Eye } from "lucide-react";

interface Inspection {
  id: string;
  inspectionDate: string;
  inspector: string;
  stockInventoryId: string | null;
  stockInventoryDeleted: boolean;
  partNo: string | null;
  serialNo: string | null;
  description: string | null;
  StockInventory: {
    partNo: string;
    serialNo: string;
    description: string;
  } | null;
  createdAt: string;
}

export default function IncomingInspectionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { permissions, loading } = useUserPermissions();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has permission to view incoming inspections
    if (!loading && permissions && !permissions.canViewIncomingInspections) {
      router.push('/dashboard');
      return;
    }
  }, [permissions, loading, router]);

  useEffect(() => {
    const showForm = searchParams.get('showForm') === 'true';
    if (showForm) {
      setIsFormVisible(true);
      router.replace('/dashboard/incoming-inspections', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const response = await fetch('/api/incoming-inspections');
      const data = await response.json();
      if (data.success) {
        setInspections(data.data);
      }
    } catch (error) {
      console.error('Error fetching inspections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInspection = (inspectionId: string) => {
    router.push(`/dashboard/incoming-inspections/${inspectionId}`);
  };

  // Show loading state while checking permissions
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // Redirect if user doesn't have permission
  if (!permissions?.canViewIncomingInspections) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <IncomingInspectionsHeader onAddNew={() => setIsFormVisible(true)} />
      
      {isFormVisible && (
        <InspectionChecklistForm
          isVisible={isFormVisible}
          onClose={() => {
            setIsFormVisible(false);
            fetchInspections(); // Refresh the list after form submission
          }}
        />
      )}

      <div className="rounded-md border">
        <Table className="[&_td]:py-1.5 [&_th]:py-1.5 text-sm">
          <TableHeader>
            <TableRow className="hover:bg-muted/50 [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wider">
              <TableHead>Inspection Date</TableHead>
              <TableHead>Part Number</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Inspector</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading inspections...
                </TableCell>
              </TableRow>
            ) : inspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No inspections found
                </TableCell>
              </TableRow>
            ) : (
              inspections.map((inspection) => (
                <TableRow key={inspection.id} className="hover:bg-muted/50 [&_td]:text-sm">
                  <TableCell className="whitespace-nowrap font-medium">
                    {formatDateSafely(inspection.inspectionDate, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {inspection.stockInventoryDeleted ? (
                      <span className="text-red-600">
                        {inspection.partNo} (Deleted)
                      </span>
                    ) : inspection.StockInventory ? (
                      inspection.StockInventory.partNo
                    ) : (
                      <span className="text-gray-500">Not available</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {inspection.stockInventoryDeleted ? (
                      <span className="text-red-600">
                        {inspection.serialNo} (Deleted)
                      </span>
                    ) : inspection.StockInventory ? (
                      inspection.StockInventory.serialNo
                    ) : (
                      <span className="text-gray-500">Not available</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate whitespace-nowrap text-muted-foreground">
                    {inspection.stockInventoryDeleted ? (
                      <span className="text-red-600">
                        {inspection.description} (Deleted)
                      </span>
                    ) : inspection.StockInventory ? (
                      inspection.StockInventory.description
                    ) : (
                      <span className="text-gray-500">Not available</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {inspection.inspector}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 cursor-pointer"
                      onClick={() => handleViewInspection(inspection.id)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 
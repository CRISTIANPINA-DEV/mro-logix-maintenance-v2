"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateSafely } from "@/lib/utils";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getFileUrl } from "@/lib/s3";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface InspectionDetail {
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
  productMatch: string;
  productSpecs: string;
  batchNumber: string;
  serialNumber: string;
  productObservations: string | null;
  quantityMatch: string;
  physicalCondition: string;
  expirationDate: string;
  serviceableExpiry: string;
  physicalDefects: string;
  suspectedUnapproved: string;
  quantityObservations: string | null;
  esdSensitive: string;
  inventoryRecorded: string;
  temperatureControl: string;
  handlingObservations: string | null;
  Attachment: {
    id: string;
    fileName: string;
    fileKey: string;
    fileSize: number;
    fileType: string;
  }[];
  createdAt: string;
}

export default function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInspectionDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/incoming-inspections/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setInspection(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch inspection details');
      }
    } catch (error) {
      console.error('Error fetching inspection details:', error);
      setError('Failed to fetch inspection details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInspectionDetail();
  }, [fetchInspectionDetail]);

  const handleDownload = async (fileKey: string, fileName: string) => {
    try {
      const encodedFileKey = encodeURIComponent(fileKey);
      const response = await fetch(`/api/incoming-inspections/attachments/${encodedFileKey}`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/incoming-inspections/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Inspection deleted successfully",
        });
        router.push('/dashboard/incoming-inspections');
      } else {
        throw new Error(data.error || 'Failed to delete inspection');
      }
    } catch (error) {
      console.error('Error deleting inspection:', error);
      toast({
        title: "Error",
        description: "Failed to delete inspection",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading inspection details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center text-red-500">{error}</div>
        <div className="text-center mt-4">
          <Button variant="neutral" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inspections
          </Button>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Inspection not found</div>
      </div>
    );
  }
  const renderRadioValue = (value: string | null) => {
    if (!value) return null;
    return (
      <Badge variant={value === "YES" ? "default" : value === "NO" ? "destructive" : "secondary"}>
        {value}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="neutral"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inspections
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="delete" disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Inspection
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the inspection record
                and all associated attachments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white text-black border border-gray-800 hover:bg-gray-50">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="bg-red-100 text-black border border-red-600 hover:bg-red-200"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>        <CardHeader>
          <CardTitle>Incoming Inspection Details</CardTitle>
          <div className="text-sm text-muted-foreground">
            Inspection Date: {formatDateSafely(inspection.inspectionDate, 'MMMM dd, yyyy')}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">Inspector</p>
                <p className="text-sm">{inspection.inspector}</p>
              </div>              <div>
                <p className="text-sm font-medium">Part Number</p>
                {inspection.stockInventoryDeleted ? (
                  <p className="text-red-600">
                    {inspection.partNo} (Stock Inventory Item Deleted)
                  </p>
                ) : inspection.StockInventory ? (
                  <Link 
                    href={`/dashboard/stock-inventory/${inspection.stockInventoryId}`}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {inspection.StockInventory.partNo}
                  </Link>
                ) : (
                  <p className="text-sm text-gray-500">Not available</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Serial Number</p>
                {inspection.stockInventoryDeleted ? (
                  <p className="text-red-600">
                    {inspection.serialNo} (Stock Inventory Item Deleted)
                  </p>
                ) : inspection.StockInventory ? (
                  <Link 
                    href={`/dashboard/stock-inventory/${inspection.stockInventoryId}`}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {inspection.StockInventory.serialNo}
                  </Link>
                ) : (
                  <p className="text-sm text-gray-500">Not available</p>
                )}
              </div>
              <div className="md:col-span-3">
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm">
                  {inspection.stockInventoryDeleted ? (
                    <span className="text-red-600">
                      {inspection.description} (Stock Inventory Item Deleted)
                    </span>
                  ) : inspection.StockInventory ? (
                    inspection.StockInventory.description
                  ) : (
                    <span className="text-gray-500">Not available</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Product Identification and Documentation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">1. PRODUCT IDENTIFICATION AND DOCUMENTATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Product name and description match the order and packing slip</p>
                {renderRadioValue(inspection.productMatch)}
              </div>
              <div>
                <p className="text-sm font-medium">Product specifications and documentation are provided</p>
                {renderRadioValue(inspection.productSpecs)}
              </div>
              <div>
                <p className="text-sm font-medium">Batch/Part Number is clearly labeled</p>
                {renderRadioValue(inspection.batchNumber)}
              </div>
              <div>
                <p className="text-sm font-medium">Serial Number is clearly labeled</p>
                {renderRadioValue(inspection.serialNumber)}
              </div>
            </div>
            {inspection.productObservations && (
              <div className="mt-4">
                <p className="text-sm font-medium">Observations/Notes</p>
                <p className="text-sm whitespace-pre-wrap">{inspection.productObservations}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Quantity Verification/Part Integrity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">2. QUANTITY VERIFICATION/PART INTEGRITY</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Quantity matches packing slip/purchase order</p>
                {renderRadioValue(inspection.quantityMatch)}
              </div>
              <div>
                <p className="text-sm font-medium">Part is in good physical condition</p>
                {renderRadioValue(inspection.physicalCondition)}
              </div>
              <div>
                <p className="text-sm font-medium">Expiration date check</p>
                {renderRadioValue(inspection.expirationDate)}
              </div>
              <div>
                <p className="text-sm font-medium">Serviceable expiry check</p>
                {renderRadioValue(inspection.serviceableExpiry)}
              </div>
              <div>
                <p className="text-sm font-medium">Free from physical defects</p>
                {renderRadioValue(inspection.physicalDefects)}
              </div>
              <div>
                <p className="text-sm font-medium">Suspected Unapproved Parts (SUP)</p>
                {renderRadioValue(inspection.suspectedUnapproved)}
              </div>
            </div>
            {inspection.quantityObservations && (
              <div className="mt-4">
                <p className="text-sm font-medium">Observations/Notes</p>
                <p className="text-sm whitespace-pre-wrap">{inspection.quantityObservations}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Part Handling and Storage */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">3. PART HANDLING AND STORAGE</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">ESD Sensitive</p>
                {renderRadioValue(inspection.esdSensitive)}
              </div>
              <div>
                <p className="text-sm font-medium">Recorded in inventory</p>
                {renderRadioValue(inspection.inventoryRecorded)}
              </div>
              <div>
                <p className="text-sm font-medium">Temperature controlled storage</p>
                {renderRadioValue(inspection.temperatureControl)}
              </div>
            </div>
            {inspection.handlingObservations && (
              <div className="mt-4">
                <p className="text-sm font-medium">Observations/Notes</p>
                <p className="text-sm whitespace-pre-wrap">{inspection.handlingObservations}</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {inspection.Attachment.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600">ATTACHMENTS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inspection.Attachment.map((file) => (
                    <Card key={file.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium truncate max-w-[200px]">
                              {file.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(file.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(file.fileKey, file.fileName)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
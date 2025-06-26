"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download,
  Calendar,
  Plane,
  Fuel,
  FileText,
  Gauge,
  Zap,
  Droplets,
  Trash2,
  Eye
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface OilServiceAttachment {
  id: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  fileType: string;
}

interface OilServiceRecord {
  id: string;
  date: string;
  airline: string;
  fleet: string;
  tailNumber?: string;
  flightNumber?: string;
  station?: string;
  serviceType: string;
  enginePosition?: string;
  engineModel?: string;
  hydraulicSystem?: string;
  oilAmount: number;
  oilType?: string;
  Attachment: OilServiceAttachment[];
}

// Fetch real oil service records from API
import { useCallback } from "react";

export default function OilConsumptionHistoryPage() {
  const [records, setRecords] = useState<OilServiceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<OilServiceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<OilServiceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OilServiceRecord | null>(null);
  
  const { toast } = useToast();

  // Fetch records from API
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/oil-consumption");
      if (!res.ok) throw new Error("Failed to fetch records");
      const data = await res.json();
      setRecords(data);
      setFilteredRecords(data);
    } catch (e: any) {
      setRecords([]);
      setFilteredRecords([]);
      setError(e.message || "Failed to fetch records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Handle view record
  const handleViewRecord = (record: OilServiceRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteClick = (record: OilServiceRecord) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/oil-consumption/${recordToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete record (${response.status})`);
      }

      // Remove the record from local state
      const updatedRecords = records.filter(record => record.id !== recordToDelete.id);
      setRecords(updatedRecords);
      setFilteredRecords(updatedRecords.filter(record => {
        // Apply current filters
        let filtered = true;
        
        if (searchTerm) {
          filtered = filtered && (
            record.airline.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.fleet.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.tailNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.flightNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.station?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.oilType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.id.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        if (serviceTypeFilter !== "all") {
          filtered = filtered && record.serviceType === serviceTypeFilter;
        }
        
        return filtered;
      }));

      toast({
        title: "Record Deleted",
        description: "Oil service record and associated attachments have been permanently deleted.",
      });

      // Close both dialogs
      setViewDialogOpen(false);
      setSelectedRecord(null);

    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: "Failed to delete record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  // Filter records based on search and filters
  useEffect(() => {
    let filtered = records;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.airline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.fleet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.tailNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.flightNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.station?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.oilType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply service type filter
    if (serviceTypeFilter !== "all") {
      filtered = filtered.filter(record => record.serviceType === serviceTypeFilter);
    }

    setFilteredRecords(filtered);
  }, [searchTerm, serviceTypeFilter, statusFilter, records]);

  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case "Engine":
        return <Gauge className="h-4 w-4 text-orange-500" />;
      case "APU":
        return <Zap className="h-4 w-4 text-purple-500" />;
      case "Hydraulic SYS":
        return <Droplets className="h-4 w-4 text-blue-500" />;
      default:
        return <Fuel className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadAttachment = async (attachment: OilServiceAttachment) => {
    try {
      // Encode the file key to handle special characters
      const encodedFileKey = encodeURIComponent(attachment.fileKey);
      const downloadUrl = `/api/oil-consumption/attachment/${encodedFileKey}`;
      
      // First, check if the file exists by making a HEAD request
      const response = await fetch(downloadUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`File not found (${response.status})`);
      }
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.fileName;
      link.target = '_blank';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download file "${attachment.fileName}". Please try again or contact support if the issue persists.`);
    }
  };

  const handleViewAttachment = async (attachment: OilServiceAttachment) => {
    try {
      // Encode the file key to handle special characters
      const encodedFileKey = encodeURIComponent(attachment.fileKey);
      const viewUrl = `/api/oil-consumption/attachment/${encodedFileKey}`;
      
      // First, check if the file exists by making a HEAD request
      const response = await fetch(viewUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`File not found (${response.status})`);
      }
      
      window.open(viewUrl, '_blank');
    } catch (error) {
      console.error('View error:', error);
      alert(`Failed to open file "${attachment.fileName}". Please try again or contact support if the issue persists.`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/oil-consumption">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-blue-500" />
                  Oil Consumption History
                </CardTitle>
                <CardDescription>
                  View all oil servicing records and maintenance history
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              if (!filteredRecords.length) {
                toast({
                  title: "No Data to Export",
                  description: "There are no records matching your current filters.",
                  variant: "destructive",
                });
                return;
              }

              // Create CSV content
              const headers = [
                'Service ID', 'Date', 'Airline', 'Fleet', 'Tail Number', 'Flight Number',
                'Station', 'Service Type', 'Engine Position', 'Engine Model', 'Hydraulic System',
                'Oil Amount (Qt)', 'Oil Type'
              ];

              const csvContent = [
                headers.join(','),
                ...filteredRecords.map(record => [
                  record.id,
                  new Date(record.date).toLocaleDateString(),
                  `"${record.airline}"`,
                  `"${record.fleet}"`,
                  record.tailNumber || '',
                  record.flightNumber || '',
                  record.station || '',
                  record.serviceType,
                  record.enginePosition || '',
                  record.engineModel || '',
                  record.hydraulicSystem || '',
                  record.oilAmount,
                  `"${record.oilType || ''}"`
                ].join(','))
              ].join('\n');

              // Download file
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `oil-consumption-history-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);

              toast({
                title: "Export Successful",
                description: `Exported ${filteredRecords.length} records to CSV file.`,
              });
            }}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Service Type</label>
              <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Engine">Engine</SelectItem>
                  <SelectItem value="APU">APU</SelectItem>
                  <SelectItem value="Hydraulic SYS">Hydraulic SYS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending Review">Pending Review</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full rounded-none"
                onClick={() => {
                  setSearchTerm("");
                  setServiceTypeFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredRecords.length} of {records.length} records
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Simplified Records Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Service ID</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Airline</th>
                  <th className="text-left p-4 font-medium">Aircraft</th>
                  <th className="text-left p-4 font-medium">Service Type</th>
                  <th className="text-left p-4 font-medium">Oil Amount</th>
                  <th className="text-left p-4 font-medium">Station</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr key={record.id} className={`border-b hover:bg-muted/25 ${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'}`}>
                    <td className="p-4">
                      <div className="font-medium text-blue-600">{record.id}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{new Date(record.date).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium">{record.airline.split(' - ')[0]}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Plane className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <div className="text-sm">{record.fleet}</div>
                          {record.tailNumber && (
                            <div className="text-xs text-muted-foreground">{record.tailNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getServiceTypeIcon(record.serviceType)}
                        <span className="text-sm">{record.serviceType}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Fuel className="h-3 w-3 text-blue-500" />
                        <span className="text-sm font-medium">{record.oilAmount} Qt</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {record.station ? record.station.split(' - ')[0] : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRecord(record)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <div className="text-muted-foreground">Loading oil consumption records...</div>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-12">
              <div className="text-red-500 space-y-2">
                <div className="text-lg font-medium">Error Loading Data</div>
                <div className="text-sm">{error}</div>
                <Button onClick={fetchRecords} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground space-y-2">
                <Fuel className="h-12 w-12 mx-auto opacity-50" />
                <div className="text-lg font-medium">No records found</div>
                <div className="text-sm">
                  {records.length === 0 
                    ? "No oil consumption records have been created yet. Start by adding your first service record."
                    : "Try adjusting your search criteria or filters to find records."
                  }
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredRecords.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Records</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredRecords.reduce((sum, r) => sum + r.oilAmount, 0).toFixed(1)}Qt
              </div>
              <div className="text-sm text-muted-foreground">Total Oil Used</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredRecords.length > 0 ? (filteredRecords.reduce((sum, r) => sum + r.oilAmount, 0) / filteredRecords.length).toFixed(1) : '0'}Qt
              </div>
              <div className="text-sm text-muted-foreground">Avg per Service</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredRecords.filter(r => r.serviceType === "Engine").length}
              </div>
              <div className="text-sm text-muted-foreground">Engine Services</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {filteredRecords.filter(r => r.serviceType === "APU").length}
              </div>
              <div className="text-sm text-muted-foreground">APU Services</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredRecords.filter(r => r.serviceType === "Hydraulic SYS").length}
              </div>
              <div className="text-sm text-muted-foreground">Hydraulic Services</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed View Modal */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl mx-auto rounded-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-blue-500" />
              Oil Service Record Details
            </DialogTitle>
            <DialogDescription>
              Complete information for Service ID: {selectedRecord?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <table className="w-full border border-gray-200">
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3 bg-gray-50 font-medium">Service ID</td>
                        <td className="p-3">{selectedRecord.id}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 bg-gray-50 font-medium">Date</td>
                        <td className="p-3">{new Date(selectedRecord.date).toLocaleDateString()}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 bg-gray-50 font-medium">Airline</td>
                        <td className="p-3">{selectedRecord.airline}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 bg-gray-50 font-medium">Fleet</td>
                        <td className="p-3">{selectedRecord.fleet}</td>
                      </tr>
                      <tr>
                        <td className="p-3 bg-gray-50 font-medium">Tail Number</td>
                        <td className="p-3">{selectedRecord.tailNumber || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <table className="w-full border border-gray-200">
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3 bg-gray-50 font-medium">Flight Number</td>
                        <td className="p-3">{selectedRecord.flightNumber || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 bg-gray-50 font-medium">Station</td>
                        <td className="p-3">{selectedRecord.station || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 bg-gray-50 font-medium">Service Type</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {getServiceTypeIcon(selectedRecord.serviceType)}
                            {selectedRecord.serviceType}
                          </div>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 bg-gray-50 font-medium">Oil Amount</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Fuel className="h-4 w-4 text-blue-500" />
                            {selectedRecord.oilAmount} Quarts
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 bg-gray-50 font-medium">Oil Type</td>
                        <td className="p-3">{selectedRecord.oilType || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Service Details */}
              {(selectedRecord.enginePosition || selectedRecord.engineModel || selectedRecord.hydraulicSystem) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Service Details</h3>
                  <table className="w-full border border-gray-200">
                    <tbody>
                      {selectedRecord.enginePosition && (
                        <tr className="border-b">
                          <td className="p-3 bg-gray-50 font-medium">Engine Position</td>
                          <td className="p-3">{selectedRecord.enginePosition}</td>
                        </tr>
                      )}
                      {selectedRecord.engineModel && (
                        <tr className="border-b">
                          <td className="p-3 bg-gray-50 font-medium">Engine Model</td>
                          <td className="p-3">{selectedRecord.engineModel}</td>
                        </tr>
                      )}
                      {selectedRecord.hydraulicSystem && (
                        <tr>
                          <td className="p-3 bg-gray-50 font-medium">Hydraulic System</td>
                          <td className="p-3">{selectedRecord.hydraulicSystem}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Attachments */}
              {selectedRecord.Attachment.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Attachments ({selectedRecord.Attachment.length})</h3>
                  <table className="w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left font-medium">File Name</th>
                        <th className="p-3 text-left font-medium">Size</th>
                        <th className="p-3 text-left font-medium">Type</th>
                        <th className="p-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.Attachment.map((attachment, index) => (
                        <tr key={attachment.id} className="border-b">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-500" />
                              {attachment.fileName}
                            </div>
                          </td>
                          <td className="p-3">{formatFileSize(attachment.fileSize)}</td>
                          <td className="p-3">{attachment.fileType || 'Unknown'}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewAttachment(attachment)}
                                className="h-8 px-3"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadAttachment(attachment)}
                                className="h-8 px-3"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                  className="rounded-none"
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteClick(selectedRecord)}
                  className="rounded-none"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Record
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Oil Service Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this oil service record? This action will permanently delete:
              <br />
              <br />
              <strong>Record Details:</strong>
              <br />
              • Service ID: {recordToDelete?.id}
              <br />
              • Date: {recordToDelete ? new Date(recordToDelete.date).toLocaleDateString() : ''}
              <br />
              • Airline: {recordToDelete?.airline}
              <br />
              • Service Type: {recordToDelete?.serviceType}
              <br />
              • Attachments: {recordToDelete?.Attachment.length || 0} file(s)
              <br />
              <br />
              <span className="text-red-600 font-semibold">
                This action cannot be undone. All associated attachments will also be permanently deleted.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete Record"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

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
  Attachment: Attachment[];
  createdAt: string;
}

export default function FlightRecordsBulkDeletePage() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session && session.user.privilege !== 'admin') {
      redirect('/dashboard/flight-records');
    }
  }, [session]);

  const [records, setRecords] = useState<FlightRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const { toast } = useToast();

  const fetchRecords = useCallback(async () => {
    try {
      const response = await fetch('/api/flight-records');
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.records);
      } else {
        throw new Error(data.message || 'Failed to fetch records');
      }
    } catch (error) {
      console.error('Error fetching flight records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch flight records",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(new Set(records.map(record => record.id)));
    } else {
      setSelectedRecords(new Set());
    }
  };

  const handleSelectRecord = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRecords(newSelected);
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== "Delete") {
      toast({
        title: "Error",
        description: "Please type 'Delete' to confirm",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/flight-records/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: Array.from(selectedRecords)
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `Successfully deleted ${selectedRecords.size} record(s)`
        });
        setSelectedRecords(new Set());
        setDeleteConfirmation("");
        setIsDeleteDialogOpen(false);
        fetchRecords(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to delete records');
      }
    } catch (error) {
      console.error('Error deleting flight records:', error);
      toast({
        title: "Error",
        description: "Failed to delete records",
        variant: "destructive"
      });
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/manage-data-records">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Flight Records</h1>
        </div>
        <Button
          variant="delete"
          disabled={selectedRecords.size === 0}
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Selected ({selectedRecords.size})
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedRecords.size === records.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Station</TableHead>
              <TableHead>Airline</TableHead>
              <TableHead>Flight #</TableHead>
              <TableHead>Fleet</TableHead>
              <TableHead>Tail</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Block Time</TableHead>
              <TableHead>Out Time</TableHead>
              <TableHead>Defect</TableHead>
              <TableHead>Technician</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRecords.has(record.id)}
                    onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                    aria-label={`Select ${record.flightNumber || record.id}`}
                  />
                </TableCell>
                <TableCell>{formatDate(record.date)}</TableCell>
                <TableCell>{record.station}</TableCell>
                <TableCell>{record.airline}</TableCell>
                <TableCell>{record.flightNumber || '-'}</TableCell>
                <TableCell>{record.fleet}</TableCell>
                <TableCell>{record.tail || '-'}</TableCell>
                <TableCell>
                  {record.service === 'AOG' ? (
                    <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-red-100 text-red-800">
                      {record.service}
                    </span>
                  ) : (
                    record.service
                  )}
                </TableCell>
                <TableCell>{record.hasTime && record.blockTime ? record.blockTime : 'N/A'}</TableCell>
                <TableCell>{record.hasTime && record.outTime ? record.outTime : 'N/A'}</TableCell>
                <TableCell>
                  {record.hasDefect ? (
                    <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-orange-100 text-yellow-800">
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-green-100 text-green-800">
                      No
                    </span>
                  )}
                </TableCell>
                <TableCell>{record.technician || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedRecords.size} record(s)? This action cannot be undone.
              Type &quot;Delete&quot; to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Type 'Delete' to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="neutral" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="delete" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
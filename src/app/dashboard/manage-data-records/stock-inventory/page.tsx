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
import { format } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

interface StockInventory {
  id: string;
  incomingDate: string;
  station: string;
  owner: string;
  description: string;
  partNo: string;
  serialNo: string;
  quantity: string;
  type: string;
  location: string;
}

export default function StockInventoryBulkDeletePage() {
  const [records, setRecords] = useState<StockInventory[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const { toast } = useToast();

  const fetchRecords = useCallback(async () => {
    try {
      const response = await fetch('/api/stock-inventory');
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.records);
      } else {
        throw new Error(data.message || 'Failed to fetch records');
      }
    } catch (error) {
      console.error('Error fetching stock inventory records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stock inventory records",
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
      const response = await fetch('/api/stock-inventory/bulk-delete', {
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
      console.error('Error deleting stock inventory records:', error);
      toast({
        title: "Error",
        description: "Failed to delete records",
        variant: "destructive"
      });
    }
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
          <h1 className="text-3xl font-bold">Stock Inventory Records</h1>
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
              <TableHead>Part No</TableHead>
              <TableHead>Serial No</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Station</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Incoming Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRecords.has(record.id)}
                    onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                    aria-label={`Select ${record.partNo}`}
                  />
                </TableCell>
                <TableCell>{record.partNo}</TableCell>
                <TableCell>{record.serialNo}</TableCell>
                <TableCell>{record.description}</TableCell>
                <TableCell>{record.station}</TableCell>
                <TableCell>{record.owner}</TableCell>
                <TableCell>{record.quantity}</TableCell>
                <TableCell>{record.type}</TableCell>
                <TableCell>{record.location}</TableCell>
                <TableCell>{format(new Date(record.incomingDate), 'MMM d, yyyy')}</TableCell>
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
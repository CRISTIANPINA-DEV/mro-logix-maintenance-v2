"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface StockInventoryReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Define column options and their default states
const COLUMN_OPTIONS = [
  { key: 'incomingDate', label: 'Incoming Date', required: true },
  { key: 'station', label: 'Station', required: false },
  { key: 'owner', label: 'Owner', required: false },
  { key: 'description', label: 'Description', required: true },
  { key: 'partNo', label: 'Part No', required: true },
  { key: 'serialNo', label: 'Serial No', required: true },
  { key: 'quantity', label: 'Quantity', required: false },
  { key: 'type', label: 'Type', required: false },
  { key: 'location', label: 'Location', required: false },
  { key: 'expireDate', label: 'Expire Date', required: true },
  { key: 'inspectionResult', label: 'Inspection Result', required: false },
  { key: 'inspectionFailure', label: 'Inspection Failure', required: false },
  { key: 'comments', label: 'Comments', required: false },
  { key: 'attachments', label: 'Attachments', required: false },
];

export function StockInventoryReportDialog({
  open,
  onOpenChange,
}: StockInventoryReportDialogProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [owner, setOwner] = useState<string>("");
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>(() => {
    // Initialize with all required columns selected by default, others unselected
    const initial: Record<string, boolean> = {};
    COLUMN_OPTIONS.forEach(column => {
      initial[column.key] = column.required;
    });
    return initial;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const ownerOptions = ['Airline-1', 'Airline-2', 'Airline-3', 'Airline-4', 'Airline-5', 'Airline-6', 'Airline-7', 'Airline-8', 'Airline-9', 'Airline-10', 'All'];

  const handleColumnToggle = (columnKey: string, checked: boolean) => {
    setSelectedColumns(prev => ({
      ...prev,
      [columnKey]: checked
    }));
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing dates",
        description: "Please select both start and end dates",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/stock-inventory/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          owner: owner === 'All' ? null : owner,
          selectedColumns,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock-inventory-report-${startDate}-to-${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Report generated successfully"
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Stock Inventory Report</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="owner">Owner</Label>
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger id="owner">
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {ownerOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Column Selection Section */}
          <div className="grid gap-3">
            <Label className="text-base font-semibold">Select Columns to Include</Label>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 border rounded-lg">
              {COLUMN_OPTIONS.map((column) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.key}
                    checked={selectedColumns[column.key]}
                    onCheckedChange={(checked) => handleColumnToggle(column.key, checked as boolean)}
                    disabled={column.required}
                  />
                  <Label 
                    htmlFor={column.key} 
                    className={`text-sm ${column.required ? 'font-medium text-gray-600' : 'text-gray-800'}`}
                  >
                    {column.label}
                    {column.required && <span className="text-xs text-gray-500 ml-1">(Required)</span>}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              * Required columns are always included and cannot be unchecked
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="bg-green-400 hover:bg-green-500 text-gray-800"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Report'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
"use client";

import { useState, useEffect, useCallback, use } from "react";
import { Button } from "@/components/ui/button";
import { FileText, ChevronLeft, Download, AlertCircle, Trash2, FileType as PdfIcon } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlightRecordForm, FlightRecordFormValues } from "../FlightRecordForm";

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
  fleet: string;
  flightNumber: string | null;
  tail: string | null;
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
  defectStatus: string | null;
  riiRequired: boolean;
  inspectedBy: string | null;
  hasAttachments: boolean;
  hasComment: boolean;
  comment: string | null;
  technician: string | null;
  username: string | null;
  Attachment: Attachment[];
  createdAt: string;
  fixingManual?: string;
  manualReference?: string;
  hasPartReplaced: boolean;
  pnOff?: string | null;
  snOff?: string | null;
  pnOn?: string | null;
  snOn?: string | null;
  PartReplacement: Array<{
    id: string;
    pnOff: string | null;
    snOff: string | null;
    pnOn: string | null;
    snOn: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

export default function FlightRecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [record, setRecord] = useState<FlightRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const fetchFlightRecord = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/flight-records/${id}`);
      const data = await response.json();
      if (data.success) {
        console.log('Fetched flight record:', data.record);
        console.log('Comment data:', {
          hasComment: data.record.hasComment,
          comment: data.record.comment
        });
        setRecord(data.record);
      } else {
        setError(data.message || "Failed to load flight record");
      }
    } catch (error) {
      console.error('Error fetching flight record:', error);
      setError("An error occurred while loading the flight record");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFlightRecord();
  }, [fetchFlightRecord]);

  const generatePdf = () => {
    if (!record) return;
    setIsGeneratingPdf(true);

    const doc = new jsPDF();
    
    // Set up fonts and colors
    doc.setFont("helvetica");
    
    // Page margins
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, contentWidth, 25, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition + 25, margin + contentWidth, yPosition + 25);
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Flight Record Report", margin + 5, yPosition + 10);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin + 5, yPosition + 18);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Status: Active", margin + contentWidth - 40, yPosition + 10);
    doc.setFont("helvetica", "normal");
    doc.text(`Last Updated: ${formatDate(record.createdAt)}`, margin + contentWidth - 60, yPosition + 18);
    
    yPosition += 35;

    // General Information Section
    yPosition = addSection(doc, "General Information", yPosition, margin, contentWidth, [0, 100, 200]);
    
    const generalInfo = [
      ["Date", formatDate(record.date)],
      ["Airline", record.airline],
      ["Fleet", record.fleet],
      ["Flight Number", record.flightNumber || "N/A"],
      ["Tail", record.tail || "N/A"],
      ["Station", record.station],
      ["Service", record.service],
      ["Technician", record.technician || "N/A"],
      ["Username", record.username || "N/A"],
      ["Record Created", formatDate(record.createdAt)]
    ];

    yPosition = addInfoTable(doc, generalInfo, yPosition, margin, contentWidth, [0, 100, 200]);

    // Time Information Section
    if (record.hasTime) {
      yPosition = addSection(doc, "Time Information", yPosition, margin, contentWidth, [0, 150, 0]);
      
      const timeInfo = [
        ["Block Time", record.blockTime || "N/A"],
        ["Out Time", record.outTime || "N/A"]
      ];

      yPosition = addInfoTable(doc, timeInfo, yPosition, margin, contentWidth, [0, 150, 0]);
    }

    // Defect Information Section
    if (record.hasDefect) {
      yPosition = addSection(doc, "Defect Information", yPosition, margin, contentWidth, [200, 0, 0]);
      
      const defectInfo = [
        ["Log Page No", record.logPageNo || "N/A"],
        ["System Affected", record.systemAffected || "N/A"],
        ["Status", record.defectStatus || "N/A"],
        ["RII Required", record.riiRequired ? "Yes" : "No"],
        ["Part Replaced", record.hasPartReplaced ? "Yes" : "No"]
      ];

      if (record.riiRequired && record.inspectedBy) {
        defectInfo.push(["Inspected By", record.inspectedBy]);
      }

      if (record.defectStatus) {
        defectInfo.push([
          record.defectStatus === "Fixed" ? "Fixing Manual" : "Deferral Manual",
          record.fixingManual || "N/A"
        ]);
        defectInfo.push([
          record.defectStatus === "Fixed" ? "Fixing Manual Reference" : "Deferral Manual Reference",
          record.manualReference || "N/A"
        ]);
      }

      yPosition = addInfoTable(doc, defectInfo, yPosition, margin, contentWidth, [200, 0, 0]);

      // Part Replacements
      if (record.hasPartReplaced && record.PartReplacement && record.PartReplacement.length > 0) {
        yPosition = addSubSection(doc, "Part Replacements", yPosition, margin, contentWidth, [255, 140, 0]);
        
        for (let i = 0; i < record.PartReplacement.length; i++) {
          const part = record.PartReplacement[i];
          
          if (yPosition > doc.internal.pageSize.height - 80) {
            doc.addPage();
            yPosition = margin;
          }

          // Part replacement box
          doc.setDrawColor(200, 200, 200);
          doc.setFillColor(248, 248, 248);
          doc.rect(margin, yPosition, contentWidth, 40, 'FD');
          
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(`Part Replacement #${i + 1}`, margin + 5, yPosition + 8);
          
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text(`Date: ${new Date(part.createdAt).toLocaleDateString()}`, margin + contentWidth - 50, yPosition + 8);
          
          // Removed Part
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text("Removed Part:", margin + 5, yPosition + 18);
          doc.setFont("helvetica", "normal");
          doc.text(`P/N: ${part.pnOff || "N/A"}`, margin + 5, yPosition + 24);
          doc.text(`S/N: ${part.snOff || "N/A"}`, margin + 5, yPosition + 30);
          
          // Installed Part
          doc.setFont("helvetica", "bold");
          doc.text("Installed Part:", margin + contentWidth/2, yPosition + 18);
          doc.setFont("helvetica", "normal");
          doc.text(`P/N: ${part.pnOn || "N/A"}`, margin + contentWidth/2, yPosition + 24);
          doc.text(`S/N: ${part.snOn || "N/A"}`, margin + contentWidth/2, yPosition + 30);
          
          yPosition += 50;
        }
      }

      // Defect Notes
      yPosition = addSubSection(doc, "Defect Notes", yPosition, margin, contentWidth, [200, 0, 0]);
      
      // Discrepancy
      if (yPosition > doc.internal.pageSize.height - 100) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Discrepancy:", margin + 5, yPosition + 5);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const discrepancyText = doc.splitTextToSize(record.discrepancyNote || "N/A", contentWidth - 10);
      
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 248, 248);
      const discrepancyHeight = Math.max(20, discrepancyText.length * 4);
      doc.rect(margin, yPosition + 8, contentWidth, discrepancyHeight, 'FD');
      
      doc.text(discrepancyText, margin + 5, yPosition + 12);
      yPosition += discrepancyHeight + 15;

      // Rectification
      if (yPosition > doc.internal.pageSize.height - 100) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFont("helvetica", "bold");
      doc.text("Rectification:", margin + 5, yPosition + 5);
      
      doc.setFont("helvetica", "normal");
      const rectificationText = doc.splitTextToSize(record.rectificationNote || "N/A", contentWidth - 10);
      
      const rectificationHeight = Math.max(20, rectificationText.length * 4);
      doc.rect(margin, yPosition + 8, contentWidth, rectificationHeight, 'FD');
      
      doc.text(rectificationText, margin + 5, yPosition + 12);
      yPosition += rectificationHeight + 15;
    }

    // Comments Section
    if (record.hasComment) {
      yPosition = addSection(doc, "Comments", yPosition, margin, contentWidth, [128, 0, 128]);
      
      if (yPosition > doc.internal.pageSize.height - 80) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 248, 248);
      const commentText = doc.splitTextToSize(record.comment || "No comment provided", contentWidth - 10);
      const commentHeight = Math.max(20, commentText.length * 4);
      doc.rect(margin, yPosition, contentWidth, commentHeight, 'FD');
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(commentText, margin + 5, yPosition + 5);
      yPosition += commentHeight + 15;
    }

    // Attachments Section
    if (record.hasAttachments && record.Attachment?.length > 0) {
      yPosition = addSection(doc, "Attachments", yPosition, margin, contentWidth, [75, 0, 130]);
      
      const attachmentData = record.Attachment.map(att => [
        att.fileName,
        att.fileType,
        `${(att.fileSize / 1024).toFixed(1)} KB`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["File Name", "Type", "Size"]],
        body: attachmentData,
        theme: 'grid',
        headStyles: { 
          fillColor: [75, 0, 130], 
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8,
          cellPadding: 3
        },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Footer
    if (yPosition > doc.internal.pageSize.height - 30) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, contentWidth, 20, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, margin + contentWidth, yPosition);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Report generated by MRO Logix System", margin + 5, yPosition + 8);
    doc.text(`Document ID: ${record.id}`, margin + 5, yPosition + 14);
    
    doc.text("Page 1 of 1", margin + contentWidth - 30, yPosition + 8);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin + contentWidth - 50, yPosition + 14);

    doc.save(`FlightRecord_${record.id}.pdf`);
    setIsGeneratingPdf(false);
  };

  // Helper function to add a section header
  const addSection = (doc: jsPDF, title: string, yPosition: number, margin: number, contentWidth: number, color: number[]) => {
    if (yPosition > doc.internal.pageSize.height - 40) {
      doc.addPage();
      yPosition = margin;
    }

    // Section background
    doc.setFillColor(248, 248, 248);
    doc.rect(margin, yPosition, contentWidth, 20, 'F');
    
    // Section border
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition + 20, margin + contentWidth, yPosition + 20);
    
    // Color indicator
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin + 2, yPosition + 5, 3, 10, 'F');
    
    // Section title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin + 10, yPosition + 12);
    
    return yPosition + 25;
  };

  // Helper function to add a subsection header
  const addSubSection = (doc: jsPDF, title: string, yPosition: number, margin: number, contentWidth: number, color: number[]) => {
    if (yPosition > doc.internal.pageSize.height - 30) {
      doc.addPage();
      yPosition = margin;
    }

    // Subsection title with color indicator
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin + 2, yPosition + 2, 3, 8, 'F');
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin + 10, yPosition + 8);
    
    return yPosition + 15;
  };

  // Helper function to add information table
  const addInfoTable = (doc: jsPDF, data: string[][], yPosition: number, margin: number, contentWidth: number, color: number[]) => {
    if (yPosition > doc.internal.pageSize.height - 60) {
      doc.addPage();
      yPosition = margin;
    }

    const rowHeight = 8;
    const rowsPerPage = Math.floor((doc.internal.pageSize.height - yPosition - 40) / rowHeight);
    const totalRows = data.length;
    let currentRow = 0;

    while (currentRow < totalRows) {
      const pageData = data.slice(currentRow, currentRow + rowsPerPage);
      
      pageData.forEach((row, index) => {
        const currentY = yPosition + (index * rowHeight);
        
        // Left border accent
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(margin, currentY, 2, rowHeight, 'F');
        
        // Field label
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(row[0].toUpperCase(), margin + 8, currentY + 5);
        
        // Field value
        doc.setFont("helvetica", "normal");
        doc.text(row[1], margin + 60, currentY + 5);
      });

      currentRow += rowsPerPage;
      
      if (currentRow < totalRows) {
        doc.addPage();
        yPosition = margin;
      }
    }

    return yPosition + (totalRows * rowHeight) + 10;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFlightRecord();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const fileKeyEncoded = encodeURIComponent(attachment.fileKey);
      const response = await fetch(`/api/flight-records/attachments/${fileKeyEncoded}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to download file");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      alert("Failed to download attachment: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
    setDeleteConfirmation("");
    setDeleteError(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeleteConfirmation("");
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation !== "Delete") {
      setDeleteError("Please type 'Delete' to confirm");
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/flight-records/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setShowDeleteDialog(false);
        // Navigate back to flight records list and ensure a complete page refresh
        window.location.href = '/dashboard/flight-records';
      } else {
        setDeleteError(result.message || "Failed to delete the flight record");
      }
    } catch (error) {
      console.error("Error deleting flight record:", error);
      setDeleteError("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error || "Flight record not found."}</p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/flight-records">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Flight Records
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isEditMode && record) {
    // Prepare initial values for the form
    const initialValues: FlightRecordFormValues = {
      ...record,
      date: record.date ? record.date.split("T")[0] : "",
      hasTime: !!record.hasTime,
      hasDefect: !!record.hasDefect,
      hasAttachments: !!record.hasAttachments,
      hasComment: !!record.hasComment,
      hasPartReplaced: !!record.hasPartReplaced,
      flightNumber: record.flightNumber || "",
      tail: record.tail || "",
      logPageNo: record.logPageNo || "",
      discrepancyNote: record.discrepancyNote || "",
      rectificationNote: record.rectificationNote || "",
      systemAffected: record.systemAffected || "",
      defectStatus: record.defectStatus || "",
      inspectedBy: record.inspectedBy || "",
      fixingManual: record.fixingManual || "",
      manualReference: record.manualReference || "",
      comment: record.comment || "",
      username: record.username || "",
      technician: record.technician || "",
      PartReplacement: (record.PartReplacement || []).map(part => ({
        ...part,
        pnOff: part.pnOff || "",
        snOff: part.snOff || "",
        pnOn: part.pnOn || "",
        snOn: part.snOn || "",
      })),
      Attachment: record.Attachment || [],
      blockTime: record.blockTime || "",
      outTime: record.outTime || "",
    };
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
        <FlightRecordForm
          initialValues={initialValues}
          mode="edit"
          onSubmit={async (
            values: FlightRecordFormValues,
            files: File[],
            deletedAttachmentIds: string[]
          ) => {
            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
              if (key === "PartReplacement") {
                formData.append("partReplacements", JSON.stringify(value));
              } else if (key === "Attachment") {
                // skip, handled separately
              } else {
                formData.append(key, value as any);
              }
            });
            files.forEach((file: File) => formData.append("files", file));
            formData.append("deletedAttachmentIds", JSON.stringify(deletedAttachmentIds));
            try {
              const res = await fetch(`/api/flight-records/${record.id}`, {
                method: "PUT",
                body: formData,
              });
              const data = await res.json();
              if (data.success) {
                setIsEditMode(false);
                fetchFlightRecord();
              } else {
                alert(data.message || "Failed to update record");
              }
            } catch (e) {
              alert("Error updating record");
            }
          }}
          onCancel={() => setIsEditMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b-2 border-gray-300 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flight Record Report</h1>
          <p className="text-sm text-gray-600 mt-1">Record ID: {record.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(true)}
            disabled={isEditMode || loading}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generatePdf}
            disabled={isGeneratingPdf || loading}
          >
            <PdfIcon className="h-4 w-4 mr-2" />
            {isGeneratingPdf ? "Generating..." : "Export PDF"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteClick}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/flight-records">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="bg-white border-2 border-gray-300 shadow-sm">
        {/* Report Header */}
        <div className="bg-gray-100 border-b-2 border-gray-300 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Flight Record Information</h2>
              <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Status: Active</p>
              <p className="text-xs text-gray-600">Last Updated: {formatDate(record.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* General Information Section */}
          <section className="border-2 border-gray-200">
            <div className="bg-gray-50 border-b-2 border-gray-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-blue-600 mr-3"></span>
                General Information
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border-l-2 border-blue-500 pl-4">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{formatDate(record.date)}</dd>
                </div>
                <div className="border-l-2 border-blue-500 pl-4">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Airline</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{record.airline}</dd>
                </div>
                <div className="border-l-2 border-blue-500 pl-4">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Fleet</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{record.fleet}</dd>
                </div>
                <div className="border-l-2 border-blue-500 pl-4">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Flight Number</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{record.flightNumber || "N/A"}</dd>
                </div>
                <div className="border-l-2 border-blue-500 pl-4">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Tail</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{record.tail || "N/A"}</dd>
                </div>
                <div className="border-l-2 border-blue-500 pl-4">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Station</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{record.station}</dd>
                </div>
                <div className="border-l-2 border-blue-500 pl-4">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Service</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{record.service}</dd>
                </div>
                <div className="border-l-2 border-blue-500 pl-4">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Technician</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{record.technician || "N/A"}</dd>
                </div>
                <div className="border-l-2 border-blue-500 pl-4">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Username</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{record.username || "N/A"}</dd>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-gray-200">
                <div className="border-l-2 border-green-500 pl-4">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Record Created</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{formatDate(record.createdAt)}</dd>
                </div>
              </div>
            </div>
          </section>

          {/* Time Information Section */}
          {record.hasTime && (
            <section className="border-2 border-gray-200">
              <div className="bg-gray-50 border-b-2 border-gray-200 px-4 py-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="w-2 h-2 bg-green-600 mr-3"></span>
                  Time Information
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="border-l-2 border-green-500 pl-4">
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Block Time</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{record.blockTime || "N/A"}</dd>
                  </div>
                  <div className="border-l-2 border-green-500 pl-4">
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Out Time</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{record.outTime || "N/A"}</dd>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Defect Information Section */}
          {record.hasDefect && (
            <section className="border-2 border-gray-200">
              <div className="bg-gray-50 border-b-2 border-gray-200 px-4 py-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="w-2 h-2 bg-red-600 mr-3"></span>
                  Defect Information
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div className="border-l-2 border-red-500 pl-4">
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Log Page No</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{record.logPageNo || "N/A"}</dd>
                  </div>
                  <div className="border-l-2 border-red-500 pl-4">
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">System Affected</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{record.systemAffected || "N/A"}</dd>
                  </div>
                  <div className="border-l-2 border-red-500 pl-4">
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{record.defectStatus || "N/A"}</dd>
                  </div>
                  <div className="border-l-2 border-red-500 pl-4">
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">RII Required</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{record.riiRequired ? "Yes" : "No"}</dd>
                  </div>
                  <div className="border-l-2 border-red-500 pl-4">
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Part Replaced</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{record.hasPartReplaced ? "Yes" : "No"}</dd>
                  </div>
                  {record.riiRequired && record.inspectedBy && (
                    <div className="border-l-2 border-red-500 pl-4">
                      <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Inspected By</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">{record.inspectedBy}</dd>
                    </div>
                  )}
                  {record.defectStatus && (
                    <>
                      <div className="border-l-2 border-red-500 pl-4">
                        <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          {record.defectStatus === "Fixed" ? "Fixing Manual" : "Deferral Manual"}
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 font-medium">{record.fixingManual || "N/A"}</dd>
                      </div>
                      <div className="border-l-2 border-red-500 pl-4">
                        <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          {record.defectStatus === "Fixed" ? "Fixing Manual Reference" : "Deferral Manual Reference"}
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 font-medium">{record.manualReference || "N/A"}</dd>
                      </div>
                    </>
                  )}
                </div>

                {/* Part Replacements */}
                {record.hasPartReplaced && record.PartReplacement && record.PartReplacement.length > 0 && (
                  <div className="mb-6 border-t-2 border-gray-200 pt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-orange-600 mr-3"></span>
                      Part Replacements
                    </h4>
                    <div className="space-y-4">
                      {record.PartReplacement.map((part, index) => (
                        <div key={part.id} className="border-2 border-gray-200 p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-medium text-gray-900">Part Replacement #{index + 1}</h5>
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 border">
                              {new Date(part.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="border-l-2 border-orange-500 pl-3">
                              <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Removed Part</dt>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <dt className="text-xs text-gray-500 uppercase">P/N</dt>
                                  <dd className="text-sm text-gray-900 font-medium">{part.pnOff || "N/A"}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-gray-500 uppercase">S/N</dt>
                                  <dd className="text-sm text-gray-900 font-medium">{part.snOff || "N/A"}</dd>
                                </div>
                              </div>
                            </div>
                            <div className="border-l-2 border-orange-500 pl-3">
                              <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Installed Part</dt>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <dt className="text-xs text-gray-500 uppercase">P/N</dt>
                                  <dd className="text-sm text-gray-900 font-medium">{part.pnOn || "N/A"}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-gray-500 uppercase">S/N</dt>
                                  <dd className="text-sm text-gray-900 font-medium">{part.snOn || "N/A"}</dd>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Defect Notes */}
                <div className="border-t-2 border-gray-200 pt-6 space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Discrepancy</dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-wrap border-2 border-gray-200 p-4 bg-gray-50">
                      {record.discrepancyNote || "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Rectification</dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-wrap border-2 border-gray-200 p-4 bg-gray-50">
                      {record.rectificationNote || "N/A"}
                    </dd>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Comments Section */}
          {record.hasComment && (
            <section className="border-2 border-gray-200">
              <div className="bg-gray-50 border-b-2 border-gray-200 px-4 py-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="w-2 h-2 bg-purple-600 mr-3"></span>
                  Comments
                </h3>
              </div>
              <div className="p-4">
                <div className="border-2 border-gray-200 p-4 bg-gray-50">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {record.comment || "No comment provided"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Attachments Section */}
          {record.hasAttachments && record.Attachment?.length > 0 && (
            <section className="border-2 border-gray-200">
              <div className="bg-gray-50 border-b-2 border-gray-200 px-4 py-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="w-2 h-2 bg-indigo-600 mr-3"></span>
                  Attachments
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {record.Attachment.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between border-2 border-gray-200 p-3 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {attachment.fileType} • {(attachment.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAttachment(attachment)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Report Footer */}
        <div className="bg-gray-100 border-t-2 border-gray-300 px-6 py-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              <p>Report generated by MRO Logix System</p>
              <p>Document ID: {record.id}</p>
            </div>
            <div className="text-right">
              <p>Page 1 of 1</p>
              <p>Generated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the flight record
              {record?.hasAttachments && ' and all attached files'}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="confirmation" className="text-red-600 font-semibold">
              Type &quot;Delete&quot; to confirm:
            </Label>
            <Input
              id="confirmation"
              className="mt-2"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Delete"
            />
            {deleteError && (
              <p className="text-sm text-red-600 mt-2">{deleteError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={isDeleting || deleteConfirmation !== "Delete"}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
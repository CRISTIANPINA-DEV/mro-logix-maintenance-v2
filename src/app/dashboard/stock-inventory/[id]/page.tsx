"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download, Trash2, ArrowLeft, MoreHorizontal, Package, Calendar, User, MapPin, Hash, FileText, Clock, CheckCircle, XCircle, MessageSquare, Paperclip, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StockInventory {
  id: string;
  incomingDate: string;
  station: string;
  owner: string;
  description: string;
  partNo: string;
  serialNo: string;
  quantity: string;
  hasExpireDate: boolean;
  expireDate: string | null;
  type: string;
  location: string;
  hasInspection: boolean;
  inspectionResult: string | null;
  inspectionFailure: string | null;
  customFailure: string | null;
  hasComment: boolean;
  comment: string | null;
  hasAttachments: boolean;
  technician: string | null;
  Attachment: Array<{
    id: string;
    fileName: string;
    fileKey: string;
    fileSize: number;
    fileType: string;
  }>;
}

export default function StockInventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");
  const [record, setRecord] = useState<StockInventory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();

  // Get the id from params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    getParams();
  }, [params]);
  
  const fetchRecord = useCallback(async () => {
    if (!id) return; // Don't fetch if id is not available yet
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/stock-inventory/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setRecord(data.record);
      } else {
        throw new Error(data.message || 'Failed to fetch record');
      }
    } catch (error) {
      console.error('Error fetching stock inventory record:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stock inventory record",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const handleDownload = async (fileKey: string, fileName: string) => {
    try {
      const response = await fetch(`/api/stock-inventory/attachments/${encodeURIComponent(fileKey)}`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleGeneratePDF = async () => {
    if (!record) {
      toast({
        title: "Error",
        description: "Record data not available",
        variant: "destructive"
      });
      return;
    }

    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      const footerHeight = 30;
      const maxContentHeight = pageHeight - footerHeight - 10;
      let yPosition = 30;

      // Helper function to check if we need a new page
      const checkPageBreak = (requiredSpace: number = 20) => {
        if (yPosition + requiredSpace > maxContentHeight) {
          doc.addPage();
          yPosition = 30;
          return true;
        }
        return false;
      };

      // Helper function to add text with word wrapping and page break handling
      const addText = (text: string, x: number, y: number, options: any = {}) => {
        const fontSize = options.fontSize || 12;
        doc.setFontSize(fontSize);
        doc.setFont(options.font || 'helvetica', options.style || 'normal');
        
        const lines = doc.splitTextToSize(text, options.maxWidth || maxWidth);
        const textHeight = lines.length * fontSize * 0.4;
        
        // Check if we need a new page for this text
        if (y + textHeight + (options.marginBottom || 5) > maxContentHeight) {
          doc.addPage();
          y = 30;
        }
        
        doc.text(lines, x, y);
        return y + textHeight + (options.marginBottom || 5);
      };

      // Helper function to add section header with page break check
      const addSectionHeader = (title: string, currentY: number) => {
        checkPageBreak(25); // Ensure space for header + some content
        
        doc.setFillColor(240, 240, 240);
        doc.rect(margin - 5, yPosition - 5, maxWidth + 10, 8, 'F');
        yPosition = addText(title, margin, yPosition, { 
          fontSize: 14, 
          style: 'bold',
          marginBottom: 8
        });
        return yPosition;
      };

      // Add footer to each page
      const addFooter = () => {
        const footerY = pageHeight - 20;
        doc.setFillColor(240, 240, 240);
        doc.rect(0, footerY - 10, pageWidth, 30, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text(`Document ID: ${record.id}`, margin, footerY);
        doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy • h:mm a')}`, pageWidth - margin - 80, footerY);
        doc.setTextColor(0, 0, 0); // Reset to black
      };

      // Header
      doc.setFillColor(59, 130, 246); // Blue background
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setTextColor(255, 255, 255); // White text
      yPosition = addText('STOCK INVENTORY REPORT', margin, 25, { 
        fontSize: 20, 
        font: 'helvetica', 
        style: 'bold',
        marginBottom: 10 
      });
      
      doc.setTextColor(200, 200, 200); // Light gray text
      yPosition = addText(`Generated on ${format(new Date(), 'MMM d, yyyy • h:mm a')}`, margin, yPosition - 5, { 
        fontSize: 10,
        marginBottom: 15
      });

      yPosition = 70; // Reset position after header
      doc.setTextColor(0, 0, 0); // Black text for content

      // Part Identification Section
      yPosition = addSectionHeader('PART IDENTIFICATION', yPosition);
      yPosition = addText(`Part Number: ${record.partNo}`, margin + 10, yPosition, { 
        fontSize: 11, 
        style: 'bold',
        marginBottom: 3
      });
      yPosition = addText(`Serial Number: ${record.serialNo}`, margin + 10, yPosition, { 
        fontSize: 11, 
        style: 'bold',
        marginBottom: 3
      });
      yPosition = addText(`Quantity: ${record.quantity}`, margin + 10, yPosition, { 
        fontSize: 11, 
        style: 'bold',
        marginBottom: 3
      });
      yPosition = addText(`Type: ${record.type}`, margin + 10, yPosition, { 
        fontSize: 11, 
        style: 'bold',
        marginBottom: 10
      });

      // Description Section
      yPosition = addSectionHeader('DESCRIPTION', yPosition);
      yPosition = addText(record.description, margin + 10, yPosition, { 
        fontSize: 10,
        maxWidth: maxWidth - 20,
        marginBottom: 10
      });

      // Location & Ownership Section
      yPosition = addSectionHeader('LOCATION & OWNERSHIP', yPosition);
      yPosition = addText(`Station: ${record.station}`, margin + 10, yPosition, { 
        fontSize: 11,
        marginBottom: 3
      });
      yPosition = addText(`Owner: ${record.owner}`, margin + 10, yPosition, { 
        fontSize: 11,
        marginBottom: 3
      });
      yPosition = addText(`Location: ${record.location}`, margin + 10, yPosition, { 
        fontSize: 11,
        marginBottom: 3
      });
      if (record.technician) {
        yPosition = addText(`Assigned Technician: ${record.technician}`, margin + 10, yPosition, { 
          fontSize: 11,
          marginBottom: 10
        });
      } else {
        yPosition += 7;
      }

      // Dates & Timeline Section
      yPosition = addSectionHeader('DATES & TIMELINE', yPosition);
      yPosition = addText(`Incoming Date: ${format(new Date(record.incomingDate), 'MMM d, yyyy (EEEE)')}`, margin + 10, yPosition, { 
        fontSize: 11,
        marginBottom: 3
      });
      
      if (record.hasExpireDate && record.expireDate) {
        const today = new Date();
        const expiryDate = new Date(record.expireDate);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const status = diffDays <= 0 ? 'EXPIRED' : diffDays <= 30 ? 'EXPIRING SOON' : 'CURRENT';
        
        yPosition = addText(`Expiry Date: ${format(expiryDate, 'MMM d, yyyy')} (${status})`, margin + 10, yPosition, { 
          fontSize: 11,
          marginBottom: 10
        });
      } else {
        yPosition += 7;
      }

      // Inspection Status Section
      if (record.hasInspection) {
        yPosition = addSectionHeader('INSPECTION STATUS', yPosition);
        yPosition = addText(`Result: ${record.inspectionResult}`, margin + 10, yPosition, { 
          fontSize: 11,
          style: 'bold',
          marginBottom: 3
        });
        
        if (record.inspectionResult === "Failed") {
          const failureReason = record.inspectionFailure === "Other" ? record.customFailure : record.inspectionFailure;
          yPosition = addText(`Failure Reason: ${failureReason}`, margin + 10, yPosition, { 
            fontSize: 11,
            maxWidth: maxWidth - 20,
            marginBottom: 10
          });
        } else {
          yPosition += 7;
        }
      }

      // Comments Section
      if (record.hasComment && record.comment) {
        yPosition = addSectionHeader('ADDITIONAL COMMENTS', yPosition);
        yPosition = addText(record.comment, margin + 10, yPosition, { 
          fontSize: 10,
          maxWidth: maxWidth - 20,
          marginBottom: 10
        });
      }

      // Attachments Section
      if (record.hasAttachments && record.Attachment.length > 0) {
        yPosition = addSectionHeader('ATTACHMENTS', yPosition);
        
        record.Attachment.forEach((attachment) => {
          checkPageBreak(15); // Check space before each attachment
          yPosition = addText(`• ${attachment.fileName} (${(attachment.fileSize / 1024).toFixed(1)} KB)`, margin + 10, yPosition, { 
            fontSize: 10,
            marginBottom: 2
          });
        });
        yPosition += 5;
      }

      // Add footer to all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter();
      }

      // Save the PDF
      const fileName = `Stock_Inventory_${record.partNo}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);

      toast({
        title: "Success",
        description: "PDF report generated successfully"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (deleteText !== "Delete") {
      toast({
        title: "Invalid confirmation",
        description: "Please type 'Delete' to confirm",
        variant: "destructive"
      });
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/stock-inventory/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Record deleted successfully"
        });
        // Navigate back to inventory list
        router.push('/dashboard/stock-inventory');
      } else {
        throw new Error(data.message || 'Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting stock inventory record:', error);
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard/stock-inventory')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {!isMobile && "Back to Inventory"}
            </Button>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Record Not Found</h2>
            <p className="text-muted-foreground">The inventory item you're looking for could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (expireDate: string | null) => {
    if (!expireDate) return 'bg-gray-100 text-gray-800';
    
    const today = new Date();
    const expiryDate = new Date(expireDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'bg-red-100 text-red-800';
    if (diffDays <= 30) return 'bg-yellow-100 text-yellow-800';
    if (diffDays <= 90) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getDaysRemaining = (expireDate: string | null) => {
    if (!expireDate) return 'N/A';
    
    const today = new Date();
    const expiryDate = new Date(expireDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expired';
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard/stock-inventory')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
              {!isMobile && <span className="ml-2">Back to Inventory</span>}
            </Button>
          </div>
          
                     {isMobile ? (
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="outline" size="sm">
                   <MoreHorizontal className="h-4 w-4" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuItem 
                   onClick={handleGeneratePDF}
                   className="flex items-center gap-2"
                 >
                   <FileDown className="h-4 w-4" />
                   Generate PDF
                 </DropdownMenuItem>
                 <DropdownMenuItem 
                   onClick={() => setShowDeleteConfirm(true)}
                   className="flex items-center gap-2 text-red-600"
                 >
                   <Trash2 className="h-4 w-4" />
                   Delete Record
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           ) : (
             <div className="flex items-center space-x-2">
               <Button
                 variant="export"
                 onClick={handleGeneratePDF}
               >
                 <FileDown className="h-4 w-4 mr-2" />
                 Generate PDF
               </Button>
               <Button
                 variant="delete"
                 onClick={() => setShowDeleteConfirm(true)}
               >
                 <Trash2 className="h-4 w-4 mr-2" />
                 Delete Record
               </Button>
             </div>
           )}
        </div>

        {/* Document Title */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="px-8 py-6">
              <div className="flex items-center space-x-3 mb-2">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Stock Inventory Report</h1>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-3">
                <Calendar className="h-4 w-4 mr-2" />
                Generated on {format(new Date(), 'MMM d, yyyy • h:mm a')}
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="p-8 space-y-8">
            {/* Part Identification Section */}
            <section>
              <div className="border-l-4 border-blue-500 pl-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Hash className="h-5 w-5 mr-2 text-blue-600" />
                  Part Identification
                </h2>
                <p className="text-sm text-gray-600 mt-1">Primary identification details for the inventory item</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Part Number</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-gray-900">{record.partNo}</div>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Serial Number</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-gray-900">{record.serialNo}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Quantity</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{record.quantity}</div>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Type</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{record.type}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Description Section */}
            <section>
              <div className="border-l-4 border-green-500 pl-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Description
                </h2>
                <p className="text-sm text-gray-600 mt-1">Detailed description of the inventory item</p>
              </div>
              
              <div className="border rounded-lg p-6 bg-white shadow-sm">
                <div className="text-base leading-relaxed text-gray-900 whitespace-pre-wrap">
                  {record.description}
                </div>
              </div>
            </section>

            {/* Location & Ownership Section */}
            <section>
              <div className="border-l-4 border-orange-500 pl-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-orange-600" />
                  Location & Ownership
                </h2>
                <p className="text-sm text-gray-600 mt-1">Location details and responsible parties</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-orange-50">
                  <div className="flex items-center mb-2">
                    <MapPin className="h-4 w-4 text-orange-600 mr-2" />
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Station</span>
                  </div>
                  <div className="text-base font-bold text-gray-900">{record.station}</div>
                </div>
                
                <div className="border rounded-lg p-4 bg-orange-50">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 text-orange-600 mr-2" />
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Owner</span>
                  </div>
                  <div className="text-base font-bold text-gray-900">{record.owner}</div>
                </div>
                
                <div className="border rounded-lg p-4 bg-orange-50">
                  <div className="flex items-center mb-2">
                    <MapPin className="h-4 w-4 text-orange-600 mr-2" />
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Location</span>
                  </div>
                  <div className="text-base font-bold text-gray-900">{record.location}</div>
                </div>
              </div>
              
              {record.technician && (
                <div className="mt-4">
                  <div className="border rounded-lg p-4 bg-orange-50">
                    <div className="flex items-center mb-2">
                      <User className="h-4 w-4 text-orange-600 mr-2" />
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Assigned Technician</span>
                    </div>
                    <div className="text-base font-bold text-gray-900">{record.technician}</div>
                  </div>
                </div>
              )}
            </section>

            {/* Dates & Timeline Section */}
            <section>
              <div className="border-l-4 border-indigo-500 pl-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-indigo-600" />
                  Dates & Timeline
                </h2>
                <p className="text-sm text-gray-600 mt-1">Important dates and timeline information</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6 bg-indigo-50">
                  <div className="flex items-center mb-3">
                    <Calendar className="h-5 w-5 text-indigo-600 mr-2" />
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Incoming Date</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {format(new Date(record.incomingDate), 'MMM d, yyyy')}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    {format(new Date(record.incomingDate), 'EEEE')}
                  </div>
                </div>
                
                {record.hasExpireDate && record.expireDate && (
                  <div className={`border rounded-lg p-6 ${getStatusColor(record.expireDate).includes('red') ? 'bg-red-50 border-red-200' : 
                    getStatusColor(record.expireDate).includes('yellow') ? 'bg-yellow-50 border-yellow-200' : 
                    getStatusColor(record.expireDate).includes('orange') ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center mb-3">
                      <Clock className={`h-5 w-5 mr-2 ${getStatusColor(record.expireDate).includes('red') ? 'text-red-600' : 
                        getStatusColor(record.expireDate).includes('yellow') ? 'text-yellow-600' : 
                        getStatusColor(record.expireDate).includes('orange') ? 'text-orange-600' : 'text-green-600'}`} />
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Expiry Date</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {format(new Date(record.expireDate), 'MMM d, yyyy')}
                    </div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-3 ${getStatusColor(record.expireDate)}`}>
                      {getDaysRemaining(record.expireDate)} remaining
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Inspection Status Section */}
            {record.hasInspection && (
              <section>
                <div className="border-l-4 border-red-500 pl-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    {record.inspectionResult === "Failed" ? (
                      <XCircle className="h-5 w-5 mr-2 text-red-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    )}
                    Inspection Status
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Quality inspection results and findings</p>
                </div>
                
                <div className="border rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-base font-bold ${
                      record.inspectionResult === "Failed" 
                        ? "bg-red-100 text-red-800 border border-red-200" 
                        : "bg-green-100 text-green-800 border border-green-200"
                    }`}>
                      {record.inspectionResult === "Failed" ? (
                        <XCircle className="h-5 w-5 mr-2" />
                      ) : (
                        <CheckCircle className="h-5 w-5 mr-2" />
                      )}
                      {record.inspectionResult}
                    </span>
                  </div>
                  
                  {record.inspectionResult === "Failed" && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm font-semibold text-red-800 mb-2">Failure Reason:</div>
                      <div className="text-base text-red-700">
                        {record.inspectionFailure === "Other" ? record.customFailure : record.inspectionFailure}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Comments Section */}
            {record.hasComment && record.comment && (
              <section>
                <div className="border-l-4 border-cyan-500 pl-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-cyan-600" />
                    Additional Comments
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Additional notes and observations</p>
                </div>
                
                <div className="border rounded-lg p-6 bg-cyan-50 border-cyan-200">
                  <div className="text-base leading-relaxed text-gray-900 whitespace-pre-wrap">
                    {record.comment}
                  </div>
                </div>
              </section>
            )}

            {/* Attachments Section */}
            {record.hasAttachments && record.Attachment.length > 0 && (
              <section>
                <div className="border-l-4 border-pink-500 pl-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Paperclip className="h-5 w-5 mr-2 text-pink-600" />
                    Attachments
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Supporting documents and files</p>
                </div>
                
                <div className="space-y-3">
                  {record.Attachment.map((attachment, index) => (
                    <div key={attachment.id} className="border rounded-lg p-4 bg-white shadow-sm flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                          <Paperclip className="h-4 w-4 text-pink-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{attachment.fileName}</div>
                          <div className="text-sm text-gray-500">
                            {(attachment.fileSize / 1024).toFixed(1)} KB • {attachment.fileType}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(attachment.fileKey, attachment.fileName)}
                        className="flex-shrink-0"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Document Footer */}
          <div className="border-t bg-gray-50 px-8 py-4">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div>Report generated on {format(new Date(), 'MMM d, yyyy • h:mm a')}</div>
              <div>Document ID: {record.id}</div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this record? This action cannot be undone.
                Type 'Delete' to confirm.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="Type 'Delete' to confirm"
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteText("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteText !== "Delete" || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

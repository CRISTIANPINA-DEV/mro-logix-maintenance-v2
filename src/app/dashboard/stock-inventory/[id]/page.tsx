"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download, Trash2, ArrowLeft, MoreHorizontal, Package, Calendar, User, MapPin, Hash, FileText, Clock, CheckCircle, XCircle, MessageSquare, Paperclip, FileDown, Minus, History, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserPermissions } from "@/hooks/useUserPermissions";
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
  quantity: number;
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

interface UsageRecord {
  id: string;
  usedQuantity: number;
  remainingQuantity: number;
  usedBy: string;
  usedByName: string;
  purpose: string | null;
  notes: string | null;
  usedAt: string;
}

interface UsageHistory {
  stockItem: {
    id: string;
    partNo: string;
    serialNo: string;
    description: string;
    currentQuantity: number;
  };
  usageHistory: UsageRecord[];
  statistics: {
    totalUsageRecords: number;
    totalQuantityUsed: number;
    currentQuantity: number;
    lastUsedAt: string | null;
    lastUsedBy: string | null;
    uniqueUsers: number;
  };
  dailySummary: Array<{
    date: string;
    totalUsed: number;
    recordCount: number;
    users: string[];
  }>;
}

export default function StockInventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");
  const [record, setRecord] = useState<StockInventory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIdLoading, setIsIdLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  
  // Usage functionality state
  const [showUseQuantityDialog, setShowUseQuantityDialog] = useState(false);
  const [useQuantityAmount, setUseQuantityAmount] = useState<number>(1);
  const [usePurpose, setUsePurpose] = useState("");
  const [useNotes, setUseNotes] = useState("");
  const [isUsingQuantity, setIsUsingQuantity] = useState(false);
  
  // Usage history state
  const [showUsageHistory, setShowUsageHistory] = useState(false);
  const [usageHistory, setUsageHistory] = useState<UsageHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { permissions, loading: permissionsLoading } = useUserPermissions();

  // Get the id from params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
      setIsIdLoading(false);
    };
    getParams();
  }, [params]);
  
  const fetchRecord = useCallback(async (abortController?: AbortController) => {
    if (!id || isDeleted) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/stock-inventory/${id}`, {
        signal: abortController?.signal
      });
      
      if (abortController?.signal.aborted) {
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRecord(data.record);
      } else {
        throw new Error(data.message || 'Failed to fetch record');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching stock inventory record:', error);
        toast({
          title: "Error",
          description: error.message === "Stock inventory record not found" 
            ? "This stock inventory record could not be found. It may have been deleted."
            : "Failed to fetch stock inventory record",
          variant: "destructive"
        });
      }
    } finally {
      if (!abortController || !abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [id, toast, isDeleted]);

  useEffect(() => {
    if (!id) {
      return;
    }
    
    const abortController = new AbortController();
    fetchRecord(abortController);
    
    return () => {
      abortController.abort();
    };
  }, [fetchRecord, id]);

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

  const handleUseQuantity = async () => {
    if (!record || useQuantityAmount <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity to use",
        variant: "destructive"
      });
      return;
    }
    
    if (useQuantityAmount > record.quantity) {
      toast({
        title: "Insufficient quantity",
        description: `Cannot use ${useQuantityAmount} units. Only ${record.quantity} available.`,
        variant: "destructive"
      });
      return;
    }
    
    setIsUsingQuantity(true);
    try {
      const response = await fetch(`/api/stock-inventory/${id}/use-quantity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usedQuantity: useQuantityAmount,
          purpose: usePurpose.trim() || null,
          notes: useNotes.trim() || null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRecord(prev => prev ? { ...prev, quantity: data.data.remainingQuantity } : null);
        
        toast({
          title: "Success",
          description: data.message
        });
        
        setUseQuantityAmount(1);
        setUsePurpose("");
        setUseNotes("");
        setShowUseQuantityDialog(false);
        
        if (showUsageHistory) {
          fetchUsageHistory();
        }
      } else {
        throw new Error(data.message || 'Failed to use quantity');
      }
    } catch (error) {
      console.error('Error using quantity:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to use quantity",
        variant: "destructive"
      });
    } finally {
      setIsUsingQuantity(false);
    }
  };
  
  const fetchUsageHistory = async () => {
    if (!id) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/stock-inventory/${id}/usage-history`);
      const data = await response.json();
      
      if (data.success) {
        setUsageHistory(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch usage history');
      }
    } catch (error) {
      console.error('Error fetching usage history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch usage history",
        variant: "destructive"
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  const handleShowUsageHistory = () => {
    setShowUsageHistory(true);
    fetchUsageHistory();
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
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      
      // Simple PDF generation - you can expand this based on your needs
      doc.setFontSize(16);
      doc.text('Stock Inventory Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Part Number: ${record.partNo}`, 20, 40);
      doc.text(`Serial Number: ${record.serialNo}`, 20, 50);
      doc.text(`Quantity: ${record.quantity}`, 20, 60);
      doc.text(`Description: ${record.description}`, 20, 70);
      
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
        setIsDeleted(true);
        toast({
          title: "Success",
          description: "Record deleted successfully"
        });
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

  if (isIdLoading || isLoading) {
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
          
          {!permissionsLoading && (
            isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {permissions?.canGenerateStockPdf && (
                    <DropdownMenuItem 
                      onClick={handleGeneratePDF}
                      className="flex items-center gap-2"
                    >
                      <FileDown className="h-4 w-4" />
                      Generate PDF
                    </DropdownMenuItem>
                  )}
                  {record && record.quantity > 0 && (
                    <DropdownMenuItem 
                      onClick={() => setShowUseQuantityDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <Minus className="h-4 w-4" />
                      Use Quantity
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={handleShowUsageHistory}
                    className="flex items-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    Usage History
                  </DropdownMenuItem>
                  {permissions?.canDeleteStockRecord && (
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Record
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                {permissions?.canGenerateStockPdf && (
                  <Button
                    variant="outline"
                    onClick={handleGeneratePDF}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Generate PDF
                  </Button>
                )}
                {record && record.quantity > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowUseQuantityDialog(true)}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Use Quantity
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleShowUsageHistory}
                >
                  <History className="h-4 w-4 mr-2" />
                  Usage History
                </Button>
                {permissions?.canDeleteStockRecord && (
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Record
                  </Button>
                )}
              </div>
            )
          )}
        </div>

        {/* Document Title */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b bg-gray-50">
            <div className="px-8 py-6">
              <div className="flex items-center space-x-3 mb-2">
                <Package className="h-8 w-8 text-gray-600" />
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
              <div className="border-l-4 border-gray-300 pl-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Hash className="h-5 w-5 mr-2 text-gray-600" />
                  Part Identification
                </h2>
                <p className="text-sm text-gray-600 mt-1">Primary identification details for the inventory item</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Part Number</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-gray-900">{record.partNo}</div>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Serial Number</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-gray-900">{record.serialNo}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Quantity</span>
                      {record.quantity > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowUseQuantityDialog(true)}
                          className="text-xs h-6 px-2"
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                      )}
                    </div>
                    <div className={`text-lg font-bold ${
                      record.quantity === 0 ? 'text-red-600' : 
                      record.quantity <= 5 ? 'text-orange-600' : 
                      'text-gray-900'
                    }`}>
                      {record.quantity.toLocaleString()}
                    </div>
                    {record.quantity === 0 && (
                      <div className="text-sm text-red-600 mt-1">Out of stock</div>
                    )}
                    {record.quantity > 0 && record.quantity <= 5 && (
                      <div className="text-sm text-orange-600 mt-1">Low stock</div>
                    )}
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Type</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{record.type}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Description Section */}
            <section>
              <div className="border-l-4 border-gray-300 pl-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-gray-600" />
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
              <div className="border-l-4 border-gray-300 pl-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-600" />
                  Location & Ownership
                </h2>
                <p className="text-sm text-gray-600 mt-1">Location details and responsible parties</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Station</span>
                  </div>
                  <div className="text-base font-bold text-gray-900">{record.station}</div>
                </div>
                
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Owner</span>
                  </div>
                  <div className="text-base font-bold text-gray-900">{record.owner}</div>
                </div>
                
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Location</span>
                  </div>
                  <div className="text-base font-bold text-gray-900">{record.location}</div>
                </div>
              </div>
              
              {record.technician && (
                <div className="mt-4">
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Assigned Technician</span>
                    </div>
                    <div className="text-base font-bold text-gray-900">{record.technician}</div>
                  </div>
                </div>
              )}
            </section>

            {/* Dates & Timeline Section */}
            <section>
              <div className="border-l-4 border-gray-300 pl-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-600" />
                  Dates & Timeline
                </h2>
                <p className="text-sm text-gray-600 mt-1">Important dates and timeline information</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6 bg-white">
                  <div className="flex items-center mb-3">
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
                  <div className="border rounded-lg p-6 bg-white">
                    <div className="flex items-center mb-3">
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
                <div className="border-l-4 border-gray-300 pl-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    {record.inspectionResult === "Failed" ? (
                      <XCircle className="h-5 w-5 mr-2 text-gray-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 mr-2 text-gray-600" />
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
                <div className="border-l-4 border-gray-300 pl-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-gray-600" />
                    Additional Comments
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Additional notes and observations</p>
                </div>
                
                <div className="border rounded-lg p-6 bg-white">
                  <div className="text-base leading-relaxed text-gray-900 whitespace-pre-wrap">
                    {record.comment}
                  </div>
                </div>
              </section>
            )}

            {/* Attachments Section */}
            {record.hasAttachments && record.Attachment.length > 0 && (
              <section>
                <div className="border-l-4 border-gray-300 pl-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Paperclip className="h-5 w-5 mr-2 text-gray-600" />
                    Attachments
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Supporting documents and files</p>
                </div>
                
                <div className="space-y-3">
                  {record.Attachment.map((attachment, index) => (
                    <div key={attachment.id} className="border rounded-lg p-4 bg-white shadow-sm flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Paperclip className="h-4 w-4 text-gray-600" />
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

        {/* Use Quantity Dialog */}
        <Dialog open={showUseQuantityDialog} onOpenChange={setShowUseQuantityDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Use Inventory Quantity</DialogTitle>
              <DialogDescription>
                Specify how many units you want to use from this inventory item.
                Current available: <strong>{record?.quantity || 0}</strong> units.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="useQuantity">Quantity to Use</Label>
                <Input
                  id="useQuantity"
                  type="number"
                  min="1"
                  max={record?.quantity || 0}
                  value={useQuantityAmount}
                  onChange={(e) => setUseQuantityAmount(parseInt(e.target.value) || 1)}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="usePurpose">Purpose (optional)</Label>
                <Input
                  id="usePurpose"
                  value={usePurpose}
                  onChange={(e) => setUsePurpose(e.target.value)}
                  placeholder="e.g., Maintenance, Repair, Installation"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="useNotes">Notes (optional)</Label>
                <Textarea
                  id="useNotes"
                  value={useNotes}
                  onChange={(e) => setUseNotes(e.target.value)}
                  placeholder="Additional details about this usage..."
                  className="w-full"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUseQuantityDialog(false);
                  setUseQuantityAmount(1);
                  setUsePurpose("");
                  setUseNotes("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUseQuantity}
                disabled={isUsingQuantity || useQuantityAmount <= 0 || useQuantityAmount > (record?.quantity || 0)}
              >
                {isUsingQuantity ? "Processing..." : "Use Quantity"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Usage History Dialog */}
        <Dialog open={showUsageHistory} onOpenChange={setShowUsageHistory}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Usage History
              </DialogTitle>
              <DialogDescription>
                Track of all quantity usage for this inventory item.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto space-y-6">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : usageHistory ? (
                <>
                  {/* Statistics Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {usageHistory.statistics.totalUsageRecords}
                      </div>
                      <div className="text-sm text-blue-600">Total Uses</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-red-600">
                        {usageHistory.statistics.totalQuantityUsed}
                      </div>
                      <div className="text-sm text-red-600">Total Used</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {usageHistory.statistics.currentQuantity}
                      </div>
                      <div className="text-sm text-green-600">Remaining</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {usageHistory.statistics.uniqueUsers}
                      </div>
                      <div className="text-sm text-purple-600">Users</div>
                    </div>
                  </div>
                  
                  {/* Recent Usage Records */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Recent Usage Records
                    </h4>
                    {usageHistory.usageHistory.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No usage records found for this item.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-auto">
                        {usageHistory.usageHistory.map((usage) => (
                          <div key={usage.id} className="border rounded-lg p-3 bg-white">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-red-600">-{usage.usedQuantity}</span>
                                  <span className="text-sm text-muted-foreground">→</span>
                                  <span className="font-semibold text-green-600">{usage.remainingQuantity} remaining</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Used by <strong>{usage.usedByName}</strong> on{' '}
                                  {format(new Date(usage.usedAt), 'MMM d, yyyy • h:mm a')}
                                </div>
                                {usage.purpose && (
                                  <div className="text-sm mt-1">
                                    <strong>Purpose:</strong> {usage.purpose}
                                  </div>
                                )}
                                {usage.notes && (
                                  <div className="text-sm mt-1 text-muted-foreground">
                                    <strong>Notes:</strong> {usage.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Failed to load usage history.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowUsageHistory(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
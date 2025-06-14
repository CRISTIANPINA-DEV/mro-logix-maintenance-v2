"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

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

interface StockInventoryViewDialogProps {
  record: StockInventory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockInventoryViewDialog({
  record,
  open,
  onOpenChange,
}: StockInventoryViewDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

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
      const response = await fetch(`/api/stock-inventory/${record.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Record deleted successfully"
        });
        onOpenChange(false);
        // Reload the page to refresh the list
        window.location.reload();
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] sm:!max-w-[95vw] max-h-[95vh] overflow-y-auto p-12">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Stock Inventory Details</DialogTitle>
            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Record
            </Button>
          </DialogHeader>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left border">Incoming Date</th>
                  <th className="p-2 text-left border">Station</th>
                  <th className="p-2 text-left border">Owner</th>
                  <th className="p-2 text-left border">Description</th>
                  <th className="p-2 text-left border">Part No</th>
                  <th className="p-2 text-left border">Serial No</th>
                  <th className="p-2 text-left border">Quantity</th>
                  <th className="p-2 text-left border">Type</th>
                  <th className="p-2 text-left border">Location</th>
                  <th className="p-2 text-left border">Technician</th>
                  {record.hasExpireDate && <th className="p-2 text-left border">Expire Date</th>}
                  {record.hasInspection && <th className="p-2 text-left border">Inspection Result</th>}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border">{format(new Date(record.incomingDate), 'MMM d, yyyy')}</td>
                  <td className="p-2 border">{record.station}</td>
                  <td className="p-2 border">{record.owner}</td>
                  <td className="p-2 border whitespace-pre-wrap">{record.description}</td>
                  <td className="p-2 border">{record.partNo}</td>
                  <td className="p-2 border">{record.serialNo}</td>
                  <td className="p-2 border">{record.quantity}</td>
                  <td className="p-2 border">{record.type}</td>
                  <td className="p-2 border">{record.location}</td>
                  <td className="p-2 border">{record.technician || 'Not available'}</td>
                  {record.hasExpireDate && (
                    <td className="p-2 border">
                      {record.expireDate ? format(new Date(record.expireDate), 'MMM d, yyyy') : 'N/A'}
                    </td>
                  )}
                  {record.hasInspection && (
                    <td className="p-2 border">
                      {record.inspectionResult}
                      {record.inspectionResult === "Failed" && (
                        <div className="text-sm text-gray-500 mt-1">
                          Reason: {record.inspectionFailure === "Other" ? record.customFailure : record.inspectionFailure}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
                {record.hasComment && (
                  <tr>
                    <td 
                      colSpan={9 + (record.hasExpireDate ? 1 : 0) + (record.hasInspection ? 1 : 0)} 
                      className="p-4 border bg-gray-50"
                    >
                      <div className="font-medium text-gray-500 mb-1">Comments:</div>
                      <div className="whitespace-pre-wrap">{record.comment}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {record.hasAttachments && record.Attachment.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold mb-2">Attachments</h3>
              <div className="space-y-2">
                {record.Attachment.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm truncate flex-1">{attachment.fileName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(attachment.fileKey, attachment.fileName)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              This action cannot be undone. This will permanently delete the record and all associated attachments.
            </p>
            <p className="text-sm font-medium">
              Please type &quot;Delete&quot; to confirm:
            </p>
            <Input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="Type 'Delete' to confirm"
              className="w-full"
            />
          </div>
          <div className="flex justify-end space-x-2">
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
              {isDeleting ? "Deleting..." : "Delete Record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 
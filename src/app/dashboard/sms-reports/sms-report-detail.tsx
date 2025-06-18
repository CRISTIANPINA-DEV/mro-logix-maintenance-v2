"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  FileText, 
  Download, 
  Trash2,
  AlertTriangle,
  Paperclip
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
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

interface SMSReportDetailProps {
  report: {
    id: string;
    reportNumber: string;
    reporterName?: string | null;
    reporterEmail?: string | null;
    userId?: string | null;
    date: string;
    timeOfEvent?: string | null;
    reportTitle: string;
    reportDescription: string;
    hasAttachments: boolean;
    createdAt: string;
    updatedAt: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
    Attachment?: Array<{
      id: string;
      fileName: string;
      fileKey: string;
      fileSize: number;
      fileType: string;
      createdAt: string;
    }>;
  };
  onClose: () => void;
  onDelete: () => void;
}

const SMSReportDetail = ({ report, onClose, onDelete }: SMSReportDetailProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy at h:mm a');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/sms-reports/attachments/${attachmentId}`);
      
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
      
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDeleteReport = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/sms-reports/${report.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('SMS report deleted successfully');
        onDelete();
      } else {
        toast.error(result.message || 'Failed to delete SMS report');
      }
    } catch (error) {
      console.error('Error deleting SMS report:', error);
      toast.error('An error occurred while deleting the report');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <CardTitle className="text-lg sm:text-xl font-semibold">
            <span className="sm:hidden">Report Details</span>
            <span className="hidden sm:inline">SMS Report Details</span>
          </CardTitle>
          <Badge className="bg-[#8b5cf6] text-white text-xs sm:text-sm">
            {report.reportNumber}
          </Badge>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm h-8 sm:h-9"
                disabled={isDeleting}
              >
                <Trash2 size={14} className="mr-1" />
                <span className="hidden sm:inline">Delete</span>
                <span className="sm:hidden">Del</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-red-500" size={20} />
                  Delete SMS Report
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this SMS report? This action cannot be undone.
                  All associated attachments will also be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteReport}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Report'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X size={14} className="sm:w-4 sm:h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
        {/* Report Title */}
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 leading-tight">
            {report.reportTitle}
          </h2>
        </div>

        {/* Report Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Calendar size={14} className="text-gray-500 flex-shrink-0" />
            <span className="font-medium">Event Date:</span>
            <span className="truncate">{formatDate(report.date)}</span>
          </div>
          
          {report.timeOfEvent && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Clock size={14} className="text-gray-500 flex-shrink-0" />
              <span className="font-medium">Time:</span>
              <span className="truncate">{formatTime(report.timeOfEvent)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <User size={14} className="text-gray-500 flex-shrink-0" />
            <span className="font-medium">Reporter:</span>
            <span className="truncate">{report.reporterName || 'Anonymous'}</span>
          </div>
          
          {report.reporterEmail && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Mail size={14} className="text-gray-500 flex-shrink-0" />
              <span className="font-medium">Email:</span>
              <span className="truncate">{report.reporterEmail}</span>
            </div>
          )}
          
          {report.user && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <User size={14} className="text-gray-500 flex-shrink-0" />
              <span className="font-medium">Created by:</span>
              <span className="truncate">{report.user.firstName} {report.user.lastName}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <FileText size={14} className="text-gray-500 flex-shrink-0" />
            <span className="font-medium">Submitted:</span>
            <span className="truncate">{formatDateTime(report.createdAt)}</span>
          </div>
          
          {report.hasAttachments && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Paperclip size={14} className="text-gray-500 flex-shrink-0" />
              <span className="font-medium">Attachments:</span>
              <span className="truncate">{report.Attachment?.length || 0} files</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Report Description */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Report Description</h3>
          <div className="bg-white border rounded-lg p-3 sm:p-4">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
              {report.reportDescription}
            </p>
          </div>
        </div>

        {/* Attachments */}
        {report.hasAttachments && report.Attachment && report.Attachment.length > 0 && (
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Attachments</h3>
            <div className="space-y-2">
              {report.Attachment.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <Paperclip size={14} className="text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {attachment.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(attachment.fileSize)} • {attachment.fileType}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                    className="flex items-center gap-1 text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto justify-center"
                  >
                    <Download size={12} className="sm:w-3.5 sm:h-3.5" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t text-xs text-gray-500">
          <p>
            Last updated: {formatDateTime(report.updatedAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SMSReportDetail; 
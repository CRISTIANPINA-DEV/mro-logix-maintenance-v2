"use client";

import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, FileText, Paperclip } from "lucide-react";
import { format } from "date-fns";

interface SMSReportCardProps {
  report: {
    id: string;
    reportNumber: string;
    reporterName?: string | null;
    reporterEmail?: string | null;
    date: string;
    timeOfEvent?: string | null;
    reportTitle: string;
    reportDescription: string;
    hasAttachments: boolean;
    createdAt: string;
    Attachment?: Array<{
      id: string;
      fileName: string;
      fileSize: number;
      fileType: string;
    }>;
  };
  onClick: () => void;
}

const SMSReportCard = ({ report, onClick }: SMSReportCardProps) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // Handle time format (HH:MM)
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 rounded-none"
      onClick={onClick}
    >
      <CardHeader className="pb-1 px-3 pt-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-[#8b5cf6] text-white text-xs">
              {report.reportNumber}
            </Badge>
            {report.hasAttachments && (
              <Badge variant="outline" className="text-xs">
                <Paperclip size={10} className="mr-1" />
                {report.Attachment?.length || 0} files
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(report.createdAt)}
          </div>
        </div>
        
        <h3 className="font-medium text-sm leading-tight mt-1">
          {truncateText(report.reportTitle, 80)}
        </h3>
      </CardHeader>
      
      <CardContent className="pt-0 px-3 pb-3">
        <div className="space-y-1">
          {/* Report Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>Event: {formatDate(report.date)}</span>
            </div>
            
            {report.timeOfEvent && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>Time: {formatTime(report.timeOfEvent)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <User size={12} />
              <span>Reporter: {report.reporterName || 'Anonymous'}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <FileText size={12} />
              <span>Submitted: {formatDate(report.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SMSReportCard; 
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Download, Trash2, FileText, Calendar, User, MapPin, Clock, AlertTriangle, Plane, Settings, FileDown } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SDRDetailsProps {
  report: any;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const SDRDetails: React.FC<SDRDetailsProps> = ({ report, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this SDR report? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(report.id);
      toast.success('SDR report deleted successfully');
      onClose();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete SDR report');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/sdr-reports/attachments/${attachmentId}`);
      if (!response.ok) {
        throw new Error('Failed to download attachment');
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
      
      toast.success('Attachment downloaded successfully');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast.error('Failed to download attachment');
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('SDR Report', 20, 25);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Control Number: ${report.controlNumber}`, 20, 35);
      doc.text(`Report Title: ${report.reportTitle}`, 20, 45);
      
      // Line separator
      doc.setLineWidth(0.5);
      doc.line(20, 55, 190, 55);
      
      let yPosition = 70;
      
      // Event Summary
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Event Summary', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Difficulty Date: ${formatDate(report.difficultyDate)}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Station: ${report.station}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Reported By: ${report.submitterName}`, 20, yPosition);
      yPosition += 15;
      
      // Event Details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Event Details', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Condition: ${report.condition}${report.condition === 'Other' && report.conditionOther ? ` (${report.conditionOther})` : ''}`, 20, yPosition);
      yPosition += 8;
      doc.text(`How Discovered: ${report.howDiscovered}${report.howDiscovered === 'Other' && report.howDiscoveredOther ? ` (${report.howDiscoveredOther})` : ''}`, 20, yPosition);
      yPosition += 8;
      
      if (report.hasFlightNumber) {
        doc.text(`Flight Number: ${report.flightNumber}`, 20, yPosition);
        yPosition += 8;
      }
      
      if (report.timeOfDiscover) {
        doc.text(`Time of Discovery: ${report.timeOfDiscover}`, 20, yPosition);
        yPosition += 8;
      }
      
      if (report.hasAtaCode && report.ataSystemCode) {
        doc.text(`ATA System Code: ${report.ataSystemCode}`, 20, yPosition);
        yPosition += 8;
      }
      yPosition += 7;
      
      // Aircraft/Part Information
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${report.partOrAirplane === 'Airplane' ? 'Aircraft' : 'Part'} Information`, 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Type: ${report.partOrAirplane}`, 20, yPosition);
      yPosition += 8;
      
      if (report.partOrAirplane === 'Airplane' && report.airplaneModel) {
        doc.text(`Model: ${report.airplaneModel}`, 20, yPosition);
        yPosition += 8;
      }
      
      if (report.partOrAirplane === 'Airplane' && report.airplaneTailNumber) {
        doc.text(`Tail Number: ${report.airplaneTailNumber}`, 20, yPosition);
        yPosition += 8;
      }
      
      if (report.partOrAirplane === 'Part') {
        if (report.partNumber) {
          doc.text(`Part Number: ${report.partNumber}`, 20, yPosition);
          yPosition += 8;
        }
        if (report.serialNumber) {
          doc.text(`Serial Number: ${report.serialNumber}`, 20, yPosition);
          yPosition += 8;
        }
      }
      yPosition += 7;
      
      // Problem Description
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Problem Description', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const problemText = report.problemDescription || 'No description provided';
      const splitText = doc.splitTextToSize(problemText, 170);
      doc.text(splitText, 20, yPosition);
      yPosition += splitText.length * 5 + 10;
      
      // Additional Details (Symptoms, Consequences, Corrective Action)
      if (report.symptoms || report.consequences || report.correctiveAction) {
        // Check if we need a new page
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Additional Details', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        if (report.symptoms) {
          doc.setFont('helvetica', 'bold');
          doc.text('Symptoms:', 20, yPosition);
          yPosition += 8;
          doc.setFont('helvetica', 'normal');
          const symptomsText = doc.splitTextToSize(report.symptoms, 170);
          doc.text(symptomsText, 20, yPosition);
          yPosition += symptomsText.length * 5 + 5;
        }
        
        if (report.consequences) {
          doc.setFont('helvetica', 'bold');
          doc.text('Consequences:', 20, yPosition);
          yPosition += 8;
          doc.setFont('helvetica', 'normal');
          const consequencesText = doc.splitTextToSize(report.consequences, 170);
          doc.text(consequencesText, 20, yPosition);
          yPosition += consequencesText.length * 5 + 5;
        }
        
        if (report.correctiveAction) {
          doc.setFont('helvetica', 'bold');
          doc.text('Corrective Action:', 20, yPosition);
          yPosition += 8;
          doc.setFont('helvetica', 'normal');
          const correctiveActionText = doc.splitTextToSize(report.correctiveAction, 170);
          doc.text(correctiveActionText, 20, yPosition);
          yPosition += correctiveActionText.length * 5 + 10;
        } else {
          yPosition += 5;
        }
      }
      
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Submitter Information
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Submitter Information', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Submitter Type: ${report.submitter}${report.submitter === 'Other' && report.submitterOther ? ` (${report.submitterOther})` : ''}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Email: ${report.email}`, 20, yPosition);
      yPosition += 15;
      
      // Attachments
      if (report.hasAttachments && report.Attachment && report.Attachment.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Attachments (${report.Attachment.length})`, 20, yPosition);
        yPosition += 10;
        
        const attachmentData = report.Attachment.map((attachment: any) => [
          attachment.fileName,
          `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB`
        ]);
        
        autoTable(doc, {
          head: [['File Name', 'Size']],
          body: attachmentData,
          startY: yPosition,
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202] },
          margin: { left: 20, right: 20 },
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Report Information
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Report Information', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Created: ${formatDateTime(report.createdAt)}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Last Updated: ${formatDateTime(report.updatedAt)}`, 20, yPosition);
      
      // Save the PDF
      const fileName = `SDR_Report_${report.controlNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const InfoItem = ({ icon: Icon, label, value, className = "" }: {
    icon: any;
    label: string;
    value: string | React.ReactNode;
    className?: string;
  }) => (
    <div className={`flex items-start gap-3 ${className}`}>
      <Icon size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="text-base font-semibold text-foreground break-words">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] mx-auto flex flex-col">
        {/* Header */}
        <CardHeader className="border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm font-mono px-2 py-1">
                  {report.controlNumber}
                </Badge>
                <h1 className="text-xl font-bold">SDR Report</h1>
              </div>
              <h2 className="text-base text-muted-foreground font-medium line-clamp-1">
                {report.reportTitle}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadPDF}
                className="flex items-center gap-2"
              >
                <FileDown size={16} />
                Download PDF
              </Button>
              <Button 
                variant="delete" 
                size="sm" 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                <Trash2 size={16} />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
              <Button variant="neutral" size="sm" onClick={onClose} className="flex items-center gap-2">
                <X size={16} />
                Close
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Key Information */}
            <section>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                Event Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoItem
                  icon={Calendar}
                  label="Difficulty Date"
                  value={formatDate(report.difficultyDate)}
                />
                <InfoItem
                  icon={MapPin}
                  label="Station"
                  value={report.station}
                />
                <InfoItem
                  icon={User}
                  label="Reported By"
                  value={report.submitterName}
                />
              </div>
            </section>

            <Separator />

            {/* Event Details */}
            <section>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Settings size={18} className="text-blue-600" />
                Event Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem
                  icon={AlertTriangle}
                  label="Condition"
                  value={
                    <span>
                      {report.condition}
                      {report.condition === 'Other' && report.conditionOther && (
                        <span className="text-muted-foreground ml-1">({report.conditionOther})</span>
                      )}
                    </span>
                  }
                />
                <InfoItem
                  icon={FileText}
                  label="How Discovered"
                  value={
                    <span>
                      {report.howDiscovered}
                      {report.howDiscovered === 'Other' && report.howDiscoveredOther && (
                        <span className="text-muted-foreground ml-1">({report.howDiscoveredOther})</span>
                      )}
                    </span>
                  }
                />
                {report.hasFlightNumber && (
                  <InfoItem
                    icon={Plane}
                    label="Flight Number"
                    value={report.flightNumber}
                  />
                )}
                {report.timeOfDiscover && (
                  <InfoItem
                    icon={Clock}
                    label="Time of Discovery"
                    value={report.timeOfDiscover}
                  />
                )}
                {report.hasAtaCode && report.ataSystemCode && (
                  <InfoItem
                    icon={Settings}
                    label="ATA System Code"
                    value={report.ataSystemCode}
                  />
                )}
              </div>
            </section>

            <Separator />

            {/* Aircraft/Part Information */}
            <section>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Plane size={18} className="text-green-600" />
                {report.partOrAirplane === 'Airplane' ? 'Aircraft Information' : 'Part Information'}
              </h3>
              <div className="space-y-3">
                <InfoItem
                  icon={Settings}
                  label="Type"
                  value={
                    <div className="space-y-1">
                      <div>{report.partOrAirplane}</div>
                      {report.partOrAirplane === 'Airplane' && (
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {report.airplaneModel && <div>Model: {report.airplaneModel}</div>}
                          {report.airplaneTailNumber && <div>Tail Number: {report.airplaneTailNumber}</div>}
                        </div>
                      )}
                      {report.partOrAirplane === 'Part' && (
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {report.partNumber && <div>Part Number: {report.partNumber}</div>}
                          {report.serialNumber && <div>Serial Number: {report.serialNumber}</div>}
                        </div>
                      )}
                    </div>
                  }
                />
              </div>
            </section>

            <Separator />

            {/* Problem Description */}
            <section>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <FileText size={18} className="text-red-600" />
                Problem Description
              </h3>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {report.problemDescription}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Additional Details */}
            {(report.symptoms || report.consequences || report.correctiveAction) && (
              <>
                <Separator />
                <section>
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-orange-600" />
                    Additional Details
                  </h3>
                  <div className="space-y-4">
                    {report.symptoms && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-muted-foreground">Symptoms</h4>
                        <Card className="bg-muted/30">
                          <CardContent className="p-3">
                            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                              {report.symptoms}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    {report.consequences && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-muted-foreground">Consequences</h4>
                        <Card className="bg-muted/30">
                          <CardContent className="p-3">
                            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                              {report.consequences}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    {report.correctiveAction && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-muted-foreground">Corrective Action</h4>
                        <Card className="bg-muted/30">
                          <CardContent className="p-3">
                            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                              {report.correctiveAction}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* Submitter Information */}
            <section>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <User size={18} className="text-purple-600" />
                Submitter Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem
                  icon={User}
                  label="Submitter Type"
                  value={
                    <span>
                      {report.submitter}
                      {report.submitter === 'Other' && report.submitterOther && (
                        <span className="text-muted-foreground ml-1">({report.submitterOther})</span>
                      )}
                    </span>
                  }
                />
                <InfoItem
                  icon={FileText}
                  label="Email"
                  value={report.email}
                />
              </div>
            </section>

            {/* Attachments */}
            {report.hasAttachments && report.Attachment && report.Attachment.length > 0 && (
              <>
                <Separator />
                <section>
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-orange-600" />
                    Attachments ({report.Attachment.length})
                  </h3>
                  <div className="space-y-2">
                    {report.Attachment.map((attachment: any) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText size={18} className="text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{attachment.fileName}</div>
                            <div className="text-xs text-muted-foreground">
                              {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                          className="flex items-center gap-1 ml-3 flex-shrink-0"
                        >
                          <Download size={14} />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            <Separator />

            {/* Report Metadata */}
            <section>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Clock size={18} className="text-gray-600" />
                Report Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem
                  icon={Calendar}
                  label="Created"
                  value={formatDateTime(report.createdAt)}
                />
                <InfoItem
                  icon={Calendar}
                  label="Last Updated"
                  value={formatDateTime(report.updatedAt)}
                />
              </div>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SDRDetails; 
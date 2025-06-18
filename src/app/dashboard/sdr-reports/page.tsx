"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, Calendar, User, MapPin, Paperclip } from "lucide-react";
import { toast } from "sonner";
import SDRReportsHeader from './sdr-reports-header';
import SDRForm from './sdr-form';
import SDRDetails from './sdr-details';

interface SDRReport {
  id: string;
  controlNumber: string;
  reportTitle: string;
  difficultyDate: string;
  submitterName: string;
  station: string;
  condition: string;
  hasAttachments: boolean;
  createdAt: string;
  hasFlightNumber?: boolean;
  flightNumber?: string;
  airlineName?: string;
  Attachment?: any[];
}

export default function SDRReports() {
  const [reports, setReports] = useState<SDRReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<SDRReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch reports
  const fetchReports = async () => {
    try {
      const response = await fetch('/api/sdr-reports');
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      const data = await response.json();
      setReports(data);
      setFilteredReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load SDR reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filter reports based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter(report =>
        report.controlNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reportTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.submitterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.station.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReports(filtered);
    }
  }, [searchTerm, reports]);

  const handleNewSDR = () => {
    setShowForm(true);
    setSelectedReport(null); // Close details if open
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleCloseDetails = () => {
    setSelectedReport(null);
  };

  const handleFormSubmit = async (formData: FormData) => {
    try {
      const response = await fetch('/api/sdr-reports', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create SDR report');
      }

      const newReport = await response.json();
      setReports(prev => [newReport, ...prev]);
      setShowForm(false);
      toast.success('SDR report created successfully');
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create SDR report');
      throw error;
    }
  };

  const handleReportClick = async (reportId: string) => {
    try {
      const response = await fetch(`/api/sdr-reports/${reportId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report details');
      }
      const reportDetails = await response.json();
      setSelectedReport(reportDetails);
      setShowForm(false); // Close form if open
    } catch (error) {
      console.error('Error fetching report details:', error);
      toast.error('Failed to load report details');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/sdr-reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      setReports(prev => prev.filter(report => report.id !== reportId));
      toast.success('SDR report deleted successfully');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete SDR report');
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateTitle = (title: string, maxWords: number = 10) => {
    const words = title.split(' ');
    if (words.length <= maxWords) return title;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-full mx-auto px-2 pt-1 pb-10">
        <SDRReportsHeader onNewSDR={handleNewSDR} />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading SDR reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto px-2 pt-1 pb-10">
      {/* Compliance Notice */}
      <Card className="bg-slate-50 border-slate-200 mb-4 sm:mb-6 rounded-none">
        <CardContent className="py-2 sm:py-1 px-3 sm:px-6">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              This form is used to comply with Service Difficulty Reports (SDR) requirements under regulations{' '}
              <span className="font-bold italic text-slate-900">122</span>,{' '}
              <span className="font-bold italic text-slate-900">125</span>,{' '}
              <span className="font-bold italic text-slate-900">135</span>, and{' '}
              <span className="font-bold italic text-slate-900">145</span>.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <SDRReportsHeader onNewSDR={handleNewSDR} />
      
      {/* Show Form Inline */}
      {showForm && (
        <div className="mb-6">
          <SDRForm
            onClose={handleCloseForm}
            onSubmit={handleFormSubmit}
          />
        </div>
      )}

      {/* Show Details Inline */}
      {selectedReport && (
        <div className="mb-6">
          <SDRDetails
            report={selectedReport}
            onClose={handleCloseDetails}
            onDelete={handleDeleteReport}
          />
        </div>
      )}

      {/* Show Reports List (hidden when form or details are shown) */}
      {!showForm && !selectedReport && (
        <div className="space-y-4 sm:space-y-6">
          {/* Search and Stats */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="sm:col-span-2 lg:col-span-2">
              <CardContent className="pt-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-center py-2">
                <CardTitle className="text-lg sm:text-xl font-bold text-blue-600">{reports.length}</CardTitle>
                <CardDescription className="text-xs">Total Reports</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="text-center py-2">
                <CardTitle className="text-lg sm:text-xl font-bold text-green-600">
                  {reports.filter(r => r.hasAttachments).length}
                </CardTitle>
                <CardDescription className="text-xs">With Attachments</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Reports List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">SDR Reports</CardTitle>
              <CardDescription className="text-sm">
                Click on any report to view full details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredReports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No reports found' : 'No SDR reports yet'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm 
                      ? 'Try adjusting your search terms' 
                      : 'Create your first SDR report to get started'
                    }
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleNewSDR} className="mt-4 cursor-pointer" size="sm">
                      Create New SDR Report
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredReports.map((report) => (
                    <Card
                      key={report.id}
                      className="cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all border-l-4 border-l-[#f43f5e] rounded-none"
                      onClick={() => handleReportClick(report.id)}
                    >
                      <CardContent className="py-3 px-3 sm:px-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                          {/* Top row on mobile - Control Number and Title */}
                          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                            <Badge variant="outline" className="font-mono text-xs shrink-0">
                              {report.controlNumber}
                            </Badge>
                            <h3 className="font-semibold text-sm truncate flex-1">
                              {truncateTitle(report.reportTitle, window.innerWidth < 640 ? 6 : 10)}
                            </h3>
                          </div>
                          
                          {/* Middle section - Details (hidden on mobile, shown on desktop) */}
                          <div className="hidden md:flex items-center gap-4 lg:gap-6 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span className="whitespace-nowrap">{formatDate(report.difficultyDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User size={12} />
                              <span className="truncate max-w-24">{report.submitterName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin size={12} />
                              <span className="truncate max-w-20">{report.station}</span>
                            </div>
                          </div>
                          
                          {/* Right side - Status and Attachments */}
                          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2 shrink-0">
                            {/* Mobile details row */}
                            <div className="flex items-center gap-2 text-xs text-gray-600 sm:hidden">
                              <div className="flex items-center gap-1">
                                <Calendar size={10} />
                                <span className="text-xs">{formatDate(report.difficultyDate)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User size={10} />
                                <span className="text-xs truncate max-w-16">{report.submitterName}</span>
                              </div>
                            </div>
                            
                            {/* Status badges */}
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Badge variant="outline" className="text-xs">
                                {report.condition}
                              </Badge>
                              {report.hasAttachments && (
                                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                                  <Paperclip size={8} />
                                  <span className="hidden sm:inline">Files</span>
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import SMSReportsHeader from './sms-reports-header';
import SMSReportForm from './sms-report-form';
import SMSReportCard from './sms-report-card';
import SMSReportDetail from './sms-report-detail';

interface SMSReport {
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
}

export default function SMSReports() {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SMSReport | null>(null);
  const [reports, setReports] = useState<SMSReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<SMSReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const isAdmin = session?.user?.privilege === 'admin';

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/sms-reports');
      const result = await response.json();
      
      if (result.success) {
        setReports(result.data);
        setFilteredReports(result.data);
      } else {
        toast.error('Failed to fetch SMS reports');
      }
    } catch (error) {
      console.error('Error fetching SMS reports:', error);
      toast.error('An error occurred while fetching reports');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter(report =>
        report.reportTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reportDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.reporterName && report.reporterName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.user && `${report.user.firstName} ${report.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredReports(filtered);
    }
  }, [searchTerm, reports]);

  const handleNewReport = () => {
    setShowForm(true);
    setSelectedReport(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchReports(); // Refresh the reports list
  };

  const handleReportClick = (report: SMSReport) => {
    setSelectedReport(report);
    setShowForm(false);
  };

  const handleDetailClose = () => {
    setSelectedReport(null);
  };

  const handleReportDelete = () => {
    setSelectedReport(null);
    fetchReports(); // Refresh the reports list
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchReports();
  };

  // If showing form, render only the form
  if (showForm) {
    return (
      <div className="w-full max-w-full mx-auto px-1 sm:px-2 pt-1 pb-6 sm:pb-10">
        <SMSReportsHeader onNewReport={handleNewReport} />
        <SMSReportForm onCancel={handleFormCancel} onSuccess={handleFormSuccess} />
      </div>
    );
  }

  // If showing report detail, render only the detail view
  if (selectedReport) {
    return (
      <div className="w-full max-w-full mx-auto px-1 sm:px-2 pt-1 pb-6 sm:pb-10">
        <SMSReportsHeader onNewReport={handleNewReport} />
        <SMSReportDetail 
          report={selectedReport} 
          onClose={handleDetailClose}
          onDelete={handleReportDelete}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto px-1 sm:px-2 pt-1 pb-6 sm:pb-10">
      <SMSReportsHeader onNewReport={handleNewReport} />
      
      <div className="space-y-3 sm:space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-2 sm:gap-4 grid-cols-2">
          <Card className="rounded-none">
            <CardHeader className="text-center py-1 sm:py-2 px-2 sm:px-4">
              <CardTitle className="text-lg sm:text-xl font-bold text-[#8b5cf6]">
                {reports.length}
              </CardTitle>
              <CardDescription className="underline text-purple-500 text-xs leading-tight">
                {isAdmin ? 'Total Company Reports' : 'My SMS Reports'}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="rounded-none">
            <CardHeader className="text-center py-1 sm:py-2 px-2 sm:px-4">
              <CardTitle className="text-lg sm:text-xl font-bold text-[#8b5cf6]">
                {reports.filter(r => !r.reporterName).length}
              </CardTitle>
              <CardDescription className="underline text-purple-500 text-xs leading-tight">
                Anonymous Reports
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder={isAdmin ? "Search by title, description, number, reporter, or creator..." : "Search by title, description, number, or reporter..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 sm:gap-2 h-9 text-sm px-3 w-full sm:w-auto justify-center"
          >
            <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin' : ''} sm:w-4 sm:h-4`} />
            Refresh
          </Button>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="text-center py-6 sm:py-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#8b5cf6] mx-auto"></div>
            <p className="mt-2 text-gray-500 text-sm sm:text-base">Loading SMS reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <Card className="text-center py-6 sm:py-8 rounded-none">
            <CardHeader className="px-2 sm:px-4">
              <CardTitle className="text-gray-500 text-base sm:text-lg">
                {searchTerm ? 'No reports found' : 'No SMS reports yet'}
              </CardTitle>
              <CardDescription className="text-sm">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Click "New Report" to create your first SMS report'
                }
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-2 sm:gap-4 grid-cols-1 lg:grid-cols-2">
            {filteredReports.map((report) => (
              <SMSReportCard
                key={report.id}
                report={report}
                onClick={() => handleReportClick(report)}
              />
            ))}
          </div>
        )}

        {/* Results Summary */}
        {!isLoading && filteredReports.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            Showing {filteredReports.length} of {reports.length} reports
            {searchTerm && ` for "${searchTerm}"`}
            {isAdmin && (
              <span className="block text-xs text-blue-600 mt-1">
                Viewing all company reports (Admin)
              </span>
            )}
            {!isAdmin && (
              <span className="block text-xs text-green-600 mt-1">
                Viewing your reports only
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
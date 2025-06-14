"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Upload, File, Trash2, FileBarChart, UserX, Shield } from "lucide-react";
import { toast } from "sonner";

interface FileWithPreview extends File {
  id: string;
}

export default function AnonymousReport() {
  const [formData, setFormData] = useState({
    date: '',
    timeOfEvent: '',
    reportTitle: '',
    reportDescription: ''
  });
  
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reportNumber, setReportNumber] = useState('');

  // Set page title and meta tags for privacy
  useEffect(() => {
    document.title = 'Anonymous SMS Report - MRO Logix';
    
    // Add meta tag to prevent indexing
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);
    
    return () => {
      // Cleanup
      document.head.removeChild(metaRobots);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const newFiles: FileWithPreview[] = Array.from(selectedFiles).map(file => {
      const fileWithId = file as FileWithPreview;
      fileWithId.id = Math.random().toString(36).substr(2, 9);
      return fileWithId;
    });
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateForm = () => {
    if (!formData.date) {
      toast.error('Date is required');
      return false;
    }
    if (!formData.reportTitle.trim()) {
      toast.error('Report title is required');
      return false;
    }
    if (!formData.reportDescription.trim()) {
      toast.error('Report description is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const submitFormData = new FormData();
      
      // Add form fields - explicitly mark as anonymous
      submitFormData.append('date', formData.date);
      submitFormData.append('timeOfEvent', formData.timeOfEvent);
      submitFormData.append('reportTitle', formData.reportTitle);
      submitFormData.append('reportDescription', formData.reportDescription);
      submitFormData.append('isAnonymous', 'true');
      
      // Add files
      if (files.length > 0) {
        submitFormData.append('hasAttachments', 'true');
        files.forEach(file => {
          submitFormData.append('files', file);
        });
      } else {
        submitFormData.append('hasAttachments', 'false');
      }
      
      const response = await fetch('/api/anonymous-reports', {
        method: 'POST',
        body: submitFormData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Anonymous report submitted successfully!');
        setReportNumber(result.data.reportNumber);
        setIsSubmitted(true);
      } else {
        toast.error(result.message || 'Failed to submit anonymous report');
      }
    } catch (error) {
      console.error('Error submitting anonymous report:', error);
      toast.error('An error occurred while submitting the report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewReport = () => {
    setIsSubmitted(false);
    setFormData({
      date: '',
      timeOfEvent: '',
      reportTitle: '',
      reportDescription: ''
    });
    setFiles([]);
    setReportNumber('');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-8">
        <div className="w-full max-w-2xl mx-auto px-4">
          <Card className="text-center">
            <CardHeader className="pb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-600 mb-2">
                Report Submitted Successfully
              </CardTitle>
              <CardDescription className="text-lg">
                Your anonymous report has been submitted with reference number:
              </CardDescription>
              <Badge className="mt-4 px-4 py-2 text-lg bg-[#f43f5e] text-white">
                {reportNumber}
              </Badge>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> Please save this reference number for your records. 
                  Your report has been submitted anonymously and will be reviewed by the appropriate team.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={handleNewReport}
                  className="bg-[#f43f5e] hover:bg-[#e11d48]"
                >
                  Submit Another Report
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.close()}
                >
                  Close Window
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="w-full max-w-4xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileBarChart size={24} className="text-[#f43f5e]" />
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <UserX size={20} className="text-[#f43f5e]" />
                    Anonymous SMS Report
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Submit a safety report anonymously - no login required
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.close()}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Privacy Notice */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <CardTitle className="text-sm text-blue-800">Privacy & Anonymity</CardTitle>
                <CardDescription className="text-sm text-blue-700 mt-1">
                  This form is completely anonymous. No personal information is collected or stored. 
                  Your identity cannot be traced back through this submission.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
            <CardDescription>
              Please provide as much detail as possible about the safety event or concern.
            </CardDescription>
          </CardHeader>
          
          <div className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeOfEvent">Time of Event (Optional)</Label>
                  <Input
                    id="timeOfEvent"
                    name="timeOfEvent"
                    type="time"
                    value={formData.timeOfEvent}
                    onChange={handleInputChange}
                    placeholder="HH:MM"
                  />
                </div>
              </div>

              {/* Report Details */}
              <div className="space-y-2">
                <Label htmlFor="reportTitle">Report Title <span className="text-red-500">*</span></Label>
                <Input
                  id="reportTitle"
                  name="reportTitle"
                  value={formData.reportTitle}
                  onChange={handleInputChange}
                  placeholder="Enter a descriptive title for the report"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportDescription">Report Description <span className="text-red-500">*</span></Label>
                <Textarea
                  id="reportDescription"
                  name="reportDescription"
                  value={formData.reportDescription}
                  onChange={handleInputChange}
                  placeholder="Provide a detailed description of the safety event or concern..."
                  rows={6}
                  required
                />
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <Label>Attachments (Optional)</Label>
                
                {/* File Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop files here, or{' '}
                    <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                      browse
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports images, videos, documents, etc. (Max 250MB total)
                  </p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Files ({files.length})</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <File size={16} className="text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="neutral"
                  onClick={() => window.close()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="save"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Anonymous Report'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
} 
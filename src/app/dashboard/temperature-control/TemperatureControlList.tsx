"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from 'react-modal';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Thermometer, Droplets, User, ChevronLeft, ChevronRight, Eye, MessageSquare, Trash2, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface TemperatureControlRecord {
  id: string;
  date: string;
  location: string;
  customLocation?: string;
  time: string;
  temperature: number;
  humidity: number;
  employeeName: string;
  hasComment: boolean;
  comment?: string;
  createdAt: string;
}

interface ConfigData {
  tempNormalMin: number;
  tempNormalMax: number;
  tempMediumMin: number;
  tempMediumMax: number;
  tempHighMin: number;
  humidityNormalMin: number;
  humidityNormalMax: number;
  humidityMediumMin: number;
  humidityMediumMax: number;
  humidityHighMin: number;
}

interface TemperatureControlListProps {
  refreshTrigger?: number;
  config: ConfigData;
}

export function TemperatureControlList({ refreshTrigger, config }: TemperatureControlListProps) {
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const [records, setRecords] = useState<TemperatureControlRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedComment, setSelectedComment] = useState<{
    comment: string;
    recordId: string;
    hasComment: boolean;
  } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const limit = 10;

  useEffect(() => {
    // Set the app element for react-modal
    if (typeof window !== 'undefined') {
      const appElement = document.getElementById('__next') || document.body;
      Modal.setAppElement(appElement);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/temperature-control?${params}`);
      const result = await response.json();

      if (result.success) {
        setRecords(result.data.records);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch temperature control records",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch temperature control records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, toast]);

  useEffect(() => {
    if (!permissionsLoading) {
      fetchRecords();
    }
  }, [fetchRecords, refreshTrigger, permissionsLoading]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  const formatTime = (timeString: string) => {
    return timeString; // Return the time as-is from the form (24-hour format)
  };

  const getLocationDisplay = (location: string, customLocation?: string) => {
    return location === 'Other' && customLocation ? customLocation : location;
  };
  const getTemperatureColor = (temp: number) => {
    if (temp >= config.tempNormalMin && temp <= config.tempNormalMax) return "text-blue-600"; // Normal
    if (temp >= config.tempMediumMin && temp <= config.tempMediumMax) return "text-yellow-600"; // Medium
    return "text-red-600"; // High
  };

  const getHumidityColor = (humidity: number) => {
    if (humidity >= config.humidityNormalMin && humidity <= config.humidityNormalMax) return "text-blue-600"; // Normal
    if (humidity >= config.humidityMediumMin && humidity <= config.humidityMediumMax) return "text-yellow-600"; // Medium
    return "text-red-600"; // High
  };

  const handleDelete = async (recordId: string) => {
    if (deleteConfirmation !== "Delete") {
      toast({
        title: "Error",
        description: "Please type 'Delete' to confirm",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/temperature-control?id=${recordId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Record deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setDeleteConfirmation("");
        setRecordToDelete(null);
        setSelectedComment(null);
        fetchRecords(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete record",
          variant: "destructive",
        });
        console.error("Delete error:", data);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete record. Please try again.",
        variant: "destructive",
      });
    }
  };

  const customStyles = {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.60)',
      backdropFilter: 'blur(2px)',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
    },
    content: {
      position: 'relative' as const,
      top: 'auto',
      left: 'auto',
      right: 'auto',
      bottom: 'auto',
      width: '100%',
      maxWidth: '90vw',
      maxHeight: '90vh',
      border: 'none',
      borderRadius: '8px',
      padding: '0',
      overflow: 'hidden',
      background: 'white',
      boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      margin: 'auto',
    },
  };

  if (permissionsLoading) {
    return (
      <div className="space-y-4">
        {/* Loading placeholder */}
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-muted-foreground text-sm sm:text-base">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {/* Records List */}
      {records.length === 0 ? (
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <Thermometer className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">No Temperature Records Found</h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Start by adding your first temperature record.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {records.map((record) => (
              <Card key={record.id} className="hover:shadow-md transition-shadow rounded-none">
                <CardContent className="p-3 sm:p-4">
                  {/* Mobile-first layout with responsive grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    {/* Date & Time */}
                    <div className="flex items-center gap-2 sm:col-span-1">
                      <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium">Date & Time</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatDate(record.date)} at {formatTime(record.time)}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 sm:col-span-1">
                      <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium">Location</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {getLocationDisplay(record.location, record.customLocation)}
                        </p>
                      </div>
                    </div>

                    {/* Temperature & Humidity - Combined on mobile */}
                    <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-2">
                      {/* Temperature */}
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium">Temperature</p>
                          <p className={`text-xs font-semibold ${getTemperatureColor(record.temperature)}`}>
                            {record.temperature}°C
                          </p>
                        </div>
                      </div>

                      {/* Humidity */}
                      <div className="flex items-center gap-2">
                        <Droplets className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium">Humidity</p>
                          <p className={`text-xs font-semibold ${getHumidityColor(record.humidity)}`}>
                            {record.humidity}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Employee */}
                    <div className="flex items-center gap-2 sm:col-span-1">
                      <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium">Recorded by</p>
                        <p className="text-xs text-muted-foreground truncate">{record.employeeName}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 sm:col-span-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setSelectedComment({ comment: record.comment || "", recordId: record.id, hasComment: record.hasComment })}
                      >
                        <Eye className="h-3.5 w-3.5 cursor-pointer" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled
                      >
                        <MessageSquare className={`h-3.5 w-3.5 ${record.hasComment ? 'text-green-500' : 'text-gray-400'}`} />
                      </Button>
                      {permissions?.canDeleteTemperatureRecord && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                          onClick={() => {
                            setRecordToDelete(record.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination - Mobile Optimized */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-3 sm:gap-0">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="text-xs sm:text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Comment Details Modal */}
      <Modal
        isOpen={selectedComment !== null}
        onRequestClose={() => setSelectedComment(null)}
        style={customStyles}
        contentLabel="Comment Details"
        closeTimeoutMS={200}
      >
        <div className="flex flex-col h-full bg-gray-50">
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-3 sm:px-4 py-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-md flex-shrink-0">
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Comment Details</h1>
                  <p className="text-xs text-gray-500 truncate">Record ID: {selectedComment?.recordId}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedComment(null)}
                className="h-7 w-7 p-0 hover:bg-gray-100 rounded-md cursor-pointer flex-shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            <div className="prose prose-sm max-w-none">
              {selectedComment?.hasComment && selectedComment.comment ? (
                <p className="text-sm sm:text-base">{selectedComment.comment}</p>
              ) : (
                <p className="text-gray-500 italic text-sm sm:text-base">No comment provided for this record.</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 px-3 sm:px-4 py-3">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
              {permissions?.canDeleteTemperatureRecord && (
                <Button
                  variant="delete"
                  onClick={() => {
                    setRecordToDelete(selectedComment?.recordId || null);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="text-sm cursor-pointer flex items-center gap-2 order-2 sm:order-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Record
                </Button>
              )}
              <Button 
                type="button" 
                variant="neutral" 
                onClick={() => setSelectedComment(null)}
                className="text-sm cursor-pointer order-1 sm:order-2"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Temperature Record</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Please type &quot;Delete&quot; to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder="Type 'Delete' to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteConfirmation("");
              setRecordToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => recordToDelete && handleDelete(recordToDelete)}
            >
              Delete Record
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

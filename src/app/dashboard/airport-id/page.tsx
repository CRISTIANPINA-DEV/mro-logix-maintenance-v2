"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { DownloadIcon, Trash2Icon, MessageSquareIcon, AlertCircle, AlertTriangle, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AirportID {
  id: string;
  employeeName: string;
  station: string;
  customStation: string | null;
  idIssuedDate: string;
  badgeIdNumber: string;
  expireDate: string;
  hasComment: boolean;
  comment: string | null;
  hasAttachment: boolean;
  Attachment: {
    id: string;
    fileName: string;
    fileKey: string;
    fileType: string;
  }[];
  createdAt: string;
}

const STATIONS = ['STA-1', 'STA-2', 'STA-3', 'STA-4', 'STA-5', 'Other'];

// Add this helper function at the top level, before the component
const formatDate = (dateString: string): string => {
  try {
    // Parse the date string and create a new date object
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    // Format the date
    return format(date, "MMM d, yyyy");
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// Add helper function to calculate days remaining
const calculateDaysRemaining = (expireDate: string): { days: number; status: 'expired' | 'warning' | 'critical' | 'normal' } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const expiry = new Date(expireDate);
  expiry.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { days: diffDays, status: 'expired' };
  } else if (diffDays <= 30) {
    return { days: diffDays, status: 'critical' };
  } else if (diffDays <= 90) {
    return { days: diffDays, status: 'warning' };
  } else {
    return { days: diffDays, status: 'normal' };
  }
};

export default function AirportIDPage() {
  const [showForm, setShowForm] = useState(false);
  const [airportIds, setAirportIds] = useState<AirportID[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<{ name: string; comment: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [employeeName, setEmployeeName] = useState("");
  const [station, setStation] = useState("");
  const [customStation, setCustomStation] = useState("");
  const [idIssuedDate, setIdIssuedDate] = useState("");
  const [badgeIdNumber, setBadgeIdNumber] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [hasComment, setHasComment] = useState("No");
  const [comment, setComment] = useState("");
  const [hasAttachment, setHasAttachment] = useState("No");
  const [file, setFile] = useState<File | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const fetchAirportIds = useCallback(async () => {
    try {
      const response = await fetch('/api/airport-id');
      const data = await response.json();
      setAirportIds(data);
    } catch (error) {
      console.error('Error fetching airport IDs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch airport IDs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAirportIds();
  }, [fetchAirportIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!idIssuedDate || !expireDate) {
      toast({
        title: "Error",
        description: "Please select both issue and expiry dates",
        variant: "destructive",
      });
      return;
    }

    // Convert dates to noon UTC to prevent timezone shifts
    const adjustDateToNoonUTC = (dateString: string) => {
      const date = new Date(dateString);
      date.setUTCHours(12, 0, 0, 0);
      return date.toISOString();
    };

    const formData = new FormData();
    formData.append('employeeName', employeeName);
    formData.append('station', station);
    if (station === 'Other') {
      formData.append('customStation', customStation);
    }
    formData.append('idIssuedDate', adjustDateToNoonUTC(idIssuedDate));
    formData.append('badgeIdNumber', badgeIdNumber);
    formData.append('expireDate', adjustDateToNoonUTC(expireDate));
    formData.append('hasComment', hasComment);
    if (hasComment === 'Yes') {
      formData.append('comment', comment);
    }
    formData.append('hasAttachment', hasAttachment);
    if (hasAttachment === 'Yes' && file) {
      formData.append('file', file);
    }

    try {
      const response = await fetch('/api/airport-id', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create airport ID');
      }

      toast({
        title: "Success",
        description: "Airport ID record created successfully",
      });

      // Reset form
      setEmployeeName("");
      setStation("");
      setCustomStation("");
      setIdIssuedDate("");
      setBadgeIdNumber("");
      setExpireDate("");
      setHasComment("No");
      setComment("");
      setHasAttachment("No");
      setFile(null);
      setShowForm(false);

      // Refresh list
      fetchAirportIds();
    } catch (error) {
      console.error('Error creating airport ID:', error);
      toast({
        title: "Error",
        description: "Failed to create airport ID record",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDelete = async (id: string) => {
    setRecordToDelete(id);
    setDeleteConfirmText(""); // Reset confirmation text
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete || deleteConfirmText !== "Delete") return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/airport-id/${recordToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete record');
      }

      toast({
        title: "Success",
        description: "Airport ID record deleted successfully",
      });

      // Refresh the list
      fetchAirportIds();
    } catch (error) {
      console.error('Error deleting airport ID:', error);
      toast({
        title: "Error",
        description: "Failed to delete airport ID record",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      setDeleteConfirmText(""); // Reset confirmation text
    }
  };

  const handleViewComment = (name: string, comment: string | null) => {
    if (comment) {
      setSelectedComment({ name, comment });
      setCommentDialogOpen(true);
    }
  };

  // Add filtered data with search functionality
  const filteredAirportIds = useMemo(() => {
    if (!searchTerm.trim()) {
      return airportIds;
    }

    const search = searchTerm.toLowerCase().trim();
    return airportIds.filter((id) => {
      const employeeName = id.employeeName.toLowerCase();
      const station = id.station === 'Other' ? (id.customStation?.toLowerCase() || '') : id.station.toLowerCase();
      const badgeId = id.badgeIdNumber.toLowerCase();
      
      return employeeName.includes(search) || 
             station.includes(search) || 
             badgeId.includes(search);
    });
  }, [airportIds, searchTerm]);

  // Add this function to calculate statistics based on filtered data
  const calculateStatistics = (ids: AirportID[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return ids.reduce((acc, id) => {
      const expireDate = new Date(id.expireDate);
      expireDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        acc.expired++;
      } else if (diffDays <= 30) {
        acc.expiring30++;
      } else if (diffDays <= 90) {
        acc.expiring90++;
      }
      acc.total++;
      return acc;
    }, { total: 0, expired: 0, expiring30: 0, expiring90: 0 });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Airport ID Management</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "destructive" : "default"}
        >
          {showForm ? "Cancel" : "Add New ID"}
        </Button>
      </div>

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
              <CardTitle className="text-xs font-medium">Expiring in 90 Days</CardTitle>
              <Clock className="h-3.5 w-3.5 text-yellow-500" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-xl font-bold">{calculateStatistics(filteredAirportIds).expiring90}</div>
              <p className="text-[10px] text-muted-foreground">Badges expiring soon</p>
            </CardContent>
          </Card>

          <Card className="p-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
              <CardTitle className="text-xs font-medium">Expiring in 30 Days</CardTitle>
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-xl font-bold">{calculateStatistics(filteredAirportIds).expiring30}</div>
              <p className="text-[10px] text-muted-foreground">Badges requiring immediate attention</p>
            </CardContent>
          </Card>

          <Card className="p-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
              <CardTitle className="text-xs font-medium">Expired Badges</CardTitle>
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-xl font-bold">{calculateStatistics(filteredAirportIds).expired}</div>
              <p className="text-[10px] text-muted-foreground">Badges that need renewal</p>
            </CardContent>
          </Card>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="employeeName">Employee Name</Label>
              <Input
                id="employeeName"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="station">Station</Label>
              <Select value={station} onValueChange={setStation} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  {STATIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {station === 'Other' && (
                <Input
                  placeholder="Enter custom station"
                  value={customStation}
                  onChange={(e) => setCustomStation(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="idIssuedDate">ID Issued Date</Label>
              <Input
                type="date"
                id="idIssuedDate"
                value={idIssuedDate || ''}
                onChange={e => setIdIssuedDate(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="badgeIdNumber">Badge ID Number</Label>
              <Input
                id="badgeIdNumber"
                value={badgeIdNumber}
                onChange={(e) => setBadgeIdNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expireDate">Expire Date</Label>
              <Input
                type="date"
                id="expireDate"
                value={expireDate || ''}
                onChange={e => setExpireDate(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Upload File</Label>
              <Select value={hasAttachment} onValueChange={setHasAttachment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
              {hasAttachment === 'Yes' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {file && (
                    <span className="text-sm text-muted-foreground">
                      {file.name}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Comment</Label>
              <Select value={hasComment} onValueChange={setHasComment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
              {hasComment === 'Yes' && (
                <Textarea
                  placeholder="Enter comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="save">Save</Button>
          </div>
        </form>
      )}

      {/* Search Input */}
      {!loading && (
        <div className="flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by employee name, station, or badge ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4"
            />
          </div>
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="px-2"
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="rounded-md border">
          <Table className="[&_td]:py-1.5 [&_th]:py-2 [&_td]:text-sm [&_th]:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Employee Name</TableHead>
                <TableHead className="w-[120px]">Station</TableHead>
                <TableHead className="w-[120px]">Badge ID</TableHead>
                <TableHead className="w-[120px]">Issued Date</TableHead>
                <TableHead className="w-[100px]">Has Comment</TableHead>
                <TableHead className="w-[120px]">Has Attachment</TableHead>
                <TableHead className="w-[120px]">Expire Date</TableHead>
                <TableHead className="w-[100px]">Due Days</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAirportIds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No records found matching your search." : "No airport ID records found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAirportIds.map((id) => {
                  const { days, status } = calculateDaysRemaining(id.expireDate);
                  return (
                  <TableRow key={id.id}>
                    <TableCell className="font-medium">{id.employeeName}</TableCell>
                    <TableCell>
                      {id.station === 'Other' ? id.customStation : id.station}
                    </TableCell>
                    <TableCell>{id.badgeIdNumber}</TableCell>
                    <TableCell>
                      {formatDate(id.idIssuedDate)}
                    </TableCell>
                    <TableCell>
                      {id.hasComment ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewComment(id.employeeName, id.comment)}
                          className="h-7 w-7 p-0"
                        >
                          <MessageSquareIcon className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        "No"
                      )}
                    </TableCell>
                    <TableCell>
                      {id.hasAttachment ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const fileUrl = `https://mro-logix-amazons3-bucket.s3.amazonaws.com/${id.Attachment[0].fileKey}`;
                            window.open(fileUrl, '_blank');
                          }}
                          className="h-7 px-2"
                        >
                          <DownloadIcon className="h-3.5 w-3.5 mr-1" />
                          Download
                        </Button>
                      ) : (
                        "No"
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(id.expireDate)}
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "px-1.5 py-0.5 rounded text-center text-xs font-medium",
                        status === 'expired' && "bg-red-100 text-red-700",
                        status === 'critical' && "bg-orange-100 text-orange-700",
                        status === 'warning' && "bg-yellow-100 text-yellow-700",
                        status === 'normal' && "bg-green-100 text-green-700"
                      )}>
                        {status === 'expired' ? 'Expired' : `${days} days`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="delete"
                        size="sm"
                        onClick={() => handleDelete(id.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the airport ID record
              and any associated attachments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="deleteConfirmation" className="text-sm font-medium">
              Type <span className="font-bold text-red-600">&quot;Delete&quot;</span> to confirm:
            </Label>
            <Input
              id="deleteConfirmation"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type Delete here..."
              className="mt-2"
              disabled={isDeleting}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeleting}
              onClick={() => {
                setDeleteConfirmText("");
                setDeleteDialogOpen(false);
              }}
              className="bg-white text-black border border-gray-800 hover:bg-gray-50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting || deleteConfirmText !== "Delete"}
              className="bg-red-100 text-black border border-red-600 hover:bg-red-200"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Comment for {selectedComment?.name}</AlertDialogTitle>
            <AlertDialogDescription className="mt-4 bg-muted p-4 rounded-lg whitespace-pre-wrap">
              {selectedComment?.comment}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setCommentDialogOpen(false)}
              className="bg-white text-black border border-gray-800 hover:bg-gray-50"
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 
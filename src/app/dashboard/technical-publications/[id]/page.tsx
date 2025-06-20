'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar, 
  User, 
  Hash,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  MessageSquare,
  Bell
} from 'lucide-react';
import { formatDateSafely } from '@/lib/utils';
import { TechnicalPublication, TechnicalPublicationFormData } from '@/types/technical-publications';
import { useSession } from 'next-auth/react';

export default function TechnicalPublicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;
  
  const [publication, setPublication] = useState<TechnicalPublication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<any>(null);
  const [isRevisionDetailOpen, setIsRevisionDetailOpen] = useState(false);
  const [formData, setFormData] = useState<TechnicalPublicationFormData>({
    revisionDate: '',
    manualDescription: '',
    revisionNumber: '',
    owner: '',
    comment: '',
    file: undefined
  });

  // Check if user is admin
  const isAdmin = session?.user?.privilege === 'admin';

  useEffect(() => {
    if (id) {
      fetchPublication();
      fetchRevisionHistory();
    }
  }, [id]);

  const fetchPublication = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/technical-publications/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setPublication(data.record);
      } else {
        setError(data.message || 'Failed to fetch technical publication');
      }
    } catch (err) {
      setError('Failed to fetch technical publication');
      console.error('Error fetching publication:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevisionHistory = async () => {
    try {
      setLoadingRevisions(true);
      const response = await fetch(`/api/technical-publications/${id}/revisions`);
      const data = await response.json();
      
      if (data.success) {
        setRevisions(data.revisions || []);
      } else {
        console.error('Failed to fetch revision history:', data.message);
      }
    } catch (err) {
      console.error('Error fetching revision history:', err);
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleDownload = async (fileKey: string, fileName: string) => {
    try {
      const encodedFileKey = encodeURIComponent(fileKey);
      const response = await fetch(`/api/technical-publications/attachments/${encodedFileKey}`);
      
      if (response.ok) {
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
      } else {
        setError('Failed to download file');
      }
    } catch (err) {
      setError('Failed to download file');
      console.error('Error downloading file:', err);
    }
  };

  const handleEdit = () => {
    if (publication) {
      setFormData({
        revisionDate: formatDateSafely(publication.revisionDate, 'yyyy-MM-dd'),
        manualDescription: publication.manualDescription,
        revisionNumber: publication.revisionNumber,
        owner: publication.owner,
        comment: publication.comment || '',
        file: undefined
      });
      setIsEditOpen(true);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const submitFormData = new FormData();
      submitFormData.append('revisionDate', formData.revisionDate);
      submitFormData.append('manualDescription', formData.manualDescription);
      submitFormData.append('revisionNumber', formData.revisionNumber);
      submitFormData.append('owner', formData.owner);
      submitFormData.append('comment', formData.comment || '');
      
      // Include new file if selected
      if (formData.file) {
        submitFormData.append('file', formData.file);
      }

      const response = await fetch(`/api/technical-publications/${id}`, {
        method: 'PUT',
        body: submitFormData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(formData.file 
          ? 'Technical publication and attachment updated successfully' 
          : 'Technical publication updated successfully');
        setIsEditOpen(false);
        // Reset form data
        setFormData({
          revisionDate: '',
          manualDescription: '',
          revisionNumber: '',
          owner: '',
          comment: '',
          file: undefined
        });
        await fetchPublication();
        await fetchRevisionHistory(); // Refresh revision history
      } else {
        setError(data.message || 'Failed to update technical publication');
      }
    } catch (err) {
      setError('Failed to update technical publication');
      console.error('Error updating publication:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/technical-publications/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Technical publication deleted successfully');
        // Redirect to the main page after a short delay
        setTimeout(() => {
          router.push('/dashboard/technical-publications');
        }, 1500);
      } else {
        setError(data.message || 'Failed to delete technical publication');
      }
    } catch (err) {
      setError('Failed to delete technical publication');
      console.error('Error deleting publication:', err);
    }
  };

  const handleNotifyUsers = async () => {
    if (!publication) return;
    
    setNotifying(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `New Publication: ${publication.manualDescription} - Rev ${publication.revisionNumber}. Please review the updated documentation.`,
          priority: 'Medium',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Notification sent to all company users successfully');
      } else {
        setError(data.message || 'Failed to send notification');
      }
    } catch (err) {
      setError('Failed to send notification');
      console.error('Error sending notification:', err);
    } finally {
      setNotifying(false);
    }
  };

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleRevisionClick = (revision: any) => {
    setSelectedRevision(revision);
    setIsRevisionDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Loading technical publication...</span>
        </div>
      </div>
    );
  }

  if (!publication) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <h2 className="text-lg font-semibold mb-2">Technical Publication Not Found</h2>
          <p className="text-sm text-gray-600 mb-4">The technical publication you're looking for doesn't exist or has been removed.</p>
          <Button size="sm" onClick={() => router.push('/dashboard/technical-publications')}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to Technical Publications
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      {/* Compact Header */}
      <div className="space-y-3">
        {/* Back Button and Title */}
        <div className="flex items-start gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/technical-publications')}
            className="h-7"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Technical Publication Details
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and manage technical publication information
            </p>
          </div>
        </div>
        
        {/* Compact Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {publication.attachments && publication.attachments.length > 0 && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => handleDownload(
                publication.attachments![0].fileKey,
                publication.attachments![0].fileName
              )}
              className="h-7"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download
            </Button>
          )}
          {isAdmin && (
            <Button 
              variant="outline"
              size="sm"
              onClick={handleNotifyUsers}
              disabled={notifying}
              className="h-7 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
            >
              {notifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Notifying...
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 mr-1.5" />
                  Notify Users
                </>
              )}
            </Button>
          )}
          {isAdmin && (
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleEdit} className="h-7">
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-none">
              <DialogHeader>
                <DialogTitle>Edit Technical Publication</DialogTitle>
                <DialogDescription>
                  Update the technical publication information below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="revisionDate" className="text-sm">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      Revision Date *
                    </Label>
                    <Input
                      id="revisionDate"
                      type="date"
                      value={formData.revisionDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, revisionDate: e.target.value }))}
                      required
                      className="h-9"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="manualDescription" className="text-sm">
                      <FileText className="w-3.5 h-3.5 inline mr-1" />
                      Manual Description *
                    </Label>
                    <Input
                      id="manualDescription"
                      type="text"
                      placeholder="Enter the name of the manual"
                      value={formData.manualDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, manualDescription: e.target.value }))}
                      required
                      className="h-9"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="revisionNumber" className="text-sm">
                      <Hash className="w-3.5 h-3.5 inline mr-1" />
                      Revision Number *
                    </Label>
                    <Input
                      id="revisionNumber"
                      type="text"
                      placeholder="Enter revision number"
                      value={formData.revisionNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, revisionNumber: e.target.value }))}
                      required
                      className="h-9"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="owner" className="text-sm">
                      <User className="w-3.5 h-3.5 inline mr-1" />
                      Owner *
                    </Label>
                    <Input
                      id="owner"
                      type="text"
                      placeholder="Owner's name"
                      value={formData.owner}
                      onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                      required
                      className="h-9"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="comment" className="text-sm">
                    <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                    Comment
                  </Label>
                  <Textarea
                    id="comment"
                    placeholder="Enter any additional comments"
                    value={formData.comment}
                    onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Current Attachment Section */}
                {publication.attachments && publication.attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Current Attachment</Label>
                    <div className="border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{publication.attachments[0].fileName}</span>
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            {(publication.attachments[0].fileSize / (1024 * 1024)).toFixed(1)} MB
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(
                            publication.attachments![0].fileKey,
                            publication.attachments![0].fileName
                          )}
                          className="h-6 text-xs px-2"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Replace Attachment Section */}
                <div className="space-y-2">
                  <Label htmlFor="newFile" className="text-sm">
                    <FileText className="w-3.5 h-3.5 inline mr-1" />
                    {publication.attachments && publication.attachments.length > 0 
                      ? 'Replace Attachment (Optional)' 
                      : 'Add Attachment (Optional)'}
                  </Label>
                  <Input
                    id="newFile"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size (50MB limit)
                        if (file.size > 50 * 1024 * 1024) {
                          setError('File size must be less than 50MB');
                          e.target.value = '';
                          return;
                        }
                        setFormData(prev => ({ ...prev, file }));
                      } else {
                        setFormData(prev => ({ ...prev, file: undefined }));
                      }
                    }}
                    className="h-9 cursor-pointer"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                  />
                  <p className="text-xs text-gray-500">
                    {publication.attachments && publication.attachments.length > 0 
                      ? 'Select a new file to replace the current attachment. Leave empty to keep the current file.'
                      : 'Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, images (Max 50MB)'}
                  </p>
                  {formData.file && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      New file selected: {formData.file.name} ({(formData.file.size / (1024 * 1024)).toFixed(1)} MB)
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditOpen(false)}
                    size="sm"
                    className="h-8"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    size="sm"
                    className="h-8 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Publication'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="h-7">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Technical Publication</AlertDialogTitle>
                  <AlertDialogDescription className="text-red-600">
                    Are you sure you want to delete "{publication.manualDescription} - Rev {publication.revisionNumber}"? 
                    This action cannot be undone and will also delete any associated files.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Compact Alerts */}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 py-2">
          <CheckCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-sm">{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Publication Details */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="py-3 px-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-blue-600" />
                Publication Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Manual Description
                </label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                  {publication.manualDescription}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    Revision Number
                  </label>
                  <Badge variant="secondary" className="mt-1 text-xs px-2 py-0.5">
                    Rev {publication.revisionNumber}
                  </Badge>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Owner
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                    {publication.owner}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Revision Date
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                    {formatDateSafely(publication.revisionDate, 'MMMM dd, yyyy')}
                  </p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Created
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {formatDateSafely(publication.createdAt, 'MMM dd, yyyy \'at\' h:mm a')}
                  </p>
                </div>
              </div>

              {/* Comment Section */}
              {publication.comment && (
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Comment
                  </label>
                  <div className="mt-1 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {publication.comment}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* File Information */}
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="py-3 px-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-green-600" />
                Attached Files
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {publication.attachments && publication.attachments.length > 0 ? (
                <div className="space-y-2">
                  {publication.attachments.map((attachment) => (
                    <div key={attachment.id} className="border rounded-lg p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB • {attachment.fileType}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(attachment.fileKey, attachment.fileName)}
                          className="h-7 px-2"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <FileText className="w-6 h-6 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No files attached</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm">
            <CardHeader className="py-2.5 px-4">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-4 pb-3 pt-0">
              {isAdmin && (
                <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs" onClick={handleEdit}>
                  <Edit className="w-3 h-3 mr-1.5" />
                  Edit Publication
                </Button>
              )}
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start h-7 text-xs"
                  onClick={handleNotifyUsers}
                  disabled={notifying}
                >
                  {notifying ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Notifying...
                    </>
                  ) : (
                    <>
                      <Bell className="w-3 h-3 mr-1.5" />
                      Notify all Users
                    </>
                  )}
                </Button>
              )}
              {publication.attachments && publication.attachments.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start h-7 text-xs"
                  onClick={() => handleDownload(
                    publication.attachments![0].fileKey,
                    publication.attachments![0].fileName
                  )}
                >
                  <Download className="w-3 h-3 mr-1.5" />
                  Download File
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revision History Section */}
      <Card className="shadow-sm">
        <CardHeader className="py-3 px-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-gray-600" />
            Revision History
          </CardTitle>
          <CardDescription className="text-xs">
            Track all changes made to this technical publication
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingRevisions ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading revision history...</span>
            </div>
          ) : revisions.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No revision history available</p>
              <p className="text-xs mt-0.5">Changes will appear here when the publication is updated</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="h-8 bg-gray-50 dark:bg-gray-800/50">
                    <TableHead className="text-xs font-medium">Date & Time</TableHead>
                    <TableHead className="text-xs font-medium">Change Type</TableHead>
                    <TableHead className="text-xs font-medium">Summary</TableHead>
                    <TableHead className="text-xs font-medium">Modified By</TableHead>
                    <TableHead className="text-xs font-medium text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revisions.map((revision) => (
                    <TableRow 
                      key={revision.id} 
                      className="h-9 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors"
                      onClick={() => handleRevisionClick(revision)}
                    >
                      <TableCell className="py-1">
                        <div className="text-xs">
                          <div className="font-medium">
                            {formatDateSafely(revision.modifiedAt, 'MMM dd, yyyy')}
                          </div>
                          <div className="text-gray-500 text-[10px]">
                            {formatDateSafely(revision.modifiedAt, 'h:mm a')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-1">
                        <Badge 
                          variant={
                            revision.changeType === 'ATTACHMENT_REPLACED' ? 'default' :
                            revision.changeType === 'UPDATED' ? 'secondary' :
                            revision.changeType === 'CREATED' ? 'outline' :
                            'secondary'
                          }
                          className="text-[10px] px-1.5 py-0"
                        >
                          {revision.changeType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1">
                        <div className="text-xs">
                          {revision.changeType === 'CREATED' ? (
                            'Publication created'
                          ) : revision.changeType === 'ATTACHMENT_REPLACED' ? (
                            `File replaced: ${revision.attachmentFileName}`
                          ) : (
                            `${Object.keys(revision.changedFields || {}).length} field(s) updated`
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-1">
                        <div className="text-xs">
                          <div className="font-medium">
                            {revision.modifier.firstName} {revision.modifier.lastName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-1 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevisionClick(revision);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revision Detail Modal */}
      <Dialog open={isRevisionDetailOpen} onOpenChange={setIsRevisionDetailOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revision Details</DialogTitle>
            <DialogDescription>
              View what was changed, when it was changed, and who made the changes
            </DialogDescription>
          </DialogHeader>
          
          {selectedRevision && (
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600">Date & Time</Label>
                  <div className="text-sm mt-0.5">
                    <div className="font-medium">
                      {formatDateSafely(selectedRevision.modifiedAt, 'MMMM dd, yyyy')}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {formatDateSafely(selectedRevision.modifiedAt, 'h:mm:ss a')}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium text-gray-600">Change Type</Label>
                  <div className="mt-1">
                    <Badge 
                      variant={
                        selectedRevision.changeType === 'ATTACHMENT_REPLACED' ? 'default' :
                        selectedRevision.changeType === 'UPDATED' ? 'secondary' :
                        selectedRevision.changeType === 'CREATED' ? 'outline' :
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {selectedRevision.changeType.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium text-gray-600">Modified By</Label>
                  <div className="text-sm mt-0.5">
                    <div className="font-medium">
                      {selectedRevision.modifier.firstName} {selectedRevision.modifier.lastName}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {selectedRevision.modifier.email}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium text-gray-600">Description</Label>
                  <div className="text-sm mt-0.5">
                    {selectedRevision.changeDescription}
                  </div>
                </div>
              </div>

              {/* File Changes */}
              {selectedRevision.attachmentAction && (
                <div>
                  <Label className="text-xs font-medium text-gray-600">File Changes</Label>
                  <div className="mt-1.5 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-sm font-medium">
                        File {selectedRevision.attachmentAction.toLowerCase()}: {selectedRevision.attachmentFileName}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Field Changes */}
              {selectedRevision.changedFields && Object.keys(selectedRevision.changedFields).length > 0 && (
                <div>
                  <Label className="text-xs font-medium text-gray-600">Field Changes</Label>
                  <div className="mt-1.5 space-y-2">
                    {Object.entries(selectedRevision.changedFields).map(([field, change]: [string, any]) => (
                      <div key={field} className="border rounded-lg p-2.5">
                        <div className="font-medium text-xs capitalize mb-1.5">{field.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <div className="text-[10px] text-gray-500 mb-0.5">Previous Value</div>
                            <div className="text-xs p-1.5 bg-red-50 dark:bg-red-900/20 rounded border-l-2 border-red-500">
                              {change.old || <span className="italic text-gray-400">empty</span>}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500 mb-0.5">New Value</div>
                            <div className="text-xs p-1.5 bg-green-50 dark:bg-green-900/20 rounded border-l-2 border-green-500">
                              {change.new || <span className="italic text-gray-400">empty</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Publication Summary */}
              {selectedRevision.changeType !== 'CREATED' && selectedRevision.previousValues && (
                <div>
                  <Label className="text-xs font-medium text-gray-600">Complete Publication Summary</Label>
                  <div className="mt-1.5 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] text-gray-500 mb-1">Before Changes</div>
                      <div className="text-xs p-3 bg-red-50 dark:bg-red-900/20 rounded border-l-4 border-red-500 space-y-1">
                        <div><span className="font-medium">Owner:</span> {selectedRevision.previousValues.owner}</div>
                        <div><span className="font-medium">Revision Number:</span> {selectedRevision.previousValues.revisionNumber}</div>
                        <div><span className="font-medium">Manual Description:</span> {selectedRevision.previousValues.manualDescription}</div>
                        <div><span className="font-medium">Revision Date:</span> {selectedRevision.previousValues.revisionDate}</div>
                        <div><span className="font-medium">Comment:</span> {selectedRevision.previousValues.comment || 'No comment'}</div>
                        {selectedRevision.previousValues.attachments && selectedRevision.previousValues.attachments.length > 0 && (
                          <div>
                            <span className="font-medium">Attached Files:</span>
                            <ul className="mt-0.5 ml-3 space-y-0.5">
                              {selectedRevision.previousValues.attachments.map((attachment: any, index: number) => (
                                <li key={index} className="text-[11px]">
                                  • {attachment.fileName} ({(attachment.fileSize / (1024 * 1024)).toFixed(1)} MB)
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 mb-1">After Changes</div>
                      <div className="text-xs p-3 bg-green-50 dark:bg-green-900/20 rounded border-l-4 border-green-500 space-y-1">
                        <div><span className="font-medium">Owner:</span> {selectedRevision.newValues.owner}</div>
                        <div><span className="font-medium">Revision Number:</span> {selectedRevision.newValues.revisionNumber}</div>
                        <div><span className="font-medium">Manual Description:</span> {selectedRevision.newValues.manualDescription}</div>
                        <div><span className="font-medium">Revision Date:</span> {selectedRevision.newValues.revisionDate}</div>
                        <div><span className="font-medium">Comment:</span> {selectedRevision.newValues.comment || 'No comment'}</div>
                        {selectedRevision.newValues.attachments && selectedRevision.newValues.attachments.length > 0 && (
                          <div>
                            <span className="font-medium">Attached Files:</span>
                            <ul className="mt-0.5 ml-3 space-y-0.5">
                              {selectedRevision.newValues.attachments.map((attachment: any, index: number) => (
                                <li key={index} className="text-[11px]">
                                  • {attachment.fileName} ({(attachment.fileSize / (1024 * 1024)).toFixed(1)} MB)
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
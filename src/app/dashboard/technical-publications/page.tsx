'use client';

import React, { useState, useEffect } from 'react';
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
  Plus, 
  FileText, 
  Download, 
  Edit, 
  Trash2, 
  Upload, 
  Calendar, 
  User, 
  Hash,
  AlertCircle,
  CheckCircle,
  Loader2,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { formatDateSafely } from '@/lib/utils';
import { TechnicalPublication, TechnicalPublicationFormData } from '@/types/technical-publications';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function TechnicalPublicationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [publications, setPublications] = useState<TechnicalPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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

  // Fetch publications on component mount
  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/technical-publications');
      const data = await response.json();
      
      if (data.success) {
        setPublications(data.records || []);
      } else {
        setError(data.message || 'Failed to fetch technical publications');
      }
    } catch (err) {
      setError('Failed to fetch technical publications');
      console.error('Error fetching publications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
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
      
      if (isEditMode && editingId) {
        submitFormData.append('id', editingId);
      } else if (formData.file) {
        submitFormData.append('file', formData.file);
      }

      const url = isEditMode && editingId 
        ? `/api/technical-publications/${editingId}` 
        : '/api/technical-publications';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: submitFormData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Technical publication saved successfully');
        setIsFormOpen(false);
        resetForm();
        await fetchPublications();
      } else {
        setError(data.message || 'Failed to save technical publication');
      }
    } catch (err) {
      setError('Failed to save technical publication');
      console.error('Error saving publication:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      revisionDate: '',
      manualDescription: '',
      revisionNumber: '',
      owner: '',
      comment: '',
      file: undefined
    });
    setIsEditMode(false);
    setEditingId(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        e.target.value = '';
        return;
      }
      setFormData(prev => ({ ...prev, file }));
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

  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Technical Publications
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage company manuals, revisions, and documentation
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 bg-black hover:bg-gray-800 text-white">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Publication
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-none">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? 'Edit Technical Publication' : 'Add New Technical Publication'}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode 
                    ? 'Update the technical publication information below.' 
                    : 'Fill in the details below to add a new technical publication.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleFormSubmit} className="space-y-4">
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
                
                {!isEditMode && (
                  <div className="space-y-2">
                    <Label htmlFor="file" className="text-sm">
                      <Upload className="w-3.5 h-3.5 inline mr-1" />
                      Upload File * (Max 50MB)
                    </Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      required
                      className="h-9 cursor-pointer"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                    />
                    <p className="text-xs text-gray-500">
                      Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, images
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleFormClose}
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
                        {isEditMode ? 'Updating...' : 'Saving...'}
                      </>
                    ) : (
                      isEditMode ? 'Update Publication' : 'Save Publication'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
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

      {/* Compact Publications List */}
      <Card className="shadow-sm">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <CardTitle className="text-base">Technical Publications</CardTitle>
            </div>
            <CardDescription className="text-sm">
              {publications.length} publication{publications.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading publications...</span>
            </div>
          ) : publications.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No technical publications yet</p>
              <p className="text-xs mt-1">Click "Add Publication" to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="h-9 bg-gray-50 dark:bg-gray-800/50">
                    <TableHead className="font-medium text-xs">Manual Description</TableHead>
                    <TableHead className="font-medium text-xs">Revision</TableHead>
                    <TableHead className="font-medium text-xs">Owner</TableHead>
                    <TableHead className="font-medium text-xs">Date</TableHead>
                    <TableHead className="font-medium text-xs text-center">File</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publications.map((publication) => (
                    <TableRow key={publication.id} className="h-10 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <TableCell className="py-2">
                        <button
                          onClick={() => router.push(`/dashboard/technical-publications/${publication.id}`)}
                          className="text-left text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm flex items-center gap-1.5 group underline"
                        >
                          <span className="truncate max-w-[300px]">{publication.manualDescription}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          Rev {publication.revisionNumber}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-sm text-gray-700 dark:text-gray-300">
                        {publication.owner}
                      </TableCell>
                      <TableCell className="py-2 text-sm text-gray-600 dark:text-gray-400">
                        {formatDateSafely(publication.revisionDate, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        {publication.attachments && publication.attachments.length > 0 ? (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                            <FileText className="w-3 h-3 mr-1" />
                            Available
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
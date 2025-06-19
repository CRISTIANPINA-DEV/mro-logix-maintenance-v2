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
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Technical Publications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage company manuals, revisions, and documentation
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-white hover:bg-gray-50 text-black border-black border">
                <Plus className="w-4 h-4 mr-2" />
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
                    <Label htmlFor="revisionDate">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Revision Date *
                    </Label>
                    <Input
                      id="revisionDate"
                      type="date"
                      value={formData.revisionDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, revisionDate: e.target.value }))}
                      required
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="manualDescription">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Manual Description *
                    </Label>
                    <Input
                      id="manualDescription"
                      type="text"
                      placeholder="Enter the name of the manual"
                      value={formData.manualDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, manualDescription: e.target.value }))}
                      required
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="revisionNumber">
                      <Hash className="w-4 h-4 inline mr-1" />
                      Revision Number *
                    </Label>
                    <Input
                      id="revisionNumber"
                      type="text"
                      placeholder="Enter revision number"
                      value={formData.revisionNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, revisionNumber: e.target.value }))}
                      required
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="owner">
                      <User className="w-4 h-4 inline mr-1" />
                      Owner *
                    </Label>
                    <Input
                      id="owner"
                      type="text"
                      placeholder="Owner's name"
                      value={formData.owner}
                      onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                      required
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="comment">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Comment
                  </Label>
                  <Textarea
                    id="comment"
                    placeholder="Enter any additional comments"
                    value={formData.comment}
                    onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full"
                  />
                </div>
                
                {!isEditMode && (
                  <div className="space-y-2">
                    <Label htmlFor="file">
                      <Upload className="w-4 h-4 inline mr-1" />
                      Upload File * (Max 50MB)
                    </Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      required
                      className="w-full"
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
                    className="w-full sm:w-auto h-8"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full sm:w-auto bg-green-100 hover:bg-green-200 border-green-600 text-black border h-8"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Publications List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Technical Publications
          </CardTitle>
          <CardDescription>
            {publications.length === 0 
              ? 'No technical publications found. Add your first publication above.' 
              : `${publications.length} publication${publications.length !== 1 ? 's' : ''} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading publications...
            </div>
          ) : publications.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No technical publications yet</p>
              <p className="text-sm">Click "Add Publication" to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="h-10">
                    <TableHead className="min-w-[200px] h-10">Manual Description</TableHead>
                    <TableHead className="min-w-[120px] h-10">Revision</TableHead>
                    <TableHead className="min-w-[150px] h-10">Owner</TableHead>
                    <TableHead className="min-w-[120px] h-10">Date</TableHead>
                    <TableHead className="min-w-[100px] h-10">File</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publications.map((publication) => (
                    <TableRow key={publication.id} className="h-12">
                      <TableCell className="font-medium py-2">
                        <button
                          onClick={() => router.push(`/dashboard/technical-publications/${publication.id}`)}
                          className="text-left text-blue-600 underline hover:text-blue-800 transition-colors flex items-center gap-2"
                        >
                          {publication.manualDescription}
                          <ExternalLink className="w-4 h-4 opacity-50" />
                        </button>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="secondary">
                          Rev {publication.revisionNumber}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">{publication.owner}</TableCell>
                      <TableCell className="py-2">
                        {formatDateSafely(publication.revisionDate, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="py-2">
                        {publication.attachments && publication.attachments.length > 0 && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>Available</span>
                          </div>
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
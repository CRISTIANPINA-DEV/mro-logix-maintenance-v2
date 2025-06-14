"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, ArrowLeft, AlertCircle, FileText, Trash2, Download } from "lucide-react";
import { format } from "date-fns";

interface Training {
  id: string;
  date: string;
  technician: string;
  organization: string;
  customOrg: string | null;
  type: string;
  customType: string | null;
  training: string;
  hasEngine: boolean;
  engineType: string | null;
  hasHours: boolean;
  hours: number | null;
  hasComment: boolean;
  comment: string | null;
  hasAttachments: boolean;
  Attachment: Array<{
    id: string;
    fileName: string;
    fileKey: string;
    fileSize: number;
    fileType: string;
  }>;
}

export default function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [training, setTraining] = useState<Training | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (shouldRedirect) {
      const timeout = setTimeout(() => {
        router.push('/dashboard/technician-training');
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [shouldRedirect, router]);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (id) {
      fetchTraining();
    }
  }, [id]);

  const fetchTraining = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/technician-training/${id}`);
      const data = await response.json();
      if (response.ok) {
        setTraining(data);
      } else {
        setError(data.error || "Failed to fetch training details");
        setShouldRedirect(true);
      }
    } catch (err) {
      setError("Failed to fetch training details");
      setShouldRedirect(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/technician-training/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Training record deleted successfully");
        setTimeout(() => {
          router.push(`/dashboard/technician-training/${encodeURIComponent(training?.technician || '')}`);
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete training record");
      }
    } catch (err) {
      setError("Failed to delete training record");
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDownload = async (fileKey: string, fileName: string) => {
    try {
      const response = await fetch(`/api/technician-training/download/${fileKey}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError("Failed to download file");
      }
    } catch (err) {
      setError("Failed to download file");
    }
  };

  if (loading && !training) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!training) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Training record not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="neutral" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Training Details</h1>
        </div>
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogTrigger asChild>
            <Button variant="delete">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Training
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Training Record</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this training record? This action cannot be undone.
                All associated attachments will also be deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="neutral" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="delete" onClick={handleDelete} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Training Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Date</h3>
              <p>{format(new Date(training.date), "MMMM d, yyyy")}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Technician</h3>
              <p>{training.technician}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Organization</h3>
              <p>{training.customOrg || training.organization}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Type</h3>
              <p>{training.customType || training.type}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Training</h3>
              <p>{training.training}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {training.hasEngine && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Engine Type</h3>
                <p>{training.engineType}</p>
              </div>
            )}
            {training.hasHours && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Hours</h3>
                <p>{training.hours}</p>
              </div>
            )}
            {training.hasComment && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Comment</h3>
                <p className="whitespace-pre-wrap">{training.comment}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {training.hasAttachments && training.Attachment.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {training.Attachment.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{file.fileName}</span>
                      <span className="text-sm text-muted-foreground">
                        ({(file.fileSize / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() => handleDownload(file.fileKey, file.fileName)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 
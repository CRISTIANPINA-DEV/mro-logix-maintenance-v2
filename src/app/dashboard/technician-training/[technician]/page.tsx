"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, AlertCircle, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface Training {
  id: string;
  date: string;
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

export default function TechnicianTrainingsPage({
  params,
}: {
  params: Promise<{ technician: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const { technician } = use(params);
  const decodedTechnician = decodeURIComponent(technician);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/technician-training?technician=${encodeURIComponent(decodedTechnician)}`
      );
      const data = await response.json();
      if (response.ok) {
        setTrainings(data.trainings);
      } else {
        setError(data.error || "Failed to fetch trainings");
      }
    } catch (err) {
      setError("Failed to fetch trainings");
    } finally {
      setLoading(false);
    }
  };

  const handleTrainingClick = (trainingId: string) => {
    router.push(`/dashboard/technician-training/training/${trainingId}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="neutral" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Trainings for {decodedTechnician}</h1>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Training Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Training</TableHead>
                  <TableHead>Engine Type</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Attachments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainings.map((training) => (
                  <TableRow
                    key={training.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleTrainingClick(training.id)}
                  >
                    <TableCell>{format(new Date(training.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{training.customOrg || training.organization}</TableCell>
                    <TableCell>{training.customType || training.type}</TableCell>
                    <TableCell>{training.training}</TableCell>
                    <TableCell>{training.hasEngine ? training.engineType : "N/A"}</TableCell>
                    <TableCell>{training.hasHours ? training.hours : "N/A"}</TableCell>
                    <TableCell>
                      {training.hasAttachments && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {training.Attachment.length}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {trainings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No training records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
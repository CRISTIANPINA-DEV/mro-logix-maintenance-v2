"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, FileText, AlertCircle, User } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const organizations = [
  "FlightTech",
  "MRO-R",
  "FLightLine",
  "TechCenter",
  "LineTech",
  "Avio Academy",
  "Aero-Tech",
  "Aircraft Technik",
  "Other",
];

const trainingTypes = ["Initial", "Recurrent", "N/A", "Other"];

interface TechnicianTrainingCount {
  technician: string;
  trainingCount: number;
}

export default function TechnicianTrainingPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    technician: "",
    organization: "",
    customOrg: "",
    type: "",
    customType: "",
    training: "",
    hasEngine: "No",
    engineType: "",
    hasHours: "No",
    hours: "",
    hasComment: "No",
    comment: "",
    hasAttachments: "No",
    attachments: [] as File[],
  });
  const [technicians, setTechnicians] = useState<TechnicianTrainingCount[]>([]);

  useEffect(() => {
    fetchTrainings();
    fetchTechnicians();
  }, [currentPage]);

  const fetchTrainings = async () => {
    try {
      const response = await fetch(
        `/api/technician-training?page=${currentPage}&limit=10`
      );
      const data = await response.json();
      if (response.ok) {
        setTrainings(data.trainings);
        setTotalPages(data.totalPages);
      } else {
        setError(data.error || "Failed to fetch trainings");
      }
    } catch (err) {
      setError("Failed to fetch trainings");
    }
  };

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/technician-training/technicians");
      const data = await response.json();
      if (response.ok) {
        setTechnicians(data);
      } else {
        setError(data.error || "Failed to fetch technicians");
      }
    } catch (err) {
      setError("Failed to fetch technicians");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({
        ...prev,
        attachments: Array.from(e.target.files || []),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataToSend = new FormData();
      
      // Convert Yes/No strings to boolean values
      const booleanFields = ['hasEngine', 'hasHours', 'hasComment', 'hasAttachments'];
      const processedData = {
        ...formData,
        hasEngine: formData.hasEngine === "Yes",
        hasHours: formData.hasHours === "Yes",
        hasComment: formData.hasComment === "Yes",
        hasAttachments: formData.hasAttachments === "Yes",
      };

      // Only append non-empty values
      Object.entries(processedData).forEach(([key, value]) => {
        if (key === "attachments" && Array.isArray(value)) {
          value.forEach((file: File) => {
            formDataToSend.append("attachments", file);
          });
        } else if (key === "hours" && value) {
          formDataToSend.append(key, value.toString());
        } else if (key === "customOrg" && value && processedData.organization === "Other") {
          formDataToSend.append(key, value.toString());
        } else if (key === "customType" && value && processedData.type === "Other") {
          formDataToSend.append(key, value.toString());
        } else if (key === "engineType" && value && processedData.hasEngine) {
          formDataToSend.append(key, value.toString());
        } else if (key === "comment" && value && processedData.hasComment) {
          formDataToSend.append(key, value.toString());
        } else if (!["customOrg", "customType", "engineType", "comment", "hours"].includes(key)) {
          formDataToSend.append(key, value.toString());
        }
      });

      const response = await fetch("/api/technician-training", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Training record created successfully");
        setShowForm(false);
        setFormData({
          date: format(new Date(), "yyyy-MM-dd"),
          technician: "",
          organization: "",
          customOrg: "",
          type: "",
          customType: "",
          training: "",
          hasEngine: "No",
          engineType: "",
          hasHours: "No",
          hours: "",
          hasComment: "No",
          comment: "",
          hasAttachments: "No",
          attachments: [],
        });
        // Refresh the page immediately to ensure all data is updated
        window.location.reload();
      } else {
        setError(data.error?.message || data.error || "Failed to create training record");
      }
    } catch (err) {
      setError("Failed to create training record");
    } finally {
      setLoading(false);
    }
  };

  const handleTechnicianClick = (technician: string) => {
    router.push(`/dashboard/technician-training/${encodeURIComponent(technician)}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Technician Training</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Training
        </Button>
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

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Training</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technician">Technician</Label>
                  <Input
                    id="technician"
                    name="technician"
                    value={formData.technician}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Select
                    value={formData.organization}
                    onValueChange={(value) => handleSelectChange("organization", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org} value={org}>
                          {org}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.organization === "Other" && (
                    <Input
                      placeholder="Specify organization"
                      value={formData.customOrg}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customOrg: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainingTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.type === "Other" && (
                    <Input
                      placeholder="Specify type"
                      value={formData.customType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customType: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="training">Training</Label>
                  <Input
                    id="training"
                    name="training"
                    value={formData.training}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hasEngine">Engine Training?</Label>
                  <Select
                    value={formData.hasEngine}
                    onValueChange={(value) => handleSelectChange("hasEngine", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.hasEngine === "Yes" && (
                    <Input
                      placeholder="Engine type"
                      value={formData.engineType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          engineType: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hasHours">Training Hours?</Label>
                  <Select
                    value={formData.hasHours}
                    onValueChange={(value) => handleSelectChange("hasHours", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.hasHours === "Yes" && (
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Hours"
                      value={formData.hours}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hours: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hasComment">Add Comment?</Label>
                  <Select
                    value={formData.hasComment}
                    onValueChange={(value) => handleSelectChange("hasComment", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.hasComment === "Yes" && (
                    <Textarea
                      placeholder="Enter comment"
                      value={formData.comment}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hasAttachments">Add Attachments?</Label>
                  <Select
                    value={formData.hasAttachments}
                    onValueChange={(value) =>
                      handleSelectChange("hasAttachments", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.hasAttachments === "Yes" && (
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Training
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Technicians</CardTitle>
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
                  <TableHead>Technician</TableHead>
                  <TableHead className="text-right">Total Trainings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicians.map((tech) => (
                  <TableRow
                    key={tech.technician}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleTechnicianClick(tech.technician)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {tech.technician}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{tech.trainingCount}</TableCell>
                  </TableRow>
                ))}
                {technicians.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No technicians found
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
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCw, History, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface WheelRotation {
  id: string;
  arrivalDate: string;
  station: string;
  airline: string;
  wheelPartNumber: string;
  wheelSerialNumber: string;
  currentPosition: number;
  rotationFrequency: string;
  lastRotationDate: string | null;
  nextRotationDue: string | null;
  isActive: boolean;
  notes: string | null;
  rotationHistory: any[];
}

interface WheelDetailsModalProps {
  wheel: WheelRotation;
  isOpen: boolean;
  onClose: () => void;
}

export default function WheelDetailsModal({ wheel, isOpen, onClose }: WheelDetailsModalProps) {
  const [showRotateForm, setShowRotateForm] = useState(false);
  const [newPosition, setNewPosition] = useState<string>("");
  const [rotationNotes, setRotationNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [wheelData, setWheelData] = useState<WheelRotation>(wheel);

  // Fetch latest wheel data
  useEffect(() => {
    const fetchWheelData = async () => {
      try {
        const response = await fetch(`/api/wheel-rotation/${wheel.id}`);
        if (response.ok) {
          const data = await response.json();
          setWheelData(data);
        }
      } catch (error) {
        console.error("Error fetching wheel data:", error);
      }
    };

    if (isOpen) {
      fetchWheelData();
    }
  }, [wheel.id, isOpen]);

  const handleRotate = async () => {
    const position = parseFloat(newPosition);
    if (isNaN(position) || position < 0 || position >= 360) {
      toast.error("Please enter a valid position between 0 and 359 degrees");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/wheel-rotation/${wheel.id}/rotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPosition: position,
          notes: rotationNotes,
        }),
      });

      if (response.ok) {
        toast.success("Wheel rotated successfully");
        setShowRotateForm(false);
        setNewPosition("");
        setRotationNotes("");
        
        // Refresh wheel data
        const updatedResponse = await fetch(`/api/wheel-rotation/${wheel.id}`);
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          setWheelData(updatedData);
        }
      } else {
        throw new Error("Failed to rotate wheel");
      }
    } catch (error) {
      toast.error("Error rotating wheel");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/wheel-rotation/${wheel.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Wheel deleted successfully");
        setShowDeleteConfirm(false);
        onClose(); // Close the modal
      } else {
        throw new Error("Failed to delete wheel");
      }
    } catch (error) {
      toast.error("Error deleting wheel");
      console.error("Error:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Wheel visualization component
  const WheelVisualization = ({ position }: { position: number }) => {
    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Wheel circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-300"
          />
          
          {/* Position markers */}
          {[0, 90, 180, 270].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 100 100)`}>
              <line
                x1="100"
                y1="10"
                x2="100"
                y2="20"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-400"
              />
              <text
                x="100"
                y="35"
                textAnchor="middle"
                className="fill-current text-xs text-gray-600"
                transform={`rotate(${-deg} 100 35)`}
              >
                {deg}°
              </text>
            </g>
          ))}
          
          {/* Current position indicator */}
          <g transform={`rotate(${position} 100 100)`}>
            <line
              x1="100"
              y1="30"
              x2="100"
              y2="90"
              stroke="currentColor"
              strokeWidth="4"
              className="text-orange-500"
              markerEnd="url(#arrowhead)"
            />
          </g>
          
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="0"
              refY="3"
              orient="auto"
              className="fill-current text-orange-500"
            >
              <polygon points="0 0, 6 3, 0 6" />
            </marker>
          </defs>
          
          {/* Center dot */}
          <circle cx="100" cy="100" r="5" className="fill-current text-gray-600" />
        </svg>
        
        {/* Position label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Badge className="bg-orange-100 text-orange-700">
            {position}°
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Wheel Details - {wheelData.wheelSerialNumber}</DialogTitle>
                <DialogDescription>
                  {wheelData.airline} | P/N: {wheelData.wheelPartNumber} | Station: {wheelData.station}
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Current Status</TabsTrigger>
              <TabsTrigger value="history">Rotation History</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4">
              {/* Wheel Visualization */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-center">Current Position</h3>
                <WheelVisualization position={wheelData.currentPosition} />
              </Card>

              {/* Wheel Information */}
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Arrival Date</Label>
                    <p className="font-medium">
                      {format(new Date(wheelData.arrivalDate), "PPP")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Rotation Frequency</Label>
                    <p className="font-medium capitalize">{wheelData.rotationFrequency}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Rotation</Label>
                    <p className="font-medium">
                      {wheelData.lastRotationDate
                        ? format(new Date(wheelData.lastRotationDate), "PPP")
                        : "Not rotated yet"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Next Rotation Due</Label>
                    <p className="font-medium">
                      {wheelData.nextRotationDue
                        ? format(new Date(wheelData.nextRotationDue), "PPP")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Station</Label>
                    <p className="font-medium">{wheelData.station}</p>
                  </div>
                </div>
                {wheelData.notes && (
                  <div className="mt-4">
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="font-medium">{wheelData.notes}</p>
                  </div>
                )}
              </Card>

              {/* Rotate Form */}
              {!showRotateForm ? (
                <div className="flex justify-center">
                  <Button
                    onClick={() => setShowRotateForm(true)}
                    className="flex items-center gap-2"
                  >
                    <RotateCw className="h-4 w-4" />
                    Rotate Wheel
                  </Button>
                </div>
              ) : (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Rotate Wheel</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newPosition">New Position (degrees)</Label>
                      <Input
                        id="newPosition"
                        type="number"
                        min="0"
                        max="359"
                        value={newPosition}
                        onChange={(e) => setNewPosition(e.target.value)}
                        placeholder="Enter position in degrees (0-359)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rotationNotes">Notes (optional)</Label>
                      <Textarea
                        id="rotationNotes"
                        value={rotationNotes}
                        onChange={(e) => setRotationNotes(e.target.value)}
                        placeholder="Add any notes about this rotation"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRotateForm(false);
                          setNewPosition("");
                          setRotationNotes("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleRotate} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Rotation
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Rotation History
                  </h3>
                  {wheelData.rotationHistory && wheelData.rotationHistory.length > 0 ? (
                    <div className="space-y-3">
                      {wheelData.rotationHistory.map((history, index) => (
                        <div
                          key={history.id}
                          className="border-l-2 border-orange-200 pl-4 pb-3 last:pb-0"
                        >
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{format(new Date(history.rotationDate), "PPP")}</span>
                            {history.performedBy && (
                              <span>• By {history.performedBy}</span>
                            )}
                          </div>
                          <div className="font-medium">
                            Rotated from {history.previousPosition}° to {history.newPosition}°
                          </div>
                          {history.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {history.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No rotation history available
                    </p>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Wheel Record</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Are you sure you want to delete this wheel rotation record for <strong>{wheelData.wheelSerialNumber}</strong>?
                </p>
                <p className="mt-4">This action will permanently delete:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All wheel information and settings</li>
                  <li>Complete rotation history</li>
                  <li>All associated notes and data</li>
                </ul>
                <p className="mt-4">
                  <strong>This action cannot be undone.</strong>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 
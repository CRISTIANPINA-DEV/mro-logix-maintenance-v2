"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { RotateCw } from "lucide-react";

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

interface WheelRotationListProps {
  wheelRotations: WheelRotation[];
  onWheelClick: (wheel: WheelRotation) => void;
}

export default function WheelRotationList({ wheelRotations, onWheelClick }: WheelRotationListProps) {
  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      weekly: "Weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      biannually: "Biannually",
      annually: "Annually",
    };
    return labels[frequency] || frequency;
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueBadge = (dueDate: string | null) => {
    const days = getDaysUntilDue(dueDate);
    if (days === null) return null;
    
    if (days < 0) {
      return <Badge variant="destructive">Overdue by {Math.abs(days)} days</Badge>;
    } else if (days <= 7) {
      return <Badge variant="destructive">Due in {days} days</Badge>;
    } else if (days <= 30) {
      return <Badge variant="secondary">Due in {days} days</Badge>;
    }
    return null;
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Arrival Date</TableHead>
            <TableHead>Station</TableHead>
            <TableHead>Airline</TableHead>
            <TableHead>Wheel P/N</TableHead>
            <TableHead>Wheel S/N</TableHead>
            <TableHead>Current Position</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Last Rotation</TableHead>
            <TableHead>Next Due</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wheelRotations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                No wheels added for rotation tracking yet
              </TableCell>
            </TableRow>
          ) : (
            wheelRotations.map((wheel) => (
              <TableRow
                key={wheel.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onWheelClick(wheel)}
              >
                <TableCell>{format(new Date(wheel.arrivalDate), "PP")}</TableCell>
                <TableCell>{wheel.station}</TableCell>
                <TableCell>{wheel.airline}</TableCell>
                <TableCell>{wheel.wheelPartNumber}</TableCell>
                <TableCell className="font-mono">{wheel.wheelSerialNumber}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <RotateCw className="h-4 w-4 text-muted-foreground" />
                    {wheel.currentPosition}°
                  </div>
                </TableCell>
                <TableCell>{getFrequencyLabel(wheel.rotationFrequency)}</TableCell>
                <TableCell>
                  {wheel.lastRotationDate
                    ? format(new Date(wheel.lastRotationDate), "PP")
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {wheel.nextRotationDue && (
                      <div className="text-sm">
                        {format(new Date(wheel.nextRotationDue), "PP")}
                      </div>
                    )}
                    {getDueBadge(wheel.nextRotationDue)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={wheel.isActive ? "default" : "secondary"}>
                    {wheel.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
} 
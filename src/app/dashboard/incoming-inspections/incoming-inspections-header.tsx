"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IncomingInspectionsHeaderProps {
  onAddNew: () => void;
}

export function IncomingInspectionsHeader({ onAddNew }: IncomingInspectionsHeaderProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incoming Inspections</h1>
          <p className="text-muted-foreground">
            Manage and track incoming part inspections
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={onAddNew}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Inspection
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Create a new incoming inspection record</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
} 
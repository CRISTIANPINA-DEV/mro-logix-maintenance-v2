"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface IncomingInspectionsHeaderProps {
  onAddNew: () => void;
}

const IncomingInspectionsHeader: React.FC<IncomingInspectionsHeaderProps> = ({ onAddNew }) => {
  const { permissions, loading } = useUserPermissions();

  // Don't show buttons if permissions are still loading
  if (loading) {
    return (
      <Card className="w-full mb-6">
        <header>
          <div className="w-full max-w-full mx-auto px-4">
            <div className="flex h-16 items-center justify-between w-full">
              <div>
                              <h1 className="text-2xl font-bold">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={24} strokeWidth={1.5} style={{ color: '#3B2900' }} />
                  <Badge className="px-3 py-1 text-base rounded-[4px] shadow-md" style={{ backgroundColor: '#EFDFBB', color: '#3B2900', borderColor: '#3B2900' }}>Incoming Inspections</Badge>
                </div>
              </h1>
              </div>
            </div>
          </div>
        </header>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-6">
      <header>
        <div className="w-full max-w-full mx-auto px-4">
          <div className="flex h-16 items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-bold">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={24} strokeWidth={1.5} style={{ color: '#3B2900' }} />
                  <Badge className="px-3 py-1 text-base rounded-[4px] shadow-md" style={{ backgroundColor: '#EFDFBB', color: '#3B2900', borderColor: '#3B2900' }}>Incoming Inspections</Badge>
                </div>
              </h1>
            </div>
            
            {permissions?.canAddIncomingInspections && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={onAddNew}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add New Inspection
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create a new incoming inspection record</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </header>
    </Card>
  );
};

export { IncomingInspectionsHeader }; 
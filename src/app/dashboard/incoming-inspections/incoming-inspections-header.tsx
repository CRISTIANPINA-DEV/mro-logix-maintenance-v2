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
      <TooltipProvider>
        {/* Mobile: Separate card for title */}
        <Card className="w-full mb-4 sm:hidden rounded-none">
          <header>
            <div className="w-full max-w-full mx-auto px-3">
              <div className="flex justify-center items-center min-h-12 py-2">
                <div className="text-center">
                  <h1 className="text-xl font-bold">
                    <div className="flex items-center justify-center gap-1.5">
                      <ClipboardCheck size={20} strokeWidth={1.5} className="text-purple-500" />
                      <Badge className="px-2 py-0.5 text-sm bg-purple-500 text-white rounded-none border border-black shadow-md">Incoming Inspections</Badge>
                    </div>
                  </h1>
                </div>
              </div>
            </div>
          </header>
        </Card>

        {/* Desktop: Combined layout */}
        <Card className="w-full mb-6 hidden sm:block rounded-none">
          <header>
            <div className="w-full max-w-full mx-auto px-4">
              <div className="flex flex-row h-16 items-center justify-between w-full">
                <div>
                  <h1 className="text-2xl font-bold">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck size={24} strokeWidth={1.5} className="text-purple-500" />
                      <Badge className="px-3 py-1 text-base bg-purple-500 text-white rounded-none border border-black shadow-md">Incoming Inspections</Badge>
                    </div>
                  </h1>
                </div>
              </div>
            </div>
          </header>
        </Card>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      {/* Mobile: Separate card for title */}
      <Card className="w-full mb-3 sm:hidden rounded-none">
        <header>
          <div className="w-full max-w-full mx-auto px-3">
            <div className="flex justify-center items-center min-h-12 py-2">
              <div className="text-center">
                <h1 className="text-xl font-bold">
                  <div className="flex items-center justify-center gap-1.5">
                    <ClipboardCheck size={20} strokeWidth={1.5} className="text-purple-500" />
                    <Badge className="px-2 py-0.5 text-sm bg-purple-500 text-white rounded-none border border-black shadow-md">Incoming Inspections</Badge>
                  </div>
                </h1>
              </div>
            </div>
          </div>
        </header>
      </Card>

      {/* Mobile: Separate card for buttons */}
      <Card className="w-full mb-4 sm:hidden rounded-none">
        <div className="w-full max-w-full mx-auto px-3">
          <div className="flex justify-center items-center min-h-10 py-2">
            <div className="flex flex-wrap justify-center gap-2">
              {permissions?.canAddIncomingInspections && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={onAddNew}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs flex items-center gap-1.5 bg-white text-black border-black hover:bg-gray-100 cursor-pointer font-normal rounded"
                    >
                      <Plus size={14} />
                      Add Inspection
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create a new incoming inspection record</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Desktop: Combined layout */}
      <Card className="w-full mb-6 hidden sm:block rounded-none">
        <header>
          <div className="w-full max-w-full mx-auto px-4">
            <div className="flex flex-row h-16 items-center justify-between w-full">
              <div>
                <h1 className="text-2xl font-bold">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck size={24} strokeWidth={1.5} className="text-purple-500" />
                    <Badge className="px-3 py-1 text-base bg-purple-500 text-white rounded-none border border-black shadow-md">Incoming Inspections</Badge>
                  </div>
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Manage and track incoming part inspections
                </p>
              </div>
              <div className="flex gap-3">
                {permissions?.canAddIncomingInspections && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={onAddNew}
                        variant="outline"
                        size="sm"
                        className="h-8 flex items-center gap-2 bg-white text-black border-black hover:bg-gray-100 cursor-pointer font-normal rounded"
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
          </div>
        </header>
      </Card>
    </TooltipProvider>
  );
};

export { IncomingInspectionsHeader }; 
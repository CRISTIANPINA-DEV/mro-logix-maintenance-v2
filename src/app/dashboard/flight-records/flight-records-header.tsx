"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Plane, PlusCircle, FileSpreadsheet } from "lucide-react"; 
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface FlightRecordsHeaderProps {
  showForm: boolean;
  onAddFlightClick: () => void;
}

const FlightRecordsHeader: React.FC<FlightRecordsHeaderProps> = ({ showForm, onAddFlightClick }) => {
  const { permissions, loading } = useUserPermissions();

  // Don't show buttons if permissions are still loading
  if (loading) {
    return (
      <Card className="w-full mb-6">
        <header>
          <div className="w-full max-w-full mx-auto px-4">
            <div className="flex flex-col sm:flex-row min-h-16 py-3 sm:py-0 sm:h-16 items-start sm:items-center justify-between w-full gap-3 sm:gap-0">
              <div className="w-full sm:w-auto">
                <h1 className="text-xl sm:text-2xl font-bold">
                  <div className="flex items-center gap-2">
                    <Plane size={20} strokeWidth={1.5} className="text-green-500 sm:size-6" />
                    <Badge className="px-2 py-1 text-sm sm:px-3 sm:py-1 sm:text-base bg-green-100 text-green-600 rounded-[4px] border border-green-500 shadow-md">Flight Records</Badge>
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
    <TooltipProvider>
      <Card className="w-full mb-6">
        <header>
          <div className="w-full max-w-full mx-auto px-4">
            <div className="flex flex-col sm:flex-row min-h-16 py-3 sm:py-0 sm:h-16 items-start sm:items-center justify-between w-full gap-3 sm:gap-0">
              <div className="w-full sm:w-auto">
                <h1 className="text-xl sm:text-2xl font-bold">
                  <div className="flex items-center gap-2">
                    <Plane size={20} strokeWidth={1.5} className="text-green-500 sm:size-6" />
                    <Badge className="px-2 py-1 text-sm sm:px-3 sm:py-1 sm:text-base bg-green-100 text-green-600 rounded-[4px] border border-green-500 shadow-md">Flight Records</Badge>
                  </div>
                </h1>
              </div>
              
              {!showForm && (
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  {permissions?.canAddFlightRecords && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={onAddFlightClick} 
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 sm:gap-2 cursor-pointer text-xs sm:text-sm px-2 sm:px-3 flex-1 sm:flex-none"
                        >
                          <PlusCircle size={14} className="sm:size-4" />
                          <span className="hidden xs:inline">Add Flight</span>
                          <span className="xs:hidden">Add</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to record new flight</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {permissions?.canExportFlightRecords && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm"
                          className="flex items-center gap-1 sm:gap-2 bg-green-600 text-white hover:bg-green-700 text-xs sm:text-sm px-2 sm:px-3 flex-1 sm:flex-none"
                          asChild
                        >
                          <Link href="/dashboard/flight-records/export">
                            <FileSpreadsheet size={14} className="sm:size-4" />
                            <span className="hidden xs:inline">Export Data</span>
                            <span className="xs:hidden">Export</span>
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Export flight records to Excel</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      </Card>
    </TooltipProvider>
  );
};

export default FlightRecordsHeader;

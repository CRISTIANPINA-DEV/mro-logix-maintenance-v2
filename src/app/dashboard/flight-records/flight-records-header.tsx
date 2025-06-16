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
      <TooltipProvider>
        <Card className="w-full mb-6">
          <header>
            <div className="w-full max-w-full mx-auto px-4">
              <div className="flex flex-col sm:flex-row min-h-16 py-3 sm:py-0 sm:h-16 items-start sm:items-center justify-start sm:justify-between w-full gap-3 sm:gap-0">
                <div>
                  <h1 className="text-2xl font-bold">
                    <div className="flex items-center gap-2">
                      <Plane size={24} strokeWidth={1.5} className="text-blue-500" />
                      <Badge className="px-3 py-1 text-base bg-blue-500 text-white rounded-[4px] border border-black shadow-md">Flight Records</Badge>
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
      <Card className="w-full mb-6">
        <header>
          <div className="w-full max-w-full mx-auto px-4">
            <div className="flex flex-col sm:flex-row min-h-16 py-3 sm:py-0 sm:h-16 items-start sm:items-center justify-start sm:justify-between w-full gap-3 sm:gap-0">
              <div>
                <h1 className="text-2xl font-bold">
                  <div className="flex items-center gap-2">
                    <Plane size={24} strokeWidth={1.5} className="text-blue-500" />
                    <Badge className="px-3 py-1 text-base bg-blue-500 text-white rounded-[4px] border border-black shadow-md">Flight Records</Badge>
                  </div>
                </h1>
                {/* You can add a subtitle here if needed, e.g.: */}
                {/* <p className="text-sm text-muted-foreground">Manage your flight data</p> */}
              </div>
              {!showForm && (
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {permissions?.canAddFlightRecords && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={onAddFlightClick} 
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <PlusCircle size={16} />
                          Add Flight
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
                          className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                          asChild
                        >
                          <Link href="/dashboard/flight-records/export">
                            <FileSpreadsheet size={16} />
                            Export Data
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

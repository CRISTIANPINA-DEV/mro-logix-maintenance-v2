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
        {/* Mobile: Separate card for title */}
        <Card className="w-full mb-4 sm:hidden rounded-none">
          <header>
            <div className="w-full max-w-full mx-auto px-3">
              <div className="flex justify-center items-center min-h-12 py-2">
                <div className="text-center">
                  <h1 className="text-xl font-bold">
                    <div className="flex items-center justify-center gap-1.5">
                      <Plane size={20} strokeWidth={1.5} className="text-blue-500" />
                      <Badge className="px-2 py-0.5 text-sm bg-blue-500 text-white rounded-none border border-black shadow-md">Flight Records</Badge>
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
                      <Plane size={24} strokeWidth={1.5} className="text-blue-500" />
                      <Badge className="px-3 py-1 text-base bg-blue-500 text-white rounded-none border border-black shadow-md">Flight Records</Badge>
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
                    <Plane size={20} strokeWidth={1.5} className="text-blue-500" />
                    <Badge className="px-2 py-0.5 text-sm bg-blue-500 text-white rounded-none border border-black shadow-md">Flight Records</Badge>
                  </div>
                </h1>
              </div>
            </div>
          </div>
        </header>
      </Card>

      {/* Mobile: Separate card for buttons */}
      {!showForm && (
        <Card className="w-full mb-4 sm:hidden rounded-none">
          <div className="w-full max-w-full mx-auto px-3">
            <div className="flex justify-center items-center min-h-10 py-2">
              <div className="flex flex-wrap justify-center gap-2">
                {permissions?.canAddFlightRecords && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={onAddFlightClick} 
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex items-center gap-1.5 cursor-pointer rounded-none"
                      >
                        <PlusCircle size={14} />
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
                        className="h-7 text-xs flex items-center gap-1.5 bg-green-600 text-white hover:bg-green-700 rounded-none"
                        asChild
                      >
                        <Link href="/dashboard/flight-records/export">
                          <FileSpreadsheet size={14} />
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
            </div>
          </div>
        </Card>
      )}

      {/* Desktop: Combined layout */}
      <Card className="w-full mb-6 hidden sm:block rounded-none">
        <header>
          <div className="w-full max-w-full mx-auto px-4">
            <div className="flex flex-row h-16 items-center justify-between w-full">
              <div>
                <h1 className="text-2xl font-bold">
                  <div className="flex items-center gap-2">
                    <Plane size={24} strokeWidth={1.5} className="text-blue-500" />
                    <Badge className="px-3 py-1 text-base bg-blue-500 text-white rounded-none border border-black shadow-md">Flight Records</Badge>
                  </div>
                </h1>
              </div>
              {!showForm && (
                <div className="flex gap-3">
                  {permissions?.canAddFlightRecords && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={onAddFlightClick} 
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 cursor-pointer rounded-none"
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
                          className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 rounded-none"
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

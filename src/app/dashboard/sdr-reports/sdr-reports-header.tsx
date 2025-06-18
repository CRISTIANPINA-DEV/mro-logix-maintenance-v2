"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface SDRReportsHeaderProps {
  onNewSDR: () => void;
}

const SDRReportsHeader: React.FC<SDRReportsHeaderProps> = ({ onNewSDR }) => {
  return (
    <Card className="w-full mb-4 sm:mb-6">
      <header>
        <div className="w-full max-w-full mx-auto px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:h-12 py-3 sm:py-0 items-start sm:items-center justify-between w-full gap-3 sm:gap-0">
            <div className="w-full sm:w-auto">
              <h1 className="text-lg sm:text-2xl font-bold">
                <div className="flex items-center gap-1 sm:gap-2">
                  <AlertTriangle size={18} strokeWidth={1.5} className="text-[#f43f5e] sm:hidden" />
                  <AlertTriangle size={24} strokeWidth={1.5} className="text-[#f43f5e] hidden sm:block" />
                  <Badge className="px-2 py-1 text-sm sm:text-base bg-[#f43f5e] text-white rounded-[4px] border border-black shadow-md">
                    SDR Reports
                  </Badge>
                </div>
              </h1>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button 
                variant="neutral" 
                size="sm" 
                className="flex items-center gap-1 sm:gap-2 cursor-pointer text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9" 
                onClick={onNewSDR}
              >
                <PlusCircle size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">New SDR</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
    </Card>
  );
};

export default SDRReportsHeader; 
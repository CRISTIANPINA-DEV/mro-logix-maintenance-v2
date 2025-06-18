"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, FileBarChart, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface SMSReportsHeaderProps {
  onNewReport: () => void;
}

const SMSReportsHeader = ({ onNewReport }: SMSReportsHeaderProps) => {
  const handleAnonymousReport = () => {
    window.open('/anonymous-report', '_blank');
  };

  return (
    <Card className="w-full mb-4 sm:mb-6">
      <header>
        <div className="w-full max-w-full mx-auto px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:h-16 py-3 sm:py-0 items-start sm:items-center justify-between w-full gap-3 sm:gap-0">
            <div className="w-full sm:w-auto">
              <h1 className="text-lg sm:text-2xl font-bold">
                <div className="flex items-center gap-1 sm:gap-2">
                  <FileBarChart size={24} strokeWidth={1.5} className="text-[#8b5cf6] hidden sm:block" />
                  <FileBarChart size={18} strokeWidth={1.5} className="text-[#8b5cf6] sm:hidden" />
                  <Badge className="px-2 py-1 text-sm sm:text-base bg-[#8b5cf6] text-white rounded-[4px] border border-black shadow-md">
                    SMS Reports
                  </Badge>
                </div>
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 sm:gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
                onClick={handleAnonymousReport}
              >
                <UserX size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Anonymous Report</span>
                <span className="sm:hidden">Anonymous</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
                onClick={onNewReport}
              >
                <PlusCircle size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">New Report</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
    </Card>
  );
};

export default SMSReportsHeader; 
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
    <Card className="w-full mb-6">
      <header>
        <div className="w-full max-w-full mx-auto px-4">
          <div className="flex h-16 items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-bold">
                <div className="flex items-center gap-2">
                  <FileBarChart size={24} strokeWidth={1.5} className="text-[#8b5cf6]" />
                  <Badge className="px-3 py-1 text-base bg-[#8b5cf6] text-white rounded-[4px] border border-black shadow-md">SMS Reports</Badge>
                </div>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
                onClick={handleAnonymousReport}
              >
                <UserX size={16} />
                Anonymous Report
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={onNewReport}
              >
                <PlusCircle size={16} />
                New Report
              </Button>
            </div>
          </div>
        </div>
      </header>
    </Card>
  );
};

export default SMSReportsHeader; 
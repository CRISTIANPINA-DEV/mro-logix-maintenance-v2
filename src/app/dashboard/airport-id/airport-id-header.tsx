"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, IdCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface AirportIDHeaderProps {
  onToggleForm?: () => void;
  showForm?: boolean;
}

const AirportIDHeader: React.FC<AirportIDHeaderProps> = ({ onToggleForm, showForm }) => {
  const handleToggleForm = () => {
    if (onToggleForm) {
      onToggleForm();
    }
  };

  return (
    <Card className="w-full mb-6">
      <header>
        <div className="w-full max-w-full mx-auto px-4">
          <div className="flex h-16 items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-bold">
                <div className="flex items-center gap-2">
                  <IdCard size={24} strokeWidth={1.5} className="text-[#6A5ACD]" />
                  <Badge className="px-3 py-1 text-base bg-[#F0EFFF] text-[#6A5ACD] rounded-[4px] border border-[#6A5ACD] shadow-md">Airport ID Management</Badge>
                </div>
              </h1>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleToggleForm}
            >
              <PlusCircle size={16} />
              {showForm ? "Cancel" : "New Airport ID"}
            </Button>
          </div>
        </div>
      </header>
    </Card>
  );
};

export default AirportIDHeader; 
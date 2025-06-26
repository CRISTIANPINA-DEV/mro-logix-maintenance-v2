"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface TechnicianTrainingHeaderProps {
  onAddTraining?: () => void;
}

const TechnicianTrainingHeader: React.FC<TechnicianTrainingHeaderProps> = ({ onAddTraining }) => {
  const handleAddTraining = () => {
    if (onAddTraining) {
      onAddTraining();
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
                  <GraduationCap size={24} strokeWidth={1.5} className="text-[#5A4FCF]" />
                  <Badge className="px-3 py-1 text-base bg-[#5A4FCF]/10 text-[#5A4FCF] rounded-[4px] border border-[#5A4FCF] shadow-md">Technician Training</Badge>
                </div>
              </h1>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleAddTraining}
            >
              <PlusCircle size={16} />
              Add Training
            </Button>
          </div>
        </div>
      </header>
    </Card>
  );
};

export default TechnicianTrainingHeader; 
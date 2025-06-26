"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { RotateCw, PlusCircle } from "lucide-react"; 
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface WheelRotationHeaderProps {
  showForm: boolean;
  onAddWheelClick: () => void;
}

const WheelRotationHeader: React.FC<WheelRotationHeaderProps> = ({ showForm, onAddWheelClick }) => {
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
                    <RotateCw size={24} strokeWidth={1.5} className="text-orange-500" />
                    <Badge className="px-3 py-1 text-base bg-orange-100 text-orange-600 rounded-[4px] border border-orange-500 shadow-md">Wheel Rotation</Badge>
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
            <div className="flex h-16 items-center justify-between w-full">
              <div>
                <h1 className="text-2xl font-bold">
                  <div className="flex items-center gap-2">
                    <RotateCw size={24} strokeWidth={1.5} className="text-orange-500" />
                    <Badge className="px-3 py-1 text-base bg-orange-100 text-orange-600 rounded-[4px] border border-orange-500 shadow-md">Wheel Rotation</Badge>
                  </div>
                </h1>
              </div>
              
              {!showForm && (
                <div className="flex gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={onAddWheelClick} 
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <PlusCircle size={16} />
                        Add Wheel
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add new wheel for rotation tracking</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </header>
      </Card>
    </TooltipProvider>
  );
};

export default WheelRotationHeader; 
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { ThermometerSnowflake, Plus, Settings } from "lucide-react"; 
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface TemperatureControlHeaderProps {
  showForm: boolean;
  onAddTemperatureClick: () => void;
  onConfigClick: () => void;
}

const TemperatureControlHeader: React.FC<TemperatureControlHeaderProps> = ({ 
  showForm, 
  onAddTemperatureClick, 
  onConfigClick 
}) => {
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
                    <ThermometerSnowflake size={24} strokeWidth={1.5} className="text-blue-500" />
                    <Badge className="px-3 py-1 text-base bg-blue-100 text-blue-600 rounded-[4px] border border-blue-500 shadow-md">Temperature Control</Badge>
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
                    <ThermometerSnowflake size={24} strokeWidth={1.5} className="text-blue-500" />
                    <Badge className="px-3 py-1 text-base bg-blue-100 text-blue-600 rounded-[4px] border border-blue-500 shadow-md">Temperature Control</Badge>
                  </div>
                </h1>
              </div>
              
              {!showForm && (
                <div className="flex gap-3">
                  {permissions?.canAddTemperatureRecord && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={onAddTemperatureClick} 
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Add Temperature
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to add new temperature record</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {permissions?.canConfigureTemperatureRanges && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={onConfigClick}
                          size="sm"
                          className="flex items-center gap-2 bg-blue-100 text-blue-600 hover:bg-blue-200 border border-blue-500"
                        >
                          <Settings size={16} />
                          Configure Ranges
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Configure temperature and humidity ranges</p>
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

export default TemperatureControlHeader; 
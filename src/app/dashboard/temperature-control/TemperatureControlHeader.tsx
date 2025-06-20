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
      <TooltipProvider>
        {/* Mobile: Separate card for title */}
        <Card className="w-full mb-4 sm:hidden rounded-none">
          <header>
            <div className="w-full max-w-full mx-auto px-3">
              <div className="flex justify-center items-center min-h-12 py-2">
                <div className="text-center">
                  <h1 className="text-xl font-bold">
                    <div className="flex items-center justify-center gap-1.5">
                      <ThermometerSnowflake size={20} strokeWidth={1.5} className="text-blue-500" />
                      <Badge className="px-2 py-0.5 text-sm bg-blue-500 text-white rounded-none border border-black shadow-md">Temperature Control</Badge>
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
                      <ThermometerSnowflake size={24} strokeWidth={1.5} className="text-blue-500" />
                      <Badge className="px-3 py-1 text-base bg-blue-500 text-white rounded-none border border-black shadow-md">Temperature Control</Badge>
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
                    <ThermometerSnowflake size={20} strokeWidth={1.5} className="text-blue-500" />
                    <Badge className="px-2 py-0.5 text-sm bg-blue-500 text-white rounded-none border border-black shadow-md">Temperature Control</Badge>
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
                {permissions?.canAddTemperatureRecord && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={onAddTemperatureClick} 
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} />
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
                        className="h-8 text-xs flex items-center gap-1.5 bg-orange-200 text-black hover:bg-orange-300 border border-black"
                      >
                        <Settings size={14} />
                        Configure
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Configure temperature and humidity ranges</p>
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
                    <ThermometerSnowflake size={24} strokeWidth={1.5} className="text-blue-500" />
                    <Badge className="px-3 py-1 text-base bg-blue-500 text-white rounded-none border border-black shadow-md">Temperature Control</Badge>
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
                          className="h-8 flex items-center gap-2 cursor-pointer"
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
                          className="h-8 flex items-center gap-2 bg-orange-200 text-black hover:bg-orange-300 border border-black"
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
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ThermometerSnowflake, Thermometer, Droplets, Settings } from "lucide-react";
import { AddTemperatureControlForm } from "./AddTemperatureControlForm";
import { TemperatureControlList } from "./TemperatureControlList";
import { TemperatureConfigDialog } from "./TemperatureConfigDialog";
import { TemperatureTrendCard } from "./TemperatureTrendCard";
import { TemperatureTrendModal } from "./TemperatureTrendModal";
import TemperatureControlHeader from "./TemperatureControlHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface ConfigData {
  tempNormalMin: number;
  tempNormalMax: number;
  tempMediumMin: number;
  tempMediumMax: number;
  tempHighMin: number;
  humidityNormalMin: number;
  humidityNormalMax: number;
  humidityMediumMin: number;
  humidityMediumMax: number;
  humidityHighMin: number;
}

export default function TemperatureControlPage() {
  const { permissions, loading } = useUserPermissions();
  const [showForm, setShowForm] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [configRefreshTrigger, setConfigRefreshTrigger] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [config, setConfig] = useState<ConfigData>({
    tempNormalMin: 0,
    tempNormalMax: 24,
    tempMediumMin: 25,
    tempMediumMax: 35,
    tempHighMin: 36,
    humidityNormalMin: 0,
    humidityNormalMax: 35,
    humidityMediumMin: 36,
    humidityMediumMax: 65,
    humidityHighMin: 66,
  });

  useEffect(() => {
    // Fetch the total number of records
    const fetchTotalRecords = async () => {
      try {
        const response = await fetch('/api/temperature-control?count=true');
        const data = await response.json();
        if (data.success) {
          setTotalRecords(data.data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching total records:', error);
      }
    };
    
    fetchTotalRecords();
  }, [refreshTrigger]);

  useEffect(() => {
    // Fetch configuration
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/temperature-humidity-config');
        const result = await response.json();
        
        if (result.success) {
          setConfig({
            tempNormalMin: result.data.tempNormalMin,
            tempNormalMax: result.data.tempNormalMax,
            tempMediumMin: result.data.tempMediumMin,
            tempMediumMax: result.data.tempMediumMax,
            tempHighMin: result.data.tempHighMin,
            humidityNormalMin: result.data.humidityNormalMin,
            humidityNormalMax: result.data.humidityNormalMax,
            humidityMediumMin: result.data.humidityMediumMin,
            humidityMediumMax: result.data.humidityMediumMax,
            humidityHighMin: result.data.humidityHighMin,
          });
        }
      } catch (error) {
        console.error('Error fetching configuration:', error);
      }
    };
    
    fetchConfig();
  }, [configRefreshTrigger]);

  const handleFormClose = () => {
    setShowForm(false);
    // Trigger a refresh of the list when form is closed (after successful submission)
    setRefreshTrigger(prev => prev + 1);
  };

  const handleConfigUpdate = () => {
    setConfigRefreshTrigger(prev => prev + 1);
    setRefreshTrigger(prev => prev + 1); // Also refresh the list to apply new colors
  };

  const handleAddTemperatureClick = () => {
    setShowForm(true);
  };

  const handleConfigClick = () => {
    setShowConfigDialog(true);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto py-4 px-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header Section */}
        <TemperatureControlHeader 
          showForm={showForm}
          onAddTemperatureClick={handleAddTemperatureClick}
          onConfigClick={handleConfigClick}
        />

        {/* Range Indicator Cards - Mobile Optimized Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {/* Total Records Stats Card */}
          <Card className="shadow-sm lg:col-span-1 xl:col-span-1">
            <CardHeader className="py-2 px-3 sm:px-4">
              <CardTitle className="text-xs sm:text-sm flex items-center">
                <ThermometerSnowflake className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Records Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 sm:px-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Total Records</span>
                <span className="text-base sm:text-lg font-bold text-primary">{totalRecords}</span>
              </div>
            </CardContent>
          </Card>

          {/* Temperature Range Cards */}
          <Card className="shadow-sm lg:col-span-1 xl:col-span-1">
            <CardHeader className="py-2 px-3 sm:px-4">
              <CardTitle className="text-xs sm:text-sm flex items-center">
                <Thermometer className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Temperature Ranges
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 sm:px-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Normal:</span>
                  <span className="text-xs font-semibold text-blue-600">
                    {config.tempNormalMin}-{config.tempNormalMax}°C
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Medium:</span>
                  <span className="text-xs font-semibold text-yellow-600">
                    {config.tempMediumMin}-{config.tempMediumMax}°C
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">High:</span>
                  <span className="text-xs font-semibold text-red-600">
                    Above {config.tempHighMin - 1}°C
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Humidity Range Cards */}
          <Card className="shadow-sm lg:col-span-1 xl:col-span-1">
            <CardHeader className="py-2 px-3 sm:px-4">
              <CardTitle className="text-xs sm:text-sm flex items-center">
                <Droplets className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Humidity Ranges
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 sm:px-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Normal:</span>
                  <span className="text-xs font-semibold text-blue-600">
                    {config.humidityNormalMin}-{config.humidityNormalMax}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Medium:</span>
                  <span className="text-xs font-semibold text-yellow-600">
                    {config.humidityMediumMin}-{config.humidityMediumMax}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">High:</span>
                  <span className="text-xs font-semibold text-red-600">
                    Above {config.humidityHighMin - 1}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trend Analysis Card */}
          <div className="lg:col-span-1 xl:col-span-1">
            <TemperatureTrendCard 
              refreshTrigger={refreshTrigger}
              onClick={() => setShowTrendModal(true)}
            />
          </div>
        </div>

        {showForm && (
          <AddTemperatureControlForm onClose={handleFormClose} />
        )}

        {/* Configuration Dialog */}
        <TemperatureConfigDialog 
          isOpen={showConfigDialog}
          onClose={() => setShowConfigDialog(false)}
          onConfigUpdate={handleConfigUpdate}
        />

        {/* Trend Analysis Modal */}
        <TemperatureTrendModal 
          isOpen={showTrendModal}
          onClose={() => setShowTrendModal(false)}
          refreshTrigger={refreshTrigger}
        />

        {/* Temperature Control Records List */}
        <div className="mt-6 sm:mt-8">
          <TemperatureControlList 
            refreshTrigger={refreshTrigger} 
            config={config}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

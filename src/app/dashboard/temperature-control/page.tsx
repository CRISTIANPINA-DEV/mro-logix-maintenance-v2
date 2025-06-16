"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ThermometerSnowflake, Thermometer, Droplets, Settings } from "lucide-react";
import { AddTemperatureControlForm } from "./AddTemperatureControlForm";
import { TemperatureControlList } from "./TemperatureControlList";
import { TemperatureConfigDialog } from "./TemperatureConfigDialog";
import { TemperatureTrendCard } from "./TemperatureTrendCard";
import { TemperatureTrendModal } from "./TemperatureTrendModal";
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

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ThermometerSnowflake className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Temperature Control</h1>
          </div>
          <div className="flex space-x-2">
            {permissions?.canConfigureTemperatureRanges && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setShowConfigDialog(true)}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Ranges
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configure temperature and humidity ranges</p>
                </TooltipContent>
              </Tooltip>
            )}
            {permissions?.canAddTemperatureRecord && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setShowForm(true)}
                    className="bg-white text-black border border-black hover:bg-gray-50 cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Temperature
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add a new temperature record</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Range Indicator Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Total Records Stats Card */}
          <Card className="shadow-sm">
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center">
                <ThermometerSnowflake className="h-4 w-4 mr-1" />
                Records Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Total Records</span>
                <span className="text-lg font-bold text-primary">{totalRecords}</span>
              </div>
            </CardContent>
          </Card>

          {/* Temperature Range Cards */}
          <Card className="shadow-sm">
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center">
                <Thermometer className="h-4 w-4 mr-1" />
                Temperature Ranges
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
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
          <Card className="shadow-sm">
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center">
                <Droplets className="h-4 w-4 mr-1" />
                Humidity Ranges
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
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
          <TemperatureTrendCard 
            refreshTrigger={refreshTrigger}
            onClick={() => setShowTrendModal(true)}
          />
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
        <div className="mt-8">
          <TemperatureControlList 
            refreshTrigger={refreshTrigger} 
            config={config}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { FuelIcon, PlusCircle, History, MapPin } from "lucide-react"; 
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface OilConsumptionHeaderProps {
  showForm: boolean;
  onUpliftOilClick: () => void;
  selectedStation?: string;
  onStationChange?: (station: string) => void;
}

const OilConsumptionHeader: React.FC<OilConsumptionHeaderProps> = ({ showForm, onUpliftOilClick, selectedStation, onStationChange }) => {
  const { permissions, loading } = useUserPermissions();
  const [stations, setStations] = useState<string[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);

  // Fetch available stations
  useEffect(() => {
    const fetchStations = async () => {
      setLoadingStations(true);
      try {
        const res = await fetch('/api/oil-consumption');
        if (res.ok) {
          const records = await res.json();
          const uniqueStations = Array.from(new Set(
            records
              .map((record: any) => record.station ? record.station.split(' - ')[0] : '')
              .filter((station: string) => station !== '')
          )).sort() as string[];
          setStations(uniqueStations);
        }
      } catch (error) {
        console.error('Error fetching stations:', error);
      } finally {
        setLoadingStations(false);
      }
    };

    fetchStations();
  }, []);

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
                    <FuelIcon size={24} strokeWidth={1.5} className="text-blue-500" />
                    <Badge className="px-3 py-1 text-base bg-blue-100 text-blue-600 rounded-[4px] border border-blue-500 shadow-md">Oil Consumption</Badge>
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
                    <FuelIcon size={24} strokeWidth={1.5} className="text-blue-500" />
                    <Badge className="px-3 py-1 text-base bg-blue-100 text-blue-600 rounded-[4px] border border-blue-500 shadow-md">Oil Consumption</Badge>
                  </div>
                </h1>
              </div>
              
              {!showForm && (
                <div className="flex gap-3 items-center">
                  {/* Station Filter */}
                  {stations.length > 0 && onStationChange && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Select 
                        value={selectedStation || 'all'} 
                        onValueChange={onStationChange}
                        disabled={loadingStations}
                      >
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                          <SelectValue placeholder="Filter by station" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Stations</SelectItem>
                          {stations.map((station) => (
                            <SelectItem key={station} value={station}>
                              {station}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {permissions?.canAddFlightRecords && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={onUpliftOilClick} 
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <PlusCircle size={16} />
                          Uplift Oil
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Record new oil servicing information</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm"
                        className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                        asChild
                      >
                        <Link href="/dashboard/oil-consumption/history">
                          <History size={16} />
                          See History
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View oil consumption history</p>
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

export default OilConsumptionHeader;

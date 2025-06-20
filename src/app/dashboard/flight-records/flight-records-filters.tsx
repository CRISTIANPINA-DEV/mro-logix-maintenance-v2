"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterIcon, SearchIcon, RefreshCwIcon, ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FlightRecordsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  stationFilter: string;
  onStationFilterChange: (value: string) => void;
  serviceFilter: string;
  onServiceFilterChange: (value: string) => void;
  defectFilter: string;
  onDefectFilterChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
  stationList: string[];
  serviceList: string[];
}

export function FlightRecordsFilters({
  searchTerm,
  onSearchChange,
  stationFilter,
  onStationFilterChange,
  serviceFilter,
  onServiceFilterChange,
  defectFilter,
  onDefectFilterChange,
  onRefresh,
  loading,
  stationList,
  serviceList
}: FlightRecordsFiltersProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <TooltipProvider>
      <Card className="rounded-none">
        <CardHeader className={`py-3 sm:py-3 ${isCollapsed ? 'py-1.5' : 'py-3'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4" />
              <div className="sm:hidden flex items-center gap-2">
                <CardTitle className={`text-base ${isCollapsed ? 'text-sm' : 'text-base'}`}>Filters</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={`p-1 ${isCollapsed ? 'h-5 w-5' : 'h-6 w-6'} rounded-none`}
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <CardTitle className="text-base hidden sm:block">Filters & Search</CardTitle>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => {
                      onStationFilterChange("all_stations");
                      onServiceFilterChange("all_services");
                      onDefectFilterChange("all_defects");
                      onSearchChange("");
                    }}
                    className="h-8 text-xs sm:text-sm bg-white text-black hover:bg-gray-100 cursor-pointer rounded"
                  >
                    Clear All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset all filters to default</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={onRefresh} 
                    disabled={loading} 
                    variant="outline" 
                    size="default"
                    className="h-8 text-xs sm:text-sm bg-white text-black hover:bg-gray-100 cursor-pointer rounded"
                  >
                    <RefreshCwIcon className={`h-[14px] w-[14px] sm:h-[16px] sm:w-[16px] mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reload flight records data</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className={`py-3 ${isCollapsed ? 'hidden sm:block' : 'block'}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Search</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-8 h-8 text-sm cursor-pointer rounded-none"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search by airline, tail number, or station</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Station</label>
              <Select value={stationFilter} onValueChange={onStationFilterChange}>
                <SelectTrigger className="h-8 text-sm cursor-pointer rounded-none">
                  <SelectValue placeholder="All stations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_stations">All Stations</SelectItem>
                  {stationList.map((station) => (
                    <SelectItem key={station} value={station}>{station}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Service Type</label>
              <Select value={serviceFilter} onValueChange={onServiceFilterChange}>
                <SelectTrigger className="h-8 text-sm cursor-pointer rounded-none">
                  <SelectValue placeholder="All services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_services">All Services</SelectItem>
                  {serviceList.map((service) => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Defect Status</label>
              <Select value={defectFilter} onValueChange={onDefectFilterChange}>
                <SelectTrigger className="h-8 text-sm cursor-pointer rounded-none">
                  <SelectValue placeholder="All defects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_defects">All Defects</SelectItem>
                  <SelectItem value="with_defects">With Defects</SelectItem>
                  <SelectItem value="without_defects">Without Defects</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
} 
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  FileSpreadsheet,
  Filter,
  Download,
  CheckSquare,
  Square
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FlightRecord {
  id: string;
  date: string;
  airline: string;
  fleet: string;
  tail: string;
  station: string;
  service: string;
  hasTime: boolean;
  blockTime: string | null;
  outTime: string | null;
  hasDefect: boolean;
  logPageNo: string | null;
  discrepancyNote: string | null;
  rectificationNote: string | null;
  systemAffected: string | null;
  hasAttachments: boolean;
  technician: string | null;
  createdAt: string;
}

interface FilterState {
  startDate: string;
  endDate: string;
  airline: string;
  fleet: string;
  station: string;
}

interface ColumnOption {
  key: string;
  label: string;
  checked: boolean;
}

export default function ExportFlightRecordsPage() {
  const [allRecords, setAllRecords] = useState<FlightRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FlightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  
  // Filtered value lists
  const [uniqueAirlines, setUniqueAirlines] = useState<string[]>([]);
  const [uniqueFleets, setUniqueFleets] = useState<string[]>([]);
  const [uniqueStations, setUniqueStations] = useState<string[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    startDate: "",
    endDate: "",
    airline: "all_airlines",
    fleet: "all_fleets",
    station: "all_stations"
  });

  // Column selection state
  const [selectedColumns, setSelectedColumns] = useState<ColumnOption[]>([
    { key: "id", label: "ID", checked: true },
    { key: "date", label: "Date", checked: true },
    { key: "airline", label: "Airline", checked: true },
    { key: "fleet", label: "Fleet", checked: true },
    { key: "tail", label: "Tail", checked: true },
    { key: "station", label: "Station", checked: true },
    { key: "service", label: "Service", checked: true },
    { key: "blockTime", label: "Block Time", checked: true },
    { key: "outTime", label: "Out Time", checked: true },
    { key: "hasDefect", label: "Has Defect", checked: true },
    { key: "logPageNo", label: "Log Page #", checked: true },
    { key: "systemAffected", label: "System Affected", checked: true },
    { key: "discrepancyNote", label: "Discrepancy", checked: true },
    { key: "rectificationNote", label: "Rectification", checked: true },
    { key: "technician", label: "Technician", checked: true },
    { key: "createdAt", label: "Created At", checked: true },
  ]);

  // Fetch all flight records
  useEffect(() => {
    const fetchFlightRecords = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/flight-records');
        const data = await response.json();
        
        if (data.success) {
          setAllRecords(data.records);
          
          // Extract unique values for filters
          const airlines = [...new Set(data.records.map((record: FlightRecord) => record.airline))] as string[];
          const fleets = [...new Set(data.records.map((record: FlightRecord) => record.fleet))] as string[];
          const stations = [...new Set(data.records.map((record: FlightRecord) => record.station))] as string[];
          
          setUniqueAirlines(airlines);
          setUniqueFleets(fleets);
          setUniqueStations(stations);
        }
      } catch (error) {
        console.error('Error fetching flight records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlightRecords();
  }, []);

  // Format date for display and filtering
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy');
  };

  // Apply filters
  const applyFilters = () => {
    let result = [...allRecords];
    
    // Filter by start date
    if (filters.startDate) {
      result = result.filter(record => {
        const recordDate = new Date(record.date);
        const startDate = new Date(filters.startDate);
        return recordDate >= startDate;
      });
    }
    
    // Filter by end date
    if (filters.endDate) {
      result = result.filter(record => {
        const recordDate = new Date(record.date);
        const endDate = new Date(filters.endDate);
        return recordDate <= endDate;
      });
    }
    
    // Filter by airline
    if (filters.airline && filters.airline !== 'all_airlines') {
      result = result.filter(record => record.airline === filters.airline);
    }
    
    // Filter by fleet
    if (filters.fleet && filters.fleet !== 'all_fleets') {
      result = result.filter(record => record.fleet === filters.fleet);
    }
    
    // Filter by station
    if (filters.station && filters.station !== 'all_stations') {
      result = result.filter(record => record.station === filters.station);
    }
    
    setFilteredRecords(result);
    setFiltersApplied(true);
  };

  // Handle filter changes
  const handleFilterChange = (
    key: keyof FilterState,
    value: string
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle column selection
  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns(prev => 
      prev.map(col => 
        col.key === columnKey 
          ? { ...col, checked: !col.checked }
          : col
      )
    );
  };

  // Select all columns
  const selectAllColumns = () => {
    setSelectedColumns(prev => 
      prev.map(col => ({ ...col, checked: true }))
    );
  };

  // Deselect all columns
  const deselectAllColumns = () => {
    setSelectedColumns(prev => 
      prev.map(col => ({ ...col, checked: false }))
    );
  };

  // Generate and download Excel file
  const exportToExcel = () => {
    setExporting(true);
    setShowColumnDialog(false);
    
    try {
      // Get selected columns
      const activeColumns = selectedColumns.filter(col => col.checked);
      
      if (activeColumns.length === 0) {
        alert('Please select at least one column to export.');
        setExporting(false);
        return;
      }

      // Prepare data for export based on selected columns
      const data = filteredRecords.map(record => {
        const exportRecord: any = {};
        
        activeColumns.forEach(col => {
          switch (col.key) {
            case 'id':
              exportRecord['ID'] = record.id;
              break;
            case 'date':
              exportRecord['Date'] = formatDate(record.date);
              break;
            case 'airline':
              exportRecord['Airline'] = record.airline;
              break;
            case 'fleet':
              exportRecord['Fleet'] = record.fleet;
              break;
            case 'tail':
              exportRecord['Tail'] = record.tail || "N/A";
              break;
            case 'station':
              exportRecord['Station'] = record.station;
              break;
            case 'service':
              exportRecord['Service'] = record.service;
              break;
            case 'blockTime':
              exportRecord['Block Time'] = record.hasTime && record.blockTime ? record.blockTime : "N/A";
              break;
            case 'outTime':
              exportRecord['Out Time'] = record.hasTime && record.outTime ? record.outTime : "N/A";
              break;
            case 'hasDefect':
              exportRecord['Has Defect'] = record.hasDefect ? "Yes" : "No";
              break;
            case 'logPageNo':
              exportRecord['Log Page #'] = record.hasDefect && record.logPageNo ? record.logPageNo : "N/A";
              break;
            case 'systemAffected':
              exportRecord['System Affected'] = record.hasDefect && record.systemAffected ? record.systemAffected : "N/A";
              break;
            case 'discrepancyNote':
              exportRecord['Discrepancy'] = record.hasDefect && record.discrepancyNote ? record.discrepancyNote : "N/A";
              break;
            case 'rectificationNote':
              exportRecord['Rectification'] = record.hasDefect && record.rectificationNote ? record.rectificationNote : "N/A";
              break;
            case 'technician':
              exportRecord['Technician'] = record.technician || "N/A";
              break;
            case 'createdAt':
              exportRecord['Created At'] = format(new Date(record.createdAt), 'MMM dd, yyyy HH:mm');
              break;
          }
        });
        
        return exportRecord;
      });
      
      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Flight Records");
      
      // Set column widths based on selected columns
      const columnsWidths = activeColumns.map(col => {
        switch (col.key) {
          case 'id':
            return { wch: 12 };
          case 'date':
            return { wch: 12 };
          case 'airline':
            return { wch: 10 };
          case 'fleet':
            return { wch: 10 };
          case 'tail':
            return { wch: 10 };
          case 'station':
            return { wch: 10 };
          case 'service':
            return { wch: 10 };
          case 'blockTime':
            return { wch: 10 };
          case 'outTime':
            return { wch: 10 };
          case 'hasDefect':
            return { wch: 10 };
          case 'logPageNo':
            return { wch: 12 };
          case 'systemAffected':
            return { wch: 15 };
          case 'discrepancyNote':
            return { wch: 20 };
          case 'rectificationNote':
            return { wch: 20 };
          case 'technician':
            return { wch: 15 };
          case 'createdAt':
            return { wch: 20 };
          default:
            return { wch: 15 };
        }
      });
      worksheet['!cols'] = columnsWidths;
      
      // Generate filename
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const fileName = `flight-records-export-${dateStr}.xlsx`;
      
      // Trigger download
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setExporting(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      airline: "all_airlines",
      fleet: "all_fleets",
      station: "all_stations"
    });
    setFiltersApplied(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <Card className="w-full mb-6">
            <header>
              <div className="w-full max-w-full mx-auto px-4">
                <div className="flex h-16 items-center justify-between w-full">
                  <div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 bg-background hover:bg-accent border border-input mr-2" 
                        asChild
                      >
                        <Link href="/dashboard/flight-records">
                          <ArrowLeft size={16} />
                          <span className="ml-1 text-xs">Back</span>
                        </Link>
                      </Button>
                      <h1 className="text-2xl font-bold">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet size={24} strokeWidth={1.5} className="text-green-600" />
                          <Badge className="px-3 py-1 text-base bg-green-600 text-white rounded-[4px] border border-black shadow-md">Export Flight Records</Badge>
                        </div>
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
            </header>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                type="date"
                id="startDate"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className={`w-full rounded-none cursor-pointer ${filters.startDate ? 'bg-green-50' : ''}`}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                type="date"
                id="endDate"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className={`w-full rounded-none cursor-pointer ${filters.endDate ? 'bg-green-50' : ''}`}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Airline</Label>
              <Select 
                value={filters.airline} 
                onValueChange={(value) => handleFilterChange('airline', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select airline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_airlines">All Airlines</SelectItem>
                  {uniqueAirlines.map(airline => (
                    <SelectItem key={airline} value={airline}>{airline}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Fleet</Label>
              <Select 
                value={filters.fleet} 
                onValueChange={(value) => handleFilterChange('fleet', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fleet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_fleets">All Fleets</SelectItem>
                  {uniqueFleets.map(fleet => (
                    <SelectItem key={fleet} value={fleet}>{fleet}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Station</Label>
              <Select 
                value={filters.station} 
                onValueChange={(value) => handleFilterChange('station', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_stations">All Stations</SelectItem>
                  {uniqueStations.map(station => (
                    <SelectItem key={station} value={station}>{station}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={applyFilters} 
              size="sm"
              variant="neutral"
              className="h-8 text-xs"
            >
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            
            <Button 
              variant="neutral" 
              size="sm"
              className="h-8 text-xs"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
          
          {filtersApplied && (
            <>
              <Separator className="my-6" />
              
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold mb-4">
                  {filteredRecords.length} Records Found
                </h2>
                
                <Button 
                  onClick={() => setShowColumnDialog(true)} 
                  size="sm"
                  variant="export"
                  className="h-8 text-xs"
                  disabled={filteredRecords.length === 0 || exporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exporting ? "Exporting..." : "Export to Excel"}
                </Button>
              </div>
              
              {filteredRecords.length > 0 ? (
                <div className="border rounded-lg bg-card overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Airline</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fleet</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Has Defect</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRecords.slice(0, 20).map((record) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(record.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{record.airline}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{record.fleet}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{record.station}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {record.service === 'AOG' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {record.service}
                              </span>
                            ) : record.service}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {record.hasDefect ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-yellow-800">
                                Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                No
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRecords.length > 20 && (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Showing 20 of {filteredRecords.length} records. Export to Excel to see all records.
                    </div>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg p-8 bg-card text-center">
                  <p className="text-muted-foreground">No records match your filter criteria.</p>
                </div>
              )}
            </>
          )}

          {/* Column Selection Dialog */}
          <Dialog open={showColumnDialog} onOpenChange={setShowColumnDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  Select Columns for Export
                </DialogTitle>
                <DialogDescription>
                  Choose which columns you want to include in your Excel export file.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    variant="neutral" 
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={selectAllColumns}
                  >
                    <CheckSquare className="mr-1 h-3 w-3" />
                    Select All
                  </Button>
                  <Button 
                    variant="neutral" 
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={deselectAllColumns}
                  >
                    <Square className="mr-1 h-3 w-3" />
                    Deselect All
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {selectedColumns.map((column) => (
                    <div key={column.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={column.key}
                        checked={column.checked}
                        onCheckedChange={() => handleColumnToggle(column.key)}
                      />
                      <Label 
                        htmlFor={column.key} 
                        className="text-sm font-medium cursor-pointer"
                      >
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="neutral" 
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowColumnDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={exportToExcel}
                  size="sm"
                  variant="export"
                  className="h-8 text-xs"
                  disabled={selectedColumns.filter(col => col.checked).length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

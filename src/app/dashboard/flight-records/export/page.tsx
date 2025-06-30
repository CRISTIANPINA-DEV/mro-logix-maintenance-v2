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
    <div className="container mx-auto py-4 sm:py-6 px-4 space-y-4 sm:space-y-6">
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Professional Header */}
          <Card className="w-full mb-4 sm:mb-6 shadow-lg">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
              <div className="px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-8 sm:h-9 bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm" 
                    asChild
                  >
                    <Link href="/dashboard/flight-records">
                      <ArrowLeft size={14} className="sm:size-4" />
                      <span className="ml-1 text-xs sm:text-sm">Back</span>
                    </Link>
                  </Button>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileSpreadsheet size={20} className="sm:size-6" strokeWidth={1.5} />
                    <div>
                      <h1 className="text-lg sm:text-2xl font-bold">Export Flight Records</h1>
                      <p className="text-green-100 text-xs sm:text-sm">Download your flight records in Excel format</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Filter Section */}
          <Card className="p-4 sm:p-6 shadow-md">
            <div className="mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Filter className="h-5 w-5 text-green-600" />
                Filter Options
              </h2>
              <p className="text-sm text-muted-foreground">Customize your export by applying filters below</p>
            </div>
            
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="font-medium">Start Date</Label>
                <Input
                  type="date"
                  id="startDate"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className={`w-full cursor-pointer transition-colors duration-200 ${filters.startDate ? 'bg-green-50 border-green-300' : ''}`}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate" className="font-medium">End Date</Label>
                <Input
                  type="date"
                  id="endDate"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className={`w-full cursor-pointer transition-colors duration-200 ${filters.endDate ? 'bg-green-50 border-green-300' : ''}`}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="font-medium">Airline</Label>
                <Select 
                  value={filters.airline} 
                  onValueChange={(value) => handleFilterChange('airline', value)}
                >
                  <SelectTrigger className={`transition-colors duration-200 ${filters.airline !== 'all_airlines' ? 'bg-green-50 border-green-300' : ''}`}>
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
                <Label className="font-medium">Fleet</Label>
                <Select 
                  value={filters.fleet} 
                  onValueChange={(value) => handleFilterChange('fleet', value)}
                >
                  <SelectTrigger className={`transition-colors duration-200 ${filters.fleet !== 'all_fleets' ? 'bg-green-50 border-green-300' : ''}`}>
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
                <Label className="font-medium">Station</Label>
                <Select 
                  value={filters.station} 
                  onValueChange={(value) => handleFilterChange('station', value)}
                >
                  <SelectTrigger className={`transition-colors duration-200 ${filters.station !== 'all_stations' ? 'bg-green-50 border-green-300' : ''}`}>
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
          
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 pt-4 border-t">
              <Button 
                onClick={applyFilters} 
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
                onClick={resetFilters}
              >
                Reset Filters
              </Button>
            </div>
          </Card>
          
          {filtersApplied && (
            <>
              {/* Results Section */}
              <Card className="p-4 sm:p-6 shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Badge variant="secondary" className="px-3 py-1">
                        {filteredRecords.length}
                      </Badge>
                      Records Found
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {filteredRecords.length === 0 
                        ? "No records match your filter criteria" 
                        : `Ready to export ${filteredRecords.length} flight record${filteredRecords.length !== 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                  
                  {filteredRecords.length > 0 && (
                    <Button 
                      onClick={() => setShowColumnDialog(true)} 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                      disabled={exporting}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {exporting ? "Exporting..." : "Export to Excel"}
                    </Button>
                  )}
                </div>
              
                {/* Preview Table */}
                {filteredRecords.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                      Preview
                      <Badge variant="outline" className="text-xs">
                        Showing {Math.min(filteredRecords.length, 10)} of {filteredRecords.length}
                      </Badge>
                    </h3>
                    <div className="border rounded-lg bg-card overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Airline</th>
                              <th scope="col" className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fleet</th>
                              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station</th>
                              <th scope="col" className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Defect</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRecords.slice(0, 10).map((record, index) => (
                              <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">{formatDate(record.date)}</td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                                  <div className="truncate max-w-[120px] sm:max-w-none" title={record.airline}>
                                    {record.airline}
                                  </div>
                                </td>
                                <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{record.fleet}</td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{record.station}</td>
                                <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                  {record.service === 'AOG' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      {record.service}
                                    </span>
                                  ) : record.service}
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                  {record.hasDefect ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-yellow-800">
                                      Yes
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      No
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {filteredRecords.length > 10 && (
                        <div className="px-4 py-3 bg-blue-50 text-center border-t">
                          <p className="text-sm text-blue-700">
                            <strong>{filteredRecords.length - 10}</strong> more records available in export
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}

          {/* Column Selection Dialog */}
          <Dialog open={showColumnDialog} onOpenChange={setShowColumnDialog}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  Customize Export Columns
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Select the data columns you want to include in your Excel export. All selected columns will be exported with properly formatted data.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto"
                    onClick={selectAllColumns}
                  >
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto"
                    onClick={deselectAllColumns}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Deselect All
                  </Button>
                  <div className="flex-1 sm:ml-4">
                    <Badge variant="secondary" className="text-xs">
                      {selectedColumns.filter(col => col.checked).length} of {selectedColumns.length} columns selected
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedColumns.map((column) => (
                    <div key={column.key} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id={column.key}
                        checked={column.checked}
                        onCheckedChange={() => handleColumnToggle(column.key)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <Label 
                        htmlFor={column.key} 
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto order-2 sm:order-1"
                  onClick={() => setShowColumnDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={exportToExcel}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto order-1 sm:order-2"
                  disabled={selectedColumns.filter(col => col.checked).length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export {selectedColumns.filter(col => col.checked).length} Columns to Excel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

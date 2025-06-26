"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";
import { X, Loader2, Upload, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AutoCompleteInput } from "@/components/ui/auto-complete-input";
import { airlines } from "@/data/airlines";
import { airplanes } from "@/data/airplanes";
import { engines } from "@/data/engines";
import { oiltypes } from "@/data/oiltype";
import { stations } from "@/data/stations";

// Maximum file size limit (25MB in bytes)
const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

interface UpliftOilFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function UpliftOilForm({ onClose, onSuccess }: UpliftOilFormProps) {
  // Generate a unique key to force form re-render and clear all values
  const [formKey, setFormKey] = useState<number>(Date.now());
  const [date, setDate] = useState<string>("");
  const [airline, setAirline] = useState<string>("");
  const [airlineSuggestions, setAirlineSuggestions] = useState<string[]>([]);
  const [fleet, setFleet] = useState<string>("");
  const [fleetSuggestions, setFleetSuggestions] = useState<string[]>([]);
  const [tailNumber, setTailNumber] = useState<string>("");
  const [flightNumber, setFlightNumber] = useState<string>("");
  const [station, setStation] = useState<string>("");
  const [stationSuggestions, setStationSuggestions] = useState<string[]>([]);
  const [serviceType, setServiceType] = useState<string>("");
  const [enginePosition, setEnginePosition] = useState<string>("");
  const [engineModel, setEngineModel] = useState<string>("");
  const [engineModelSuggestions, setEngineModelSuggestions] = useState<string[]>([]);
  const [hydraulicSystem, setHydraulicSystem] = useState<string>("");
  const [oilAmount, setOilAmount] = useState<string>("");
  const [oilType, setOilType] = useState<string>("");
  const [oilTypeSuggestions, setOilTypeSuggestions] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [totalFileSize, setTotalFileSize] = useState<number>(0);
  const [fileSizeExceeded, setFileSizeExceeded] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const serviceTypeOptions = ['Engine', 'Hydraulic SYS', 'APU'];

  // Reset form when component mounts (form is opened)
  useEffect(() => {
    // Clear all form fields to prevent browser autocomplete and previous values
    const clearForm = () => {
      // Generate new form key to force complete re-render
      setFormKey(Date.now());
      
      setDate("");
      setAirline("");
      setAirlineSuggestions([]);
      setFleet("");
      setFleetSuggestions([]);
      setTailNumber("");
      setFlightNumber("");
      setStation("");
      setStationSuggestions([]);
      setServiceType("");
      setEnginePosition("");
      setEngineModel("");
      setEngineModelSuggestions([]);
      setHydraulicSystem("");
      setOilAmount("");
      setOilType("");
      setOilTypeSuggestions([]);
      setAttachedFiles([]);
      setTotalFileSize(0);
      setFileSizeExceeded(false);
      setIsSubmitting(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Force clear all form inputs to prevent browser autocomplete
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          const inputs = form.querySelectorAll('input, select, textarea');
          inputs.forEach((input: any) => {
            if (input.type !== 'file') {
              input.value = '';
              input.defaultValue = '';
            }
          });
        }
      }, 100);
    };

    clearForm();
  }, []); // Empty dependency array means this runs once when component mounts

  // Get airline suggestions
  const getAirlineSuggestions = (input: string) => {
    if (!input) return [];
    const upperInput = input.toUpperCase().trim();
    return airlines
      .filter(
        (airline) =>
          airline.name.toUpperCase().includes(upperInput) ||
          airline.icaoCode.includes(upperInput)
      )
      .map((airline) => `${airline.icaoCode} - ${airline.name}`)
      .slice(0, 10);
  };

  // Get airplane suggestions
  const getFleetSuggestions = (input: string) => {
    if (!input) return [];
    const upperInput = input.toUpperCase().trim();
    return airplanes
      .filter(
        (airplane) =>
          airplane.model.toUpperCase().includes(upperInput) ||
          airplane.manufacturer.toUpperCase().includes(upperInput)
      )
      .map((airplane) => `${airplane.manufacturer} ${airplane.model}`)
      .slice(0, 10);
  };

  // Get engine suggestions
  const getEngineSuggestions = (input: string) => {
    if (!input) return [];
    const upperInput = input.toUpperCase().trim();
    return engines
      .filter((engine) =>
        engine.model.toUpperCase().includes(upperInput)
      )
      .map((engine) => engine.model)
      .slice(0, 10);
  };

  // Get oil type suggestions
  const getOilTypeSuggestions = (input: string) => {
    if (!input) return [];
    const upperInput = input.toUpperCase().trim();
    return oiltypes
      .filter((oil) =>
        oil.manufacturer.toUpperCase().includes(upperInput) ||
        oil.oiltype.toUpperCase().includes(upperInput)
      )
      .map((oil) => oil.manufacturer)
      .slice(0, 10);
  };

  // Get station suggestions
  const getStationSuggestions = (input: string) => {
    if (!input) return [];
    const upperInput = input.toUpperCase().trim();
    return stations
      .filter((station) =>
        station.code.toUpperCase().includes(upperInput) ||
        station.name.toUpperCase().includes(upperInput) ||
        station.country.toUpperCase().includes(upperInput)
      )
      .map((station) => `${station.code} - ${station.name}`)
      .slice(0, 10);
  };

  // Format file size to human-readable format
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate total size of files
  const calculateTotalFileSize = (files: File[]) => {
    return files.reduce((total, file) => total + file.size, 0);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [...attachedFiles, ...files];
    const newTotalSize = calculateTotalFileSize(newFiles);
    
    if (newTotalSize > MAX_UPLOAD_SIZE_BYTES) {
      setFileSizeExceeded(true);
      toast({
        title: "File size limit exceeded",
        description: `Total file size cannot exceed ${formatFileSize(MAX_UPLOAD_SIZE_BYTES)}. Current total: ${formatFileSize(newTotalSize)}`,
        variant: "destructive",
      });
      return;
    }
    
    setFileSizeExceeded(false);
    setAttachedFiles(newFiles);
    setTotalFileSize(newTotalSize);
    
    // Reset file input to allow selecting the same files again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const newFiles = attachedFiles.filter((_, i) => i !== index);
    setAttachedFiles(newFiles);
    const newTotalSize = calculateTotalFileSize(newFiles);
    setTotalFileSize(newTotalSize);
    if (newTotalSize <= MAX_UPLOAD_SIZE_BYTES) {
      setFileSizeExceeded(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!date) {
        toast({
          title: "Date Required",
          description: "Please select a date",
          variant: "destructive",
        });
        return;
      }

      if (!airline) {
        toast({
          title: "Airline Required",
          description: "Please select an airline",
          variant: "destructive",
        });
        return;
      }

      if (!fleet) {
        toast({
          title: "Fleet Required",
          description: "Please select a fleet",
          variant: "destructive",
        });
        return;
      }

      if (!serviceType) {
        toast({
          title: "Service Type Required",
          description: "Please select a service type",
          variant: "destructive",
        });
        return;
      }

      if (!oilAmount || parseFloat(oilAmount) <= 0) {
        toast({
          title: "Oil Amount Required",
          description: "Please enter a valid oil amount in Quarts",
          variant: "destructive",
        });
        return;
      }

      // Validate conditional fields
      if (serviceType === "Engine") {
        if (!enginePosition) {
          toast({
            title: "Engine Position Required",
            description: "Please specify the engine position",
            variant: "destructive",
          });
          return;
        }
        if (!engineModel) {
          toast({
            title: "Engine Model Required",
            description: "Please select an engine model",
            variant: "destructive",
          });
          return;
        }
      }

      if (serviceType === "Hydraulic SYS" && !hydraulicSystem) {
        toast({
          title: "Hydraulic System Required",
          description: "Please specify the hydraulic system",
          variant: "destructive",
        });
        return;
      }

      // Create FormData for API request
      const formData = new FormData();
      formData.append('date', date);
      formData.append('airline', airline);
      formData.append('fleet', fleet);
      formData.append('serviceType', serviceType);
      formData.append('oilAmount', oilAmount);
      if (oilType) formData.append('oilType', oilType);
      
      if (tailNumber) formData.append('tailNumber', tailNumber);
      if (flightNumber) formData.append('flightNumber', flightNumber);
      if (station) formData.append('station', station);
      if (enginePosition) formData.append('enginePosition', enginePosition);
      if (engineModel) formData.append('engineModel', engineModel);
      if (hydraulicSystem) formData.append('hydraulicSystem', hydraulicSystem);

      // Add files to FormData
      attachedFiles.forEach((file) => {
        formData.append('files', file);
      });

      // Submit to API
      const response = await fetch('/api/oil-consumption', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save oil service record');
      }

      const result = await response.json();

      toast({
        title: "Oil Service Recorded",
        description: "Oil uplift information has been successfully recorded",
      });

      // Trigger dashboard refresh if callback provided
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Error submitting oil service record:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record oil service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl mx-auto rounded-none max-h-[95vh] overflow-y-auto w-[85vw]">
        <DialogHeader>
          <DialogTitle>Uplift Oil Service</DialogTitle>
          <DialogDescription>
            Record oil servicing information for aircraft systems
          </DialogDescription>
        </DialogHeader>

        <form key={formKey} onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* Date and Airline - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="text-sm">Date *</Label>
              <Input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`mt-1 w-full rounded-none cursor-pointer ${date ? 'bg-green-50' : ''}`}
                autoComplete="off"
                required
              />
            </div>

            <div>
              <Label htmlFor="airline" className="text-sm">Airline *</Label>
              <AutoCompleteInput
                id="airline"
                value={airline}
                suggestions={airlineSuggestions}
                onValueChange={(value) => {
                  setAirline(value);
                  setAirlineSuggestions(getAirlineSuggestions(value));
                }}
                placeholder="Search airline..."
                className={`mt-1 w-full rounded-none cursor-pointer ${airline ? 'bg-green-50' : ''}`}
              />
            </div>
          </div>

          {/* Fleet and Tail Number - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fleet" className="text-sm">Fleet *</Label>
              <AutoCompleteInput
                id="fleet"
                value={fleet}
                suggestions={fleetSuggestions}
                onValueChange={(value) => {
                  setFleet(value);
                  setFleetSuggestions(getFleetSuggestions(value));
                }}
                placeholder="Search fleet..."
                className={`mt-1 w-full rounded-none cursor-pointer ${fleet ? 'bg-green-50' : ''}`}
              />
            </div>

            <div>
              <Label htmlFor="tailNumber" className="text-sm">Tail Number</Label>
              <Input
                type="text"
                id="tailNumber"
                value={tailNumber}
                onChange={(e) => setTailNumber(e.target.value.toUpperCase())}
                placeholder="e.g., N123AB"
                className={`mt-1 w-full rounded-none cursor-pointer ${tailNumber ? 'bg-green-50' : ''}`}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Flight Number and Station - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="flightNumber" className="text-sm">Flight Number</Label>
                              <Input
                  type="text"
                  id="flightNumber"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                  placeholder="Optional"
                  className={`mt-1 w-full rounded-none cursor-pointer ${flightNumber ? 'bg-green-50' : ''}`}
                  autoComplete="off"
                />
            </div>

            <div>
              <Label htmlFor="station" className="text-sm">Station</Label>
              <AutoCompleteInput
                id="station"
                value={station}
                suggestions={stationSuggestions}
                onValueChange={(value) => {
                  setStation(value);
                  setStationSuggestions(getStationSuggestions(value));
                }}
                placeholder="Search station..."
                className={`mt-1 w-full rounded-none cursor-pointer ${station ? 'bg-green-50' : ''}`}
              />
            </div>
          </div>

          {/* Service Type and Engine Position/Hydraulic System - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serviceType" className="text-sm">Service Type *</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger id="serviceType" className="mt-1 rounded-none cursor-pointer">
                  <SelectValue placeholder="Pick One" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Engine Position - Only show when Engine is selected */}
            {serviceType === "Engine" && (
              <div>
                <Label htmlFor="enginePosition" className="text-sm">Engine Position *</Label>
                <Select value={enginePosition} onValueChange={setEnginePosition}>
                  <SelectTrigger id="enginePosition" className="mt-1 rounded-none cursor-pointer">
                    <SelectValue placeholder="Select Engine Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENG-1">ENG-1</SelectItem>
                    <SelectItem value="ENG-2">ENG-2</SelectItem>
                    <SelectItem value="ENG-3">ENG-3</SelectItem>
                    <SelectItem value="ENG-4">ENG-4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Hydraulic System - Only show when Hydraulic SYS is selected */}
            {serviceType === "Hydraulic SYS" && (
              <div>
                <Label htmlFor="hydraulicSystem" className="text-sm">Hydraulic System *</Label>
                <Select value={hydraulicSystem} onValueChange={setHydraulicSystem}>
                  <SelectTrigger id="hydraulicSystem" className="mt-1 rounded-none cursor-pointer">
                    <SelectValue placeholder="Select Hydraulic System" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYS-A">SYS-A</SelectItem>
                    <SelectItem value="SYS-B">SYS-B</SelectItem>
                    <SelectItem value="SYS-STANDBY">SYS-STANDBY</SelectItem>
                    <SelectItem value="SYS-BLUE">SYS-BLUE</SelectItem>
                    <SelectItem value="SYS-GREEN">SYS-GREEN</SelectItem>
                    <SelectItem value="SYS-YELLOW">SYS-YELLOW</SelectItem>
                    <SelectItem value="SYS-LEFT">SYS-LEFT</SelectItem>
                    <SelectItem value="SYS-RIGHT">SYS-RIGHT</SelectItem>
                    <SelectItem value="SYS-CENTER">SYS-CENTER</SelectItem>
                    <SelectItem value="SYS-1">SYS-1</SelectItem>
                    <SelectItem value="SYS-2">SYS-2</SelectItem>
                    <SelectItem value="SYS-3">SYS-3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Conditional Fields for Engine */}
          {serviceType === "Engine" && (
            <>
              <div>
                <Label htmlFor="engineModel" className="text-sm">Engine Model *</Label>
                <AutoCompleteInput
                  id="engineModel"
                  value={engineModel}
                  suggestions={engineModelSuggestions}
                  onValueChange={(value) => {
                    setEngineModel(value);
                    setEngineModelSuggestions(getEngineSuggestions(value));
                  }}
                  placeholder="Search engine model..."
                  className={`mt-1 w-full rounded-none cursor-pointer ${engineModel ? 'bg-green-50' : ''}`}
                />
              </div>
            </>
          )}

          {/* Oil Amount and Oil Type - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="oilAmount" className="text-sm">Oil Amount (Quarts) *</Label>
              <Input
                type="number"
                id="oilAmount"
                value={oilAmount}
                onChange={(e) => setOilAmount(e.target.value)}
                placeholder="Enter oil amount in Quarts"
                min="0"
                step="0.1"
                className={`mt-1 w-full rounded-none cursor-pointer ${oilAmount ? 'bg-green-50' : ''}`}
                autoComplete="off"
                required
              />
            </div>

            <div>
              <Label htmlFor="oilType" className="text-sm">Oil Type</Label>
              <AutoCompleteInput
                id="oilType"
                value={oilType}
                suggestions={oilTypeSuggestions}
                onValueChange={(value) => {
                  setOilType(value);
                  setOilTypeSuggestions(getOilTypeSuggestions(value));
                }}
                placeholder="Search oil type..."
                className={`mt-1 w-full rounded-none cursor-pointer ${oilType ? 'bg-green-50' : ''}`}
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <Label className="text-sm">Upload File</Label>
            <div className="mt-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept="*/*"
              />
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileInput}
                className="w-full rounded-none cursor-pointer"
                disabled={fileSizeExceeded}
              >
                <Upload className="h-4 w-4 mr-2" />
                {attachedFiles.length > 0 ? `${attachedFiles.length} file(s) selected` : 'Choose Files'}
              </Button>
              
              {totalFileSize > 0 && (
                <p className={`text-xs mt-1 ${fileSizeExceeded ? 'text-red-500' : 'text-muted-foreground'}`}>
                  Total size: {formatFileSize(totalFileSize)} / {formatFileSize(MAX_UPLOAD_SIZE_BYTES)}
                </p>
              )}

              {attachedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs text-muted-foreground">Attached Files:</Label>
                  <div className="border rounded-md p-3 bg-gray-50">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border mb-2 last:mb-0">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          title="Remove file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="h-8 text-xs border border-black hover:bg-gray-100 bg-white text-black cursor-pointer"
              onClick={onClose} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="outline"
              disabled={isSubmitting || fileSizeExceeded}
              size="sm"
              className="h-8 text-xs border border-green-500 hover:bg-green-50 bg-green-100 text-black cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

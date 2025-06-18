"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { X, Loader2, Plus, Minus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { UserSearchCombobox } from "@/components/ui/user-search-combobox";
import { validateStation, validateAirline, validateAirplane, getStationSuggestions, getAirlineSuggestions, getAirplaneSuggestions, getCleanStationCode, getCleanAirlineName, getCleanAirplaneModel, isValueFromAirlineSuggestions, isValueFromStationSuggestions, isValueFromAirplaneSuggestions } from "@/utils/validation";
import { AutoCompleteInput } from "@/components/ui/auto-complete-input";

// Maximum file size limit (250MB in bytes)
const MAX_UPLOAD_SIZE_BYTES = 250 * 1024 * 1024;

interface AddFlightFormProps {
  onClose: () => void;
}

interface PartReplacement {
  pnOff: string;
  snOff: string;
  pnOn: string;
  snOn: string;
}

export function AddFlightForm({ onClose }: AddFlightFormProps) {
  const [date, setDate] = useState<string>("");
  const [hasTime, setHasTime] = useState<string>("no");
  const [blockTime, setBlockTime] = useState<string>("");
  const [outTime, setOutTime] = useState<string>("");
  const [blockTimeError, setBlockTimeError] = useState<string>("");
  const [outTimeError, setOutTimeError] = useState<string>("");
  const [airline, setAirline] = useState<string>("");
  const [fleet, setFleet] = useState<string>("");
  const [flightNumber, setFlightNumber] = useState<string>("");
  const [tail, setTail] = useState<string>("");
  const [station, setStation] = useState<string>("");
  const [otherStation, setOtherStation] = useState<string>("");
  const [service, setService] = useState<string>("");
  const [hasDefect, setHasDefect] = useState<string>("no");
  const [logPageNo, setLogPageNo] = useState<string>("");
  const [discrepancyNote, setDiscrepancyNote] = useState<string>("");
  const [rectificationNote, setRectificationNote] = useState<string>("");
  const [systemAffected, setSystemAffected] = useState<string>("");
  const [defectStatus, setDefectStatus] = useState<string>("");
  const [riiRequired, setRiiRequired] = useState<string>("no");
  const [inspectedById, setInspectedById] = useState<string>("");
  const [inspectedByName, setInspectedByName] = useState<string>("");
  const [hasPartReplaced, setHasPartReplaced] = useState<string>("no");
  const [hasAttachments, setHasAttachments] = useState<string>("no");
  const [hasComment, setHasComment] = useState<string>("no");
  const [comment, setComment] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [totalFileSize, setTotalFileSize] = useState<number>(0);
  const [fileSizeExceeded, setFileSizeExceeded] = useState<boolean>(false);
  const [technician, setTechnician] = useState<string>("");
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fixingManual, setFixingManual] = useState<string>("");
  const [manualReference, setManualReference] = useState<string>("");
  const [manualReferenceError, setManualReferenceError] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  

  const serviceOptions = ['Transit', 'Over-Night', 'Cancelled', 'Diverted', 'AOG', 'Push-Back', 'Fueling', 'N/A'];
  const systemOptions = ['ATA-05 Inspections', 'ATA-10 Parking, Mooring, etc', 'ATA-11 Placards/Markings', 'ATA-12 Servicing', 'ATA-21 Air Conditioning', 'ATA-22 Autoflight', 'ATA-23 Communications', 'ATA-24 Electrical',
    'ATA-25 Equip/Furnishing', 'ATA-26 Fire Protection', 'ATA-27 Flight Controls', 'ATA-28 Fuel', 'ATA-29 Hydraulic SYS', 'ATA-30 Ice/Rain Prot', 'ATA-31 Instruments', 'ATA-32 Landing Gear',
    'ATA-33 Lights', 'ATA-34 Navigation', 'ATA-35 Oxygen', 'ATA-36 Pneumatic', 'ATA-38 Water/Waste', 'ATA-45 Central Maint. SYS', 'ATA-49 APU', 'ATA-51 Standard Practices', 'ATA-52 Doors',
    'ATA-53 Fuselage', 'ATA-54 Nacelles/Pylons', 'ATA-55 Stabilizers', 'ATA-56 Windows', 'ATA-57 Wings', 'ATA-70 Standard Practice - Engine', 'ATA-71 PowerPlant', 'ATA-72 Engine', 'ATA-73 Fuel Control',
    'ATA-73 Engine Fuel Control', 'ATA-74 Ignition', 'ATA-75 Engine Bleed'];

  // Add manual options
  const fixedManualOptions = ['AMM', 'IFIM', 'FIM', 'TSM', 'SRM', 'WM', 'AIPC', 'QRH', 'OTHER'];
  const deferredManualOptions = ['MEL', 'CDL', 'GMM', 'OTHER'];

  const [partReplacements, setPartReplacements] = useState<PartReplacement[]>([{
    pnOff: '',
    snOff: '',
    pnOn: '',
    snOn: ''
  }]);

  const [stationError, setStationError] = useState<string>("");
  const [isStationValid, setIsStationValid] = useState<boolean | undefined>(undefined);
  const [stationSuggestions, setStationSuggestions] = useState<string[]>([]);
  
  const [airlineError, setAirlineError] = useState<string>("");
  const [isAirlineValid, setIsAirlineValid] = useState<boolean | undefined>(undefined);
  const [airlineSuggestions, setAirlineSuggestions] = useState<string[]>([]);

  const [fleetError, setFleetError] = useState<string>("");
  const [isFleetValid, setIsFleetValid] = useState<boolean | undefined>(undefined);
  const [fleetSuggestions, setFleetSuggestions] = useState<string[]>([]);

  // Validate time is within range 00:00 to 23:59
  const isValidTime = (time: string): boolean => {
    if (!time) return true; // Empty is considered valid
    
    // Check if it matches the HH:MM format
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(time)) return false;
    
    // Extract hours and minutes
    const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
    
    // Check if hours and minutes are within valid ranges
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  };

  // Time formatter function
  const formatTime = (input: string): string => {
    // Remove any non-numeric characters
    const numbers = input.replace(/[^\d]/g, '');
    
    if (numbers.length === 0) return '';
    
    if (numbers.length === 1) {
      // Single digit (e.g., "1" -> "01:00")
      return `0${numbers}:00`;
    } else if (numbers.length === 2) {
      // Two digits (e.g., "12" -> "12:00")
      return `${numbers}:00`;
    } else if (numbers.length === 3) {
      // Three digits (e.g., "123" -> "01:23")
      return `0${numbers[0]}:${numbers.substring(1)}`;
    } else {
      // Four or more digits (e.g., "1234" -> "12:34")
      return `${numbers.substring(0, 2)}:${numbers.substring(2, 4)}`;
    }
  };

  // Handle time input changes
  const handleTimeChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(value.replace(/[^0-9:]/g, ''));
  };

  // Format time when field loses focus
  const handleTimeBlur = (
    value: string, 
    setter: React.Dispatch<React.SetStateAction<string>>,
    errorSetter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value === "") {
      setter("");
      errorSetter("");
      return;
    }
    
    // If the input already contains a colon and is in proper format, don't reformat
    if (/^\d{2}:\d{2}$/.test(value)) {
      // Validate the time
      if (isValidTime(value)) {
        setter(value);
        errorSetter("");
      } else {
        errorSetter("Time must be between 00:00 and 23:59");
      }
      return;
    }
    
    // Format the time
    const formattedTime = formatTime(value);
    
    // Validate the formatted time
    if (isValidTime(formattedTime)) {
      setter(formattedTime);
      errorSetter("");
    } else {
      errorSetter("Time must be between 00:00 and 23:59");
    }
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
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = [...attachedFiles, ...newFiles];
      
      // Calculate total file size
      const newTotalSize = calculateTotalFileSize(updatedFiles);
      setTotalFileSize(newTotalSize);
      
      // Check if total size exceeds the limit
      const isExceeded = newTotalSize > MAX_UPLOAD_SIZE_BYTES;
      setFileSizeExceeded(isExceeded);
      
      if (isExceeded) {
        toast({
          title: "File size limit exceeded",
          description: `Total size (${formatFileSize(newTotalSize)}) exceeds the maximum limit of ${formatFileSize(MAX_UPLOAD_SIZE_BYTES)}`,
          variant: "destructive"
        });
      }
      
      setAttachedFiles(updatedFiles);
    }
  };

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const updatedFiles = attachedFiles.filter((_, i) => i !== index);
    setAttachedFiles(updatedFiles);
    
    // Recalculate total file size
    const newTotalSize = calculateTotalFileSize(updatedFiles);
    setTotalFileSize(newTotalSize);
    setFileSizeExceeded(newTotalSize > MAX_UPLOAD_SIZE_BYTES);
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Add validation for manual reference
  const validateManualReference = (value: string) => {
    if (!value.trim()) {
      setManualReferenceError("Manual reference number is required");
      return false;
    }
    setManualReferenceError("");
    return true;
  };

  // Add these functions to handle part replacements
  const addPartReplacement = () => {
    setPartReplacements([...partReplacements, {
      pnOff: '',
      snOff: '',
      pnOn: '',
      snOn: ''
    }]);
  };

  const removePartReplacement = (index: number) => {
    setPartReplacements(partReplacements.filter((_, i) => i !== index));
  };

  const updatePartReplacement = (index: number, field: keyof PartReplacement, value: string) => {
    const newReplacements = [...partReplacements];
    newReplacements[index] = {
      ...newReplacements[index],
      [field]: value
    };
    setPartReplacements(newReplacements);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate required fields and their formats
    if (!date || !airline || !fleet || !station || !service) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate station format
    if (!validateStation(station)) {
      setStationError("Please select a valid station from the list");
      setIsStationValid(false);
      toast({
        title: "Error",
        description: "Please select a valid station from the list",
        variant: "destructive"
      });
      return;
    }

    // Validate airline format
    if (!validateAirline(airline)) {
      setAirlineError("Please select a valid airline from the list");
      setIsAirlineValid(false);
      toast({
        title: "Error",
        description: "Please select a valid airline from the list",
        variant: "destructive"
      });
      return;
    }

    // Validate airplane format
    if (!validateAirplane(fleet)) {
      setFleetError("Please select a valid airplane model from the list");
      setIsFleetValid(false);
      toast({
        title: "Error",
        description: "Please select a valid airplane model from the list",
        variant: "destructive"
      });
      return;
    }

    // Validate time format if hasTime is "yes"
    if (hasTime === "yes") {
      if (blockTimeError || outTimeError) {
        toast({
          title: "Error",
          description: "Please correct the time format errors",
          variant: "destructive"
        });
        return;
      }
    }

    // Validate manual reference if defect status is set
    if (hasDefect === "yes" && defectStatus && !validateManualReference(manualReference)) {
      return;
    }

    // Check if total file size exceeds limit
    if (fileSizeExceeded) {
      toast({
        title: "Error",
        description: `Total file size exceeds ${formatFileSize(MAX_UPLOAD_SIZE_BYTES)} limit`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData instance
      const formData = new FormData();
      formData.append('date', date);
      formData.append('hasTime', hasTime);
      formData.append('blockTime', blockTime);
      formData.append('outTime', outTime);
      formData.append('airline', airline);
      formData.append('fleet', fleet);
      formData.append('flightNumber', flightNumber);
      formData.append('tail', tail);
      formData.append('station', station);
      formData.append('service', service);
      formData.append('hasDefect', hasDefect);
      formData.append('logPageNo', logPageNo);
      formData.append('discrepancyNote', discrepancyNote);
      formData.append('rectificationNote', rectificationNote);
      formData.append('systemAffected', systemAffected);
      formData.append('defectStatus', defectStatus);
      formData.append('riiRequired', riiRequired);
      formData.append('inspectedBy', inspectedByName);
      formData.append('hasPartReplaced', hasPartReplaced);
      formData.append('hasAttachments', hasAttachments);
      formData.append('hasComment', hasComment);
      formData.append('comment', comment);
      formData.append('technician', technician);
      formData.append('username', username);
      formData.append('fixingManual', fixingManual);
      formData.append('manualReference', manualReference);

      // Append part replacements if any
      if (hasDefect === "yes" && hasPartReplaced === "yes") {
        formData.append('partReplacements', JSON.stringify(partReplacements));
      }

      // Append files if any
      if (hasAttachments === "yes") {
        attachedFiles.forEach(file => {
          formData.append('files', file);
        });
      }

      const response = await fetch('/api/flight-records', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Flight record added successfully",
        });
        onClose();
      } else {
        throw new Error(data.message || 'Failed to add flight record');
      }
    } catch (error) {
      console.error('Error adding flight record:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add flight record",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch current user data when component mounts
  useEffect(() => {
    const fetchUserData = async (retryCount = 0) => {
      try {
        setIsLoadingUser(true);
        const response = await fetch('/api/user');
        const data = await response.json();
        if (data.success) {
          setTechnician(data.user.firstName + ' ' + data.user.lastName);
          setUsername(data.user.username);
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (retryCount < 3) {
          setTimeout(() => fetchUserData(retryCount + 1), 1000 * Math.pow(2, retryCount));
        }
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="bg-card p-4 shadow border w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Add New Flight Record</h2>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Flexible grid layout */}
        <div className="flex flex-wrap -mx-2">
          {/* Each field takes up 1/3 of the container on md screens */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="date" className="text-sm sm:text-base">Date</Label>
            <Input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`mt-1 w-full rounded-none cursor-pointer ${date ? 'bg-green-50' : ''}`}
            />
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="station" className="text-sm sm:text-base">Station (IATA Code)</Label>
            <AutoCompleteInput
              id="station"
              value={station}
              onValueChange={(value) => {
                // If selecting from suggestions (contains " - ")
                if (value.includes(" - ")) {
                  const code = getCleanStationCode(value);
                  setStation(code);
                  setIsStationValid(true);
                  setStationError("");
                } else {
                  // During typing
                  setStation(value.toUpperCase());
                  setIsStationValid(undefined);
                  setStationError("");
                }
              }}
              suggestions={getStationSuggestions(station)}
              placeholder="Enter station code (e.g., JFK)"
              maxLength={3}
              isValid={isStationValid}
              errorMessage={stationError}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter 3-letter IATA airport code</p>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="airline" className="text-sm sm:text-base">Airline</Label>
            <AutoCompleteInput
              id="airline"
              value={airline}
              onValueChange={(value) => {
                // If selecting from suggestions (contains " - ")
                if (value.includes(" - ")) {
                  const name = getCleanAirlineName(value);
                  setAirline(name);
                  setIsAirlineValid(true);
                  setAirlineError("");
                } else {
                  // During typing
                  setAirline(value);
                  // Validate if the typed value exactly matches an airline name
                  const isValid = isValueFromAirlineSuggestions(value);
                  setIsAirlineValid(isValid);
                  setAirlineError(isValid ? "" : "Please select a valid airline from the list");
                }
              }}
              suggestions={getAirlineSuggestions(airline)}
              placeholder="Enter airline name"
              isValid={isAirlineValid}
              errorMessage={airlineError}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter the full airline name</p>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="fleet" className="text-sm sm:text-base">Fleet</Label>
            <AutoCompleteInput
              id="fleet"
              value={fleet}
              onValueChange={(value) => {
                // If selecting from suggestions (contains " - ")
                if (value.includes(" - ")) {
                  const model = getCleanAirplaneModel(value);
                  setFleet(model);
                  setIsFleetValid(true);
                  setFleetError("");
                } else {
                  // During typing
                  setFleet(value);
                  // Validate if the typed value exactly matches an airplane model
                  const isValid = isValueFromAirplaneSuggestions(value);
                  setIsFleetValid(isValid);
                  setFleetError(isValid ? "" : "Please select a valid airplane model from the list");
                }
              }}
              suggestions={getAirplaneSuggestions(fleet)}
              placeholder="Enter aircraft model"
              isValid={isFleetValid}
              errorMessage={fleetError}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter the aircraft model (e.g., A320, B737)</p>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="flightNumber" className="text-sm sm:text-base">Flight Number</Label>
            <Input
              type="text"
              id="flightNumber"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder="Enter flight number"
              className={`mt-1 w-full rounded-none cursor-pointer ${flightNumber ? 'bg-green-50' : ''}`}
            />
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="tail" className="text-sm sm:text-base">Tail</Label>
            <Input
              type="text"
              id="tail"
              value={tail}
              onChange={(e) => setTail(e.target.value)}
              placeholder="Enter aircraft registration"
              className={`mt-1 w-full rounded-none cursor-pointer ${tail ? 'bg-green-50' : ''}`}
            />
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="hasTime" className="text-sm sm:text-base">Has Time?</Label>
            <Select value={hasTime} onValueChange={setHasTime}>
              <SelectTrigger id="hasTime" className="mt-1 rounded-none cursor-pointer">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasTime === "yes" && (
            <>
              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="blockTime" className="text-sm sm:text-base">Block Time</Label>
                <Input
                  type="text" 
                  id="blockTime"
                  value={blockTime}
                  onChange={(e) => handleTimeChange(e.target.value, setBlockTime)}
                  onBlur={(e) => handleTimeBlur(e.target.value, setBlockTime, setBlockTimeError)}
                  placeholder="HH:MM"
                  className={`mt-1 w-full rounded-none cursor-pointer ${blockTimeError ? "border-red-500" : ""} ${blockTime && !blockTimeError ? 'bg-green-50' : ''}`}
                  maxLength={5}
                />
                {blockTimeError ? (
                  <p className="text-xs text-red-500 mt-1">{blockTimeError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Format: HH:MM (e.g. 09:30)</p>
                )}
              </div>

              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="outTime" className="text-sm sm:text-base">Out Time</Label>
                <Input
                  type="text"
                  id="outTime"
                  value={outTime}
                  onChange={(e) => handleTimeChange(e.target.value, setOutTime)}
                  onBlur={(e) => handleTimeBlur(e.target.value, setOutTime, setOutTimeError)}
                  placeholder="HH:MM"
                  className={`mt-1 w-full rounded-none cursor-pointer ${outTimeError ? "border-red-500" : ""} ${outTime && !outTimeError ? 'bg-green-50' : ''}`}
                  maxLength={5}
                />
                {outTimeError ? (
                  <p className="text-xs text-red-500 mt-1">{outTimeError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Format: HH:MM (e.g. 09:30)</p>
                )}
              </div>
            </>
          )}

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="service" className="text-sm sm:text-base">Service</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger id="service" className="mt-1 rounded-none cursor-pointer">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {serviceOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="hasDefect" className="text-sm sm:text-base">Has Defect?</Label>
            <Select value={hasDefect} onValueChange={setHasDefect}>
              <SelectTrigger id="hasDefect" className="mt-1 rounded-none cursor-pointer">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasDefect === "yes" && (
            <>
              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="logPageNo" className="text-sm sm:text-base">Log Page No</Label>
                <Input
                  type="text"
                  id="logPageNo"
                  value={logPageNo}
                  onChange={(e) => setLogPageNo(e.target.value)}
                  placeholder="Enter log page number"
                  className={`mt-1 w-full rounded-none cursor-pointer ${logPageNo ? 'bg-green-50' : ''}`}
                />
              </div>

              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="systemAffected" className="text-sm sm:text-base">System Affected</Label>
                <Select 
                  value={systemAffected} 
                  onValueChange={setSystemAffected}
                >
                  <SelectTrigger id="systemAffected" className="mt-1 rounded-none cursor-pointer">
                    <SelectValue placeholder="Select system" />
                  </SelectTrigger>
                  <SelectContent>
                    {systemOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="defectStatus" className="text-sm sm:text-base">Fixed/Deferred</Label>
                <Select 
                  value={defectStatus} 
                  onValueChange={setDefectStatus}
                >
                  <SelectTrigger id="defectStatus" className="mt-1 rounded-none cursor-pointer">
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fixed">Fixed</SelectItem>
                    <SelectItem value="Deferred">Deferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {defectStatus && (
                <>
                  <div className="w-full md:w-1/3 px-2 mb-4">
                    <Label htmlFor="fixingManual" className="text-sm sm:text-base">
                      {defectStatus === "Fixed" ? "Fixing Manual" : "Deferral Manual"}
                    </Label>
                    <Select 
                      value={fixingManual} 
                      onValueChange={setFixingManual}
                    >
                      <SelectTrigger id="fixingManual" className="mt-1 rounded-none cursor-pointer">
                        <SelectValue placeholder="Select manual" />
                      </SelectTrigger>
                      <SelectContent>
                        {(defectStatus === "Fixed" ? fixedManualOptions : deferredManualOptions).map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {fixingManual && (
                    <>
                      <div className="w-full md:w-1/3 px-2 mb-4">
                        <Label htmlFor="manualReference" className="text-sm sm:text-base">
                          {defectStatus === "Fixed" ? "Fixing Manual Reference" : "Deferral Manual Reference"} *
                        </Label>
                        <Input
                          type="text"
                          id="manualReference"
                          value={manualReference}
                          onChange={(e) => {
                            setManualReference(e.target.value);
                            if (manualReferenceError) {
                              validateManualReference(e.target.value);
                            }
                          }}
                          onBlur={(e) => validateManualReference(e.target.value)}
                          placeholder={`Enter ${defectStatus === "Fixed" ? "fixing" : "deferral"} manual reference number`}
                          className={`mt-1 w-full rounded-none cursor-pointer ${manualReferenceError ? "border-red-500" : ""} ${manualReference && !manualReferenceError ? 'bg-green-50' : ''}`}
                          required
                        />
                        {manualReferenceError ? (
                          <p className="text-xs text-red-500 mt-1">{manualReferenceError}</p>
                        ) : null}
                      </div>

                      {/* Notes section - side by side */}
                      <div className="w-full px-2 mb-4 flex gap-4">
                        <div className="flex-1">
                          <Label htmlFor="discrepancyNote" className="text-sm sm:text-base">Discrepancy/Note</Label>
                          <Textarea
                            id="discrepancyNote"
                            value={discrepancyNote}
                            onChange={(e) => setDiscrepancyNote(e.target.value)}
                            placeholder="Enter discrepancy or note"
                            className={`mt-1 w-full min-h-[100px] rounded-none cursor-pointer ${discrepancyNote ? 'bg-green-50' : ''}`}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <Label htmlFor="rectificationNote" className="text-sm sm:text-base">Rectification/Note</Label>
                          <Textarea
                            id="rectificationNote"
                            value={rectificationNote}
                            onChange={(e) => setRectificationNote(e.target.value)}
                            placeholder="Enter rectification or note"
                            className={`mt-1 w-full min-h-[100px] rounded-none cursor-pointer ${rectificationNote ? 'bg-green-50' : ''}`}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="hasPartReplaced" className="text-sm sm:text-base">Part Replaced?</Label>
                <Select value={hasPartReplaced} onValueChange={setHasPartReplaced}>
                  <SelectTrigger id="hasPartReplaced" className="mt-1 rounded-none cursor-pointer">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasPartReplaced === "yes" && (
                <div className="w-full px-2 mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium">Part Replacements</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addPartReplacement}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {partReplacements.map((part, index) => (
                      <div key={index} className="border rounded p-2 relative">
                        {partReplacements.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePartReplacement(index)}
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <Label htmlFor={`pnOff-${index}`} className="text-xs">P/N OFF</Label>
                            <Input
                              type="text"
                              id={`pnOff-${index}`}
                              value={part.pnOff}
                              onChange={(e) => updatePartReplacement(index, 'pnOff', e.target.value)}
                              placeholder="P/N OFF"
                              className={`mt-1 w-full h-8 text-xs rounded-none cursor-pointer placeholder:text-blue-400 placeholder:bg-blue-50 ${part.pnOff ? 'bg-green-50' : ''}`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`snOff-${index}`} className="text-xs">S/N OFF</Label>
                            <Input
                              type="text"
                              id={`snOff-${index}`}
                              value={part.snOff}
                              onChange={(e) => updatePartReplacement(index, 'snOff', e.target.value)}
                              placeholder="S/N OFF"
                              className={`mt-1 w-full h-8 text-xs rounded-none cursor-pointer placeholder:text-orange-400 placeholder:bg-orange-50 ${part.snOff ? 'bg-green-50' : ''}`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`pnOn-${index}`} className="text-xs">P/N ON</Label>
                            <Input
                              type="text"
                              id={`pnOn-${index}`}
                              value={part.pnOn}
                              onChange={(e) => updatePartReplacement(index, 'pnOn', e.target.value)}
                              placeholder="P/N ON"
                              className={`mt-1 w-full h-8 text-xs rounded-none cursor-pointer placeholder:text-blue-400 placeholder:bg-blue-50 ${part.pnOn ? 'bg-green-50' : ''}`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`snOn-${index}`} className="text-xs">S/N ON</Label>
                            <Input
                              type="text"
                              id={`snOn-${index}`}
                              value={part.snOn}
                              onChange={(e) => updatePartReplacement(index, 'snOn', e.target.value)}
                              placeholder="S/N ON"
                              className={`mt-1 w-full h-8 text-xs rounded-none cursor-pointer placeholder:text-orange-400 placeholder:bg-orange-50 ${part.snOn ? 'bg-green-50' : ''}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="riiRequired" className="text-sm sm:text-base">RII Required?</Label>
                <Select 
                  value={riiRequired} 
                  onValueChange={setRiiRequired}
                >
                  <SelectTrigger id="riiRequired" className="mt-1 rounded-none cursor-pointer">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {riiRequired === "yes" && (
                <div className="w-full md:w-1/3 px-2 mb-4">
                  <Label htmlFor="inspectedBy" className="text-sm sm:text-base">Inspected By</Label>
                  <UserSearchCombobox
                    value={inspectedById}
                    onValueChange={(id, fullName) => {
                      setInspectedById(id);
                      setInspectedByName(fullName);
                    }}
                    className="mt-1"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Attachments and Any Comment Section in the same row */}
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/2 px-2 mb-4">
            <Label htmlFor="hasAttachments" className="text-sm sm:text-base">Attachments</Label>
            <Select value={hasAttachments} onValueChange={setHasAttachments}>
              <SelectTrigger id="hasAttachments" className="mt-1 rounded-none cursor-pointer">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            {hasAttachments === "yes" && (
              <div className="mt-2">
                <Label htmlFor="fileAttachments" className="text-sm sm:text-base">Upload Files</Label>
                <div className="mt-1 border-2 border-dashed border-gray-300 p-4">
                  <input
                    type="file"
                    id="fileAttachments"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-sm text-gray-500">Any file type accepted including images and audio (Max 250MB total)</p>
                    <Button
                      type="button"
                      variant="neutral"
                      onClick={triggerFileInput}
                      className="mt-2 cursor-pointer"
                      disabled={fileSizeExceeded}
                    >
                      Select Files
                    </Button>
                  </div>
                  {attachedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-sm">
                        Total size: <span className={fileSizeExceeded ? "text-red-500 font-bold" : ""}>{formatFileSize(totalFileSize)}</span>
                        {fileSizeExceeded && (
                          <span className="text-red-500 ml-2 font-bold">
                            Size limit exceeded! Maximum allowed: {formatFileSize(MAX_UPLOAD_SIZE_BYTES)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium">Attached Files:</p>
                      <ul className="space-y-2">
                        {attachedFiles.map((file, index) => (
                          <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                            <span className="text-sm truncate max-w-[80%]">
                              {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile(index)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-full md:w-1/2 px-2 mb-4">
            <Label htmlFor="hasComment" className="text-sm sm:text-base">Any Comment?</Label>
            <Select value={hasComment} onValueChange={setHasComment}>
              <SelectTrigger id="hasComment" className="mt-1 rounded-none cursor-pointer">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            {hasComment === "yes" && (
              <div className="mt-2">
                <Label htmlFor="comment" className="text-sm sm:text-base">Comment</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter your comment"
                  className={`mt-1 w-full min-h-[105px] rounded-none cursor-pointer ${comment ? 'bg-green-50' : ''}`}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Technician Section */}
        <div className="flex flex-wrap -mx-2">
          <div className="w-full px-2 mb-4">
            <Label htmlFor="technician" className="text-sm sm:text-base">Technician</Label>
            <div className="flex items-center mt-1">
              {isLoadingUser ? (
                <div className="h-9 w-full bg-gray-100 rounded animate-pulse"></div>
              ) : (
                <div className="h-9 px-3 flex items-center w-full border rounded-none bg-muted/50 text-muted-foreground">
                  {technician || "Not available"}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Automatically retrieved from your account</p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="neutral" 
            size="sm"
            className="h-8 rounded-none cursor-pointer"
            onClick={onClose} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="save"
            disabled={isSubmitting || (hasAttachments === "yes" && fileSizeExceeded)}
            size="sm"
            className="h-8 rounded-none cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { validateStation, validateAirline, getCleanStationCode, getCleanAirlineName, isValueFromAirlineSuggestions, isValueFromStationSuggestions } from "@/utils/validation";
import { AutoCompleteInput } from "@/components/ui/auto-complete-input";
import { stations } from "@/data/stations";
import { getAirlineSuggestions } from "@/utils/validation";

interface AddTemporalFlightFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddTemporalFlightForm({ onClose, onSuccess }: AddTemporalFlightFormProps) {
  const [date, setDate] = useState<string>("");
  const [airline, setAirline] = useState<string>("");
  const [flightNumber, setFlightNumber] = useState<string>("");
  const [station, setStation] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { toast } = useToast();
  
  const [stationError, setStationError] = useState<string>("");
  const [isStationValid, setIsStationValid] = useState<boolean | undefined>(undefined);
  const [stationSuggestions, setStationSuggestions] = useState<string[]>([]);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [airlineError, setAirlineError] = useState<string>("");
  const [isAirlineValid, setIsAirlineValid] = useState<boolean | undefined>(undefined);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate required fields and their formats
    if (!date || !airline || !station || !flightNumber) {
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

    setIsSubmitting(true);

    try {
      // Create FormData instance for temporal flight
      const formData = new FormData();
      formData.append('date', date);
      formData.append('airline', airline);
      formData.append('station', station);
      formData.append('flightNumber', flightNumber);
      formData.append('isTemporary', 'true');

      const response = await fetch('/api/flight-records/temporal', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Temporal flight record created successfully",
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        throw new Error(data.message || 'Failed to create temporal flight record');
      }
    } catch (error) {
      console.error('Error creating temporal flight record:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create temporal flight record",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debounced station search
  useEffect(() => {
    if (!station) {
      setStationSuggestions([]);
      return;
    }
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      const upperInput = station.toUpperCase().trim();
      const filtered = stations
        .filter(
          (s) =>
            s.code.includes(upperInput) ||
            s.name.toUpperCase().includes(upperInput)
        )
        .map((s) => `${s.code} - ${s.name}`);
      setStationSuggestions(filtered);
    }, 300);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [station]);

  return (
    <div className="bg-card p-4 shadow border w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Add Temporal Flight Record</h2>
        <p className="text-sm text-muted-foreground">Create a quick flight entry with basic information. You can complete the details later.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date" className="text-sm sm:text-base">Date *</Label>
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
            <Label htmlFor="station" className="text-sm sm:text-base">Station (IATA Code) *</Label>
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
                  // During typing, allow both code and name
                  // Try to match by name if not a code
                  const matchByName = stations.find(
                    (s) => s.name.toUpperCase() === value.toUpperCase().trim()
                  );
                  if (matchByName) {
                    setStation(matchByName.code);
                    setIsStationValid(true);
                    setStationError("");
                  } else {
                    setStation(value.toUpperCase());
                    setIsStationValid(undefined);
                    setStationError("");
                  }
                }
              }}
              suggestions={stationSuggestions}
              placeholder="Enter station code or airport name (e.g., JFK)"
              maxLength={100}
              isValid={isStationValid}
              errorMessage={stationError}
              className="mt-1"
              autoComplete="off"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Enter 3-letter IATA airport code</p>
          </div>

          <div>
            <Label htmlFor="airline" className="text-sm sm:text-base">Airline *</Label>
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
              autoComplete="off"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Enter the full airline name</p>
          </div>

          <div>
            <Label htmlFor="flightNumber" className="text-sm sm:text-base">Flight Number *</Label>
            <Input
              type="text"
              id="flightNumber"
              value={flightNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setFlightNumber(value);
              }}
              placeholder="Enter flight number"
              className={`mt-1 w-full rounded-none cursor-pointer ${flightNumber ? 'bg-green-50' : ''}`}
              autoComplete="off"
              required
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            className="h-8 text-xs sm:text-base border border-black hover:bg-gray-100 bg-white text-black cursor-pointer"
            onClick={onClose} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="outline"
            disabled={isSubmitting}
            size="sm"
            className="h-8 text-xs sm:text-base border border-blue-500 hover:bg-blue-50 bg-blue-100 text-black cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Temporal Flight'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
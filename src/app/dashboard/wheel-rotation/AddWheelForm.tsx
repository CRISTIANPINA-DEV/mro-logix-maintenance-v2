"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2 } from "lucide-react";
import { airlines } from "@/data/airlines";
import { stations } from "@/data/stations";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { toast } from "sonner";
import { validateStation, getStationSuggestions, getCleanStationCode, isValueFromStationSuggestions } from "@/utils/validation";
import { AutoCompleteInput } from "@/components/ui/auto-complete-input";

interface AddWheelFormProps {
  onClose: () => void;
}

export default function AddWheelForm({ onClose }: AddWheelFormProps) {
  const [formData, setFormData] = useState({
    arrivalDate: "",
    airline: "",
    station: "",
    wheelPartNumber: "",
    wheelSerialNumber: "",
    rotationFrequency: "monthly",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [airlineOpen, setAirlineOpen] = useState(false);
  const [stationError, setStationError] = useState<string>("");
  const [isStationValid, setIsStationValid] = useState<boolean | undefined>(undefined);
  const [stationSuggestions, setStationSuggestions] = useState<string[]>([]);

  // Debounced station search - similar to AddFlightForm
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!formData.station) {
      setStationSuggestions([]);
      return;
    }
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      const upperInput = formData.station.toUpperCase().trim();
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
  }, [formData.station]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.arrivalDate || !formData.airline || !formData.station || !formData.wheelPartNumber || !formData.wheelSerialNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate station format
    if (!validateStation(formData.station)) {
      setStationError("Please select a valid station from the list");
      setIsStationValid(false);
      toast.error("Please select a valid station from the list");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/wheel-rotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Wheel added successfully");
        onClose();
      } else {
        throw new Error("Failed to add wheel");
      }
    } catch (error) {
      toast.error("Error adding wheel");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Add New Wheel for Rotation Tracking</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Arrival Date */}
          <div>
            <Label htmlFor="arrivalDate">Arrival Date</Label>
            <Input
              type="date"
              id="arrivalDate"
              value={formData.arrivalDate}
              onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
              className={`mt-1 w-full rounded-none cursor-pointer ${formData.arrivalDate ? 'bg-green-50' : ''}`}
              autoComplete="off"
              required
            />
          </div>

          {/* Station */}
          <div>
            <Label htmlFor="station">Station (IATA Code)</Label>
            <AutoCompleteInput
              id="station"
              value={formData.station}
              onValueChange={(value) => {
                // If selecting from suggestions (contains " - ")
                if (value.includes(" - ")) {
                  const code = getCleanStationCode(value);
                  setFormData({ ...formData, station: code });
                  setIsStationValid(true);
                  setStationError("");
                } else {
                  // During typing, allow both code and name
                  // Try to match by name if not a code
                  const matchByName = stations.find(
                    (s) => s.name.toUpperCase() === value.toUpperCase().trim()
                  );
                  if (matchByName) {
                    setFormData({ ...formData, station: matchByName.code });
                    setIsStationValid(true);
                    setStationError("");
                  } else {
                    setFormData({ ...formData, station: value.toUpperCase() });
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

          {/* Airline */}
          <div>
            <Label htmlFor="airline">Airline</Label>
            <Popover open={airlineOpen} onOpenChange={setAirlineOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={airlineOpen}
                  className="mt-1 w-full justify-between rounded-none cursor-pointer"
                >
                  {formData.airline || "Select airline..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search airline..." />
                  <CommandEmpty>No airline found.</CommandEmpty>
                  <CommandGroup className="max-h-60 overflow-y-auto">
                    {airlines.map((airline) => (
                      <CommandItem
                        key={airline.icaoCode}
                        value={airline.name}
                        onSelect={(value) => {
                          setFormData({ ...formData, airline: value });
                          setAirlineOpen(false);
                        }}
                      >
                        {airline.name} ({airline.icaoCode})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Wheel P/N */}
          <div>
            <Label htmlFor="wheelPartNumber">Wheel P/N</Label>
            <Input
              id="wheelPartNumber"
              value={formData.wheelPartNumber}
              onChange={(e) => setFormData({ ...formData, wheelPartNumber: e.target.value })}
              className={`mt-1 w-full rounded-none cursor-pointer ${formData.wheelPartNumber ? 'bg-green-50' : ''}`}
              required
            />
          </div>

          {/* Wheel S/N */}
          <div>
            <Label htmlFor="wheelSerialNumber">Wheel S/N</Label>
            <Input
              id="wheelSerialNumber"
              value={formData.wheelSerialNumber}
              onChange={(e) => setFormData({ ...formData, wheelSerialNumber: e.target.value })}
              className={`mt-1 w-full rounded-none cursor-pointer ${formData.wheelSerialNumber ? 'bg-green-50' : ''}`}
              required
            />
          </div>

          {/* First Position (disabled, always 0) */}
          <div>
            <Label htmlFor="firstPosition">First Position (degrees)</Label>
            <Input
              id="firstPosition"
              value="0"
              disabled
              className="mt-1 w-full rounded-none bg-muted"
            />
          </div>

          {/* Rotation Frequency */}
          <div>
            <Label htmlFor="rotationFrequency">Rotation Frequency</Label>
            <Select
              value={formData.rotationFrequency}
              onValueChange={(value) => setFormData({ ...formData, rotationFrequency: value })}
            >
              <SelectTrigger className="mt-1 rounded-none cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Every week</SelectItem>
                <SelectItem value="monthly">Every month</SelectItem>
                <SelectItem value="quarterly">Every 3 months</SelectItem>
                <SelectItem value="biannually">Every 6 months</SelectItem>
                <SelectItem value="annually">Every year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className={`mt-1 w-full rounded-none cursor-pointer ${formData.notes ? 'bg-green-50' : ''}`}
            rows={3}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Wheel
          </Button>
        </div>
      </form>
    </Card>
  );
} 
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Trash2, Edit, Clock, Save, CalendarIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { validateStation, validateAirline, getCleanStationCode, getCleanAirlineName, isValueFromAirlineSuggestions } from "@/utils/validation";
import { AutoCompleteInput } from "@/components/ui/auto-complete-input";
import { stations } from "@/data/stations";
import { getAirlineSuggestions } from "@/utils/validation";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface TemporalFlight {
  id: string;
  date: string;
  airline: string;
  station: string;
  flightNumber: string;
  isTemporary: boolean;
  createdAt: string;
}

interface NewTemporalFlight {
  id: string;
  date: string;
  airline: string;
  station: string;
  flightNumber: string;
  stationError: string;
  airlineError: string;
  isStationValid: boolean | undefined;
  isAirlineValid: boolean | undefined;
  stationSuggestions: string[];
}

interface TemporalFlightsListProps {
  onComplete: (temporalFlight: TemporalFlight) => void;
  refreshTrigger?: number;
  onUpdate?: () => void;
}

export function TemporalFlightsList({ onComplete, refreshTrigger = 0, onUpdate }: TemporalFlightsListProps) {
  const [existingFlights, setExistingFlights] = useState<TemporalFlight[]>([]);
  const [newFlights, setNewFlights] = useState<NewTemporalFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkDate, setBulkDate] = useState<string>("");
  const [bulkStation, setBulkStation] = useState<string>("");
  const [bulkStationSuggestions, setBulkStationSuggestions] = useState<string[]>([]);
  const [isBulkStationValid, setIsBulkStationValid] = useState<boolean | undefined>(undefined);
  const bulkStationDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const debounceTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { permissions } = useUserPermissions();

  const fetchTemporalFlights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/flight-records/temporal');
      const data = await response.json();
      
      if (data.success) {
        setExistingFlights(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch temporal flights');
      }
    } catch (error) {
      console.error('Error fetching temporal flights:', error);
      toast({
        title: "Error",
        description: "Failed to fetch temporal flights",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewFlight = (): NewTemporalFlight => ({
    id: `new-${Date.now()}-${Math.random()}`,
    date: "",
    airline: "",
    station: "",
    flightNumber: "",
    stationError: "",
    airlineError: "",
    isStationValid: undefined,
    isAirlineValid: undefined,
    stationSuggestions: []
  });

  const addNewFlight = () => {
    setNewFlights(prev => [...prev, createNewFlight()]);
  };

  const removeNewFlight = (id: string) => {
    setNewFlights(prev => prev.filter(flight => flight.id !== id));
  };

  const updateNewFlight = (id: string, field: keyof NewTemporalFlight, value: any) => {
    setNewFlights(prev => prev.map(flight => 
      flight.id === id ? { ...flight, [field]: value } : flight
    ));
  };

  const handleStationChange = (id: string, value: string) => {
    // Clear existing timeout for this flight
    const existingTimeout = debounceTimeouts.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    if (value.includes(" - ")) {
      const code = getCleanStationCode(value);
      updateNewFlight(id, 'station', code);
      updateNewFlight(id, 'isStationValid', true);
      updateNewFlight(id, 'stationError', "");
      updateNewFlight(id, 'stationSuggestions', []);
    } else {
      const matchByName = stations.find(
        (s) => s.name.toUpperCase() === value.toUpperCase().trim()
      );
      if (matchByName) {
        updateNewFlight(id, 'station', matchByName.code);
        updateNewFlight(id, 'isStationValid', true);
        updateNewFlight(id, 'stationError', "");
      } else {
        updateNewFlight(id, 'station', value.toUpperCase());
        updateNewFlight(id, 'isStationValid', undefined);
        updateNewFlight(id, 'stationError', "");
      }

      // Set debounced suggestions update
      const timeout = setTimeout(() => {
        const upperInput = value.toUpperCase().trim();
        const filtered = stations
          .filter(
            (s) =>
              s.code.includes(upperInput) ||
              s.name.toUpperCase().includes(upperInput)
          )
          .map((s) => `${s.code} - ${s.name}`);
        updateNewFlight(id, 'stationSuggestions', filtered);
      }, 300);

      debounceTimeouts.current.set(id, timeout);
    }
  };

  const handleAirlineChange = (id: string, value: string) => {
    if (value.includes(" - ")) {
      const name = getCleanAirlineName(value);
      updateNewFlight(id, 'airline', name);
      updateNewFlight(id, 'isAirlineValid', true);
      updateNewFlight(id, 'airlineError', "");
    } else {
      updateNewFlight(id, 'airline', value);
      const isValid = isValueFromAirlineSuggestions(value);
      updateNewFlight(id, 'isAirlineValid', isValid);
      updateNewFlight(id, 'airlineError', isValid ? "" : "Please select a valid airline from the list");
    }
  };

  const applyBulkDate = () => {
    if (!bulkDate) {
      toast({
        title: "Error",
        description: "Please select a date to apply to all flights",
        variant: "destructive"
      });
      return;
    }

    setNewFlights(prev => prev.map(flight => ({ ...flight, date: bulkDate })));
    toast({
      title: "Success",
      description: `Applied date ${format(new Date(bulkDate), 'MMM dd, yyyy')} to all new flights`
    });
  };

  const handleBulkStationChange = (value: string) => {
    // Clear existing timeout
    if (bulkStationDebounceRef.current) {
      clearTimeout(bulkStationDebounceRef.current);
    }

    if (value.includes(" - ")) {
      const code = getCleanStationCode(value);
      setBulkStation(code);
      setIsBulkStationValid(true);
      setBulkStationSuggestions([]);
    } else {
      const matchByName = stations.find(
        (s) => s.name.toUpperCase() === value.toUpperCase().trim()
      );
      if (matchByName) {
        setBulkStation(matchByName.code);
        setIsBulkStationValid(true);
      } else {
        setBulkStation(value.toUpperCase());
        setIsBulkStationValid(undefined);
      }

      // Set debounced suggestions update
      bulkStationDebounceRef.current = setTimeout(() => {
        const upperInput = value.toUpperCase().trim();
        const filtered = stations
          .filter(
            (s) =>
              s.code.includes(upperInput) ||
              s.name.toUpperCase().includes(upperInput)
          )
          .map((s) => `${s.code} - ${s.name}`);
        setBulkStationSuggestions(filtered);
      }, 300);
    }
  };

  const applyBulkStation = () => {
    if (!bulkStation) {
      toast({
        title: "Error",
        description: "Please select a station to apply to all flights",
        variant: "destructive"
      });
      return;
    }

    if (!validateStation(bulkStation)) {
      toast({
        title: "Error",
        description: "Please select a valid station from the suggestions",
        variant: "destructive"
      });
      return;
    }

    setNewFlights(prev => prev.map(flight => ({ 
      ...flight, 
      station: bulkStation,
      isStationValid: true,
      stationError: ""
    })));
    
    toast({
      title: "Success",
      description: `Applied station ${bulkStation} to all new flights`
    });
  };

  const validateNewFlight = (flight: NewTemporalFlight): boolean => {
    if (!flight.date || !flight.airline || !flight.station || !flight.flightNumber) {
      return false;
    }

    if (!validateStation(flight.station)) {
      updateNewFlight(flight.id, 'stationError', "Please select a valid station");
      updateNewFlight(flight.id, 'isStationValid', false);
      return false;
    }

    if (!validateAirline(flight.airline)) {
      updateNewFlight(flight.id, 'airlineError', "Please select a valid airline");
      updateNewFlight(flight.id, 'isAirlineValid', false);
      return false;
    }

    return true;
  };

  const saveNewFlights = async () => {
    const validFlights = newFlights.filter(validateNewFlight);
    
    if (validFlights.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields with valid data",
        variant: "destructive"
      });
      return;
    }

    if (validFlights.length !== newFlights.length) {
      toast({
        title: "Warning",
        description: `Only ${validFlights.length} of ${newFlights.length} flights are valid and will be saved`,
        variant: "destructive"
      });
    }

    setSaving(true);

    try {
      const savePromises = validFlights.map(async (flight) => {
        const formData = new FormData();
        formData.append('date', flight.date);
        formData.append('airline', flight.airline);
        formData.append('station', flight.station);
        formData.append('flightNumber', flight.flightNumber);

        const response = await fetch('/api/flight-records/temporal', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || `Failed to save flight ${flight.airline} ${flight.flightNumber}`);
        }
        return data;
      });

      await Promise.all(savePromises);

      toast({
        title: "Success",
        description: `Successfully saved ${validFlights.length} temporal flight${validFlights.length > 1 ? 's' : ''}`
      });

      // Clear new flights and refresh
      setNewFlights([]);
      await fetchTemporalFlights();
      if (onUpdate) onUpdate();

    } catch (error) {
      console.error('Error saving temporal flights:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save temporal flights",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, flightInfo: string) => {
    if (!confirm(`Are you sure you want to delete this temporal flight: ${flightInfo}?`)) {
      return;
    }

    try {
      setDeleting(id);
      const response = await fetch(`/api/flight-records/temporal?id=${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Temporal flight deleted successfully"
        });
        await fetchTemporalFlights();
        if (onUpdate) onUpdate();
      } else {
        throw new Error(data.message || 'Failed to delete temporal flight');
      }
    } catch (error) {
      console.error('Error deleting temporal flight:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete temporal flight",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchTemporalFlights();
  }, [refreshTrigger]);

  // Initialize with one new flight if none exist and user has permission
  useEffect(() => {
    if (newFlights.length === 0 && !loading && permissions?.canAddTemporalFlightRecords) {
      setNewFlights([createNewFlight()]);
    }
  }, [loading, newFlights.length, permissions?.canAddTemporalFlightRecords]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Flight Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading temporal flights...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Flight Records
          {existingFlights.length > 0 && <Badge variant="secondary">{existingFlights.length}</Badge>}
        </CardTitle>
        <CardDescription>
          Create multiple temporal flights quickly - fill in basic information and complete details later
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bulk Operations */}
        {newFlights.length > 1 && permissions?.canAddTemporalFlightRecords && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-blue-900">Bulk Operations - Apply to All Flights</h4>
            
            {/* Bulk Date */}
            <div className="flex items-center gap-3">
              <Label htmlFor="bulkDate" className="text-sm font-medium text-blue-800 min-w-[120px]">Same Date:</Label>
              <Input
                type="date"
                id="bulkDate"
                value={bulkDate}
                onChange={(e) => setBulkDate(e.target.value)}
                className="w-40"
              />
              <Button
                onClick={applyBulkDate}
                size="sm"
                variant="outline"
                className="flex items-center gap-1 bg-white hover:bg-blue-100"
              >
                <CalendarIcon className="h-4 w-4" />
                Apply Date
              </Button>
            </div>

            {/* Bulk Station */}
            <div className="flex items-center gap-3">
              <Label htmlFor="bulkStation" className="text-sm font-medium text-blue-800 min-w-[120px]">Same Station:</Label>
              <div className="w-40">
                <AutoCompleteInput
                  id="bulkStation"
                  value={bulkStation}
                  onValueChange={handleBulkStationChange}
                  suggestions={bulkStationSuggestions}
                  placeholder="IATA code"
                  maxLength={100}
                  isValid={isBulkStationValid}
                  className="h-9"
                  autoComplete="off"
                />
              </div>
              <Button
                onClick={applyBulkStation}
                size="sm"
                variant="outline"
                className="flex items-center gap-1 bg-white hover:bg-blue-100"
              >
                <CalendarIcon className="h-4 w-4" />
                Apply Station
              </Button>
            </div>
          </div>
        )}

        {/* New Flights Entry */}
        {permissions?.canAddTemporalFlightRecords && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Add New Temporal Flights</h3>
            <div className="flex gap-2">
              {permissions?.canAddTemporalFlightRecords && (
                <Button
                  onClick={addNewFlight}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Flight
                </Button>
              )}
              {newFlights.length > 0 && permissions?.canAddTemporalFlightRecords && (
                <Button
                  onClick={saveNewFlights}
                  size="sm"
                  disabled={saving}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : `Save ${newFlights.length} Flight${newFlights.length > 1 ? 's' : ''}`}
                </Button>
              )}
            </div>
          </div>

          {/* New Flights Grid */}
          <div className="space-y-2">
            {newFlights.map((flight) => (
              <div key={flight.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg bg-gray-50">
                <div>
                  <Label className="text-xs">Date *</Label>
                  <Input
                    type="date"
                    value={flight.date}
                    onChange={(e) => updateNewFlight(flight.id, 'date', e.target.value)}
                    className="mt-1 h-8"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs">Station *</Label>
                  <AutoCompleteInput
                    value={flight.station}
                    onValueChange={(value) => handleStationChange(flight.id, value)}
                    suggestions={flight.stationSuggestions}
                    placeholder="IATA code"
                    maxLength={100}
                    isValid={flight.isStationValid}
                    errorMessage={flight.stationError}
                    className="mt-1 h-8"
                    autoComplete="off"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs">Airline *</Label>
                  <AutoCompleteInput
                    value={flight.airline}
                    onValueChange={(value) => handleAirlineChange(flight.id, value)}
                    suggestions={getAirlineSuggestions(flight.airline)}
                    placeholder="Airline name"
                    isValid={flight.isAirlineValid}
                    errorMessage={flight.airlineError}
                    className="mt-1 h-8"
                    autoComplete="off"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs">Flight Number *</Label>
                  <Input
                    type="text"
                    value={flight.flightNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      updateNewFlight(flight.id, 'flightNumber', value);
                    }}
                    placeholder="Flight #"
                    className="mt-1 h-8"
                    required
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => removeNewFlight(flight.id)}
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Existing Flights */}
        {existingFlights.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Existing Pending Flights</h3>
            <div className="space-y-2">
              {existingFlights.map((flight) => (
                <div
                  key={flight.id}
                  className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="text-sm">
                    <span className="text-xs text-muted-foreground">Date:</span><br />
                    {format(new Date(flight.date), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-sm">
                    <span className="text-xs text-muted-foreground">Station:</span><br />
                    {flight.station}
                  </div>
                  <div className="text-sm">
                    <span className="text-xs text-muted-foreground">Airline:</span><br />
                    {flight.airline}
                  </div>
                  <div className="text-sm">
                    <span className="text-xs text-muted-foreground">Flight:</span><br />
                    {flight.flightNumber}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onComplete(flight)}
                      className="text-xs px-2 py-1 h-7"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Complete
                    </Button>
                    {permissions?.canDeletePendingFlights && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(
                          flight.id, 
                          `${flight.airline} ${flight.flightNumber} (${flight.station})`
                        )}
                        disabled={deleting === flight.id}
                        className="text-xs px-2 py-1 h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {existingFlights.length === 0 && (
          <div className="text-center py-4">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No pending temporal flights</p>
            {permissions?.canAddTemporalFlightRecords && newFlights.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Fill in the form above to create your first temporal flight
              </p>
            )}
            {!permissions?.canAddTemporalFlightRecords && (
              <p className="text-xs text-muted-foreground mt-1">
                You don't have permission to add temporal flights
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
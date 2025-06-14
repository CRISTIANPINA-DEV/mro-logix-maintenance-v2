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
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AddTemperatureControlFormProps {
  onClose: () => void;
}

export function AddTemperatureControlForm({ onClose }: AddTemperatureControlFormProps) {  const [date, setDate] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [customLocation, setCustomLocation] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [temperature, setTemperature] = useState<string>("");
  const [humidity, setHumidity] = useState<string>("");
  const [employeeName, setEmployeeName] = useState<string>("");
  const [hasComment, setHasComment] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  const locationOptions = ['Whouse-1', 'Whouse-2', 'Whouse-3', 'Whouse-4', 'Other'];

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {    e.preventDefault();
      if (!date || !location || !time || !temperature || !humidity || !employeeName || !hasComment) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    if (location === "Other" && !customLocation) {
      toast({
        title: "Missing location",
        description: "Please specify the location.",
        variant: "destructive"
      });
      return;
    }
    
    if (hasComment === "Yes" && !comment) {
      toast({
        title: "Missing comment",
        description: "Please provide a comment.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {      // Create form data
      const formData = new FormData();
        formData.append('date', date);
      formData.append('location', location);
      formData.append('time', time);
      formData.append('temperature', temperature);
      formData.append('humidity', humidity);
      formData.append('employeeName', employeeName);
      formData.append('hasComment', hasComment);
      if (location === "Other") {
        formData.append('customLocation', customLocation);
      }
      if (hasComment === "Yes") {
        formData.append('comment', comment);
      }
      
      // Submit form data
      const response = await fetch('/api/temperature-control', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success!",
          description: "Temperature control record saved successfully."
        });
        onClose(); // Close form on success
      } else {
        throw new Error(result.message || 'Something went wrong');
      }
    } catch (error: unknown) {
      console.error('Error submitting temperature control record:', error);
      toast({
        title: "Failed to save",
        description: error instanceof Error ? error.message : "Failed to save temperature control record",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card p-4 rounded-lg shadow border w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Add New Temperature Control</h2>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Flexible grid layout */}
        <div className="flex flex-wrap -mx-2">
          {/* Date field */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="date" className="text-sm sm:text-base">Date</Label>
            <Input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`mt-1 w-full ${date ? 'bg-green-50' : ''}`}
            />
          </div>          {/* Location field */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="location" className="text-sm sm:text-base">Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="location" className="mt-1">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locationOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom location field - only shown when "Other" is selected */}
          {location === "Other" && (
            <div className="w-full md:w-1/3 px-2 mb-4">
              <Label htmlFor="customLocation" className="text-sm sm:text-base">Specify Location</Label>
              <Input
                type="text"
                id="customLocation"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Enter location details"
                className={`mt-1 w-full ${customLocation ? 'bg-green-50' : ''}`}
              />
            </div>
          )}          {/* Time field */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="time" className="text-sm sm:text-base">Time</Label>
            <Input
              type="text"
              id="time"
              value={time}
              onChange={(e) => {
                // Get the input value with all non-numeric characters removed
                const inputValue = e.target.value.replace(/\D/g, '');
                
                // Format the time with a colon if needed
                if (inputValue.length >= 3) {
                  // Insert colon in the appropriate position
                  const hours = inputValue.slice(0, inputValue.length - 2);
                  const minutes = inputValue.slice(-2);
                  setTime(`${hours}:${minutes}`);
                } else {
                  // If less than 3 digits, just store the numbers
                  setTime(inputValue);
                }
              }}
              onBlur={() => {
                // Format time properly when the field loses focus
                if (time) {
                  const numericTime = time.replace(/\D/g, '');
                  
                  if (numericTime.length === 1 || numericTime.length === 2) {
                    // Treat as hours with 00 minutes
                    setTime(`${numericTime.padStart(2, '0')}:00`);
                  } else if (numericTime.length === 3) {
                    // Format properly: 1 digit hour, 2 digits minutes
                    setTime(`${numericTime[0]}:${numericTime.substring(1)}`);
                  } else if (numericTime.length >= 4) {
                    // Format properly: hours and minutes
                    const hours = numericTime.slice(0, 2);
                    const minutes = numericTime.slice(2, 4);
                    setTime(`${hours}:${minutes}`);
                  }
                }
              }}
              placeholder="Enter time (e.g., 13:05)"
              className={`mt-1 w-full ${time ? 'bg-green-50' : ''}`}
            />
          </div>{/* Temperature field */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="temperature" className="text-sm sm:text-base">Temperature (°C)</Label>
            <Input
              type="number"
              step="0.1"
              id="temperature"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="Enter temperature in Celsius"
              className={`mt-1 w-full ${temperature ? 'bg-green-50' : ''}`}
            />
          </div>          {/* Humidity field */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="humidity" className="text-sm sm:text-base">Humidity (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              id="humidity"
              value={humidity}
              onChange={(e) => setHumidity(e.target.value)}
              placeholder="Enter humidity percentage"
              className={`mt-1 w-full ${humidity ? 'bg-green-50' : ''}`}
            />
          </div>          {/* Employee Name field */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="employeeName" className="text-sm sm:text-base">Employee Name</Label>
            <Input
              type="text"
              id="employeeName"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Enter name of employee taking readings"
              className={`mt-1 w-full ${employeeName ? 'bg-green-50' : ''}`}
            />
          </div>

          {/* Any Comment field */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="hasComment" className="text-sm sm:text-base">Any Comment?</Label>
            <Select value={hasComment} onValueChange={setHasComment}>
              <SelectTrigger id="hasComment" className="mt-1">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comment textarea - only shown when "Yes" is selected */}
          {hasComment === "Yes" && (
            <div className="w-full px-2 mb-4">
              <Label htmlFor="comment" className="text-sm sm:text-base">Comment</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your comment"
                className={`mt-1 w-full ${comment ? 'bg-green-50' : ''}`}
              />
            </div>
          )}
        </div>

        {/* Form actions */}
        <div className="flex justify-end space-x-2">
          <Button 
            type="submit" 
            variant="save"
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Record
          </Button>
          <Button 
            type="button" 
            variant="neutral" 
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

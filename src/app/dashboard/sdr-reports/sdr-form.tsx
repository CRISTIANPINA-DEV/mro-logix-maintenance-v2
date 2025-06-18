"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload, FileText } from "lucide-react";
import { toast } from "sonner";

interface SDRFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const SDRForm: React.FC<SDRFormProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    reportTitle: '',
    difficultyDate: '',
    submitter: '',
    submitterOther: '',
    submitterName: '',
    email: '',
    station: '',
    condition: '',
    conditionOther: '',
    howDiscovered: '',
    howDiscoveredOther: '',
    hasFlightNumber: false,
    flightNumber: '',
    airlineName: '',
    partOrAirplane: '',
    airplaneModel: '',
    airplaneTailNumber: '',
    partNumber: '',
    serialNumber: '',
    timeOfDiscover: '',
    hasAtaCode: false,
    ataSystemCode: '',
    problemDescription: '',
    symptoms: '',
    consequences: '',
    correctiveAction: '',
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeOfDiscoverError, setTimeOfDiscoverError] = useState<string>("");

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
  const handleTimeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      timeOfDiscover: value.replace(/[^0-9:]/g, '')
    }));
  };

  // Format time when field loses focus
  const handleTimeBlur = (value: string) => {
    if (value === "") {
      setFormData(prev => ({
        ...prev,
        timeOfDiscover: ""
      }));
      setTimeOfDiscoverError("");
      return;
    }
    
    // If the input already contains a colon and is in proper format, don't reformat
    if (/^\d{2}:\d{2}$/.test(value)) {
      // Validate the time
      if (isValidTime(value)) {
        setFormData(prev => ({
          ...prev,
          timeOfDiscover: value
        }));
        setTimeOfDiscoverError("");
      } else {
        setTimeOfDiscoverError("Time must be between 00:00 and 23:59");
      }
      return;
    }
    
    // Format the time
    const formattedTime = formatTime(value);
    
    // Validate the formatted time
    if (isValidTime(formattedTime)) {
      setFormData(prev => ({
        ...prev,
        timeOfDiscover: formattedTime
      }));
      setTimeOfDiscoverError("");
    } else {
      setTimeOfDiscoverError("Time must be between 00:00 and 23:59");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const required = [
      'reportTitle', 'difficultyDate', 'submitter', 'submitterName', 
      'email', 'station', 'condition', 'howDiscovered', 'partOrAirplane', 
      'problemDescription'
    ];

    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`);
        return false;
      }
    }

    if (formData.submitter === 'Other' && !formData.submitterOther) {
      toast.error('Please specify the submitter type');
      return false;
    }

    if (formData.condition === 'Other' && !formData.conditionOther) {
      toast.error('Please specify the condition');
      return false;
    }

    if (formData.howDiscovered === 'Other' && !formData.howDiscoveredOther) {
      toast.error('Please specify how it was discovered');
      return false;
    }

    if (formData.hasFlightNumber && !formData.flightNumber) {
      toast.error('Please provide the flight number');
      return false;
    }

    if (formData.hasFlightNumber && !formData.airlineName) {
      toast.error('Please provide the airline name');
      return false;
    }

    if (formData.partOrAirplane === 'Airplane' && !formData.airplaneModel) {
      toast.error('Please provide the airplane model');
      return false;
    }

    if (formData.partOrAirplane === 'Airplane' && !formData.airplaneTailNumber) {
      toast.error('Please provide the airplane tail number');
      return false;
    }

    if (formData.partOrAirplane === 'Part' && (!formData.partNumber || !formData.serialNumber)) {
      toast.error('Please provide both part number and serial number');
      return false;
    }

    if (formData.hasAtaCode && !formData.ataSystemCode) {
      toast.error('Please provide the ATA system code');
      return false;
    }

    if (timeOfDiscoverError) {
      toast.error('Please correct the time format error');
      return false;
    }

    if (formData.problemDescription.length > 2000) {
      toast.error('Problem description must be 2000 characters or less');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value.toString());
      });

      // Add attachments
      attachments.forEach(file => {
        submitData.append('attachments', file);
      });

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit SDR report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader className="border-b p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-2xl">New SDR Report</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Submitter Information */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Submitter Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="reportTitle" className="text-sm">Report Title *</Label>
                  <Input
                    id="reportTitle"
                    value={formData.reportTitle}
                    onChange={(e) => handleInputChange('reportTitle', e.target.value)}
                    className="text-sm"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="difficultyDate" className="text-sm">Difficulty Date *</Label>
                  <Input
                    id="difficultyDate"
                    type="date"
                    value={formData.difficultyDate}
                    onChange={(e) => handleInputChange('difficultyDate', e.target.value)}
                    className="text-sm"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="station" className="text-sm">Station *</Label>
                  <Input
                    id="station"
                    value={formData.station}
                    onChange={(e) => handleInputChange('station', e.target.value)}
                    className="text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="submitter" className="text-sm">Submitter *</Label>
                  <Select value={formData.submitter} onValueChange={(value) => handleInputChange('submitter', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select submitter type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technician">Technician</SelectItem>
                      <SelectItem value="Pilot">Pilot</SelectItem>
                      <SelectItem value="Quality">Quality</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.submitter === 'Other' && (
                    <Input
                      className="mt-2 text-sm"
                      placeholder="Please specify"
                      value={formData.submitterOther}
                      onChange={(e) => handleInputChange('submitterOther', e.target.value)}
                      required
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="submitterName" className="text-sm">Submitter Name *</Label>
                  <Input
                    id="submitterName"
                    value={formData.submitterName}
                    onChange={(e) => handleInputChange('submitterName', e.target.value)}
                    className="text-sm"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="text-sm"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Information */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="condition" className="text-sm">Condition *</Label>
                  <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Flight">In Flight</SelectItem>
                      <SelectItem value="On Ground">On Ground</SelectItem>
                      <SelectItem value="During Maintenance">During Maintenance</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.condition === 'Other' && (
                    <Input
                      className="mt-2 text-sm"
                      placeholder="Please specify"
                      value={formData.conditionOther}
                      onChange={(e) => handleInputChange('conditionOther', e.target.value)}
                      required
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="howDiscovered" className="text-sm">How Discovered? *</Label>
                  <Select value={formData.howDiscovered} onValueChange={(value) => handleInputChange('howDiscovered', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select how discovered" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                      <SelectItem value="Boroscope">Boroscope</SelectItem>
                      <SelectItem value="Functional Check">Functional Check</SelectItem>
                      <SelectItem value="Inspection">Inspection</SelectItem>
                      <SelectItem value="Visual">Visual</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.howDiscovered === 'Other' && (
                    <Input
                      className="mt-2 text-sm"
                      placeholder="Please specify"
                      value={formData.howDiscoveredOther}
                      onChange={(e) => handleInputChange('howDiscoveredOther', e.target.value)}
                      required
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="flightNumber" className="text-sm">Flight Number *</Label>
                  <Select 
                    value={formData.hasFlightNumber ? 'Yes' : 'No'} 
                    onValueChange={(value) => handleInputChange('hasFlightNumber', value === 'Yes')}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Flight Number and Airline Name - Show when flight number is Yes */}
              {formData.hasFlightNumber && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="flightNumberInput" className="text-sm">Flight Number *</Label>
                    <Input
                      id="flightNumberInput"
                      placeholder="Enter flight number"
                      value={formData.flightNumber}
                      onChange={(e) => handleInputChange('flightNumber', e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="airlineName" className="text-sm">Airline Name *</Label>
                    <Input
                      id="airlineName"
                      placeholder="Enter airline name"
                      value={formData.airlineName}
                      onChange={(e) => handleInputChange('airlineName', e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="partOrAirplane" className="text-sm">Part or Airplane *</Label>
                  <Select value={formData.partOrAirplane} onValueChange={(value) => handleInputChange('partOrAirplane', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Airplane">Airplane</SelectItem>
                      <SelectItem value="Part">Part</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeOfDiscover" className="text-sm">Time of Discovery (Optional)</Label>
                  <Input
                    id="timeOfDiscover"
                    value={formData.timeOfDiscover}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    onBlur={() => handleTimeBlur(formData.timeOfDiscover)}
                    placeholder="HH:MM"
                    className={`text-sm ${timeOfDiscoverError ? "border-red-500" : ""} ${formData.timeOfDiscover && !timeOfDiscoverError ? 'bg-green-50' : ''}`}
                    maxLength={5}
                  />
                  {timeOfDiscoverError ? (
                    <p className="text-xs text-red-500 mt-1">{timeOfDiscoverError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Format: HH:MM (e.g. 09:30)</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="hasAtaCode" className="text-sm">ATA Code? *</Label>
                  <Select value={formData.hasAtaCode ? 'Yes' : 'No'} onValueChange={(value) => handleInputChange('hasAtaCode', value === 'Yes')}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select ATA Code option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.hasAtaCode && (
                    <Input
                      className="mt-2 text-sm"
                      placeholder="Enter ATA system code"
                      value={formData.ataSystemCode}
                      onChange={(e) => handleInputChange('ataSystemCode', e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>
                
              {formData.partOrAirplane === 'Airplane' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="airplaneModel" className="text-sm">Airplane Model *</Label>
                    <Input
                      id="airplaneModel"
                      placeholder="Enter airplane model"
                      value={formData.airplaneModel}
                      onChange={(e) => handleInputChange('airplaneModel', e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="airplaneTailNumber" className="text-sm">Tail Number *</Label>
                    <Input
                      id="airplaneTailNumber"
                      placeholder="Enter airplane tail number"
                      value={formData.airplaneTailNumber}
                      onChange={(e) => handleInputChange('airplaneTailNumber', e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>
                </div>
              )}
              
              {formData.partOrAirplane === 'Part' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="partNumber" className="text-sm">Part Number *</Label>
                    <Input
                      id="partNumber"
                      placeholder="Part Number"
                      value={formData.partNumber}
                      onChange={(e) => handleInputChange('partNumber', e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="serialNumber" className="text-sm">Serial Number *</Label>
                    <Input
                      id="serialNumber"
                      placeholder="Serial Number"
                      value={formData.serialNumber}
                      onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Problem Description & Additional Details */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Problem Description & Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="problemDescription" className="text-sm">Full Description *</Label>
                <Textarea
                  id="problemDescription"
                  value={formData.problemDescription}
                  onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                  placeholder="Limit to 2000 characters. Clearly describe the malfunction, defect, failure, or other deficiency. Be specific and factual."
                  rows={4}
                  maxLength={2000}
                  className="text-sm"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.problemDescription.length}/2000 characters
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {/* Symptoms */}
                <div>
                  <Label htmlFor="symptoms" className="text-sm">Symptoms (Optional)</Label>
                  <Textarea
                    id="symptoms"
                    value={formData.symptoms}
                    onChange={(e) => handleInputChange('symptoms', e.target.value)}
                    placeholder="What was observed? (e.g., 'Warning light illuminated', 'Abnormal vibration felt', 'Fluid leak observed', 'Component found cracked during inspection', 'System inoperative', 'Erratic gauge indication')."
                    rows={3}
                    maxLength={2000}
                    className="text-sm"
                  />
                </div>

                {/* Consequences */}
                <div>
                  <Label htmlFor="consequences" className="text-sm">Consequences (Optional)</Label>
                  <Textarea
                    id="consequences"
                    value={formData.consequences}
                    onChange={(e) => handleInputChange('consequences', e.target.value)}
                    placeholder="What was the operational impact? (e.g., 'Flight delayed', 'Flight cancelled', 'Aircraft grounded (AOG)', 'Maintenance performed at line station', 'Required return to gate', 'No immediate operational impact - deferred per MEL')."
                    rows={3}
                    maxLength={2000}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Corrective Action */}
              <div>
                <Label htmlFor="correctiveAction" className="text-sm">Corrective Action (Optional)</Label>
                <Textarea
                  id="correctiveAction"
                  value={formData.correctiveAction}
                  onChange={(e) => handleInputChange('correctiveAction', e.target.value)}
                  placeholder="What was done to rectify the problem? (e.g., 'Component replaced', 'Component repaired per SB XXX', 'Adjusted', 'Cleaned', 'Inspected per NDT and found serviceable', 'Troubleshooting performed - fault isolated to LRU')."
                  rows={3}
                  maxLength={2000}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Attachments (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="attachments" className="text-sm">Upload Files</Label>
                <div className="mt-2">
                  <input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('attachments')?.click()}
                    className="flex items-center gap-2 text-sm"
                    size="sm"
                  >
                    <Upload size={14} />
                    Select Files
                  </Button>
                </div>
                
                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-sm">Selected Files:</h4>
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText size={14} />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 shrink-0">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="ml-2 shrink-0"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-2">
            <Button type="button" variant="neutral" onClick={onClose} className="text-sm" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="save" disabled={isSubmitting} className="text-sm" size="sm">
              {isSubmitting ? 'Submitting...' : 'Submit SDR Report'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SDRForm; 
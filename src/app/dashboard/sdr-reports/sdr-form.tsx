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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">New SDR Report</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Submitter Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Submitter Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="reportTitle">Report Title *</Label>
                  <Input
                    id="reportTitle"
                    value={formData.reportTitle}
                    onChange={(e) => handleInputChange('reportTitle', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="difficultyDate">Difficulty Date *</Label>
                  <Input
                    id="difficultyDate"
                    type="date"
                    value={formData.difficultyDate}
                    onChange={(e) => handleInputChange('difficultyDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="station">Station *</Label>
                  <Input
                    id="station"
                    value={formData.station}
                    onChange={(e) => handleInputChange('station', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="submitter">Submitter *</Label>
                  <Select value={formData.submitter} onValueChange={(value) => handleInputChange('submitter', value)}>
                    <SelectTrigger>
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
                      className="mt-2"
                      placeholder="Please specify"
                      value={formData.submitterOther}
                      onChange={(e) => handleInputChange('submitterOther', e.target.value)}
                      required
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="submitterName">Submitter Name *</Label>
                  <Input
                    id="submitterName"
                    value={formData.submitterName}
                    onChange={(e) => handleInputChange('submitterName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="condition">Condition *</Label>
                  <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                    <SelectTrigger>
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
                      className="mt-2"
                      placeholder="Please specify"
                      value={formData.conditionOther}
                      onChange={(e) => handleInputChange('conditionOther', e.target.value)}
                      required
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="howDiscovered">How Discovered? *</Label>
                  <Select value={formData.howDiscovered} onValueChange={(value) => handleInputChange('howDiscovered', value)}>
                    <SelectTrigger>
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
                      className="mt-2"
                      placeholder="Please specify"
                      value={formData.howDiscoveredOther}
                      onChange={(e) => handleInputChange('howDiscoveredOther', e.target.value)}
                      required
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="flightNumber">Flight Number *</Label>
                  <Select 
                    value={formData.hasFlightNumber ? 'Yes' : 'No'} 
                    onValueChange={(value) => handleInputChange('hasFlightNumber', value === 'Yes')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.hasFlightNumber && (
                    <Input
                      className="mt-2"
                      placeholder="Enter flight number"
                      value={formData.flightNumber}
                      onChange={(e) => handleInputChange('flightNumber', e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>



              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="partOrAirplane">Part or Airplane *</Label>
                  <Select value={formData.partOrAirplane} onValueChange={(value) => handleInputChange('partOrAirplane', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Airplane">Airplane</SelectItem>
                      <SelectItem value="Part">Part</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeOfDiscover">Time of Discovery (Optional)</Label>
                  <Input
                    id="timeOfDiscover"
                    value={formData.timeOfDiscover}
                    onChange={(e) => handleInputChange('timeOfDiscover', e.target.value)}
                    placeholder="e.g., 14:30"
                  />
                </div>
                <div>
                  <Label htmlFor="hasAtaCode">ATA Code? *</Label>
                  <Select value={formData.hasAtaCode ? 'Yes' : 'No'} onValueChange={(value) => handleInputChange('hasAtaCode', value === 'Yes')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ATA Code option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.hasAtaCode && (
                    <Input
                      className="mt-2"
                      placeholder="Enter ATA system code"
                      value={formData.ataSystemCode}
                      onChange={(e) => handleInputChange('ataSystemCode', e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>
                
              {formData.partOrAirplane === 'Airplane' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="airplaneModel">Airplane Model *</Label>
                    <Input
                      id="airplaneModel"
                      placeholder="Enter airplane model"
                      value={formData.airplaneModel}
                      onChange={(e) => handleInputChange('airplaneModel', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="airplaneTailNumber">Tail Number *</Label>
                    <Input
                      id="airplaneTailNumber"
                      placeholder="Enter airplane tail number"
                      value={formData.airplaneTailNumber}
                      onChange={(e) => handleInputChange('airplaneTailNumber', e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
              
              {formData.partOrAirplane === 'Part' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="partNumber">Part Number *</Label>
                    <Input
                      id="partNumber"
                      placeholder="Part Number"
                      value={formData.partNumber}
                      onChange={(e) => handleInputChange('partNumber', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="serialNumber">Serial Number *</Label>
                    <Input
                      id="serialNumber"
                      placeholder="Serial Number"
                      value={formData.serialNumber}
                      onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Problem Description & Additional Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Problem Description & Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="problemDescription">Full Description *</Label>
                <Textarea
                  id="problemDescription"
                  value={formData.problemDescription}
                  onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                  placeholder="Limit to 2000 characters. Clearly describe the malfunction, defect, failure, or other deficiency. Be specific and factual."
                  rows={4}
                  maxLength={2000}
                  required
                />
                <div className="text-sm text-gray-500 mt-1">
                  {formData.problemDescription.length}/2000 characters
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Symptoms */}
                <div>
                  <Label htmlFor="symptoms">Symptoms (Optional)</Label>
                  <Textarea
                    id="symptoms"
                    value={formData.symptoms}
                    onChange={(e) => handleInputChange('symptoms', e.target.value)}
                    placeholder="What was observed? (e.g., 'Warning light illuminated', 'Abnormal vibration felt', 'Fluid leak observed', 'Component found cracked during inspection', 'System inoperative', 'Erratic gauge indication')."
                    rows={3}
                    maxLength={2000}
                  />
                </div>

                {/* Consequences */}
                <div>
                  <Label htmlFor="consequences">Consequences (Optional)</Label>
                  <Textarea
                    id="consequences"
                    value={formData.consequences}
                    onChange={(e) => handleInputChange('consequences', e.target.value)}
                    placeholder="What was the operational impact? (e.g., 'Flight delayed', 'Flight cancelled', 'Aircraft grounded (AOG)', 'Maintenance performed at line station', 'Required return to gate', 'No immediate operational impact - deferred per MEL')."
                    rows={3}
                    maxLength={2000}
                  />
                </div>
              </div>

              {/* Corrective Action */}
              <div>
                <Label htmlFor="correctiveAction">Corrective Action (Optional)</Label>
                <Textarea
                  id="correctiveAction"
                  value={formData.correctiveAction}
                  onChange={(e) => handleInputChange('correctiveAction', e.target.value)}
                  placeholder="What was done to rectify the problem? (e.g., 'Component replaced', 'Component repaired per SB XXX', 'Adjusted', 'Cleaned', 'Inspected per NDT and found serviceable', 'Troubleshooting performed - fault isolated to LRU')."
                  rows={3}
                  maxLength={2000}
                />
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Attachments (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="attachments">Upload Files</Label>
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
                    className="flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Select Files
                  </Button>
                </div>
                
                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Selected Files:</h4>
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText size={16} />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="save" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit SDR Report'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SDRForm; 
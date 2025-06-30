"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { X, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface StockInventoryItem {
  id: string;
  partNo: string;
  serialNo: string;
  description: string;
  incomingDate: string;
  station: string;
  customStation: string | null;
  owner: string;
  customOwner: string | null;
  quantity: string;
  hasExpireDate: boolean;
  expireDate: string | null;
  type: string;
  customType: string | null;
  location: string;
  customLocation: string | null;
  hasInspection: boolean;
  inspectionResult: string | null;
  inspectionFailure: string | null;
  customFailure: string | null;
  hasComment: boolean;
  comment: string | null;
}

interface InspectionChecklistFormProps {
  isVisible: boolean;
  onClose: () => void;
}

export function InspectionChecklistForm({ isVisible, onClose }: InspectionChecklistFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [date, setDate] = useState<string>("");
  const [inspector, setInspector] = useState("");
  const [selectedItem, setSelectedItem] = useState<StockInventoryItem | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add effect to check for selected part in localStorage
  useEffect(() => {
    const storedPart = localStorage.getItem('selectedPart');
    if (storedPart) {
      try {
        const part = JSON.parse(storedPart);
        setSelectedItem(part);
        // Clear the stored part after using it
        localStorage.removeItem('selectedPart');
      } catch (error) {
        console.error('Error parsing stored part:', error);
      }
    }
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) {
      toast({
        title: "Error",
        description: "Please select a part to inspect",
        variant: "destructive",
      });
      return;
    }

    if (!date) {
      toast({
        title: "Error",
        description: "Please select an inspection date",
        variant: "destructive",
      });
      return;
    }

    if (!inspector.trim()) {
      toast({
        title: "Error",
        description: "Please enter the inspector name",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Add files
      attachedFiles.forEach(file => {
        formData.append('files', file);
      });

      // Get all form values using FormData
      const form = e.target as HTMLFormElement;
      const formValues = {
        inspectionDate: date,
        inspector,
        stockInventoryId: selectedItem.id,
        // Product Identification and Documentation
        productMatch: (form.querySelector('input[name="product-match"]:checked') as HTMLInputElement)?.value || null,
        productSpecs: (form.querySelector('input[name="product-specs"]:checked') as HTMLInputElement)?.value || null,
        batchNumber: (form.querySelector('input[name="batch-number"]:checked') as HTMLInputElement)?.value || null,
        serialNumber: (form.querySelector('input[name="serial-number"]:checked') as HTMLInputElement)?.value || null,
        productObservations: (form.querySelector('textarea[name="product-observations"]') as HTMLTextAreaElement)?.value || null,
        // Quantity Verification/Part Integrity
        quantityMatch: (form.querySelector('input[name="quantity-match"]:checked') as HTMLInputElement)?.value || null,
        physicalCondition: (form.querySelector('input[name="physical-condition"]:checked') as HTMLInputElement)?.value || null,
        expirationDate: (form.querySelector('input[name="expiration-date"]:checked') as HTMLInputElement)?.value || null,
        serviceableExpiry: (form.querySelector('input[name="serviceable-expiry"]:checked') as HTMLInputElement)?.value || null,
        physicalDefects: (form.querySelector('input[name="physical-defects"]:checked') as HTMLInputElement)?.value || null,
        suspectedUnapproved: (form.querySelector('input[name="suspected-unapproved"]:checked') as HTMLInputElement)?.value || null,
        quantityObservations: (form.querySelector('textarea[name="quantity-observations"]') as HTMLTextAreaElement)?.value || null,
        // Part Handling and Storage
        esdSensitive: (form.querySelector('input[name="esd-sensitive"]:checked') as HTMLInputElement)?.value || null,
        inventoryRecorded: (form.querySelector('input[name="inventory-recorded"]:checked') as HTMLInputElement)?.value || null,
        temperatureControl: (form.querySelector('input[name="temperature-control"]:checked') as HTMLInputElement)?.value || null,
        handlingObservations: (form.querySelector('textarea[name="handling-observations"]') as HTMLTextAreaElement)?.value || null,
      };

      // Debug: Log the form values before sending
      console.log('Form values being submitted:', formValues);
      console.log('Selected item:', selectedItem);

      formData.append('data', JSON.stringify(formValues));

      const response = await fetch('/api/incoming-inspections', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Inspection checklist submitted successfully",
        });
        onClose();
      } else {
        throw new Error(data.error || 'Failed to submit inspection checklist');
      }
    } catch (error) {
      console.error('Error submitting inspection checklist:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit inspection checklist",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="w-full max-w-[90%] mx-auto">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl">Incoming Inspection Checklist</CardTitle>
        <Separator className="my-4" />
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-blue-600">INSTRUCTIONS:</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This checklist is designed to conduct an incoming inspection of the part to validate their quality on set acceptance criteria. Carefully review each item and mark the corresponding checkbox to indicate compliance or note any observations and non-conformities.
          </p>
        </div>
        <Separator className="my-4" />
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="inspection-date" className="text-base">Inspection Date</Label>
              <Input
                type="date"
                id="inspection-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full ${date ? 'bg-green-50' : ''}`}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspector" className="text-base">Inspector</Label>
              <Input
                id="inspector"
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                placeholder="Enter inspector name"
                className={`w-full ${inspector ? 'bg-green-50' : ''}`}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="part-search" className="text-base">Part Identification</Label>
              <Button
                variant="outline"
                className={`w-full justify-between cursor-pointer ${selectedItem ? 'bg-green-50' : ''}`}
                onClick={() => router.push('/dashboard/incoming-inspections/search-parts')}
              >
                {selectedItem ? (
                  <span className="font-medium">Part Selected: {selectedItem.partNo}</span>
                ) : (
                  "Search for a part..."
                )}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </div>
          </div>
          
          {selectedItem && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Selected Part Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Part Number</span>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">PRIMARY</span>
                    </div>
                    <span className="font-bold text-xl text-blue-900">{selectedItem.partNo}</span>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">Serial Number</span>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">UNIQUE ID</span>
                    </div>
                    <span className="font-bold text-xl text-green-900">{selectedItem.serialNo || 'Not Available'}</span>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Description</span>
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">DETAILS</span>
                    </div>
                    <span className="font-medium text-lg text-purple-900 leading-relaxed">{selectedItem.description}</span>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <Separator className="my-4" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">1. PRODUCT IDENTIFICATION AND DOCUMENTATION</h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Label className="text-base">1.1 Product name and description match the order and packing slip:</Label>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-2">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="match-yes"
                          name="product-match"
                          value="YES"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="match-yes">YES</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="match-no"
                          name="product-match"
                          value="NO"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="match-no">NO</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="match-na"
                          name="product-match"
                          value="N/A"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="match-na">N/A</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Label className="text-base">1.2 Product specifications and documentation are provided by the supplier:</Label>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-2">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="specs-yes"
                          name="product-specs"
                          value="YES"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="specs-yes">YES</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="specs-no"
                          name="product-specs"
                          value="NO"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="specs-no">NO</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="specs-na"
                          name="product-specs"
                          value="N/A"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="specs-na">N/A</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Label className="text-base">1.3 Batch/Part Number is clearly labeled (if applicable):</Label>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-2">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="batch-yes"
                          name="batch-number"
                          value="YES"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="batch-yes">YES</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="batch-no"
                          name="batch-number"
                          value="NO"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="batch-no">NO</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="batch-na"
                          name="batch-number"
                          value="N/A"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="batch-na">N/A</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Label className="text-base">1.4 Serial Number is clearly labeled (if applicable):</Label>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-2">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="serial-yes"
                          name="serial-number"
                          value="YES"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="serial-yes">YES</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="serial-no"
                          name="serial-number"
                          value="NO"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="serial-no">NO</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="serial-na"
                          name="serial-number"
                          value="N/A"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="serial-na">N/A</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label className="text-base">Observations/Notes/Corrective actions, if any:</Label>
              <Textarea
                name="product-observations"
                placeholder="Enter any observations, notes, or corrective actions here..."
                className="min-h-[100px] resize-y"
              />
            </div>
          </div>

          <Separator className="my-4" />

          <h3 className="text-lg font-semibold text-blue-600">2. QUANTITY VERIFICATION/ PART INTEGRITY</h3>
          
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Label className="text-base">2.1 The received quantity matches the quantity stated on the packing slip/purchase order:</Label>
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-2">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="quantity-yes"
                        name="quantity-match"
                        value="YES"
                        className="h-4 w-4"
                      />
                      <Label htmlFor="quantity-yes">YES</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="quantity-no"
                        name="quantity-match"
                        value="NO"
                        className="h-4 w-4"
                      />
                      <Label htmlFor="quantity-no">NO</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="quantity-na"
                        name="quantity-match"
                        value="N/A"
                        className="h-4 w-4"
                      />
                      <Label htmlFor="quantity-na">N/A</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Label className="text-base">2.2 Is part found in good physical condition?:</Label>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-2">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="condition-yes"
                          name="physical-condition"
                          value="YES"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="condition-yes">YES</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="condition-no"
                          name="physical-condition"
                          value="NO"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="condition-no">NO</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="condition-na"
                          name="physical-condition"
                          value="N/A"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="condition-na">N/A</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Label className="text-base">2.3 Does the part have expiration date (Make sure it is not Expired):</Label>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-2">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="expiry-yes"
                          name="expiration-date"
                          value="YES"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="expiry-yes">YES</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="expiry-no"
                          name="expiration-date"
                          value="NO"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="expiry-no">NO</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="expiry-na"
                          name="expiration-date"
                          value="N/A"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="expiry-na">N/A</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Label className="text-base">2.4 Check expiration or shelf-life dates on serviceable materials to ensure they are within limits:</Label>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-2">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="serviceable-yes"
                          name="serviceable-expiry"
                          value="YES"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="serviceable-yes">YES</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="serviceable-no"
                          name="serviceable-expiry"
                          value="NO"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="serviceable-no">NO</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="serviceable-na"
                          name="serviceable-expiry"
                          value="N/A"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="serviceable-na">N/A</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Label className="text-base">2.5 The raw material appears free from physical defects, contamination, or foreign objects?:</Label>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-2">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="defects-yes"
                          name="physical-defects"
                          value="YES"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="defects-yes">YES</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="defects-no"
                          name="physical-defects"
                          value="NO"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="defects-no">NO</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="defects-na"
                          name="physical-defects"
                          value="N/A"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="defects-na">N/A</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Label className="text-base">2.6 Did you suspect this is a Suspected Unapproved Parts (SUP):</Label>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-2">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="sup-yes"
                          name="suspected-unapproved"
                          value="YES"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="sup-yes">YES</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="sup-no"
                          name="suspected-unapproved"
                          value="NO"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="sup-no">NO</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="sup-na"
                          name="suspected-unapproved"
                          value="N/A"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="sup-na">N/A</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label className="text-base">Observations/Notes/Corrective actions, if any:</Label>
              <Textarea
                name="quantity-observations"
                placeholder="Enter any observations, notes, or corrective actions here..."
                className="min-h-[100px] resize-y"
              />
            </div>
          </div>

          <Separator className="my-4" />

          <h3 className="text-lg font-semibold text-blue-600">3. PART HANDLING AND STORAGE</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Label className="text-base">3.1 Is this a electrostatic discharge (ESD):</Label>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-2">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="esd-yes"
                          name="esd-sensitive"
                          value="YES"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="esd-yes">YES</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="esd-no"
                          name="esd-sensitive"
                          value="NO"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="esd-no">NO</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="esd-na"
                          name="esd-sensitive"
                          value="N/A"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="esd-na">N/A</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Label className="text-base">3.2 Is the part recorded in the inventory:</Label>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-2">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="inventory-yes"
                          name="inventory-recorded"
                          value="YES"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="inventory-yes">YES</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="inventory-no"
                          name="inventory-recorded"
                          value="NO"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="inventory-no">NO</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="inventory-na"
                          name="inventory-recorded"
                          value="N/A"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="inventory-na">N/A</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Label className="text-base">3.3 Is the part storaged in a place with temperature control:</Label>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-2">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="temp-yes"
                          name="temperature-control"
                          value="YES"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="temp-yes">YES</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="temp-no"
                          name="temperature-control"
                          value="NO"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="temp-no">NO</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="temp-na"
                          name="temperature-control"
                          value="N/A"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="temp-na">N/A</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label className="text-base">Observations/Notes/Corrective actions, if any:</Label>
              <Textarea
                name="handling-observations"
                placeholder="Enter any observations, notes, or corrective actions here..."
                className="min-h-[100px] resize-y"
              />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">ATTACHMENTS</h3>
            <div className="space-y-2">
              <Label className="text-base">Upload supporting documents (photos, certificates, etc.):</Label>
              <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-sm text-gray-500">Any file type accepted including images and audio (Max 25MB total)</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={triggerFileInput}
                    className="mt-2 cursor-pointer"
                  >
                    Select Files
                  </Button>
                </div>
                {attachedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
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
                            className="h-6 w-6 p-0 cursor-pointer"
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
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              {isSubmitting ? "Submitting..." : "Submit Inspection"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 
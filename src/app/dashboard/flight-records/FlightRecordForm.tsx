"use client";

import { useState, useRef, useEffect } from "react";
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
import { X, Loader2, Plus, Minus } from "lucide-react";
import { UserSearchCombobox } from "@/components/ui/user-search-combobox";
import { AutoCompleteInput } from "@/components/ui/auto-complete-input";

// Types
export interface PartReplacement {
  id?: string;
  pnOff: string;
  snOff: string;
  pnOn: string;
  snOn: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  fileType: string;
}

export interface FlightRecordFormValues {
  date: string;
  airline: string;
  fleet: string;
  flightNumber?: string;
  tail?: string;
  station: string;
  service: string;
  hasTime: boolean;
  blockTime?: string;
  outTime?: string;
  hasDefect: boolean;
  logPageNo?: string;
  discrepancyNote?: string;
  rectificationNote?: string;
  systemAffected?: string;
  defectStatus?: string;
  riiRequired: boolean;
  inspectedBy?: string;
  hasAttachments: boolean;
  hasComment: boolean;
  comment?: string;
  technician?: string;
  username?: string;
  fixingManual?: string;
  manualReference?: string;
  hasPartReplaced: boolean;
  PartReplacement: PartReplacement[];
  Attachment: Attachment[];
}

interface FlightRecordFormProps {
  initialValues: FlightRecordFormValues;
  mode: "add" | "edit";
  onSubmit: (values: FlightRecordFormValues, files: File[], deletedAttachmentIds: string[]) => void;
  onCancel: () => void;
}

export function FlightRecordForm({ initialValues, mode, onSubmit, onCancel }: FlightRecordFormProps) {
  // State for all fields, initialized from initialValues
  const [form, setForm] = useState<FlightRecordFormValues>(initialValues);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Options for dropdowns
  const serviceOptions = ['Transit', 'Over-Night', 'Cancelled', 'Diverted', 'AOG', 'Push-Back', 'Fueling', 'N/A'];
  const systemOptions = ['ATA-05 Inspections', 'ATA-10 Parking, Mooring, etc', 'ATA-11 Placards/Markings', 'ATA-12 Servicing', 'ATA-21 Air Conditioning', 'ATA-22 Autoflight', 'ATA-23 Communications', 'ATA-24 Electrical',
    'ATA-25 Equip/Furnishing', 'ATA-26 Fire Protection', 'ATA-27 Flight Controls', 'ATA-28 Fuel', 'ATA-29 Hydraulic SYS', 'ATA-30 Ice/Rain Prot', 'ATA-31 Instruments', 'ATA-32 Landing Gear',
    'ATA-33 Lights', 'ATA-34 Navigation', 'ATA-35 Oxygen', 'ATA-36 Pneumatic', 'ATA-38 Water/Waste', 'ATA-45 Central Maint. SYS', 'ATA-49 APU', 'ATA-51 Standard Practices', 'ATA-52 Doors',
    'ATA-53 Fuselage', 'ATA-54 Nacelles/Pylons', 'ATA-55 Stabilizers', 'ATA-56 Windows', 'ATA-57 Wings', 'ATA-70 Standard Practice - Engine', 'ATA-71 PowerPlant', 'ATA-72 Engine', 'ATA-73 Fuel Control',
    'ATA-73 Engine Fuel Control', 'ATA-74 Ignition', 'ATA-75 Engine Bleed'];

  // Handlers
  const handleInput = (field: keyof FlightRecordFormValues, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Attachments
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const handleDeleteExistingAttachment = (id: string) => {
    setDeletedAttachmentIds((prev) => [...prev, id]);
    setForm((prev) => ({
      ...prev,
      Attachment: prev.Attachment.filter((a) => a.id !== id),
    }));
  };

  // Part Replacements
  const addPartReplacement = () => {
    setForm((prev) => ({
      ...prev,
      PartReplacement: [
        ...prev.PartReplacement,
        { pnOff: "", snOff: "", pnOn: "", snOn: "" },
      ],
    }));
  };
  const removePartReplacement = (index: number) => {
    setForm((prev) => ({
      ...prev,
      PartReplacement: prev.PartReplacement.filter((_, i) => i !== index),
    }));
  };
  const updatePartReplacement = (index: number, field: keyof PartReplacement, value: string) => {
    setForm((prev) => ({
      ...prev,
      PartReplacement: prev.PartReplacement.map((part, i) =>
        i === index ? { ...part, [field]: value } : part
      ),
    }));
  };

  // Submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    onSubmit(form, attachedFiles, deletedAttachmentIds);
    setIsSubmitting(false);
  };

  // Render
  return (
    <div className="bg-card p-4 shadow border w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{mode === "add" ? "Add New Flight Record" : "Edit Flight Record"}</h2>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Flexible grid layout */}
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="date" className="text-sm sm:text-base">Date</Label>
            <Input
              type="date"
              id="date"
              value={form.date}
              onChange={(e) => handleInput("date", e.target.value)}
              className={`mt-1 w-full rounded-none cursor-pointer ${form.date ? 'bg-green-50' : ''}`}
              required
            />
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="station" className="text-sm sm:text-base">Station</Label>
            <Input
              id="station"
              value={form.station}
              onChange={(e) => handleInput("station", e.target.value)}
              placeholder="Enter station code"
              className={`mt-1 w-full rounded-none cursor-pointer ${form.station ? 'bg-green-50' : ''}`}
              required
            />
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="airline" className="text-sm sm:text-base">Airline</Label>
            <Input
              id="airline"
              value={form.airline}
              onChange={(e) => handleInput("airline", e.target.value)}
              placeholder="Enter airline name"
              className={`mt-1 w-full rounded-none cursor-pointer ${form.airline ? 'bg-green-50' : ''}`}
              required
            />
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="fleet" className="text-sm sm:text-base">Fleet</Label>
            <Input
              id="fleet"
              value={form.fleet}
              onChange={(e) => handleInput("fleet", e.target.value)}
              placeholder="Enter aircraft model"
              className={`mt-1 w-full rounded-none cursor-pointer ${form.fleet ? 'bg-green-50' : ''}`}
              required
            />
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="flightNumber" className="text-sm sm:text-base">Flight Number</Label>
            <Input
              id="flightNumber"
              value={form.flightNumber || ""}
              onChange={(e) => handleInput("flightNumber", e.target.value)}
              placeholder="Enter flight number"
              className={`mt-1 w-full rounded-none cursor-pointer ${form.flightNumber ? 'bg-green-50' : ''}`}
            />
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="tail" className="text-sm sm:text-base">Tail</Label>
            <Input
              id="tail"
              value={form.tail || ""}
              onChange={(e) => handleInput("tail", e.target.value)}
              placeholder="Enter aircraft registration"
              className={`mt-1 w-full rounded-none cursor-pointer ${form.tail ? 'bg-green-50' : ''}`}
            />
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="hasTime" className="text-sm sm:text-base">Has Time?</Label>
            <Select value={form.hasTime ? "yes" : "no"} onValueChange={(value) => handleInput("hasTime", value === "yes")}>
              <SelectTrigger id="hasTime" className="mt-1 rounded-none cursor-pointer">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.hasTime && (
            <>
              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="blockTime" className="text-sm sm:text-base">Block Time</Label>
                <Input
                  type="text"
                  id="blockTime"
                  value={form.blockTime || ""}
                  onChange={(e) => handleInput("blockTime", e.target.value)}
                  placeholder="HH:MM"
                  className={`mt-1 w-full rounded-none cursor-pointer ${form.blockTime ? 'bg-green-50' : ''}`}
                  maxLength={5}
                />
                <p className="text-xs text-muted-foreground mt-1">Format: HH:MM (e.g. 09:30)</p>
              </div>

              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="outTime" className="text-sm sm:text-base">Out Time</Label>
                <Input
                  type="text"
                  id="outTime"
                  value={form.outTime || ""}
                  onChange={(e) => handleInput("outTime", e.target.value)}
                  placeholder="HH:MM"
                  className={`mt-1 w-full rounded-none cursor-pointer ${form.outTime ? 'bg-green-50' : ''}`}
                  maxLength={5}
                />
                <p className="text-xs text-muted-foreground mt-1">Format: HH:MM (e.g. 09:30)</p>
              </div>
            </>
          )}

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="service" className="text-sm sm:text-base">Service</Label>
            <Select value={form.service} onValueChange={(value) => handleInput("service", value)}>
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
            <Select value={form.hasDefect ? "yes" : "no"} onValueChange={(value) => handleInput("hasDefect", value === "yes")}>
              <SelectTrigger id="hasDefect" className="mt-1 rounded-none cursor-pointer">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.hasDefect && (
            <>
              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="logPageNo" className="text-sm sm:text-base">Log Page No</Label>
                <Input
                  id="logPageNo"
                  value={form.logPageNo || ""}
                  onChange={(e) => handleInput("logPageNo", e.target.value)}
                  placeholder="Enter log page number"
                  className={`mt-1 w-full rounded-none cursor-pointer ${form.logPageNo ? 'bg-green-50' : ''}`}
                />
              </div>

              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="systemAffected" className="text-sm sm:text-base">System Affected</Label>
                <Select value={form.systemAffected || ""} onValueChange={(value) => handleInput("systemAffected", value)}>
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
                <Select value={form.defectStatus || ""} onValueChange={(value) => handleInput("defectStatus", value)}>
                  <SelectTrigger id="defectStatus" className="mt-1 rounded-none cursor-pointer">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fixed">Fixed</SelectItem>
                    <SelectItem value="Deferred">Deferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="discrepancyNote" className="text-sm sm:text-base">Discrepancy Note</Label>
                <Textarea
                  id="discrepancyNote"
                  value={form.discrepancyNote || ""}
                  onChange={(e) => handleInput("discrepancyNote", e.target.value)}
                  placeholder="Enter discrepancy note"
                  className={`mt-1 w-full min-h-[80px] rounded-none cursor-pointer ${form.discrepancyNote ? 'bg-green-50' : ''}`}
                />
              </div>

              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="rectificationNote" className="text-sm sm:text-base">Rectification Note</Label>
                <Textarea
                  id="rectificationNote"
                  value={form.rectificationNote || ""}
                  onChange={(e) => handleInput("rectificationNote", e.target.value)}
                  placeholder="Enter rectification note"
                  className={`mt-1 w-full min-h-[80px] rounded-none cursor-pointer ${form.rectificationNote ? 'bg-green-50' : ''}`}
                />
              </div>

              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="hasPartReplaced" className="text-sm sm:text-base">Part Replaced?</Label>
                <Select value={form.hasPartReplaced ? "yes" : "no"} onValueChange={(value) => handleInput("hasPartReplaced", value === "yes")}>
                  <SelectTrigger id="hasPartReplaced" className="mt-1 rounded-none cursor-pointer">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.hasPartReplaced && (
                <div className="w-full px-2 mb-4">
                  <Label className="text-sm sm:text-base">Part Replacements</Label>
                  <div className="mt-2 space-y-3">
                    {form.PartReplacement.map((part, idx) => (
                      <div key={idx} className="border p-3 rounded-md">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <Label htmlFor={`pnOff-${idx}`} className="text-xs">P/N OFF</Label>
                            <Input
                              type="text"
                              id={`pnOff-${idx}`}
                              value={part.pnOff}
                              onChange={(e) => updatePartReplacement(idx, "pnOff", e.target.value)}
                              placeholder="P/N OFF"
                              className={`mt-1 w-full h-8 text-xs rounded-none cursor-pointer placeholder:text-orange-400 placeholder:bg-orange-50 ${part.pnOff ? 'bg-green-50' : ''}`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`snOff-${idx}`} className="text-xs">S/N OFF</Label>
                            <Input
                              type="text"
                              id={`snOff-${idx}`}
                              value={part.snOff}
                              onChange={(e) => updatePartReplacement(idx, "snOff", e.target.value)}
                              placeholder="S/N OFF"
                              className={`mt-1 w-full h-8 text-xs rounded-none cursor-pointer placeholder:text-orange-400 placeholder:bg-orange-50 ${part.snOff ? 'bg-green-50' : ''}`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`pnOn-${idx}`} className="text-xs">P/N ON</Label>
                            <Input
                              type="text"
                              id={`pnOn-${idx}`}
                              value={part.pnOn}
                              onChange={(e) => updatePartReplacement(idx, "pnOn", e.target.value)}
                              placeholder="P/N ON"
                              className={`mt-1 w-full h-8 text-xs rounded-none cursor-pointer placeholder:text-orange-400 placeholder:bg-orange-50 ${part.pnOn ? 'bg-green-50' : ''}`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`snOn-${idx}`} className="text-xs">S/N ON</Label>
                            <Input
                              type="text"
                              id={`snOn-${idx}`}
                              value={part.snOn}
                              onChange={(e) => updatePartReplacement(idx, "snOn", e.target.value)}
                              placeholder="S/N ON"
                              className={`mt-1 w-full h-8 text-xs rounded-none cursor-pointer placeholder:text-orange-400 placeholder:bg-orange-50 ${part.snOn ? 'bg-green-50' : ''}`}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button type="button" size="sm" variant="destructive" onClick={() => removePartReplacement(idx)}>
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" size="sm" onClick={addPartReplacement} className="rounded-none cursor-pointer">
                      <Plus className="w-4 h-4" /> Add Part Replacement
                    </Button>
                  </div>
                </div>
              )}

              <div className="w-full md:w-1/3 px-2 mb-4">
                <Label htmlFor="riiRequired" className="text-sm sm:text-base">RII Required?</Label>
                <Select value={form.riiRequired ? "yes" : "no"} onValueChange={(value) => handleInput("riiRequired", value === "yes")}>
                  <SelectTrigger id="riiRequired" className="mt-1 rounded-none cursor-pointer">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.riiRequired && (
                <div className="w-full md:w-1/3 px-2 mb-4">
                  <Label htmlFor="inspectedBy" className="text-sm sm:text-base">Inspected By</Label>
                  <Input
                    id="inspectedBy"
                    value={form.inspectedBy || ""}
                    onChange={(e) => handleInput("inspectedBy", e.target.value)}
                    placeholder="Enter inspector name"
                    className={`mt-1 w-full rounded-none cursor-pointer ${form.inspectedBy ? 'bg-green-50' : ''}`}
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
            <Select value={form.hasAttachments ? "yes" : "no"} onValueChange={(value) => handleInput("hasAttachments", value === "yes")}>
              <SelectTrigger id="hasAttachments" className="mt-1 rounded-none cursor-pointer">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            {form.hasAttachments && (
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
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 cursor-pointer rounded-none"
                    >
                      Select Files
                    </Button>
                  </div>
                  {/* Existing attachments */}
                  {form.Attachment.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Existing Files:</p>
                      <ul className="space-y-2">
                        {form.Attachment.map((att) => (
                          <li key={att.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                            <span className="text-sm truncate max-w-[80%]">
                              {att.fileName} ({(att.fileSize / 1024).toFixed(1)} KB)
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExistingAttachment(att.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* New attachments */}
                  {attachedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">New Files:</p>
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
            <Select value={form.hasComment ? "yes" : "no"} onValueChange={(value) => handleInput("hasComment", value === "yes")}>
              <SelectTrigger id="hasComment" className="mt-1 rounded-none cursor-pointer">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            {form.hasComment && (
              <div className="mt-2">
                <Label htmlFor="comment" className="text-sm sm:text-base">Comment</Label>
                <Textarea
                  id="comment"
                  value={form.comment || ""}
                  onChange={(e) => handleInput("comment", e.target.value)}
                  placeholder="Enter your comment"
                  className={`mt-1 w-full min-h-[105px] rounded-none cursor-pointer ${form.comment ? 'bg-green-50' : ''}`}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Technician Section */}
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="technician" className="text-sm sm:text-base">Technician</Label>
            <Input
              id="technician"
              value={form.technician || ""}
              onChange={(e) => handleInput("technician", e.target.value)}
              placeholder="Enter technician name"
              className={`mt-1 w-full rounded-none cursor-pointer ${form.technician ? 'bg-green-50' : ''}`}
            />
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="username" className="text-sm sm:text-base">Username</Label>
            <Input
              id="username"
              value={form.username || ""}
              onChange={(e) => handleInput("username", e.target.value)}
              placeholder="Enter username"
              className={`mt-1 w-full rounded-none cursor-pointer ${form.username ? 'bg-green-50' : ''}`}
            />
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="fixingManual" className="text-sm sm:text-base">Fixing Manual</Label>
            <Input
              id="fixingManual"
              value={form.fixingManual || ""}
              onChange={(e) => handleInput("fixingManual", e.target.value)}
              placeholder="Enter fixing manual"
              className={`mt-1 w-full rounded-none cursor-pointer ${form.fixingManual ? 'bg-green-50' : ''}`}
            />
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <Label htmlFor="manualReference" className="text-sm sm:text-base">Manual Reference</Label>
            <Input
              id="manualReference"
              value={form.manualReference || ""}
              onChange={(e) => handleInput("manualReference", e.target.value)}
              placeholder="Enter manual reference"
              className={`mt-1 w-full rounded-none cursor-pointer ${form.manualReference ? 'bg-green-50' : ''}`}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="neutral" 
            size="sm"
            className="h-8 rounded-none cursor-pointer"
            onClick={onCancel} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="save"
            disabled={isSubmitting}
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
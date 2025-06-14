"use client";

import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  X,
  Edit3,
  AlertTriangle,
  Save,
  Calendar,
  User,
  Building2,
  MapPin,
  Target,
  FileText
} from "lucide-react";

interface Audit {
  id: string;
  auditNumber: string;
  title: string;
  type: string;
  status: string;
  leadAuditor: string;
  plannedStartDate: string;
  plannedEndDate: string;  
  actualStartDate?: string;
  actualEndDate?: string;
  department?: string;
  description?: string;
  scope?: string;
  location?: string;
  auditee?: string;
  objectives?: string;
  criteria?: string;
  _count: {
    findings: number;
    attachments: number;
  };
}

interface EditAuditDialogProps {
  audit: Audit | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (audit: Audit) => Promise<void>;
  loading: boolean;
}

const EditAuditDialog: React.FC<EditAuditDialogProps> = ({ 
  audit, 
  isOpen, 
  onClose, 
  onSave, 
  loading 
}) => {
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (audit) {
      setEditingAudit({ ...audit });
    }
  }, [audit]);

  useEffect(() => {
    // Set the app element for react-modal
    if (typeof window !== 'undefined') {
      const appElement = document.getElementById('__next') || document.body;
      Modal.setAppElement(appElement);
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setEditingAudit(prev => prev ? { ...prev, [field]: value } : null);
    if (error) setError(null);
  };

  const handleStatusChange = (value: string) => {
    if (!editingAudit) return;
    
    const prev = editingAudit.status;
    const updated = { ...editingAudit, status: value };
    
    // Auto-set actual start date when moving to IN_PROGRESS
    if (value === 'IN_PROGRESS' && prev === 'PLANNED' && !updated.actualStartDate) {
      updated.actualStartDate = new Date().toISOString().split('T')[0];
    }
    
    // Auto-set actual end date when moving to COMPLETED
    if (value === 'COMPLETED' && prev !== 'COMPLETED' && !updated.actualEndDate) {
      updated.actualEndDate = new Date().toISOString().split('T')[0];
      // Also set actual start date if not set
      if (!updated.actualStartDate) {
        updated.actualStartDate = updated.plannedStartDate.split('T')[0];
      }
    }
    
    setEditingAudit(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAudit) return;

    try {
      setError(null);
      await onSave(editingAudit);
    } catch (err: any) {
      setError(err.message || 'Failed to update audit');
    }
  };

  if (!isOpen || !editingAudit) return null;

  // Custom styles for react-modal (matching audit details)
  const customStyles = {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.60)',
      backdropFilter: 'blur(2px)',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    },
    content: {
      position: 'relative' as const,
      top: 'auto',
      left: 'auto',
      right: 'auto',
      bottom: 'auto',
      width: '100%',
      height: '100%',
      maxWidth: '90vw',
      maxHeight: '90vh',
      border: 'none',
      borderRadius: '0',
      padding: '0',
      overflow: 'hidden',
      background: 'white',
      boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      margin: 'auto',
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Edit Audit"
      closeTimeoutMS={200}
      appElement={typeof window !== 'undefined' ? document.getElementById('__next') || document.body : undefined}
    >
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-md">
                <Edit3 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Edit Audit</h1>
                <p className="text-xs text-gray-500">{editingAudit.auditNumber}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 hover:bg-gray-100 rounded-md"
              disabled={loading}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-title" className="text-sm font-medium">Audit Title *</Label>
                    <Input
                      id="edit-title"
                      value={editingAudit.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                      disabled={loading}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-type" className="text-sm font-medium">Audit Type *</Label>
                    <Select 
                      value={editingAudit.type} 
                      onValueChange={(value) => handleInputChange('type', value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select audit type" />
                      </SelectTrigger>
                      <SelectContent 
                        className="z-[1001] bg-white border border-gray-200 shadow-lg" 
                        side="bottom" 
                        align="start"
                        sideOffset={4}
                        position="popper"
                      >
                        <SelectItem value="INTERNAL">Internal</SelectItem>
                        <SelectItem value="EXTERNAL">External</SelectItem>
                        <SelectItem value="SAFETY">Safety</SelectItem>
                        <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                        <SelectItem value="QUALITY">Quality</SelectItem>
                        <SelectItem value="REGULATORY">Regulatory</SelectItem>
                        <SelectItem value="CUSTOMER">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-status" className="text-sm font-medium">Status *</Label>
                    <Select 
                      value={editingAudit.status} 
                      onValueChange={handleStatusChange}
                      disabled={loading}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent 
                        className="z-[1001] bg-white border border-gray-200 shadow-lg" 
                        side="bottom" 
                        align="start"
                        sideOffset={4}
                        position="popper"
                      >
                        <SelectItem value="PLANNED">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            Planned
                          </div>
                        </SelectItem>
                        <SelectItem value="IN_PROGRESS">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            In Progress
                          </div>
                        </SelectItem>
                        <SelectItem value="COMPLETED">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Completed
                          </div>
                        </SelectItem>
                        <SelectItem value="CANCELLED">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            Cancelled
                          </div>
                        </SelectItem>
                        <SelectItem value="DEFERRED">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                            Deferred
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingAudit.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location & Organization */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  Location & Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-department" className="text-sm font-medium">Department</Label>
                    <Input
                      id="edit-department"
                      value={editingAudit.department || ''}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      disabled={loading}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-location" className="text-sm font-medium">Location</Label>
                    <Input
                      id="edit-location"
                      value={editingAudit.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={loading}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-scope" className="text-sm font-medium">Scope</Label>
                    <Input
                      id="edit-scope"
                      value={editingAudit.scope || ''}
                      onChange={(e) => handleInputChange('scope', e.target.value)}
                      disabled={loading}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-startDate" className="text-sm font-medium">Planned Start Date *</Label>
                    <Input
                      id="edit-startDate"
                      type="date"
                      value={editingAudit.plannedStartDate.split('T')[0]}
                      onChange={(e) => handleInputChange('plannedStartDate', e.target.value)}
                      required
                      disabled={loading}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-endDate" className="text-sm font-medium">Planned End Date *</Label>
                    <Input
                      id="edit-endDate"
                      type="date"
                      value={editingAudit.plannedEndDate.split('T')[0]}
                      onChange={(e) => handleInputChange('plannedEndDate', e.target.value)}
                      required
                      disabled={loading}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Actual dates for status tracking */}
                {(editingAudit.status === 'IN_PROGRESS' || editingAudit.status === 'COMPLETED') && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="col-span-2 mb-2">
                      <p className="text-sm font-medium text-blue-800">
                        📅 Actual Execution Dates
                      </p>
                      <p className="text-xs text-blue-600">
                        Track the real dates when the audit was executed
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="edit-actualStartDate" className="text-sm font-medium">Actual Start Date</Label>
                      <Input
                        id="edit-actualStartDate"
                        type="date"
                        value={editingAudit.actualStartDate?.split('T')[0] || ''}
                        onChange={(e) => handleInputChange('actualStartDate', e.target.value)}
                        disabled={loading}
                        className="mt-1"
                      />
                    </div>
                    {editingAudit.status === 'COMPLETED' && (
                      <div>
                        <Label htmlFor="edit-actualEndDate" className="text-sm font-medium">Actual End Date</Label>
                        <Input
                          id="edit-actualEndDate"
                          type="date"
                          value={editingAudit.actualEndDate?.split('T')[0] || ''}
                          onChange={(e) => handleInputChange('actualEndDate', e.target.value)}
                          disabled={loading}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* People & Responsibilities */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  People & Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-leadAuditor" className="text-sm font-medium">Lead Auditor *</Label>
                    <Input
                      id="edit-leadAuditor"
                      value={editingAudit.leadAuditor}
                      onChange={(e) => handleInputChange('leadAuditor', e.target.value)}
                      required
                      disabled={loading}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-auditee" className="text-sm font-medium">Auditee</Label>
                    <Input
                      id="edit-auditee"
                      value={editingAudit.auditee || ''}
                      onChange={(e) => handleInputChange('auditee', e.target.value)}
                      disabled={loading}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4 space-y-4">
                <div>
                  <Label htmlFor="edit-objectives" className="text-sm font-medium">Objectives</Label>
                  <Textarea
                    id="edit-objectives"
                    value={editingAudit.objectives || ''}
                    onChange={(e) => handleInputChange('objectives', e.target.value)}
                    rows={2}
                    disabled={loading}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-criteria" className="text-sm font-medium">Criteria/Standards</Label>
                  <Textarea
                    id="edit-criteria"
                    value={editingAudit.criteria || ''}
                    onChange={(e) => handleInputChange('criteria', e.target.value)}
                    rows={2}
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status Change Information */}
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-2 font-medium">
                  Status Change Guide:
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• <strong>Planned:</strong> Audit is scheduled but not started</li>
                  <li>• <strong>In Progress:</strong> Audit execution has begun</li>
                  <li>• <strong>Completed:</strong> Audit finished, findings documented</li>
                  <li>• <strong>Cancelled:</strong> Audit cancelled before completion</li>
                  <li>• <strong>Deferred:</strong> Audit postponed to a later date</li>
                </ul>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Footer with Actions */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="neutral" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="save"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Audit
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditAuditDialog; 
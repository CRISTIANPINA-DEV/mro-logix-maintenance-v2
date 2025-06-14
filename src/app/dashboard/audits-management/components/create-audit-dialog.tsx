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
  Plus,
  AlertTriangle,
  CheckCircle,
  Save,
  Calendar,
  User,
  Building2,
  MapPin,
  Target,
  FileText
} from "lucide-react";

interface CreateAuditFormData {
  title: string;
  type: string;
  description: string;
  department: string;
  location: string;
  scope: string;
  plannedStartDate: string;
  plannedEndDate: string;
  leadAuditor: string;
  auditee: string;
  objectives: string;
  criteria: string;
}

interface CreateAuditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuditCreated: () => void;
}

const CreateAuditDialog: React.FC<CreateAuditDialogProps> = ({ 
  isOpen, 
  onClose, 
  onAuditCreated 
}) => {
  const [formData, setFormData] = useState<CreateAuditFormData>({
    title: '',
    type: '',
    description: '',
    department: '',
    location: '',
    scope: '',
    plannedStartDate: '',
    plannedEndDate: '',
    leadAuditor: '',
    auditee: '',
    objectives: '',
    criteria: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Set the app element for react-modal
    if (typeof window !== 'undefined') {
      const appElement = document.getElementById('__next') || document.body;
      Modal.setAppElement(appElement);
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: '',
      description: '',
      department: '',
      location: '',
      scope: '',
      plannedStartDate: '',
      plannedEndDate: '',
      leadAuditor: '',
      auditee: '',
      objectives: '',
      criteria: ''
    });
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create audit');
      }

      setSuccess(true);
      setTimeout(() => {
        onAuditCreated();
        handleClose();
      }, 1500);

    } catch (error: any) {
      setError(error.message || 'Failed to create audit');
      console.error('Error creating audit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setTimeout(() => {
        resetForm();
      }, 200);
    }
  };

  if (!isOpen) return null;

  // Custom styles for react-modal (matching edit and detail dialogs)
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
      onRequestClose={handleClose}
      style={customStyles}
      contentLabel="Create New Audit"
      closeTimeoutMS={200}
      appElement={typeof window !== 'undefined' ? document.getElementById('__next') || document.body : undefined}
    >
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-md">
                <Plus className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Create New Audit</h1>
                <p className="text-xs text-gray-500">Add a new audit to the system</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-7 w-7 p-0 hover:bg-gray-100 rounded-md"
              disabled={loading}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Audit created successfully! Refreshing data...
              </AlertDescription>
            </Alert>
          )}

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
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                      Audit Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                      disabled={loading}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                      Audit Type *
                    </Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => handleInputChange('type', value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="text-sm">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    disabled={loading}
                    className="text-sm resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Organization & Location */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  Organization & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                      Department
                    </Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      disabled={loading}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                      Location
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={loading}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scope" className="text-sm font-medium text-gray-700">
                      Scope
                    </Label>
                    <Input
                      id="scope"
                      value={formData.scope}
                      onChange={(e) => handleInputChange('scope', e.target.value)}
                      disabled={loading}
                      className="text-sm"
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
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plannedStartDate" className="text-sm font-medium text-gray-700">
                      Planned Start Date *
                    </Label>
                    <Input
                      id="plannedStartDate"
                      type="date"
                      value={formData.plannedStartDate}
                      onChange={(e) => handleInputChange('plannedStartDate', e.target.value)}
                      required
                      disabled={loading}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plannedEndDate" className="text-sm font-medium text-gray-700">
                      Planned End Date *
                    </Label>
                    <Input
                      id="plannedEndDate"
                      type="date"
                      value={formData.plannedEndDate}
                      onChange={(e) => handleInputChange('plannedEndDate', e.target.value)}
                      required
                      disabled={loading}
                      className="text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personnel */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  Personnel
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leadAuditor" className="text-sm font-medium text-gray-700">
                      Lead Auditor *
                    </Label>
                    <Input
                      id="leadAuditor"
                      value={formData.leadAuditor}
                      onChange={(e) => handleInputChange('leadAuditor', e.target.value)}
                      required
                      disabled={loading}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auditee" className="text-sm font-medium text-gray-700">
                      Auditee
                    </Label>
                    <Input
                      id="auditee"
                      value={formData.auditee}
                      onChange={(e) => handleInputChange('auditee', e.target.value)}
                      disabled={loading}
                      className="text-sm"
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
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="objectives" className="text-sm font-medium text-gray-700">
                    Objectives
                  </Label>
                  <Textarea
                    id="objectives"
                    value={formData.objectives}
                    onChange={(e) => handleInputChange('objectives', e.target.value)}
                    rows={2}
                    disabled={loading}
                    className="text-sm resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="criteria" className="text-sm font-medium text-gray-700">
                    Criteria/Standards
                  </Label>
                  <Textarea
                    id="criteria"
                    value={formData.criteria}
                    onChange={(e) => handleInputChange('criteria', e.target.value)}
                    rows={2}
                    disabled={loading}
                    className="text-sm resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="neutral" 
              onClick={handleClose}
              disabled={loading}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="save"
              disabled={loading || success}
              onClick={handleSubmit}
              className="text-sm flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  Create Audit
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateAuditDialog; 
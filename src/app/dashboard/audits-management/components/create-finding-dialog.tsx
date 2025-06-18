"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Plus, AlertTriangle, CheckCircle, Save } from "lucide-react";

interface CreateFindingDialogProps {
  auditId: string;
  onFindingCreated: () => void;
  children: React.ReactNode;
}

const findingSeverity = ['CRITICAL', 'MAJOR', 'MINOR', 'NON_CRITICAL', 'OBSERVATION'];
const findingStatus = ['OPEN', 'IN_PROGRESS', 'CLOSED', 'VERIFIED', 'DEFERRED'];

const CreateFindingDialog: React.FC<CreateFindingDialogProps> = ({ auditId, onFindingCreated, children }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'MINOR',
    status: 'OPEN',
    targetCloseDate: '',
    auditId: auditId
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      severity: 'MINOR',
      status: 'OPEN',
      targetCloseDate: '',
      auditId: auditId
    });
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/audits/findings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create finding');
      }

      setSuccess(true);
      onFindingCreated();
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] z-[1000]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add New Finding
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {success && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">Finding created successfully!</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} disabled={loading} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select value={formData.severity} onValueChange={value => handleInputChange('severity', value)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {findingSeverity.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
               <Select value={formData.status} onValueChange={value => handleInputChange('status', value)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {findingStatus.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetCloseDate">Target Close Date</Label>
            <Input id="targetCloseDate" type="date" value={formData.targetCloseDate} onChange={e => handleInputChange('targetCloseDate', e.target.value)} disabled={loading} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="neutral" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={loading || !formData.title || !formData.severity}>
            {loading ? 'Creating...' : <><Save className="w-4 h-4 mr-2" /> Create Finding</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFindingDialog; 
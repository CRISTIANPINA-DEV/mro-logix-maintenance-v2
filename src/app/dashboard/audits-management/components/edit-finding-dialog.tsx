"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Edit, AlertTriangle, CheckCircle, Save } from "lucide-react";

interface Finding {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  targetCloseDate?: string | null;
}

interface EditFindingDialogProps {
  finding: Finding;
  onFindingUpdated: () => void;
  children: React.ReactNode;
}

const findingSeverity = ['CRITICAL', 'MAJOR', 'MINOR', 'NON_CRITICAL', 'OBSERVATION'];
const findingStatus = ['OPEN', 'IN_PROGRESS', 'CLOSED', 'VERIFIED', 'DEFERRED'];

const EditFindingDialog: React.FC<EditFindingDialogProps> = ({ finding, onFindingUpdated, children }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ ...finding });

  useEffect(() => {
    if (open) {
      // Format date for input type='date'
      const targetDate = finding.targetCloseDate ? new Date(finding.targetCloseDate).toISOString().split('T')[0] : '';
      setFormData({ ...finding, targetCloseDate: targetDate });
      setError(null);
      setSuccess(false);
    }
  }, [open, finding]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/audits/findings/${finding.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update finding');
      }

      setSuccess(true);
      onFindingUpdated();
      setTimeout(() => {
        setOpen(false);
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" /> Edit Finding
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {success && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">Finding updated successfully!</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="title-edit">Title *</Label>
            <Input id="title-edit" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description-edit">Description</Label>
            <Textarea id="description-edit" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} disabled={loading} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity-edit">Severity *</Label>
              <Select value={formData.severity} onValueChange={value => handleInputChange('severity', value)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {findingSeverity.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-edit">Status *</Label>
               <Select value={formData.status} onValueChange={value => handleInputChange('status', value)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {findingStatus.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetCloseDate-edit">Target Close Date</Label>
            <Input id="targetCloseDate-edit" type="date" value={formData.targetCloseDate || ''} onChange={e => handleInputChange('targetCloseDate', e.target.value)} disabled={loading} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="neutral" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={loading || !formData.title || !formData.severity}>
            {loading ? 'Updating...' : <><Save className="w-4 h-4 mr-2" /> Update Finding</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditFindingDialog; 
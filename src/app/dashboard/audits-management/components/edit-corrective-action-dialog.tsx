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

interface CorrectiveAction {
    id: string;
    title: string;
    description: string;
    assignedTo: string;
    targetDate: string;
    priority: string;
    status: string;
}

interface EditCorrectiveActionDialogProps {
  action: CorrectiveAction;
  onActionUpdated: () => void;
  children: React.ReactNode;
}

const actionStatus = ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'OVERDUE'];
const actionPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const EditCorrectiveActionDialog: React.FC<EditCorrectiveActionDialogProps> = ({ action, onActionUpdated, children }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ ...action });

  useEffect(() => {
    if (open) {
      const targetDate = action.targetDate ? new Date(action.targetDate).toISOString().split('T')[0] : '';
      setFormData({ ...action, targetDate });
      setError(null);
      setSuccess(false);
    }
  }, [open, action]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/audits/corrective-actions/${action.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update corrective action');
      }

      setSuccess(true);
      onActionUpdated();
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
            <Edit className="w-5 h-5" /> Edit Corrective Action
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {success && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">Action updated successfully!</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="ca-edit-title">Title *</Label>
            <Input id="ca-edit-title" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ca-edit-description">Description</Label>
            <Textarea id="ca-edit-description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} disabled={loading} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="ca-edit-assignedTo">Assigned To *</Label>
                <Input id="ca-edit-assignedTo" value={formData.assignedTo} onChange={e => handleInputChange('assignedTo', e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="ca-edit-targetDate">Target Date *</Label>
                <Input id="ca-edit-targetDate" type="date" value={formData.targetDate} onChange={e => handleInputChange('targetDate', e.target.value)} disabled={loading} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ca-edit-priority">Priority</Label>
              <Select value={formData.priority} onValueChange={value => handleInputChange('priority', value)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {actionPriority.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-edit-status">Status</Label>
               <Select value={formData.status} onValueChange={value => handleInputChange('status', value)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {actionStatus.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="neutral" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={loading || !formData.title || !formData.assignedTo || !formData.targetDate}>
            {loading ? 'Updating...' : <><Save className="w-4 h-4 mr-2" /> Update Action</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCorrectiveActionDialog; 
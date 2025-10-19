'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  SaturnButton,
  SaturnInput,
  SaturnLabel,
  SaturnTextarea,
} from '@/components/saturn';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface MaintenanceWindowModalProps {
  open: boolean;
  onClose: () => void;
  orgId: string;
  window?: {
    id: string;
    name: string;
    description: string | null;
    startAt: Date;
    endAt: Date;
  } | null;
}

export function MaintenanceWindowModal({ 
  open, 
  onClose, 
  orgId,
  window: existingWindow 
}: MaintenanceWindowModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startAt: '',
    endAt: '',
  });

  // Populate form when editing
  useEffect(() => {
    if (existingWindow) {
      const startDate = new Date(existingWindow.startAt);
      const endDate = new Date(existingWindow.endAt);
      
      setFormData({
        name: existingWindow.name,
        description: existingWindow.description || '',
        startAt: format(startDate, "yyyy-MM-dd'T'HH:mm"),
        endAt: format(endDate, "yyyy-MM-dd'T'HH:mm"),
      });
    } else {
      // Reset form for new window
      setFormData({
        name: '',
        description: '',
        startAt: '',
        endAt: '',
      });
    }
  }, [existingWindow, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }

      if (!formData.startAt || !formData.endAt) {
        throw new Error('Start and end times are required');
      }

      const startDate = new Date(formData.startAt);
      const endDate = new Date(formData.endAt);

      if (startDate >= endDate) {
        throw new Error('End time must be after start time');
      }

      if (startDate < new Date() && !existingWindow) {
        throw new Error('Start time cannot be in the past');
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
      };

      const url = existingWindow 
        ? `/api/maintenance-windows/${existingWindow.id}`
        : '/api/maintenance-windows';
      
      const method = existingWindow ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || 'Failed to save maintenance window');
      }

      toast({
        title: 'Success',
        description: existingWindow 
          ? 'Maintenance window updated successfully'
          : 'Maintenance window created successfully',
      });

      router.refresh();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {existingWindow ? 'Edit Maintenance Window' : 'Create Maintenance Window'}
          </DialogTitle>
          <DialogDescription>
            Schedule a maintenance window to suppress alerts during planned downtime
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <SaturnLabel htmlFor="name" required>Name</SaturnLabel>
            <SaturnInput
              id="name"
              placeholder="e.g., Database Migration"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <SaturnLabel htmlFor="description">Description</SaturnLabel>
            <SaturnTextarea
              id="description"
              placeholder="Optional description of the maintenance work"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full"
            />
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <SaturnLabel htmlFor="startAt" required>
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Time
            </SaturnLabel>
            <input
              id="startAt"
              type="datetime-local"
              value={formData.startAt}
              onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
              required
              className="w-full px-3 py-2 border border-[rgba(55,50,47,0.16)] rounded-md font-sans text-[#37322F] focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent"
            />
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <SaturnLabel htmlFor="endAt" required>
              <Clock className="w-4 h-4 inline mr-1" />
              End Time
            </SaturnLabel>
            <input
              id="endAt"
              type="datetime-local"
              value={formData.endAt}
              onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
              required
              className="w-full px-3 py-2 border border-[rgba(55,50,47,0.16)] rounded-md font-sans text-[#37322F] focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent"
            />
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 font-sans">
              <strong>Note:</strong> Monitors will continue running during this window, but no incidents or alerts will be created.
            </p>
          </div>

          <DialogFooter>
            <SaturnButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </SaturnButton>
            <SaturnButton
              type="submit"
              disabled={loading}
              icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
            >
              {loading ? 'Saving...' : existingWindow ? 'Update Window' : 'Create Window'}
            </SaturnButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


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
import { SaturnButton, SaturnInput, SaturnLabel } from '@/components/saturn';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Tag as TagIcon } from 'lucide-react';

interface TagFormModalProps {
  open: boolean;
  onClose: () => void;
  orgId: string;
  tag?: {
    id: string;
    name: string;
  } | null;
  onSuccess?: () => void;
}

export function TagFormModal({ open, onClose, orgId, tag: existingTag, onSuccess }: TagFormModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
  });

  // Populate form when editing
  useEffect(() => {
    if (existingTag) {
      setFormData({
        name: existingTag.name,
      });
    } else {
      // Reset form for new tag
      setFormData({
        name: '',
      });
    }
  }, [existingTag, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Tag name is required');
      }

      if (formData.name.length > 50) {
        throw new Error('Tag name must be 50 characters or less');
      }

      const payload = {
        name: formData.name.trim(),
      };

      const url = existingTag ? `/api/tags/${existingTag.id}` : '/api/tags';
      const method = existingTag ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save tag');
      }

      toast({
        title: 'Success',
        description: existingTag ? 'Tag updated successfully' : 'Tag created successfully',
      });

      router.refresh();
      onSuccess?.();
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingTag ? 'Edit Tag' : 'Create Tag'}
          </DialogTitle>
          <DialogDescription>
            Tags help you organize and filter monitors
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <SaturnLabel htmlFor="name" required>
              <TagIcon className="w-4 h-4 inline mr-1" />
              Tag Name
            </SaturnLabel>
            <SaturnInput
              id="name"
              placeholder="e.g., Production, Critical, Backend"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              maxLength={50}
            />
            <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 bg-[rgba(55,50,47,0.03)] rounded-lg border border-[rgba(55,50,47,0.08)]">
            <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans mb-2">Preview:</p>
            <div className="flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-[#6B7280]" />
              <span className="font-medium text-[#37322F]">
                {formData.name || 'Your tag name'}
              </span>
            </div>
          </div>

          <DialogFooter>
            <SaturnButton
              type="button"
              variant="ghost"
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
              {loading ? 'Saving...' : existingTag ? 'Update Tag' : 'Create Tag'}
            </SaturnButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

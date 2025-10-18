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
  SaturnSelect,
} from '@/components/saturn';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface RuleModalProps {
  open: boolean;
  onClose: () => void;
  orgId: string;
  monitors: Array<{ id: string; name: string }>;
  channels: Array<{ id: string; label: string; type: string }>;
  rule?: {
    id: string;
    name: string;
    monitorIds: string[];
    channelIds: string[];
    suppressMinutes?: number | null;
  };
}

export function RuleModal({ open, onClose, orgId, monitors, channels, rule }: RuleModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    monitorIds: [] as string[],
    channelIds: [] as string[],
    suppressMinutes: '',
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        monitorIds: rule.monitorIds,
        channelIds: rule.channelIds,
        suppressMinutes: rule.suppressMinutes ? String(rule.suppressMinutes) : '',
      });
    } else {
      setFormData({
        name: '',
        monitorIds: [],
        channelIds: [],
        suppressMinutes: '',
      });
    }
  }, [rule, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        orgId,
        name: formData.name,
        monitorIds: formData.monitorIds,
        channelIds: formData.channelIds,
        suppressMinutes: formData.suppressMinutes ? parseInt(formData.suppressMinutes) : undefined,
      };

      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create rule');
      }

      toast({
        title: 'Success',
        description: rule ? 'Rule updated successfully' : 'Rule created successfully',
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

  const toggleMonitor = (monitorId: string) => {
    setFormData(prev => ({
      ...prev,
      monitorIds: prev.monitorIds.includes(monitorId)
        ? prev.monitorIds.filter(id => id !== monitorId)
        : [...prev.monitorIds, monitorId],
    }));
  };

  const toggleChannel = (channelId: string) => {
    setFormData(prev => ({
      ...prev,
      channelIds: prev.channelIds.includes(channelId)
        ? prev.channelIds.filter(id => id !== channelId)
        : [...prev.channelIds, channelId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Alert Rule' : 'Create Alert Rule'}</DialogTitle>
          <DialogDescription>
            Route incidents from monitors to specific channels
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <SaturnLabel htmlFor="name" required>Rule Name</SaturnLabel>
            <SaturnInput
              id="name"
              placeholder="e.g., Critical Alerts"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <SaturnLabel>Monitors (leave empty for all)</SaturnLabel>
            <div className="border border-[rgba(55,50,47,0.16)] rounded-lg p-4 max-h-48 overflow-y-auto">
              {monitors.length === 0 ? (
                <p className="text-sm text-[rgba(55,50,47,0.60)] text-center py-4">
                  No monitors available
                </p>
              ) : (
                <div className="space-y-2">
                  {monitors.map((monitor) => (
                    <label
                      key={monitor.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-[#F7F5F3] p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.monitorIds.includes(monitor.id)}
                        onChange={() => toggleMonitor(monitor.id)}
                        className="w-4 h-4 rounded border-[rgba(55,50,47,0.16)]"
                      />
                      <span className="text-sm text-[#37322F]">{monitor.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-[rgba(55,50,47,0.60)]">
              If no monitors are selected, this rule will apply to all monitors
            </p>
          </div>

          <div className="space-y-2">
            <SaturnLabel required>Alert Channels</SaturnLabel>
            <div className="border border-[rgba(55,50,47,0.16)] rounded-lg p-4 max-h-48 overflow-y-auto">
              {channels.length === 0 ? (
                <p className="text-sm text-[rgba(55,50,47,0.60)] text-center py-4">
                  No channels available. Add a channel first.
                </p>
              ) : (
                <div className="space-y-2">
                  {channels.map((channel) => (
                    <label
                      key={channel.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-[#F7F5F3] p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.channelIds.includes(channel.id)}
                        onChange={() => toggleChannel(channel.id)}
                        className="w-4 h-4 rounded border-[rgba(55,50,47,0.16)]"
                      />
                      <span className="text-sm text-[#37322F]">
                        {channel.label} <span className="text-[rgba(55,50,47,0.60)]">({channel.type})</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <SaturnLabel htmlFor="suppressMinutes">Suppress Alerts (minutes)</SaturnLabel>
            <SaturnInput
              id="suppressMinutes"
              type="number"
              min="0"
              placeholder="e.g., 60"
              value={formData.suppressMinutes}
              onChange={(e) => setFormData({ ...formData, suppressMinutes: e.target.value })}
              fullWidth
            />
            <p className="text-xs text-[rgba(55,50,47,0.60)]">
              Minimum time between alerts for the same monitor (optional)
            </p>
          </div>

          <DialogFooter>
            <SaturnButton type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </SaturnButton>
            <SaturnButton type="submit" disabled={loading || formData.channelIds.length === 0}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {rule ? 'Update Rule' : 'Create Rule'}
            </SaturnButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



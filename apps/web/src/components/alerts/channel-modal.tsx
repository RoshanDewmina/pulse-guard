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
  SaturnTabs,
} from '@/components/saturn';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Mail, Webhook as WebhookIcon } from 'lucide-react';

interface ChannelModalProps {
  open: boolean;
  onClose: () => void;
  orgId: string;
}

export function ChannelModal({ open, onClose, orgId }: ChannelModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [channelType, setChannelType] = useState<'EMAIL' | 'WEBHOOK'>('EMAIL');
  
  const [emailData, setEmailData] = useState({
    label: '',
    email: '',
    isDefault: false,
  });

  const [webhookData, setWebhookData] = useState({
    label: '',
    url: '',
    isDefault: false,
  });

  useEffect(() => {
    if (!open) {
      // Reset form when closed
      setEmailData({ label: '', email: '', isDefault: false });
      setWebhookData({ label: '', url: '', isDefault: false });
      setChannelType('EMAIL');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let payload;
      
      if (channelType === 'EMAIL') {
        payload = {
          orgId,
          type: 'EMAIL',
          label: emailData.label,
          configJson: { email: emailData.email },
          isDefault: emailData.isDefault,
        };
      } else {
        payload = {
          orgId,
          type: 'WEBHOOK',
          label: webhookData.label,
          configJson: { url: webhookData.url },
          isDefault: webhookData.isDefault,
        };
      }

      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create channel');
      }

      toast({
        title: 'Success',
        description: 'Alert channel created successfully',
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
          <DialogTitle>Add Alert Channel</DialogTitle>
          <DialogDescription>
            Configure where to send alerts when incidents occur
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Channel Type Selector */}
          <div className="flex gap-2 border-b border-[rgba(55,50,47,0.12)]">
            <button
              type="button"
              onClick={() => setChannelType('EMAIL')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                channelType === 'EMAIL'
                  ? 'border-[#37322F] text-[#37322F]'
                  : 'border-transparent text-[rgba(55,50,47,0.60)] hover:text-[#37322F]'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setChannelType('WEBHOOK')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                channelType === 'WEBHOOK'
                  ? 'border-[#37322F] text-[#37322F]'
                  : 'border-transparent text-[rgba(55,50,47,0.60)] hover:text-[#37322F]'
              }`}
            >
              <WebhookIcon className="w-4 h-4" />
              Webhook
            </button>
          </div>

          {channelType === 'EMAIL' ? (
            <>
              <div className="space-y-2">
                <SaturnLabel htmlFor="email-label" required>Label</SaturnLabel>
                <SaturnInput
                  id="email-label"
                  placeholder="e.g., Team Email"
                  value={emailData.label}
                  onChange={(e) => setEmailData({ ...emailData, label: e.target.value })}
                  required
                  fullWidth
                />
              </div>

              <div className="space-y-2">
                <SaturnLabel htmlFor="email-address" required>Email Address</SaturnLabel>
                <SaturnInput
                  id="email-address"
                  type="email"
                  placeholder="alerts@example.com"
                  value={emailData.email}
                  onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                  required
                  fullWidth
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="email-default"
                  checked={emailData.isDefault}
                  onChange={(e) => setEmailData({ ...emailData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-[rgba(55,50,47,0.16)]"
                />
                <SaturnLabel htmlFor="email-default" className="mb-0 cursor-pointer">
                  Set as default channel
                </SaturnLabel>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <SaturnLabel htmlFor="webhook-label" required>Label</SaturnLabel>
                <SaturnInput
                  id="webhook-label"
                  placeholder="e.g., PagerDuty"
                  value={webhookData.label}
                  onChange={(e) => setWebhookData({ ...webhookData, label: e.target.value })}
                  required
                  fullWidth
                />
              </div>

              <div className="space-y-2">
                <SaturnLabel htmlFor="webhook-url" required>Webhook URL</SaturnLabel>
                <SaturnInput
                  id="webhook-url"
                  type="url"
                  placeholder="https://example.com/webhook"
                  value={webhookData.url}
                  onChange={(e) => setWebhookData({ ...webhookData, url: e.target.value })}
                  required
                  fullWidth
                />
                <p className="text-xs text-[rgba(55,50,47,0.60)]">
                  POST requests will be sent to this URL when incidents occur
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="webhook-default"
                  checked={webhookData.isDefault}
                  onChange={(e) => setWebhookData({ ...webhookData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-[rgba(55,50,47,0.16)]"
                />
                <SaturnLabel htmlFor="webhook-default" className="mb-0 cursor-pointer">
                  Set as default channel
                </SaturnLabel>
              </div>
            </>
          )}

          <DialogFooter>
            <SaturnButton type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </SaturnButton>
            <SaturnButton type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Channel
            </SaturnButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



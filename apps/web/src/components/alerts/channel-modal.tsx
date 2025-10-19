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
import { Loader2, Mail, Webhook as WebhookIcon, Bell, MessageSquare, Smartphone } from 'lucide-react';

interface ChannelModalProps {
  open: boolean;
  onClose: () => void;
  orgId: string;
}

export function ChannelModal({ open, onClose, orgId }: ChannelModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [channelType, setChannelType] = useState<'EMAIL' | 'WEBHOOK' | 'PAGERDUTY' | 'TEAMS' | 'SMS'>('EMAIL');
  
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

  const [pagerdutyData, setPagerdutyData] = useState({
    label: '',
    routingKey: '',
    isDefault: false,
  });

  const [teamsData, setTeamsData] = useState({
    label: '',
    webhookUrl: '',
    isDefault: false,
  });

  const [smsData, setSmsData] = useState({
    label: '',
    recipients: [''],
    isDefault: false,
  });

  useEffect(() => {
    if (!open) {
      // Reset form when closed
      setEmailData({ label: '', email: '', isDefault: false });
      setWebhookData({ label: '', url: '', isDefault: false });
      setPagerdutyData({ label: '', routingKey: '', isDefault: false });
      setTeamsData({ label: '', webhookUrl: '', isDefault: false });
      setSmsData({ label: '', recipients: [''], isDefault: false });
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
      } else if (channelType === 'WEBHOOK') {
        payload = {
          orgId,
          type: 'WEBHOOK',
          label: webhookData.label,
          configJson: { url: webhookData.url },
          isDefault: webhookData.isDefault,
        };
      } else if (channelType === 'PAGERDUTY') {
        payload = {
          orgId,
          type: 'PAGERDUTY',
          label: pagerdutyData.label,
          configJson: { routingKey: pagerdutyData.routingKey },
          isDefault: pagerdutyData.isDefault,
        };
      } else if (channelType === 'TEAMS') {
        payload = {
          orgId,
          type: 'TEAMS',
          label: teamsData.label,
          configJson: { webhookUrl: teamsData.webhookUrl },
          isDefault: teamsData.isDefault,
        };
      } else if (channelType === 'SMS') {
        payload = {
          orgId,
          type: 'SMS',
          label: smsData.label,
          configJson: { recipients: smsData.recipients.filter(r => r.trim() !== '') },
          isDefault: smsData.isDefault,
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
          <div className="flex gap-2 border-b border-[rgba(55,50,47,0.12)] overflow-x-auto">
            <button
              type="button"
              onClick={() => setChannelType('EMAIL')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
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
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                channelType === 'WEBHOOK'
                  ? 'border-[#37322F] text-[#37322F]'
                  : 'border-transparent text-[rgba(55,50,47,0.60)] hover:text-[#37322F]'
              }`}
            >
              <WebhookIcon className="w-4 h-4" />
              Webhook
            </button>
            <button
              type="button"
              onClick={() => setChannelType('PAGERDUTY')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                channelType === 'PAGERDUTY'
                  ? 'border-[#37322F] text-[#37322F]'
                  : 'border-transparent text-[rgba(55,50,47,0.60)] hover:text-[#37322F]'
              }`}
            >
              <Bell className="w-4 h-4" />
              PagerDuty
            </button>
            <button
              type="button"
              onClick={() => setChannelType('TEAMS')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                channelType === 'TEAMS'
                  ? 'border-[#37322F] text-[#37322F]'
                  : 'border-transparent text-[rgba(55,50,47,0.60)] hover:text-[#37322F]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Teams
            </button>
            <button
              type="button"
              onClick={() => setChannelType('SMS')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                channelType === 'SMS'
                  ? 'border-[#37322F] text-[#37322F]'
                  : 'border-transparent text-[rgba(55,50,47,0.60)] hover:text-[#37322F]'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              SMS
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
          ) : channelType === 'WEBHOOK' ? (
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
          ) : channelType === 'PAGERDUTY' ? (
            <>
              <div className="space-y-2">
                <SaturnLabel htmlFor="pagerduty-label" required>Label</SaturnLabel>
                <SaturnInput
                  id="pagerduty-label"
                  placeholder="e.g., On-Call Team"
                  value={pagerdutyData.label}
                  onChange={(e) => setPagerdutyData({ ...pagerdutyData, label: e.target.value })}
                  required
                  fullWidth
                />
              </div>

              <div className="space-y-2">
                <SaturnLabel htmlFor="pagerduty-routing-key" required>Routing Key</SaturnLabel>
                <SaturnInput
                  id="pagerduty-routing-key"
                  placeholder="Your PagerDuty Integration Key"
                  value={pagerdutyData.routingKey}
                  onChange={(e) => setPagerdutyData({ ...pagerdutyData, routingKey: e.target.value })}
                  required
                  fullWidth
                />
                <p className="text-xs text-[rgba(55,50,47,0.60)]">
                  Your PagerDuty Integration Key (Events API v2)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pagerduty-default"
                  checked={pagerdutyData.isDefault}
                  onChange={(e) => setPagerdutyData({ ...pagerdutyData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-[rgba(55,50,47,0.16)]"
                />
                <SaturnLabel htmlFor="pagerduty-default" className="mb-0 cursor-pointer">
                  Set as default channel
                </SaturnLabel>
              </div>
            </>
          ) : channelType === 'TEAMS' ? (
            <>
              <div className="space-y-2">
                <SaturnLabel htmlFor="teams-label" required>Label</SaturnLabel>
                <SaturnInput
                  id="teams-label"
                  placeholder="e.g., Alerts Channel"
                  value={teamsData.label}
                  onChange={(e) => setTeamsData({ ...teamsData, label: e.target.value })}
                  required
                  fullWidth
                />
              </div>

              <div className="space-y-2">
                <SaturnLabel htmlFor="teams-webhook-url" required>Webhook URL</SaturnLabel>
                <SaturnInput
                  id="teams-webhook-url"
                  type="url"
                  placeholder="https://outlook.office.com/webhook/..."
                  value={teamsData.webhookUrl}
                  onChange={(e) => setTeamsData({ ...teamsData, webhookUrl: e.target.value })}
                  required
                  fullWidth
                />
                <p className="text-xs text-[rgba(55,50,47,0.60)]">
                  Your Teams Incoming Webhook URL
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="teams-default"
                  checked={teamsData.isDefault}
                  onChange={(e) => setTeamsData({ ...teamsData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-[rgba(55,50,47,0.16)]"
                />
                <SaturnLabel htmlFor="teams-default" className="mb-0 cursor-pointer">
                  Set as default channel
                </SaturnLabel>
              </div>
            </>
          ) : channelType === 'SMS' ? (
            <>
              <div className="space-y-2">
                <SaturnLabel htmlFor="sms-label" required>Label</SaturnLabel>
                <SaturnInput
                  id="sms-label"
                  placeholder="e.g., Emergency Contacts"
                  value={smsData.label}
                  onChange={(e) => setSmsData({ ...smsData, label: e.target.value })}
                  required
                  fullWidth
                />
              </div>

              <div className="space-y-2">
                <SaturnLabel htmlFor="sms-recipients" required>Phone Numbers</SaturnLabel>
                <div className="space-y-2">
                  {smsData.recipients.map((recipient, index) => (
                    <div key={index} className="flex gap-2">
                      <SaturnInput
                        placeholder="+1234567890"
                        value={recipient}
                        onChange={(e) => {
                          const newRecipients = [...smsData.recipients];
                          newRecipients[index] = e.target.value;
                          setSmsData({ ...smsData, recipients: newRecipients });
                        }}
                        fullWidth
                      />
                      {smsData.recipients.length > 1 && (
                        <SaturnButton
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            const newRecipients = smsData.recipients.filter((_, i) => i !== index);
                            setSmsData({ ...smsData, recipients: newRecipients });
                          }}
                          className="px-3"
                        >
                          Remove
                        </SaturnButton>
                      )}
                    </div>
                  ))}
                  <SaturnButton
                    type="button"
                    variant="ghost"
                    onClick={() => setSmsData({ ...smsData, recipients: [...smsData.recipients, ''] })}
                    className="text-sm"
                  >
                    + Add Phone Number
                  </SaturnButton>
                </div>
                <p className="text-xs text-[rgba(55,50,47,0.60)]">
                  Enter phone numbers in E.164 format (e.g., +1234567890)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sms-default"
                  checked={smsData.isDefault}
                  onChange={(e) => setSmsData({ ...smsData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-[rgba(55,50,47,0.16)]"
                />
                <SaturnLabel htmlFor="sms-default" className="mb-0 cursor-pointer">
                  Set as default channel
                </SaturnLabel>
              </div>
            </>
          ) : null}

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



'use client';

import { useState } from 'react';
import { X, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DiscordSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  onSuccess?: () => void;
}

export function DiscordSetupModal({ isOpen, onClose, orgId, onSuccess }: DiscordSetupModalProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [label, setLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/discord/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId,
          webhookUrl,
          label: label || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save Discord webhook');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        // Reset form
        setWebhookUrl('');
        setLabel('');
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save Discord webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setWebhookUrl('');
      setLabel('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(55,50,47,0.16)]">
          <h2 className="text-xl font-semibold text-[#37322F] font-sans">
            Connect Discord
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-[rgba(55,50,47,0.60)] hover:text-[#37322F] transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-[#37322F] font-sans mb-2 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              How to get your Discord Webhook URL
            </h3>
            <ol className="text-sm text-[rgba(55,50,47,0.80)] space-y-2 ml-6 list-decimal font-sans">
              <li>Open Discord and go to your server</li>
              <li>Click on Server Settings → Integrations</li>
              <li>Click "Create Webhook" or edit an existing webhook</li>
              <li>Choose the channel where you want to receive alerts</li>
              <li>Click "Copy Webhook URL"</li>
              <li>Paste the URL below</li>
            </ol>
            <a
              href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 font-sans mt-2 inline-flex items-center gap-1"
            >
              Learn more about Discord webhooks
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 font-sans">Error</p>
                <p className="text-sm text-red-700 font-sans">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 font-sans">Success!</p>
                <p className="text-sm text-green-700 font-sans">
                  Discord webhook has been configured. You'll now receive alerts in Discord.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="webhookUrl" className="block text-sm font-medium text-[#37322F] font-sans mb-2">
                Discord Webhook URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="webhookUrl"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                required
                disabled={isLoading || success}
                className="w-full px-3 py-2 border border-[rgba(55,50,47,0.20)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-1">
                Must be a valid Discord webhook URL starting with https://discord.com/api/webhooks/
              </p>
            </div>

            <div>
              <label htmlFor="label" className="block text-sm font-medium text-[#37322F] font-sans mb-2">
                Label (optional)
              </label>
              <input
                type="text"
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., #alerts channel"
                maxLength={100}
                disabled={isLoading || success}
                className="w-full px-3 py-2 border border-[rgba(55,50,47,0.20)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent font-sans text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-1">
                Optional friendly name to identify this Discord channel
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-white text-[#37322F] border border-[rgba(55,50,47,0.20)] rounded-lg hover:bg-[#F7F5F3] transition-colors font-sans text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || success || !webhookUrl}
                className="flex-1 px-4 py-2 bg-[#37322F] text-white rounded-lg hover:bg-[#2F2A27] transition-colors font-sans text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : success ? 'Saved!' : 'Save Webhook'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}



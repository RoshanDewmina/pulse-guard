'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SaturnButton } from '@/components/saturn/SaturnButton';
import { Copy, Check, Download, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface WordPressSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey?: string;
}

export function WordPressSetupModal({ open, onOpenChange, apiKey }: WordPressSetupModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyApiKey = async () => {
    if (!apiKey) {
      toast({
        title: 'No API Key',
        description: 'Generate an API key in Settings → API Keys first',
        variant: 'destructive',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'API key copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy manually',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    // In a real implementation, this would download the plugin zip
    toast({
      title: 'Coming Soon',
      description: 'Direct download will be available soon. For now, clone from GitHub.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans text-[#37322F]">Setup WordPress Integration</DialogTitle>
          <DialogDescription className="font-sans">
            Monitor wp-cron across all your WordPress sites from one dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Download Plugin */}
          <div>
            <h3 className="font-semibold text-[#37322F] font-sans mb-3">Step 1: Get the Plugin</h3>
            <div className="space-y-3">
              <SaturnButton
                variant="secondary"
                fullWidth
                onClick={handleDownload}
                icon={<Download className="w-4 h-4" />}
              >
                Download Saturn Watchdog Plugin
              </SaturnButton>
              <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
                Or clone from GitHub:{' '}
                <code className="bg-[rgba(55,50,47,0.08)] px-1 py-0.5 rounded text-xs">
                  integrations/wordpress/tokiflow-watchdog/
                </code>
              </p>
            </div>
          </div>

          {/* Step 2: Install */}
          <div>
            <h3 className="font-semibold text-[#37322F] font-sans mb-3">Step 2: Install in WordPress</h3>
            <ol className="space-y-3 text-sm text-[rgba(55,50,47,0.80)] font-sans list-decimal list-inside">
              <li>
                Upload the plugin folder to{' '}
                <code className="bg-[rgba(55,50,47,0.08)] px-1 py-0.5 rounded text-xs">
                  wp-content/plugins/
                </code>
              </li>
              <li>Activate the plugin in the WordPress admin panel</li>
              <li>
                Navigate to <strong>Settings → Saturn</strong>
              </li>
            </ol>
          </div>

          {/* Step 3: Configure */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#37322F] font-sans">Step 3: Add Your API Key</h3>
              {apiKey && (
                <SaturnButton
                  size="sm"
                  variant="secondary"
                  onClick={copyApiKey}
                  icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                >
                  {copied ? 'Copied' : 'Copy Key'}
                </SaturnButton>
              )}
            </div>
            
            {apiKey ? (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                {apiKey}
              </div>
            ) : (
              <div className="bg-[rgba(55,50,47,0.08)] p-4 rounded-lg">
                <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                  💡 Generate an API key in{' '}
                  <a href="/app/settings/api-keys" className="text-blue-600 hover:underline">
                    Settings → API Keys
                  </a>{' '}
                  to see it here
                </p>
              </div>
            )}
            
            <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans mt-3">
              Paste this key into the Saturn settings page in your WordPress admin.
            </p>
          </div>

          {/* Step 4: Test */}
          <div>
            <h3 className="font-semibold text-[#37322F] font-sans mb-3">Step 4: Test Connection</h3>
            <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
              Click the "Test Connection" button in the WordPress plugin settings. You should see a success message, and your wp-cron jobs will start appearing in the Saturn dashboard.
            </p>
          </div>

          {/* Bulk Management */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-[#37322F] font-sans mb-2">💡 Bulk Agency Management</h4>
            <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
              Managing multiple WordPress sites? Use the same API key across all sites to monitor them from one Saturn dashboard.
            </p>
          </div>

          {/* Documentation Link */}
          <div className="pt-4 border-t border-[rgba(55,50,47,0.12)]">
            <a
              href="https://docs.saturnmonitor.com/get-started/quickstart-wordpress"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm font-sans inline-flex items-center gap-1"
            >
              View full documentation <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SaturnButton } from '@/components/saturn/SaturnButton';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface TerraformSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey?: string;
}

export function TerraformSetupModal({ open, onOpenChange, apiKey }: TerraformSetupModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const providerConfig = `terraform {
  required_providers {
    saturn = {
      source  = "saturn/saturn"
      version = "~> 1.0"
    }
  }
}

provider "saturn" {
  api_key = "${apiKey || 'YOUR_API_KEY'}"
}`;

  const monitorExample = `resource "saturn_monitor" "daily_backup" {
  name          = "Daily Database Backup"
  schedule_type = "CRON"
  cron_expr     = "0 2 * * *"
  timezone      = "UTC"
  grace_sec     = 300
  
  tags = ["production", "backup"]
}`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy manually',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans text-[#37322F]">Setup Terraform Provider</DialogTitle>
          <DialogDescription className="font-sans">
            Manage Saturn monitors and integrations as infrastructure-as-code
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Install Provider */}
          <div>
            <h3 className="font-semibold text-[#37322F] font-sans mb-3">Step 1: Configure Provider</h3>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                Add to your <code className="bg-[rgba(55,50,47,0.08)] px-1 py-0.5 rounded text-xs">main.tf</code>
              </p>
              <SaturnButton
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard(providerConfig, 'Provider config')}
              >
                {copied === 'Provider config' ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </SaturnButton>
            </div>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
              <pre className="whitespace-pre-wrap">{providerConfig}</pre>
            </div>
            {!apiKey && (
              <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-2">
                💡 Generate an API key in Settings → API Keys to see your personalized config
              </p>
            )}
          </div>

          {/* Step 2: Initialize */}
          <div>
            <h3 className="font-semibold text-[#37322F] font-sans mb-3">Step 2: Initialize Terraform</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono">
              terraform init
            </div>
          </div>

          {/* Step 3: Create Resources */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-[#37322F] font-sans">Step 3: Create Resources</h3>
              <SaturnButton
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard(monitorExample, 'Monitor example')}
              >
                {copied === 'Monitor example' ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </SaturnButton>
            </div>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
              <pre className="whitespace-pre-wrap">{monitorExample}</pre>
            </div>
          </div>

          {/* Step 4: Apply */}
          <div>
            <h3 className="font-semibold text-[#37322F] font-sans mb-3">Step 4: Apply Configuration</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono">
              <div>terraform plan</div>
              <div className="mt-2">terraform apply</div>
            </div>
          </div>

          {/* Available Resources */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-[#37322F] font-sans mb-2">📦 Available Resources</h4>
            <ul className="text-sm text-[rgba(55,50,47,0.80)] font-sans space-y-1">
              <li>• <code className="text-xs">saturn_monitor</code> - Cron job monitors</li>
              <li>• <code className="text-xs">saturn_integration</code> - Alert channels</li>
              <li>• <code className="text-xs">saturn_alert_rule</code> - Notification rules</li>
              <li>• <code className="text-xs">saturn_status_page</code> - Public status pages</li>
            </ul>
          </div>

          {/* Note about local provider */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-[#37322F] font-sans mb-2">⚠️ Local Development</h4>
            <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
              The provider is currently available as a local build. Clone from <code className="text-xs bg-white px-1 py-0.5 rounded">integrations/terraform-provider/</code> and build locally. Terraform Registry publication coming soon!
            </p>
          </div>

          {/* Documentation Link */}
          <div className="pt-4 border-t border-[rgba(55,50,47,0.12)]">
            <a
              href="https://github.com/saturn/terraform-provider-saturn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm font-sans inline-flex items-center gap-1"
            >
              View GitHub repository <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


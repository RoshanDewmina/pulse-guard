'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SaturnButton } from '@/components/saturn/SaturnButton';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface KubernetesSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey?: string;
}

export function KubernetesSetupModal({ open, onOpenChange, apiKey }: KubernetesSetupModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const helmCommand = `helm repo add saturn https://charts.saturnmonitor.com
helm repo update
helm install saturn-agent saturn/saturn-agent \\
  --set saturn.apiKey="${apiKey || 'YOUR_API_KEY'}" \\
  --namespace saturn-system \\
  --create-namespace`;

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
          <DialogTitle className="font-sans text-[#37322F]">Setup Kubernetes Integration</DialogTitle>
          <DialogDescription className="font-sans">
            Deploy Saturn monitoring to your Kubernetes cluster in under 60 seconds
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Prerequisites */}
          <div>
            <h3 className="font-semibold text-[#37322F] font-sans mb-3">Prerequisites</h3>
            <ul className="space-y-2 text-sm text-[rgba(55,50,47,0.80)] font-sans">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>kubectl configured with cluster access</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Helm 3.x installed</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Permissions to create CronJobs and RBAC resources</span>
              </li>
            </ul>
          </div>

          {/* Step 1: Install Helm Chart */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#37322F] font-sans">Step 1: Install via Helm</h3>
              <SaturnButton
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard(helmCommand, 'Helm command')}
                icon={copied === 'Helm command' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copied === 'Helm command' ? 'Copied' : 'Copy'}
              </SaturnButton>
            </div>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">{helmCommand}</pre>
            </div>
            {!apiKey && (
              <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-2">
                💡 Generate an API key in Settings → API Keys to see your personalized command
              </p>
            )}
          </div>

          {/* Step 2: Annotate CronJobs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#37322F] font-sans">Step 2: Annotate Your CronJobs</h3>
              <SaturnButton
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard('saturn.co/enabled: "true"', 'Annotation')}
                icon={copied === 'Annotation' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copied === 'Annotation' ? 'Copied' : 'Copy'}
              </SaturnButton>
            </div>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
              <pre>{`apiVersion: batch/v1
kind: CronJob
metadata:
  name: my-cronjob
  annotations:
    saturn.co/enabled: "true"
    saturn.co/grace-sec: "300"
spec:
  schedule: "0 2 * * *"
  # ... rest of your config`}</pre>
            </div>
          </div>

          {/* Step 3: Verify */}
          <div>
            <h3 className="font-semibold text-[#37322F] font-sans mb-3">Step 3: Verify Installation</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono">
              kubectl get pods -n saturn-system
            </div>
            <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans mt-3">
              Your monitored CronJobs will appear in the dashboard automatically!
            </p>
          </div>

          {/* Documentation Link */}
          <div className="pt-4 border-t border-[rgba(55,50,47,0.12)]">
            <a
              href="https://docs.saturnmonitor.com/get-started/quickstart-kubernetes"
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


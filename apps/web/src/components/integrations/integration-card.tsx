'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ExternalLink, 
  Check, 
  Clock, 
  ArrowRight, 
  Settings, 
  CheckCircle2,
  Circle
} from 'lucide-react';
import { SaturnCard, SaturnCardHeader, SaturnCardTitle, SaturnCardDescription, SaturnCardContent } from '@/components/saturn/SaturnCard';
import { SaturnButton } from '@/components/saturn/SaturnButton';
import { KubernetesSetupModal } from './kubernetes-setup-modal';
import { WordPressSetupModal } from './wordpress-setup-modal';
import { TerraformSetupModal } from './terraform-setup-modal';
import { DiscordSetupModal } from './discord-setup-modal';
import { SlackSetupModal } from './slack-setup-modal';

interface IntegrationCardProps {
  integration: {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    status: 'available' | 'coming-soon';
    category: string;
    docsUrl?: string;
    setupUrl?: string;
    features: string[];
    installTime?: string;
  };
  isConnected?: boolean;
  monitorCount?: number;
  apiKey?: string;
  orgId?: string;
  onIntegrationChange?: () => void;
}

export function IntegrationCard({ integration, isConnected, monitorCount, apiKey, orgId, onIntegrationChange }: IntegrationCardProps) {
  const [showSetupModal, setShowSetupModal] = useState(false);

  const hasSetupModal = ['kubernetes', 'wordpress', 'terraform', 'discord', 'slack'].includes(integration.id);

  return (
    <>
      <SaturnCard className={`hover:shadow-lg transition-all ${integration.status === 'coming-soon' ? 'opacity-75' : ''}`}>
        <SaturnCardHeader>
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-[#37322F] rounded-lg flex items-center justify-center text-white">
              {integration.icon}
            </div>
            <div className="flex flex-col items-end gap-2">
              {integration.installTime && integration.status === 'available' && (
                <div className="flex items-center gap-1 text-xs text-[rgba(55,50,47,0.60)] font-sans">
                  <Clock className="w-3 h-3" />
                  {integration.installTime}
                </div>
              )}
              {integration.status === 'coming-soon' && (
                <div className="px-2 py-1 bg-[rgba(55,50,47,0.08)] rounded text-xs font-medium text-[rgba(55,50,47,0.60)] font-sans">
                  Coming Soon
                </div>
              )}
              {integration.status === 'available' && isConnected !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-sans ${isConnected ? 'text-green-600' : 'text-[rgba(55,50,47,0.40)]'}`}>
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Connected
                    </>
                  ) : (
                    <>
                      <Circle className="w-3 h-3" />
                      Not Connected
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <SaturnCardTitle className="mt-4">{integration.name}</SaturnCardTitle>
          <SaturnCardDescription>{integration.description}</SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="space-y-4">
            {/* Features */}
            <ul className="space-y-2">
              {integration.features.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-[rgba(55,50,47,0.80)] font-sans">
                  <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${integration.status === 'coming-soon' ? 'text-[rgba(55,50,47,0.30)]' : 'text-green-600'}`} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Monitor Count */}
            {monitorCount !== undefined && monitorCount > 0 && (
              <div className="pt-2 border-t border-[rgba(55,50,47,0.12)]">
                <div className="text-sm text-[rgba(55,50,47,0.70)] font-sans">
                  <span className="font-semibold text-[#37322F]">{monitorCount}</span> monitor{monitorCount !== 1 ? 's' : ''} using this integration
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {integration.status === 'available' && (
              <div className="flex gap-2 pt-2">
                {hasSetupModal && (
                  <SaturnButton 
                    size="sm" 
                    fullWidth
                    onClick={() => setShowSetupModal(true)}
                    icon={<Settings className="w-4 h-4" />}
                  >
                    Quick Setup
                  </SaturnButton>
                )}
                {integration.setupUrl && !hasSetupModal && (
                  <Link href={integration.setupUrl} className="flex-1">
                    <SaturnButton size="sm" fullWidth icon={<ArrowRight className="w-4 h-4" />}>
                      Setup
                    </SaturnButton>
                  </Link>
                )}
                {integration.docsUrl && (
                  <Link href={integration.docsUrl} target="_blank" rel="noopener noreferrer" className={hasSetupModal || integration.setupUrl ? 'flex-1' : 'w-full'}>
                    <SaturnButton variant="secondary" size="sm" fullWidth icon={<ExternalLink className="w-4 h-4" />}>
                      Docs
                    </SaturnButton>
                  </Link>
                )}
              </div>
            )}
          </div>
        </SaturnCardContent>
      </SaturnCard>

      {/* Setup Modals */}
      {integration.id === 'kubernetes' && (
        <KubernetesSetupModal 
          open={showSetupModal} 
          onOpenChange={setShowSetupModal}
          apiKey={apiKey}
        />
      )}
      {integration.id === 'wordpress' && (
        <WordPressSetupModal 
          open={showSetupModal} 
          onOpenChange={setShowSetupModal}
          apiKey={apiKey}
        />
      )}
      {integration.id === 'terraform' && (
        <TerraformSetupModal 
          open={showSetupModal} 
          onOpenChange={setShowSetupModal}
          apiKey={apiKey}
        />
      )}
      {integration.id === 'discord' && orgId && (
        <DiscordSetupModal 
          isOpen={showSetupModal} 
          onClose={() => setShowSetupModal(false)}
          orgId={orgId}
          onSuccess={() => {
            onIntegrationChange?.();
          }}
        />
      )}
      {integration.id === 'slack' && orgId && (
        <SlackSetupModal 
          isOpen={showSetupModal} 
          onClose={() => setShowSetupModal(false)}
          orgId={orgId}
          isConnected={isConnected}
        />
      )}
    </>
  );
}



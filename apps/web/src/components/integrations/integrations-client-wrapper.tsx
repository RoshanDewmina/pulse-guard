'use client';

import { useRouter } from 'next/navigation';
import { IntegrationCard } from './integration-card';

interface IntegrationsClientWrapperProps {
  integrations: any[];
  integrationStatus: Record<string, { isConnected: boolean; monitorCount: number }>;
  firstApiKey?: string;
  orgId: string;
}

export function IntegrationsClientWrapper({
  integrations,
  integrationStatus,
  firstApiKey,
  orgId,
}: IntegrationsClientWrapperProps) {
  const router = useRouter();

  const handleIntegrationChange = () => {
    router.refresh();
  };

  return (
    <>
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          isConnected={integrationStatus[integration.id]?.isConnected}
          monitorCount={integrationStatus[integration.id]?.monitorCount}
          apiKey={firstApiKey}
          orgId={orgId}
          onIntegrationChange={handleIntegrationChange}
        />
      ))}
    </>
  );
}



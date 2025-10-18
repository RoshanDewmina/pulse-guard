import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@tokiflow/db';
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata({
  title: "Integrations",
  description: "Connect Saturn with your favorite tools and services.",
  path: '/app/integrations',
  noIndex: true,
})
import { 
  Box, 
  Code, 
  Plug, 
  Globe,
  Terminal,
  FileCode,
  Slack,
  Mail,
  Webhook,
  MessageSquare
} from 'lucide-react';
import { SaturnCard, SaturnCardContent } from '@/components/saturn/SaturnCard';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import { IntegrationCard } from '@/components/integrations/integration-card';
import { IntegrationsClientWrapper } from '@/components/integrations/integrations-client-wrapper';


interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'available' | 'coming-soon';
  category: 'platform' | 'notification' | 'deployment';
  docsUrl?: string;
  setupUrl?: string;
  features: string[];
  installTime?: string;
}

const integrations: Integration[] = [
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: 'Monitor CronJobs with zero code changes using our Helm chart and Go sidecar container',
    icon: <Box className="w-6 h-6" />,
    status: 'available',
    category: 'platform',
    docsUrl: 'https://docs.saturnmonitor.com/get-started/quickstart-kubernetes',
    features: [
      'Automatic CronJob monitoring',
      'Helm chart deployment',
      'Go sidecar container',
      'Exit code tracking',
      'Log capture support',
      'RBAC templates included'
    ],
    installTime: '60 seconds'
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Native plugin for monitoring wp-cron across hundreds of sites from one dashboard',
    icon: <Globe className="w-6 h-6" />,
    status: 'available',
    category: 'platform',
    docsUrl: 'https://docs.saturnmonitor.com/get-started/quickstart-wordpress',
    features: [
      'Monitor wp-cron jobs',
      'Bulk site management',
      'Admin dashboard',
      'Connection testing',
      'Health monitoring',
      'Scheduled events viewer'
    ],
    installTime: '5 minutes'
  },
  {
    id: 'terraform',
    name: 'Terraform Provider',
    description: 'Manage monitors, alerts, and status pages as infrastructure-as-code',
    icon: <FileCode className="w-6 h-6" />,
    status: 'available',
    category: 'deployment',
    docsUrl: 'https://github.com/saturn/terraform-provider-saturn',
    features: [
      'Monitor resources',
      'Alert rule configuration',
      'Status page management',
      'Import existing resources',
      'Full CRUD support',
      'State management'
    ],
    installTime: '2 minutes'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send incident alerts and updates directly to your Slack channels',
    icon: <Slack className="w-6 h-6" />,
    status: 'available',
    category: 'notification',
    features: [
      'Real-time alerts',
      'Channel routing',
      'Rich notifications',
      'Incident context',
      'Slash commands',
      'Thread updates'
    ],
    installTime: '30 seconds'
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Receive incident notifications via email with full context',
    icon: <Mail className="w-6 h-6" />,
    status: 'available',
    category: 'notification',
    setupUrl: '/app/settings/alerts',
    features: [
      'Incident alerts',
      'Recovery notifications',
      'Email digests',
      'Custom templates',
      'Multiple recipients',
      'HTML formatting'
    ],
    installTime: '10 seconds'
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Get instant alerts in your Discord server when incidents occur',
    icon: <MessageSquare className="w-6 h-6" />,
    status: 'available',
    category: 'notification',
    features: [
      'Webhook integration',
      'Rich embeds',
      'Instant notifications',
      'Channel targeting',
      'Role mentions',
      'Custom formatting'
    ],
    installTime: '1 minute'
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Send HTTP requests to any endpoint when incidents occur',
    icon: <Webhook className="w-6 h-6" />,
    status: 'available',
    category: 'notification',
    setupUrl: '/app/settings/alerts',
    features: [
      'Custom payloads',
      'Flexible routing',
      'Retry logic',
      'Authentication support',
      'Custom headers',
      'Event filtering'
    ],
    installTime: '1 minute'
  },
  {
    id: 'github-actions',
    name: 'GitHub Actions',
    description: 'Monitor GitHub Actions workflows and get alerts when they fail',
    icon: <Code className="w-6 h-6" />,
    status: 'coming-soon',
    category: 'platform',
    features: [
      'Workflow monitoring',
      'Job status tracking',
      'Run duration analysis',
      'Failure detection',
      'Auto-registration',
      'Branch filtering'
    ],
  },
  {
    id: 'gitlab-ci',
    name: 'GitLab CI',
    description: 'Monitor GitLab CI/CD pipelines and detect failures early',
    icon: <Terminal className="w-6 h-6" />,
    status: 'coming-soon',
    category: 'platform',
    features: [
      'Pipeline monitoring',
      'Stage tracking',
      'Job analytics',
      'Failure alerts',
      'Auto-discovery',
      'Project grouping'
    ],
  },
];

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const org = await getUserPrimaryOrg(session.user.id);
  
  if (!org) {
    redirect('/onboarding');
  }
  // Fetch integration data from database
  const [channels, apiKeys, monitors] = await Promise.all([
    // Get all alert channels for this org
    prisma.alertChannel.findMany({
      where: { orgId: org.id },
      select: { type: true, id: true }
    }),
    // Get API keys (to show in setup modals)
    prisma.apiKey.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: { tokenHash: true }
    }),
    // Get monitors to calculate usage stats
    prisma.monitor.findMany({
      where: { orgId: org.id },
      select: { 
        id: true,
        name: true,
      }
    })
  ]);

  // Calculate connection status for each integration
  const integrationStatus: Record<string, { isConnected: boolean; monitorCount: number }> = {
    slack: {
      isConnected: channels.some((c: { type: string }) => c.type === 'SLACK'),
      monitorCount: 0
    },
    email: {
      isConnected: channels.some((c: { type: string }) => c.type === 'EMAIL'),
      monitorCount: 0
    },
    discord: {
      isConnected: channels.some((c: { type: string }) => c.type === 'DISCORD'),
      monitorCount: 0
    },
    webhooks: {
      isConnected: channels.some((c: { type: string }) => c.type === 'WEBHOOK'),
      monitorCount: 0
    },
    kubernetes: {
      isConnected: monitors.some((m: { name: string | null }) => m.name?.toLowerCase().includes('k8s') || m.name?.toLowerCase().includes('kubernetes')),
      monitorCount: monitors.filter((m: { name: string | null }) => m.name?.toLowerCase().includes('k8s') || m.name?.toLowerCase().includes('kubernetes')).length
    },
    wordpress: {
      isConnected: monitors.some((m: { name: string | null }) => m.name?.toLowerCase().includes('wp-cron') || m.name?.toLowerCase().includes('wordpress')),
      monitorCount: monitors.filter((m: { name: string | null }) => m.name?.toLowerCase().includes('wp-cron') || m.name?.toLowerCase().includes('wordpress')).length
    },
    terraform: {
      isConnected: apiKeys.length > 0,
      monitorCount: 0
    },
  };

  // Get first API key for setup modals (masked)
  const firstApiKey = apiKeys[0]?.tokenHash;

  const availableIntegrations = integrations.filter(i => i.status === 'available');
  const comingSoonIntegrations = integrations.filter(i => i.status === 'coming-soon');

  // Calculate total connected
  const connectedCount = Object.values(integrationStatus).filter(s => s.isConnected).length;

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/app' },
        { label: 'Integrations' },
      ]} />
      
      <PageHeader
        title="Integrations"
        description="Connect Saturn with your favorite tools and platforms"
      />

      {/* Summary Stats */}
      <div className="max-w-sm">
        <SaturnCard>
          <SaturnCardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Plug className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#37322F] font-sans">
                  {connectedCount}
                </div>
                <div className="text-sm text-[rgba(55,50,47,0.70)] font-sans">Connected Integrations</div>
              </div>
            </div>
          </SaturnCardContent>
        </SaturnCard>
      </div>

      {/* Available Integrations */}
      <div>
        <h2 className="text-xl font-semibold text-[#37322F] font-sans mb-4">Available Now</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <IntegrationsClientWrapper
            integrations={availableIntegrations}
            integrationStatus={integrationStatus}
            firstApiKey={firstApiKey}
            orgId={org.id}
          />
        </div>
      </div>

      {/* Coming Soon */}
      {comingSoonIntegrations.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-[#37322F] font-sans mb-4">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comingSoonIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
              />
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <SaturnCard>
        <SaturnCardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-[#37322F] font-sans mb-1">Need help with integrations?</h3>
              <p className="text-sm text-[rgba(55,50,47,0.70)] font-sans">
                Check our comprehensive documentation or contact our support team
              </p>
            </div>
            <div className="flex gap-2">
              <a href="https://docs.saturnmonitor.com" target="_blank" rel="noopener noreferrer">
                <button className="px-4 py-2 bg-white text-[#37322F] border border-[rgba(55,50,47,0.20)] rounded-lg hover:bg-[#F7F5F3] transition-colors font-sans text-sm font-medium">
                  Documentation
                </button>
              </a>
              <a href="mailto:support@saturnmonitor.com">
                <button className="px-4 py-2 bg-[#37322F] text-white rounded-lg hover:bg-[#2F2A27] transition-colors font-sans text-sm font-medium">
                  Contact Support
                </button>
              </a>
            </div>
          </div>
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}

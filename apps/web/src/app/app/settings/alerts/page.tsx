import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnButton,
  SaturnBadge,
  SaturnTable,
  SaturnTableHeader,
  SaturnTableBody,
  SaturnTableRow,
  SaturnTableHead,
  SaturnTableCell,
} from '@/components/saturn';
import { Plus, Mail, MessageSquare, Webhook } from 'lucide-react';
import Link from 'next/link';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';

export default async function AlertsPage() {
  const session = await getServerSession(authOptions);
  const org = await getUserPrimaryOrg(session!.user.id);

  if (!org) {
    return <div className="text-[#37322F] font-sans">No organization found</div>;
  }

  const channels = await prisma.alertChannel.findMany({
    where: { orgId: org.id },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const rules = await prisma.rule.findMany({
    where: { orgId: org.id },
    include: {
      Org: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const channelIcons: Record<string, React.ReactElement> = {
    EMAIL: <Mail className="w-4 h-4" />,
    SLACK: <MessageSquare className="w-4 h-4" />,
    DISCORD: <MessageSquare className="w-4 h-4" />,
    WEBHOOK: <Webhook className="w-4 h-4" />,
    PAGERDUTY: <MessageSquare className="w-4 h-4" />,
    TEAMS: <MessageSquare className="w-4 h-4" />,
    SMS: <MessageSquare className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      <PageHeaderWithBreadcrumbs
        title="Alert Configuration"
        description="Manage alert channels and notification rules"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Settings', href: '/app/settings' },
          { label: 'Alerts' },
        ]}
      />
      
      {/* Alert Channels */}
      <SaturnCard>
        <SaturnCardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
            <div>
              <SaturnCardTitle as="h2">Alert Channels</SaturnCardTitle>
              <SaturnCardDescription>Where to send alerts when incidents occur</SaturnCardDescription>
            </div>
            <div className="flex gap-2 flex-wrap w-full lg:w-auto">
              <SaturnButton variant="secondary" size="sm" className="flex-1 sm:flex-none">
                <Mail className="w-4 h-4 mr-2" />
                Add Email
              </SaturnButton>
              <Link href={`/api/slack/install?orgId=${org.id}`} className="flex-1 sm:flex-none">
                <SaturnButton variant="secondary" size="sm" fullWidth>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Connect Slack
                </SaturnButton>
              </Link>
            </div>
          </div>
        </SaturnCardHeader>
        <SaturnCardContent>
          {channels.length === 0 ? (
            <div className="text-center py-8 text-[rgba(55,50,47,0.80)] font-sans">
              <p className="mb-4">No alert channels configured yet.</p>
              <p className="text-sm text-[rgba(55,50,47,0.60)]">Add an email or connect Slack to receive alerts.</p>
            </div>
          ) : (
            <SaturnTable>
              <SaturnTableHeader>
                <SaturnTableRow>
                  <SaturnTableHead>Type</SaturnTableHead>
                  <SaturnTableHead>Label</SaturnTableHead>
                  <SaturnTableHead>Configuration</SaturnTableHead>
                  <SaturnTableHead>Default</SaturnTableHead>
                  <SaturnTableHead className="text-right">Actions</SaturnTableHead>
                </SaturnTableRow>
              </SaturnTableHeader>
              <SaturnTableBody>
                {channels.map((channel) => {
                  const config = channel.configJson as any;
                  return (
                    <SaturnTableRow key={channel.id}>
                      <SaturnTableCell>
                        <div className="flex items-center gap-2">
                          {channelIcons[channel.type]}
                          <span className="text-[#37322F] font-sans">{channel.type}</span>
                        </div>
                      </SaturnTableCell>
                      <SaturnTableCell className="font-medium text-[#37322F]">{channel.label}</SaturnTableCell>
                      <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                        {channel.type === 'EMAIL' && config.email}
                        {channel.type === 'SLACK' && (config.teamName || config.channel)}
                        {channel.type === 'WEBHOOK' && config.url}
                      </SaturnTableCell>
                      <SaturnTableCell>
                        {channel.isDefault && <SaturnBadge variant="default" size="sm">Default</SaturnBadge>}
                      </SaturnTableCell>
                      <SaturnTableCell className="text-right">
                        <SaturnButton variant="ghost" size="sm">
                          Edit
                        </SaturnButton>
                      </SaturnTableCell>
                    </SaturnTableRow>
                  );
                })}
              </SaturnTableBody>
            </SaturnTable>
          )}
        </SaturnCardContent>
      </SaturnCard>

      {/* Alert Rules */}
      <SaturnCard>
        <SaturnCardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <SaturnCardTitle as="h2">Alert Rules</SaturnCardTitle>
              <SaturnCardDescription>Route incidents from monitors to channels</SaturnCardDescription>
            </div>
            <SaturnButton>
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </SaturnButton>
          </div>
        </SaturnCardHeader>
        <SaturnCardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-[rgba(55,50,47,0.80)] font-sans">
              <p className="mb-4">No alert rules configured yet.</p>
              <p className="text-sm text-[rgba(55,50,47,0.60)]">Create rules to route incidents to specific channels.</p>
            </div>
          ) : (
            <SaturnTable>
              <SaturnTableHeader>
                <SaturnTableRow>
                  <SaturnTableHead>Name</SaturnTableHead>
                  <SaturnTableHead>Monitors</SaturnTableHead>
                  <SaturnTableHead>Channels</SaturnTableHead>
                  <SaturnTableHead>Suppress</SaturnTableHead>
                  <SaturnTableHead className="text-right">Actions</SaturnTableHead>
                </SaturnTableRow>
              </SaturnTableHeader>
              <SaturnTableBody>
                {rules.map((rule) => (
                  <SaturnTableRow key={rule.id}>
                    <SaturnTableCell className="font-medium text-[#37322F]">{rule.name}</SaturnTableCell>
                    <SaturnTableCell>
                      <SaturnBadge variant="default" size="sm">
                        {rule.monitorIds.length === 0 ? 'All Monitors' : `${rule.monitorIds.length} monitors`}
                      </SaturnBadge>
                    </SaturnTableCell>
                    <SaturnTableCell>
                      <SaturnBadge variant="default" size="sm">{rule.channelIds.length} channels</SaturnBadge>
                    </SaturnTableCell>
                    <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                      {rule.suppressMinutes ? `${rule.suppressMinutes}m` : 'None'}
                    </SaturnTableCell>
                    <SaturnTableCell className="text-right">
                      <SaturnButton variant="ghost" size="sm">
                        Edit
                      </SaturnButton>
                    </SaturnTableCell>
                  </SaturnTableRow>
                ))}
              </SaturnTableBody>
            </SaturnTable>
          )}
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}

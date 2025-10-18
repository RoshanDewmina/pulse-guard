import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { AlertsPageClient } from '@/components/alerts/alerts-page-client';
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata({
  title: "Settings - Alerts",
  description: "Manage alert settings for your monitors.",
  path: '/app/settings/alerts',
  noIndex: true,
})

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

  const monitors = await prisma.monitor.findMany({
    where: { orgId: org.id },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <AlertsPageClient
      orgId={org.id}
      channels={channels.map(c => ({
        id: c.id,
        type: c.type,
        label: c.label,
        configJson: c.configJson,
        isDefault: c.isDefault,
      }))}
      rules={rules.map(r => ({
        id: r.id,
        name: r.name,
        monitorIds: r.monitorIds,
        channelIds: r.channelIds,
        suppressMinutes: r.suppressMinutes,
      }))}
      monitors={monitors}
    />
  );
}

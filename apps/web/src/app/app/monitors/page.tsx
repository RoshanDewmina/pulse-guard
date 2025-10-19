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
} from '@/components/saturn';
import { generatePageMetadata } from '@/lib/seo/metadata'
import { MonitorsList } from '@/components/monitors/monitors-list';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader as PageHeaderComponent } from '@/components/page-header';

type MonitorStatus = 'OK' | 'LATE' | 'MISSED' | 'FAILING' | 'DISABLED';

export default async function MonitorsPage() {
  const session = await getServerSession(authOptions);
  const org = await getUserPrimaryOrg(session!.user.id);

  if (!org) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4 text-[#37322F] font-serif">No Organization Found</h1>
        <p className="text-[rgba(55,50,47,0.80)] font-sans">Please contact support.</p>
      </div>
    );
  }

  const monitors = await prisma.monitor.findMany({
    where: { orgId: org.id },
    include: {
      _count: {
        select: {
          Incident: {
            where: {
              status: { in: ['OPEN', 'ACKED'] },
            },
          },
          Run: true,
        },
      },
      MonitorTag: {
        include: {
          Tag: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const tags = await prisma.tag.findMany({
    where: { orgId: org.id },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/app' },
        { label: 'Monitors' },
      ]} />
      
      <PageHeaderComponent
        title="Monitors"
        description="Manage your cron job monitors"
        action={
          <Link href="/app/monitors/new">
            <SaturnButton icon={<Plus className="w-4 h-4" />}>
              Create Monitor
            </SaturnButton>
          </Link>
        }
      />

      {monitors.length === 0 ? (
        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle as="h3">No Monitors Yet</SaturnCardTitle>
            <SaturnCardDescription>Get started by creating your first monitor</SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="text-center py-8">
              <p className="text-[rgba(55,50,47,0.80)] font-sans mb-6">
                Monitors help you track your cron jobs and scheduled tasks.
              </p>
              <Link href="/app/monitors/new">
                <SaturnButton icon={<Plus className="w-4 h-4" />}>
                  Create Your First Monitor
                </SaturnButton>
              </Link>
            </div>
          </SaturnCardContent>
        </SaturnCard>
      ) : (
        <MonitorsList
          monitors={monitors}
          tags={tags}
          monitorLimit={org.SubscriptionPlan?.monitorLimit}
          currentCount={monitors.length}
        />
      )}
    </div>
  );
}

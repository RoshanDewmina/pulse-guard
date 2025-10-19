import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { PageHeader as PageHeaderComponent } from '@/components/page-header';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AnomalyTuningSlider } from '@/components/anomaly-tuning-slider';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
} from '@/components/saturn';
import { notFound } from 'next/navigation';

interface MonitorSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function MonitorSettingsPage({ params }: MonitorSettingsPageProps) {
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

  const { id } = await params;

  const monitor = await (prisma as any).monitor.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      orgId: true,
      anomalyZScoreThreshold: true,
      anomalyMedianMultiplier: true,
      anomalyOutputDropFraction: true,
    },
  });

  if (!monitor || monitor.orgId !== org.id) {
    notFound();
  }

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/app' },
        { label: 'Monitors', href: '/app/monitors' },
        { label: monitor.name, href: `/app/monitors/${id}` },
        { label: 'Settings' },
      ]} />
      
      <PageHeaderComponent
        title="Monitor Settings"
        description={`Configure settings for ${monitor.name}`}
      />

      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle>Advanced: Anomaly Detection</SaturnCardTitle>
          <SaturnCardDescription>
            Customize sensitivity for automatic anomaly detection. Leave blank to use defaults.
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <AnomalyTuningSlider
            monitorId={monitor.id}
            initialValues={{
              zScoreThreshold: (monitor as any).anomalyZScoreThreshold ?? 3.0,
              medianMultiplier: (monitor as any).anomalyMedianMultiplier ?? 5.0,
              outputDropFraction: (monitor as any).anomalyOutputDropFraction ?? 0.5,
            }}
          />
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}

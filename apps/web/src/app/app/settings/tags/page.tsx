import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@tokiflow/db';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { TagsList } from '@/components/tags/tags-list';

export const metadata = generatePageMetadata({
  title: 'Settings - Tags',
  description: 'Manage monitor tags for organization.',
  path: '/app/settings/tags',
  keywords: ['tags', 'labels', 'organization', 'monitors'],
  noIndex: true,
});

export default async function TagsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const membership = await prisma.membership.findFirst({
    where: {
      User: {
        email: session.user.email,
      },
    },
    include: {
      Org: true,
    },
  });

  if (!membership) {
    redirect('/');
  }

  // Fetch all tags with usage count
  const tags = await (prisma as any).tag.findMany({
    where: { orgId: membership.orgId },
    include: {
      MonitorTag: {
        include: {
          Monitor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Transform to include usage count
  const tagsWithUsage = tags.map((tag: any) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    orgId: tag.orgId,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
    usageCount: tag.MonitorTag.length,
    monitors: tag.MonitorTag.map((mt: any) => mt.Monitor),
  }));

  return (
    <div className="space-y-6">
      <PageHeaderWithBreadcrumbs
        title="Tags"
        description="Organize monitors with tags"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Settings', href: '/app/settings' },
          { label: 'Tags' },
        ]}
      />

      <TagsList tags={tagsWithUsage} orgId={membership.orgId} />
    </div>
  );
}

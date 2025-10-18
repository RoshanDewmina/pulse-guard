import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata({
  title: "Status Pages",
  description: "Manage your public status pages.",
  path: '/app/status-pages',
  noIndex: true,
})
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnButton,
  SaturnBadge,
} from '@/components/saturn';
import { Plus, ExternalLink, Edit, Eye } from 'lucide-react';
import Link from 'next/link';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { format } from 'date-fns';

export default async function StatusPagesPage() {
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

  const statusPages = await prisma.statusPage.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <PageHeaderWithBreadcrumbs
        title="Status Pages"
        description="Public status pages for your services"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Status Pages' },
        ]}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SaturnCard>
          <div className="p-6">
            <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans mb-3">
              Total Pages
            </div>
            <div className="text-3xl font-bold text-[#37322F] font-sans">
              {statusPages.length}
            </div>
          </div>
        </SaturnCard>

        <SaturnCard>
          <div className="p-6">
            <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans mb-3">
              Public Pages
            </div>
            <div className="text-3xl font-bold text-[#37322F] font-sans">
              {statusPages.filter((p: any) => p.isPublic).length}
            </div>
          </div>
        </SaturnCard>

        <SaturnCard>
          <div className="p-6">
            <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans mb-3">
              Custom Domains
            </div>
            <div className="text-3xl font-bold text-[#37322F] font-sans">
              {statusPages.filter((p: any) => p.customDomain).length}
            </div>
          </div>
        </SaturnCard>
      </div>

      {/* Status Pages List */}
      <SaturnCard>
        <SaturnCardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <SaturnCardTitle as="h2">Your Status Pages</SaturnCardTitle>
              <SaturnCardDescription>
                Manage and configure your public status pages
              </SaturnCardDescription>
            </div>
            <Link href="/app/status-pages/new">
              <SaturnButton>
                <Plus className="w-4 h-4 mr-2" />
                Create Status Page
              </SaturnButton>
            </Link>
          </div>
        </SaturnCardHeader>
        <SaturnCardContent>
          {statusPages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2 text-[#37322F] font-serif">
                No Status Pages Yet
              </h3>
              <p className="text-[rgba(55,50,47,0.80)] font-sans mb-6">
                Create a public status page to share service health with your users.
              </p>
              <Link href="/app/status-pages/new">
                <SaturnButton>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Status Page
                </SaturnButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {statusPages.map((page: any) => {
                const components = (page.components as any[]) || [];
                const publicUrl = `${process.env.NEXTAUTH_URL}/status/${page.slug}`;

                return (
                  <div
                    key={page.id}
                    className="p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-[#37322F] font-serif">
                            {page.title}
                          </h3>
                          {page.isPublic ? (
                            <SaturnBadge variant="success" size="sm">
                              Public
                            </SaturnBadge>
                          ) : (
                            <SaturnBadge variant="warning" size="sm">
                              Private
                            </SaturnBadge>
                          )}
                        </div>

                        <div className="space-y-2 text-sm text-[rgba(55,50,47,0.80)] font-sans">
                          <p>
                            <span className="font-medium">URL:</span>{' '}
                            <a
                              href={publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-mono"
                            >
                              {publicUrl}
                            </a>
                          </p>

                          {page.customDomain && (
                            <p>
                              <span className="font-medium">Custom Domain:</span>{' '}
                              <span className="font-mono">{page.customDomain}</span>
                            </p>
                          )}

                          <p>
                            <span className="font-medium">Components:</span> {components.length}
                          </p>

                          <p className="text-xs text-[rgba(55,50,47,0.60)]">
                            Created {format(page.createdAt, 'MMM d, yyyy')} • Updated{' '}
                            {format(page.updatedAt, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col gap-2">
                        <Link href={`/app/status-pages/${page.id}/edit`} className="flex-1 lg:flex-none">
                          <SaturnButton variant="secondary" size="sm" fullWidth>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </SaturnButton>
                        </Link>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 lg:flex-none"
                        >
                          <SaturnButton variant="secondary" size="sm" fullWidth>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </SaturnButton>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SaturnCardContent>
      </SaturnCard>

      {/* Help Section */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle as="h2">About Status Pages</SaturnCardTitle>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="space-y-4 text-[rgba(55,50,47,0.80)] font-sans">
            <p>
              Status pages provide a public-facing view of your service health. They help you:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Communicate service status to your users proactively</li>
              <li>Display real-time uptime and incident history</li>
              <li>Build trust through transparency</li>
              <li>Reduce support tickets during outages</li>
            </ul>
            <p className="text-sm text-[rgba(55,50,47,0.60)]">
              <strong>Pro tip:</strong> Use custom domains to host status pages on your own domain
              (e.g., status.yourcompany.com)
            </p>
          </div>
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}


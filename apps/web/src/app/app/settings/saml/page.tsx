import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@tokiflow/db';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { SAMLSettingsClient } from '@/components/saml/saml-settings-client';

export const metadata = generatePageMetadata({
  title: "Settings - SAML SSO",
  description: "Configure SAML 2.0 single sign-on for your organization.",
  path: '/app/settings/saml',
  keywords: ['saml', 'sso', 'single sign-on', 'enterprise', 'authentication'],
  noIndex: true,
});

export default async function SAMLSettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const org = await getUserPrimaryOrg(session.user.id);
  
  if (!org) {
    redirect('/onboarding');
  }

  // Check if user is owner or admin
  const membership = await prisma.membership.findUnique({
    where: {
      userId_orgId: {
        userId: session.user.id,
        orgId: org.id,
      },
    },
  });

  if (!membership || membership.role === 'MEMBER') {
    redirect('/app');
  }

  // Fetch SAML configuration
  const samlConfig = await prisma.sAMLConfig.findUnique({
    where: { orgId: org.id },
    select: {
      id: true,
      name: true,
      idpUrl: true,
      spEntityId: true,
      acsUrl: true,
      sloUrl: true,
      nameIdFormat: true,
      attributeMapping: true,
      isEnabled: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeaderWithBreadcrumbs
        title="SAML SSO"
        description="Configure SAML 2.0 single sign-on for enterprise authentication"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Settings', href: '/app/settings' },
          { label: 'SAML SSO' },
        ]}
      />

      <SAMLSettingsClient 
        initialConfig={samlConfig}
        orgId={org.id}
      />
    </div>
  );
}

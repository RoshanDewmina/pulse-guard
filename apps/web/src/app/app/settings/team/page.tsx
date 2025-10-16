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
import { format } from 'date-fns';
import { Plus, Crown, Shield, User } from 'lucide-react';
import { InviteMemberButton } from '@/components/invite-member-button';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  const org = await getUserPrimaryOrg(session!.user.id);

  if (!org) {
    return <div className="text-[#37322F] font-sans">No organization found</div>;
  }

  const memberships = await prisma.membership.findMany({
    where: { orgId: org.id },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const roleIcon: Record<string, React.ReactElement> = {
    OWNER: <Crown className="w-4 h-4 text-yellow-600" />,
    ADMIN: <Shield className="w-4 h-4 text-blue-600" />,
    MEMBER: <User className="w-4 h-4 text-[rgba(55,50,47,0.80)]" />,
    VIEWER: <User className="w-4 h-4 text-[rgba(55,50,47,0.60)]" />,
  };

  const getRoleBadgeVariant = (role: string): 'success' | 'warning' | 'error' | 'default' => {
    if (role === 'OWNER') return 'warning';
    if (role === 'ADMIN') return 'success';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <PageHeaderWithBreadcrumbs
        title="Team Management"
        description={`Manage team members for ${org.name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Settings', href: '/app/settings' },
          { label: 'Team' },
        ]}
      />
      
      <SaturnCard>
        <SaturnCardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <SaturnCardTitle as="h2">Team Members</SaturnCardTitle>
              <SaturnCardDescription>
                {memberships.length} member{memberships.length !== 1 ? 's' : ''} in {org.name}
              </SaturnCardDescription>
            </div>
            <InviteMemberButton />
          </div>
        </SaturnCardHeader>
        <SaturnCardContent>
          {org.subscriptionPlan && memberships.length >= org.subscriptionPlan.userLimit && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-sans">
                ⚠️ You&apos;ve reached your team member limit ({org.subscriptionPlan.userLimit} members).
                Upgrade your plan to add more members.
              </p>
            </div>
          )}

          <SaturnTable>
            <SaturnTableHeader>
              <SaturnTableRow>
                <SaturnTableHead>Member</SaturnTableHead>
                <SaturnTableHead>Role</SaturnTableHead>
                <SaturnTableHead>Joined</SaturnTableHead>
                <SaturnTableHead className="text-right">Actions</SaturnTableHead>
              </SaturnTableRow>
            </SaturnTableHeader>
            <SaturnTableBody>
              {memberships.map((membership) => (
                <SaturnTableRow key={membership.id}>
                  <SaturnTableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[rgba(55,50,47,0.12)] flex items-center justify-center text-[#37322F] font-medium font-sans">
                        {membership.user.name?.[0] || membership.user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-[#37322F] font-sans">
                          {membership.user.name || membership.user.email}
                        </div>
                        <div className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
                          {membership.user.email}
                        </div>
                      </div>
                    </div>
                  </SaturnTableCell>
                  <SaturnTableCell>
                    <SaturnBadge variant={getRoleBadgeVariant(membership.role)} size="sm">
                      <span className="flex items-center gap-1">
                        {roleIcon[membership.role]}
                        {membership.role}
                      </span>
                    </SaturnBadge>
                  </SaturnTableCell>
                  <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                    {format(membership.createdAt, 'MMM d, yyyy')}
                  </SaturnTableCell>
                  <SaturnTableCell className="text-right">
                    {membership.userId !== session!.user.id && (
                      <div className="flex gap-2 justify-end">
                        <SaturnButton variant="ghost" size="sm">
                          Change Role
                        </SaturnButton>
                        <SaturnButton variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          Remove
                        </SaturnButton>
                      </div>
                    )}
                  </SaturnTableCell>
                </SaturnTableRow>
              ))}
            </SaturnTableBody>
          </SaturnTable>
        </SaturnCardContent>
      </SaturnCard>

      {/* Role Descriptions */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle as="h3">Role Permissions</SaturnCardTitle>
          <SaturnCardDescription>What each role can do in your organization</SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="space-y-4">
            {[
              {
                role: 'OWNER',
                icon: <Crown className="w-5 h-5 text-yellow-600" />,
                description: 'Full access to all features, including billing and team management. Can delete the organization.',
              },
              {
                role: 'ADMIN',
                icon: <Shield className="w-5 h-5 text-blue-600" />,
                description: 'Can manage monitors, incidents, and alerts. Can invite members but cannot manage billing.',
              },
              {
                role: 'MEMBER',
                icon: <User className="w-5 h-5 text-[rgba(55,50,47,0.80)]" />,
                description: 'Can create and manage their own monitors. Can view team monitors and incidents.',
              },
              {
                role: 'VIEWER',
                icon: <User className="w-5 h-5 text-[rgba(55,50,47,0.60)]" />,
                description: 'Read-only access. Can view monitors, runs, and incidents but cannot make changes.',
              },
            ].map((item) => (
              <div key={item.role} className="flex gap-3 p-4 rounded-lg bg-[rgba(55,50,47,0.04)]">
                <div className="flex-shrink-0">{item.icon}</div>
                <div>
                  <div className="font-medium text-[#37322F] font-sans mb-1">{item.role}</div>
                  <div className="text-sm text-[rgba(55,50,47,0.80)] font-sans">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}

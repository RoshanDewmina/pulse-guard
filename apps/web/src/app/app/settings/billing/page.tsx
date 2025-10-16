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
} from '@/components/saturn';
import { CheckCircle2 } from 'lucide-react';
import { PLANS } from '@/lib/stripe';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import PricingSection from '@/components/pricing-section';

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const org = await getUserPrimaryOrg(session!.user.id);

  if (!org) {
    return <div className="text-[#37322F] font-sans">No organization found</div>;
  }

  const plan = org.SubscriptionPlan || {
    plan: 'FREE',
    monitorLimit: 5,
    userLimit: 3,
  };

  const monitorCount = await prisma.monitor.count({
    where: { orgId: org.id },
  });

  const memberCount = await prisma.membership.count({
    where: { orgId: org.id },
  });

  const currentPlan = PLANS[plan.plan as keyof typeof PLANS] || PLANS.FREE;

  return (
    <div className="space-y-8">
      <PageHeaderWithBreadcrumbs
        title="Billing & Plans"
        description="Manage your subscription, billing, and plan details"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Settings', href: '/app/settings' },
          { label: 'Billing' },
        ]}
      />
      
      {/* Current Plan - Enhanced Design */}
      <SaturnCard>
        {/* Header Section with Badge */}
        <div className="px-6 py-5 border-b border-[rgba(55,50,47,0.06)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h2 className="text-2xl sm:text-3xl font-normal text-[#37322F] font-serif">{currentPlan.name}</h2>
                <div className="px-3 py-1 bg-gradient-to-br from-[#37322F] to-[#49423D] text-white text-xs font-medium font-sans rounded-full shadow-[0px_1px_2px_rgba(55,50,47,0.12)]">
                  {plan.plan}
                </div>
              </div>
              <p className="text-[rgba(55,50,47,0.60)] text-sm font-sans">Your current subscription plan and usage</p>
            </div>
            {plan.plan !== 'BUSINESS' && (
              <SaturnButton className="w-full sm:w-auto">
                Upgrade Plan
              </SaturnButton>
            )}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="px-6 py-6 bg-[rgba(55,50,47,0.02)]">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-medium text-[#37322F] font-serif">${currentPlan.price}</span>
            <span className="text-[rgba(55,50,47,0.60)] text-base font-sans">/month</span>
          </div>
          <p className="text-[rgba(55,50,47,0.60)] text-sm font-sans mt-2">
            Billed monthly • {plan.userLimit} team members • {plan.monitorLimit} monitors
          </p>
        </div>

        {/* Usage Metrics */}
        <div className="px-6 py-6 space-y-6">
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-sm font-medium text-[#37322F] font-sans">Monitor Usage</span>
              <span className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                <span className="font-semibold text-[#37322F]">{monitorCount}</span> / {plan.monitorLimit}
              </span>
            </div>
            <div className="w-full bg-[rgba(55,50,47,0.06)] rounded-full h-2.5 overflow-hidden shadow-inner">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 shadow-sm ${
                  monitorCount >= plan.monitorLimit 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : monitorCount >= plan.monitorLimit * 0.8 
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                    : 'bg-gradient-to-r from-[#37322F] to-[#49423D]'
                }`}
                style={{ width: `${Math.min((monitorCount / plan.monitorLimit) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-sm font-medium text-[#37322F] font-sans">Team Members</span>
              <span className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                <span className="font-semibold text-[#37322F]">{memberCount}</span> / {plan.userLimit}
              </span>
            </div>
            <div className="w-full bg-[rgba(55,50,47,0.06)] rounded-full h-2.5 overflow-hidden shadow-inner">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 shadow-sm ${
                  memberCount >= plan.userLimit 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : memberCount >= plan.userLimit * 0.8 
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                    : 'bg-gradient-to-r from-[#37322F] to-[#49423D]'
                }`}
                style={{ width: `${Math.min((memberCount / plan.userLimit) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {'stripeCustomerId' in plan && plan.stripeCustomerId && (
          <div className="px-6 py-4 bg-[rgba(55,50,47,0.02)] border-t border-[rgba(55,50,47,0.06)]">
            <SaturnButton variant="secondary" fullWidth className="sm:w-auto">
              Manage Subscription
            </SaturnButton>
          </div>
        )}
      </SaturnCard>

      {/* Pricing Comparison - Full featured section from landing page */}
      <div className="rounded-lg overflow-hidden border border-[rgba(55,50,47,0.12)]">
        <PricingSection />
      </div>
    </div>
  );
}

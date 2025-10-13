import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { PLANS } from '@/lib/stripe';

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const org = await getUserPrimaryOrg(session!.user.id);

  if (!org) {
    return <div>No organization found</div>;
  }

  const plan = org.subscriptionPlan || {
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
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your subscription details and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{currentPlan.name}</h2>
                <Badge variant={plan.plan === 'FREE' ? 'secondary' : 'default'}>
                  {plan.plan}
                </Badge>
              </div>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                ${currentPlan.price}
                <span className="text-sm font-normal text-gray-600">/month</span>
              </p>
            </div>
            {plan.plan !== 'BUSINESS' && (
              <Button>Upgrade Plan</Button>
            )}
          </div>

          {/* Usage Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Monitors</span>
                <span className="text-gray-600">
                  {monitorCount} / {plan.monitorLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    monitorCount >= plan.monitorLimit ? 'bg-red-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min((monitorCount / plan.monitorLimit) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Team Members</span>
                <span className="text-gray-600">
                  {memberCount} / {plan.userLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    memberCount >= plan.userLimit ? 'bg-red-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min((memberCount / plan.userLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {'stripeCustomerId' in plan && plan.stripeCustomerId && (
            <div className="pt-4 border-t">
              <Button variant="outline">Manage Subscription</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(PLANS).map(([key, planDetails]) => {
          const isCurrent = plan.plan === key;
          
          return (
            <Card key={key} className={isCurrent ? 'border-blue-600 border-2' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{planDetails.name}</CardTitle>
                  {isCurrent && <Badge>Current</Badge>}
                </div>
                <div className="text-3xl font-bold">
                  ${planDetails.price}
                  {planDetails.price > 0 && (
                    <span className="text-sm font-normal text-gray-600">/mo</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-4">
                  {planDetails.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {!isCurrent && 'priceId' in planDetails && planDetails.priceId && (
                  <Button className="w-full">
                    {planDetails.price < (currentPlan.price || 0) ? 'Downgrade' : 'Upgrade'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


#!/usr/bin/env bun

/**
 * Migration script to update existing subscription plans with new fields
 * Maps old FREE/PRO/BUSINESS plans to new FREE/DEVELOPER/TEAM/BUSINESS structure
 */

import { PrismaClient } from '../packages/db/src';

const prisma = new PrismaClient();

const PLAN_MAPPING = {
  FREE: {
    monitorLimit: 10,
    userLimit: 3,
    statusPageLimit: 1,
    syntheticRunsLimit: 200,
    syntheticRunsUsed: 0,
    retentionDays: 30,
    minIntervalSec: 600, // 10 minutes
    allowsWebhooks: false,
    allowsCustomDomains: false,
    allowsSso: false,
    allowsAuditLogs: false,
  },
  PRO: {
    // Map old PRO to new DEVELOPER
    monitorLimit: 25,
    userLimit: 5,
    statusPageLimit: 2,
    syntheticRunsLimit: 1000,
    syntheticRunsUsed: 0,
    retentionDays: 90,
    minIntervalSec: 60, // 1 minute
    allowsWebhooks: false,
    allowsCustomDomains: false,
    allowsSso: false,
    allowsAuditLogs: false,
  },
  BUSINESS: {
    // Map old BUSINESS to new TEAM
    monitorLimit: 100,
    userLimit: 10,
    statusPageLimit: 5,
    syntheticRunsLimit: 5000,
    syntheticRunsUsed: 0,
    retentionDays: 180,
    minIntervalSec: 60, // 1 minute
    allowsWebhooks: true,
    allowsCustomDomains: false,
    allowsSso: false,
    allowsAuditLogs: false,
  },
};

async function migrateSubscriptionPlans() {
  console.log('🔄 Starting subscription plan migration...');

  try {
    // Get all existing subscription plans
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        Org: true,
      },
    });

    console.log(`📊 Found ${plans.length} subscription plans to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const plan of plans) {
      const oldPlan = plan.plan as keyof typeof PLAN_MAPPING;
      
      if (!PLAN_MAPPING[oldPlan]) {
        console.log(`⚠️  Unknown plan type: ${oldPlan}, skipping`);
        skipped++;
        continue;
      }

      const newConfig = PLAN_MAPPING[oldPlan];
      
      // Update the plan with new fields
      await prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: {
          monitorLimit: newConfig.monitorLimit,
          userLimit: newConfig.userLimit,
          statusPageLimit: newConfig.statusPageLimit,
          syntheticRunsLimit: newConfig.syntheticRunsLimit,
          syntheticRunsUsed: newConfig.syntheticRunsUsed,
          retentionDays: newConfig.retentionDays,
          minIntervalSec: newConfig.minIntervalSec,
          allowsWebhooks: newConfig.allowsWebhooks,
          allowsCustomDomains: newConfig.allowsCustomDomains,
          allowsSso: newConfig.allowsSso,
          allowsAuditLogs: newConfig.allowsAuditLogs,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Migrated ${oldPlan} plan for org ${plan.Org.name} (${plan.Org.slug})`);
      migrated++;
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⚠️  Skipped: ${skipped}`);
    console.log(`   📊 Total: ${plans.length}`);

    // Show summary of new plan distribution
    const planCounts = await prisma.subscriptionPlan.groupBy({
      by: ['plan'],
      _count: {
        plan: true,
      },
    });

    console.log(`\n📈 Plan distribution after migration:`);
    for (const count of planCounts) {
      console.log(`   ${count.plan}: ${count._count.plan} orgs`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (import.meta.main) {
  migrateSubscriptionPlans();
}

export { migrateSubscriptionPlans };

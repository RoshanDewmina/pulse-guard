import { prisma } from './index';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  // Create a dev user (using magic link auth, no password needed)
  const user = await prisma.user.upsert({
    where: { email: 'dewminaimalsha2003@gmail.com' },
    update: {
      name: 'Dev User',
    },
    create: {
      email: 'dewminaimalsha2003@gmail.com',
      name: 'Dev User',
    },
  });

  console.log('✅ Created user:', user.email);
  console.log('   Password: test123 (for testing)');

  // Create a dev organization
  const org = await prisma.org.upsert({
    where: { slug: 'dev-org' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Dev Organization',
      slug: 'dev-org',
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created org:', org.name);

  // Create membership
  const membership = await prisma.membership.upsert({
    where: {
      userId_orgId: {
        userId: user.id,
        orgId: org.id,
      },
    },
    update: {},
    create: {
      id: crypto.randomUUID(),
      userId: user.id,
      orgId: org.id,
      role: 'OWNER',
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created membership for', user.email, 'in', org.name);

  // Mark user as having completed onboarding since they have an org
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingCompleted: true },
  });

  // Create subscription plan (free tier)
  const plan = await prisma.subscriptionPlan.upsert({
    where: { orgId: org.id },
    update: {},
    create: {
      id: crypto.randomUUID(),
      orgId: org.id,
      plan: 'FREE',
      monitorLimit: 5,
      userLimit: 3,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created subscription plan:', plan.plan);

  // Create a default email alert channel
  const emailChannel = await prisma.alertChannel.create({
    data: {
      id: crypto.randomUUID(),
      orgId: org.id,
      type: 'EMAIL',
      label: 'Default Email',
      configJson: {
        email: 'dewminaimalsha2003@gmail.com',
      },
      isDefault: true,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created default email channel');

  // Create a sample monitor with a stable token for tests
  const monitor = await prisma.monitor.upsert({
    where: { token: 'pg_automation_test' },
    update: {
      name: 'Sample Backup Job',
      scheduleType: 'INTERVAL',
      intervalSec: 3600,
      timezone: 'UTC',
      graceSec: 300,
      status: 'OK',
      nextDueAt: new Date(Date.now() + 3600000),
      updatedAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      orgId: org.id,
      name: 'Sample Backup Job',
      token: 'pg_automation_test',
      scheduleType: 'INTERVAL',
      intervalSec: 3600, // 1 hour
      timezone: 'UTC',
      graceSec: 300, // 5 minutes
      status: 'OK',
      nextDueAt: new Date(Date.now() + 3600000), // 1 hour from now
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created sample monitor:', monitor.name);
  console.log('   Token:', monitor.token);
  console.log('   Ping URL: http://localhost:3000/api/ping/' + monitor.token);

  // Create a default rule (route all monitors to email)
  const rule = await prisma.rule.create({
    data: {
      id: crypto.randomUUID(),
      orgId: org.id,
      name: 'Alert all monitors to email',
      monitorIds: [], // empty means all monitors
      channelIds: [emailChannel.id],
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created default alert rule');

  console.log('\n🎉 Seeding complete!');
  console.log('\n📝 Login credentials:');
  console.log('   Email:', user.email);
  console.log('   (Magic link authentication - no password needed)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


import { prisma } from './index';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password for testing: test123
  const hashedPassword = await bcrypt.hash('test123', 10);

  // Create a dev user with password
  const user = await prisma.user.upsert({
    where: { email: 'dewminaimalsha2003@gmail.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      email: 'dewminaimalsha2003@gmail.com',
      name: 'Dev User',
      password: hashedPassword,
    },
  });

  console.log('✅ Created user:', user.email);
  console.log('   Password: test123 (for testing)');

  // Create a dev organization
  const org = await prisma.org.upsert({
    where: { slug: 'dev-org' },
    update: {},
    create: {
      name: 'Dev Organization',
      slug: 'dev-org',
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
      userId: user.id,
      orgId: org.id,
      role: 'OWNER',
    },
  });

  console.log('✅ Created membership for', user.email, 'in', org.name);

  // Create subscription plan (free tier)
  const plan = await prisma.subscriptionPlan.upsert({
    where: { orgId: org.id },
    update: {},
    create: {
      orgId: org.id,
      plan: 'FREE',
      monitorLimit: 5,
      userLimit: 3,
    },
  });

  console.log('✅ Created subscription plan:', plan.plan);

  // Create a default email alert channel
  const emailChannel = await prisma.alertChannel.create({
    data: {
      orgId: org.id,
      type: 'EMAIL',
      label: 'Default Email',
      configJson: {
        email: 'dewminaimalsha2003@gmail.com',
      },
      isDefault: true,
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
    },
    create: {
      orgId: org.id,
      name: 'Sample Backup Job',
      token: 'pg_automation_test',
      scheduleType: 'INTERVAL',
      intervalSec: 3600, // 1 hour
      timezone: 'UTC',
      graceSec: 300, // 5 minutes
      status: 'OK',
      nextDueAt: new Date(Date.now() + 3600000), // 1 hour from now
    },
  });

  console.log('✅ Created sample monitor:', monitor.name);
  console.log('   Token:', monitor.token);
  console.log('   Ping URL: http://localhost:3000/api/ping/' + monitor.token);

  // Create a default rule (route all monitors to email)
  const rule = await prisma.rule.create({
    data: {
      orgId: org.id,
      name: 'Alert all monitors to email',
      monitorIds: [], // empty means all monitors
      channelIds: [emailChannel.id],
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


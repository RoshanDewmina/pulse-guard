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

  // Create a viewer user
  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      email: 'viewer@example.com',
      name: 'Viewer User',
      password: hashedPassword,
    },
  });

  // Create VIEWER membership
  await prisma.membership.upsert({
    where: {
      userId_orgId: {
        userId: viewerUser.id,
        orgId: org.id,
      },
    },
    update: {},
    create: {
      userId: viewerUser.id,
      orgId: org.id,
      role: 'VIEWER',
    },
  });

  console.log('✅ Created VIEWER member:', viewerUser.email);

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

  // Create additional monitors for dependency testing
  const dbMonitor = await prisma.monitor.create({
    data: {
      orgId: org.id,
      name: 'Database Backup',
      token: 'pg_db_backup_test',
      scheduleType: 'CRON',
      cronExpr: '0 2 * * *', // 2 AM daily
      timezone: 'UTC',
      graceSec: 600,
      status: 'OK',
      nextDueAt: new Date(Date.now() + 86400000), // Tomorrow
      tags: ['production', 'database'],
      captureOutput: true,
    },
  });

  const apiMonitor = await prisma.monitor.create({
    data: {
      orgId: org.id,
      name: 'API Health Check',
      token: 'pg_api_health_test',
      scheduleType: 'INTERVAL',
      intervalSec: 300, // 5 minutes
      timezone: 'UTC',
      graceSec: 60,
      status: 'OK',
      nextDueAt: new Date(Date.now() + 300000),
      tags: ['production', 'api'],
    },
  });

  console.log('✅ Created additional monitors');

  // Create monitor dependency (API depends on DB)
  await prisma.monitorDependency.create({
    data: {
      monitorId: apiMonitor.id,
      dependsOnId: dbMonitor.id,
      required: true,
    },
  });

  console.log('✅ Created monitor dependency: API → Database');

  // Create sample runs for the first monitor
  const now = new Date();
  await prisma.run.createMany({
    data: [
      {
        monitorId: monitor.id,
        startedAt: new Date(now.getTime() - 7200000), // 2 hours ago
        finishedAt: new Date(now.getTime() - 7200000 + 5000),
        durationMs: 5000,
        exitCode: 0,
        outcome: 'SUCCESS',
        outputPreview: 'Backup completed successfully.\nFiles: 1234\nSize: 5.6GB',
      },
      {
        monitorId: monitor.id,
        startedAt: new Date(now.getTime() - 3600000), // 1 hour ago
        finishedAt: new Date(now.getTime() - 3600000 + 4800),
        durationMs: 4800,
        exitCode: 0,
        outcome: 'SUCCESS',
      },
    ],
  });

  console.log('✅ Created sample run records');

  // Create a sample incident
  await prisma.incident.create({
    data: {
      monitorId: dbMonitor.id,
      kind: 'LATE',
      severity: 'MEDIUM',
      status: 'RESOLVED',
      summary: 'Database backup completed late',
      details: 'Job took longer than expected due to increased data volume',
      openedAt: new Date(now.getTime() - 86400000), // Yesterday
      resolvedAt: new Date(now.getTime() - 86400000 + 3600000), // Resolved 1 hour later
    },
  });

  console.log('✅ Created sample incident');

  // Create a status page
  await prisma.statusPage.create({
    data: {
      orgId: org.id,
      slug: 'dev-status',
      title: 'Dev Services Status',
      isPublic: true,
      components: JSON.stringify([
        { monitorId: monitor.id, name: 'Backup Service', group: 'Infrastructure' },
        { monitorId: dbMonitor.id, name: 'Database', group: 'Infrastructure' },
        { monitorId: apiMonitor.id, name: 'API', group: 'Services' },
      ]),
      theme: JSON.stringify({
        primaryColor: '#667eea',
        backgroundColor: '#ffffff',
        textColor: '#1a202c',
      }),
    },
  });

  console.log('✅ Created status page: http://localhost:3000/status/dev-status');

  // Create an API key for testing
  const crypto = require('crypto');
  const apiKeyValue = `tfk_${crypto.randomBytes(32).toString('hex')}`;
  const apiKeyHash = crypto.createHash('sha256').update(apiKeyValue).digest('hex');

  await prisma.apiKey.create({
    data: {
      userId: user.id,
      orgId: org.id,
      name: 'Development API Key',
      tokenHash: apiKeyHash,
      scopes: ['monitors:read', 'monitors:write', 'metrics:read'],
    },
  });

  console.log('✅ Created API key with scopes');
  console.log('   API Key:', apiKeyValue);
  console.log('   (Save this for API access)');

  console.log('\n🎉 Seeding complete!');
  console.log('\n📝 Login credentials:');
  console.log('   Email:', user.email);
  console.log('   Password: test123');
  console.log('   Viewer Email:', viewerUser.email);
  console.log('   Viewer Password: test123');
  console.log('\n📊 Sample Data:');
  console.log('   Monitors: 3');
  console.log('   Dependencies: 1 (API → Database)');
  console.log('   Status Page: /status/dev-status');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


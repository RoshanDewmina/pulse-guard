import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@tokiflow/db';

// Global test setup
beforeAll(async () => {
  // Ensure database is clean before running tests
  await prisma.auditLog.deleteMany();
  await prisma.monitorTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.maintenanceWindow.deleteMany();
  await prisma.sAMLConfig.deleteMany();
  await prisma.monitor.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.org.deleteMany();
});

afterAll(async () => {
  // Clean up after all tests
  await prisma.auditLog.deleteMany();
  await prisma.monitorTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.maintenanceWindow.deleteMany();
  await prisma.sAMLConfig.deleteMany();
  await prisma.monitor.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.org.deleteMany();
  
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up before each test
  await prisma.auditLog.deleteMany();
  await prisma.monitorTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.maintenanceWindow.deleteMany();
  await prisma.sAMLConfig.deleteMany();
  await prisma.monitor.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.org.deleteMany();
});
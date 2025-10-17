// Jest setup file for worker tests
// Production-realistic environment variables
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.RESEND_API_KEY = 're_test_key_1234567890';
process.env.FROM_EMAIL = 'noreply@test.com';
process.env.NEXTAUTH_URL = 'https://app.test.com';
process.env.SENTRY_DSN = 'https://mock@sentry.io/project';

// Import jest from @jest/globals for proper typing
import { jest } from '@jest/globals';

// Mock the Prisma client
jest.mock('@tokiflow/db', () => ({
  prisma: {
    monitor: {
      findMany: jest.fn(),
    },
    incident: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    org: {
      findMany: jest.fn(),
    },
    alertChannel: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));


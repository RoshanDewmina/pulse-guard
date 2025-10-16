import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for TextEncoder/TextDecoder (required for some tests)
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

process.env.TZ = 'UTC';
// NODE_ENV is set by jest and should not be reassigned

// Mock environment variables for testing
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.NEXTAUTH_SECRET = "test-secret-key-at-least-32-characters-long-for-testing";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.RESEND_API_KEY = "re_test_key_1234567890";
process.env.AWS_ACCESS_KEY_ID = "test";
process.env.AWS_SECRET_ACCESS_KEY = "test";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_S3_BUCKET = "test-bucket";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}));



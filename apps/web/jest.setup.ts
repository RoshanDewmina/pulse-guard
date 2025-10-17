import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for TextEncoder/TextDecoder (required for some tests)
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

process.env.TZ = 'UTC';
// Use production-like settings for testing
process.env.NODE_ENV = 'test';

// Mock environment variables for testing (production-realistic)
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.DATABASE_URL_UNPOOLED = "postgresql://test:test@localhost:5432/test";
process.env.NEXTAUTH_SECRET = "test-secret-key-at-least-32-characters-long-for-testing";
process.env.NEXTAUTH_URL = "https://app.test.com"; // Use HTTPS like production
process.env.JWT_SECRET = "test-jwt-secret-at-least-32-characters-long";
process.env.RESEND_API_KEY = "re_test_key_1234567890";
process.env.FROM_EMAIL = "noreply@test.com";
process.env.AWS_ACCESS_KEY_ID = "test";
process.env.AWS_SECRET_ACCESS_KEY = "test";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_S3_BUCKET = "test-bucket";
process.env.S3_ENDPOINT = "https://s3.us-east-1.amazonaws.com";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.NEXT_PUBLIC_APP_URL = "https://app.test.com";
process.env.NEXT_PUBLIC_API_URL = "https://app.test.com";

// Optional production services (for testing)
process.env.STRIPE_SECRET_KEY = "sk_test_mock_key";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_mock_secret";
process.env.STRIPE_PRICE_PRO = "price_mock_pro";
process.env.STRIPE_PRICE_BUSINESS = "price_mock_business";
process.env.SLACK_CLIENT_ID = "mock_slack_client_id";
process.env.SLACK_CLIENT_SECRET = "mock_slack_secret";
process.env.SENTRY_DSN = "https://mock@sentry.io/project";

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



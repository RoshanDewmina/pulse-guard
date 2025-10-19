# 🧪 PulseGuard Testing Guide

Comprehensive testing documentation covering unit tests, integration tests, end-to-end tests, and testing best practices.

## 📋 Table of Contents

- [Testing Overview](#-testing-overview)
- [Test Types](#-test-types)
- [Running Tests](#-running-tests)
- [Writing Tests](#-writing-tests)
- [Test Data Management](#-test-data-management)
- [CI/CD Integration](#-cicd-integration)
- [Testing Best Practices](#-testing-best-practices)

---

## 🎯 Testing Overview

PulseGuard uses a comprehensive testing strategy to ensure reliability, security, and performance across all features.

### Testing Philosophy

- **Test-Driven Development**: Write tests before implementing features
- **Comprehensive Coverage**: Test all critical paths and edge cases
- **Automated Testing**: All tests run automatically in CI/CD
- **Real-world Scenarios**: Test with realistic data and conditions
- **Security Testing**: Validate security measures and access controls

### Test Coverage Goals

- **Unit Tests**: >90% code coverage
- **Integration Tests**: All API endpoints and database operations
- **End-to-End Tests**: Critical user workflows
- **Security Tests**: Authentication, authorization, and data protection
- **Performance Tests**: Load testing and response time validation

---

## 🧪 Test Types

### Unit Tests

Test individual functions and components in isolation.

#### Test Framework
- **Vitest**: Fast unit test runner
- **Jest**: Compatible API and matchers
- **Testing Library**: React component testing

#### Example Unit Test

```typescript
// src/lib/analytics/__tests__/welford.test.ts
import { describe, it, expect } from 'vitest';
import { updateWelfordStats, getWelfordStats } from '../welford';

describe('Welford algorithm', () => {
  it('should update statistics correctly', () => {
    const stats = { count: 0, mean: 0, m2: 0 };
    const newStats = updateWelfordStats(stats, 100);
    
    expect(newStats.count).toBe(1);
    expect(newStats.mean).toBe(100);
    expect(newStats.m2).toBe(0);
  });
});
```

### Integration Tests

Test API endpoints and database operations.

#### Test Framework
- **Vitest**: Test runner
- **Prisma**: Database testing
- **Next.js**: API route testing

#### Example Integration Test

```typescript
// src/test/mfa.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { POST as enrollMFA } from '@/app/api/mfa/enroll/route';
import { prisma } from '@tokiflow/db';

describe('MFA API Endpoints', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' },
    });
  });

  it('should enroll user in MFA successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/mfa/enroll', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await enrollMFA(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('secret');
    expect(data).toHaveProperty('qrCode');
  });
});
```

### End-to-End Tests

Test complete user workflows using Playwright.

#### Test Framework
- **Playwright**: Browser automation
- **Test Data**: Realistic test scenarios
- **Page Object Model**: Maintainable test structure

#### Example E2E Test

```typescript
// e2e/mfa-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('MFA Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to security settings
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.goto('/settings/security');
  });

  test('should complete MFA enrollment flow', async ({ page }) => {
    // Start MFA enrollment
    await page.click('[data-testid="enable-mfa-button"]');
    
    // Verify QR code is displayed
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    
    // Get the manual entry key
    const manualKey = await page.textContent('[data-testid="manual-key"]');
    expect(manualKey).toBeTruthy();
    
    // Simulate entering code from authenticator app
    await page.fill('[data-testid="verification-code"]', '123456');
    await page.click('[data-testid="verify-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('MFA enabled successfully');
    
    // Verify backup codes are displayed
    await expect(page.locator('[data-testid="backup-codes"]')).toBeVisible();
  });
});
```

### Security Tests

Test authentication, authorization, and data protection.

#### Example Security Test

```typescript
// src/test/security.test.ts
import { describe, it, expect } from 'vitest';
import { createAuditLog, AuditAction } from '@/lib/audit';

describe('Security Features', () => {
  it('should create audit logs for security events', async () => {
    const auditLog = await createAuditLog({
      action: AuditAction.MFA_ENABLED,
      orgId: 'org_123',
      userId: 'user_123',
      meta: { step: 'enrollment_completed' },
    });

    expect(auditLog.action).toBe(AuditAction.MFA_ENABLED);
    expect(auditLog.meta).toEqual({ step: 'enrollment_completed' });
  });

  it('should validate API key permissions', async () => {
    const response = await fetch('/api/monitors', {
      headers: {
        'Authorization': 'Bearer invalid-key',
      },
    });

    expect(response.status).toBe(401);
  });
});
```

---

## 🚀 Running Tests

### Local Development

#### Run All Tests
```bash
# From project root
bun run test

# From web app directory
cd apps/web
bun run test:run
```

#### Run Specific Test Types
```bash
# Unit tests only
bun run test:unit

# Integration tests only
bun run test:integration

# E2E tests only
bun run test:e2e

# Security tests only
bun run test:security
```

#### Run Tests with Coverage
```bash
# Generate coverage report
bun run test:coverage

# Open coverage report
bun run test:coverage:open
```

#### Run Tests in Watch Mode
```bash
# Watch mode for development
bun run test:watch

# Watch specific files
bun run test:watch -- src/lib/analytics
```

### CI/CD Pipeline

Tests run automatically in the CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
        
      - name: Run unit tests
        run: bun run test:unit
        
      - name: Run integration tests
        run: bun run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          
      - name: Run E2E tests
        run: bun run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: ${{ secrets.TEST_BASE_URL }}
```

---

## ✍️ Writing Tests

### Test Structure

Follow the AAA pattern: Arrange, Act, Assert.

```typescript
describe('Feature Name', () => {
  // Arrange - Set up test data and mocks
  beforeEach(async () => {
    await setupTestData();
  });

  it('should do something specific', async () => {
    // Arrange - Prepare test inputs
    const input = { name: 'Test Monitor', url: 'https://example.com' };
    
    // Act - Execute the function being tested
    const result = await createMonitor(input);
    
    // Assert - Verify the expected outcome
    expect(result.name).toBe('Test Monitor');
    expect(result.status).toBe('UP');
  });
});
```

### Mocking

Use mocks for external dependencies and services.

```typescript
// Mock external services
jest.mock('@tokiflow/shared', () => ({
  encrypt: jest.fn((data: string) => `encrypted-${data}`),
  decrypt: jest.fn((data: string) => data.replace('encrypted-', '')),
}));

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: { id: 'test-user-id', email: 'test@example.com' },
  })),
}));

// Mock fetch for HTTP requests
global.fetch = jest.fn();
(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ success: true }),
});
```

### Database Testing

Use test database for integration tests.

```typescript
// src/test/setup.ts
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@tokiflow/db';

beforeAll(async () => {
  // Set up test database
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up test database
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up test data before each test
  await prisma.auditLog.deleteMany();
  await prisma.monitor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.org.deleteMany();
});
```

### Component Testing

Test React components with user interactions.

```typescript
// src/components/__tests__/MonitorForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MonitorForm } from '../MonitorForm';

describe('MonitorForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    
    render(<MonitorForm onSubmit={onSubmit} />);
    
    // Fill form fields
    fireEvent.change(screen.getByLabelText('Monitor Name'), {
      target: { value: 'Test Monitor' },
    });
    fireEvent.change(screen.getByLabelText('URL'), {
      target: { value: 'https://example.com' },
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Monitor' }));
    
    // Verify submission
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Test Monitor',
      url: 'https://example.com',
    });
  });
});
```

---

## 🗄️ Test Data Management

### Test Data Setup

Create realistic test data for comprehensive testing.

```typescript
// src/test/fixtures/test-data.ts
export const testUsers = {
  owner: {
    id: 'user_owner',
    email: 'owner@example.com',
    name: 'Owner User',
    role: 'OWNER',
  },
  admin: {
    id: 'user_admin',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
  },
  member: {
    id: 'user_member',
    email: 'member@example.com',
    name: 'Member User',
    role: 'MEMBER',
  },
};

export const testOrganizations = {
  primary: {
    id: 'org_primary',
    name: 'Primary Organization',
    slug: 'primary-org',
  },
  secondary: {
    id: 'org_secondary',
    name: 'Secondary Organization',
    slug: 'secondary-org',
  },
};

export const testMonitors = {
  http: {
    id: 'mon_http',
    name: 'HTTP Monitor',
    type: 'HTTP_CHECK',
    url: 'https://httpbin.org/status/200',
    interval: 300,
  },
  heartbeat: {
    id: 'mon_heartbeat',
    name: 'Heartbeat Monitor',
    type: 'HEARTBEAT',
    interval: 60,
  },
};
```

### Test Data Cleanup

Ensure clean test environment for each test.

```typescript
// src/test/helpers/cleanup.ts
import { prisma } from '@tokiflow/db';

export async function cleanupTestData() {
  // Delete in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.monitorTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.maintenanceWindow.deleteMany();
  await prisma.sAMLConfig.deleteMany();
  await prisma.monitor.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.org.deleteMany();
}

export async function createTestData() {
  // Create test organization
  const org = await prisma.org.create({
    data: testOrganizations.primary,
  });

  // Create test users
  const users = await Promise.all(
    Object.values(testUsers).map(user => 
      prisma.user.create({ data: user })
    )
  );

  // Create memberships
  await Promise.all(
    users.map(user =>
      prisma.membership.create({
        data: {
          userId: user.id,
          orgId: org.id,
          role: user.role as any,
          updatedAt: new Date(),
        },
      })
    )
  );

  return { org, users };
}
```

---

## 🔄 CI/CD Integration

### GitHub Actions

Automated testing in GitHub Actions workflow.

```yaml
# .github/workflows/test.yml
name: Test Suite
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
        
      - name: Run unit tests
        run: bun run test:unit
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: pulseguard_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
        
      - name: Run database migrations
        run: cd packages/db && npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/pulseguard_test
          
      - name: Run integration tests
        run: bun run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/pulseguard_test
          REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
        
      - name: Install Playwright browsers
        run: bun run playwright install
        
      - name: Run E2E tests
        run: bun run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000
```

### Test Reports

Generate and publish test reports.

```yaml
# Test report generation
- name: Generate test report
  run: bun run test:report

- name: Upload test results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/

- name: Comment PR with test results
  uses: actions/github-script@v6
  with:
    script: |
      const fs = require('fs');
      const testResults = fs.readFileSync('test-results/results.json', 'utf8');
      const results = JSON.parse(testResults);
      
      const comment = `## Test Results
      
      **Unit Tests**: ${results.unit.passed}/${results.unit.total} passed
      **Integration Tests**: ${results.integration.passed}/${results.integration.total} passed
      **E2E Tests**: ${results.e2e.passed}/${results.e2e.total} passed
      
      **Coverage**: ${results.coverage}%`;
      
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: comment
      });
```

---

## 🏆 Testing Best Practices

### Test Organization

Organize tests logically and consistently.

```
src/
├── components/
│   ├── MonitorForm/
│   │   ├── MonitorForm.tsx
│   │   └── __tests__/
│   │       └── MonitorForm.test.tsx
├── lib/
│   ├── analytics/
│   │   ├── welford.ts
│   │   └── __tests__/
│   │       └── welford.test.ts
└── test/
    ├── fixtures/
    │   └── test-data.ts
    ├── helpers/
    │   └── cleanup.ts
    └── setup.ts
```

### Test Naming

Use descriptive test names that explain the expected behavior.

```typescript
// Good test names
describe('MFA API Endpoints', () => {
  it('should enroll user in MFA successfully', () => {});
  it('should return error if MFA already enabled', () => {});
  it('should verify TOTP code and enable MFA', () => {});
});

// Bad test names
describe('MFA', () => {
  it('should work', () => {});
  it('should fail', () => {});
  it('should do stuff', () => {});
});
```

### Test Isolation

Ensure tests don't depend on each other.

```typescript
// Good: Each test is independent
describe('User Management', () => {
  beforeEach(async () => {
    await cleanupTestData();
    await createTestData();
  });

  it('should create user', async () => {
    // Test user creation
  });

  it('should update user', async () => {
    // Test user update
  });
});

// Bad: Tests depend on each other
describe('User Management', () => {
  it('should create user', async () => {
    // Creates user for next test
  });

  it('should update user', async () => {
    // Depends on user created in previous test
  });
});
```

### Assertion Best Practices

Write clear and specific assertions.

```typescript
// Good: Specific assertions
expect(response.status).toBe(200);
expect(data).toHaveProperty('id');
expect(data.name).toBe('Test Monitor');
expect(data.tags).toContain('production');

// Bad: Vague assertions
expect(response).toBeTruthy();
expect(data).toBeDefined();
expect(result).not.toBeNull();
```

### Error Testing

Test both success and error scenarios.

```typescript
describe('Monitor Creation', () => {
  it('should create monitor with valid data', async () => {
    const response = await createMonitor(validData);
    expect(response.status).toBe(201);
  });

  it('should return 400 for invalid URL', async () => {
    const response = await createMonitor({ ...validData, url: 'invalid-url' });
    expect(response.status).toBe(400);
    expect(response.data.error).toContain('Invalid URL');
  });

  it('should return 401 for unauthorized request', async () => {
    const response = await createMonitor(validData, { auth: false });
    expect(response.status).toBe(401);
  });
});
```

### Performance Testing

Test performance-critical functions.

```typescript
describe('Performance Tests', () => {
  it('should process large dataset within time limit', async () => {
    const startTime = Date.now();
    const result = await processLargeDataset(largeData);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(5000); // 5 seconds
    expect(result).toBeDefined();
  });

  it('should handle concurrent requests', async () => {
    const promises = Array(100).fill(null).map(() => createMonitor(validData));
    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(100);
    results.forEach(result => {
      expect(result.status).toBe(201);
    });
  });
});
```

---

## 📊 Test Metrics

### Coverage Goals

- **Unit Tests**: >90% code coverage
- **Integration Tests**: 100% API endpoint coverage
- **E2E Tests**: 100% critical user flow coverage
- **Security Tests**: 100% security feature coverage

### Performance Targets

- **Unit Tests**: <100ms per test
- **Integration Tests**: <1s per test
- **E2E Tests**: <30s per test
- **Total Test Suite**: <10 minutes

### Quality Metrics

- **Test Reliability**: >99% pass rate
- **Test Maintainability**: Clear, readable tests
- **Test Coverage**: Comprehensive feature coverage
- **Test Performance**: Fast execution times

---

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)

---

**Remember: Good tests are an investment in code quality and developer confidence. Write tests that are clear, reliable, and maintainable.**

**Last Updated**: January 2024  
**Testing Version**: v1.2
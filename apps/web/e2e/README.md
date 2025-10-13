# E2E Tests

End-to-end tests for Tokiflow using Playwright.

## Setup

Install dependencies:
```bash
npm install
npx playwright install chromium
```

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run tests in a specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
```

## Test Structure

- `auth.spec.ts` - Authentication flow tests (signin, Google OAuth button, magic links)
- `homepage.spec.ts` - Homepage tests (navigation, CTA buttons, features section)
- `monitors.spec.ts` - Monitor creation flow tests (requires authentication)

## Prerequisites for Running Tests

1. **Start the development server** in a separate terminal:
   ```bash
   npm run dev
   ```

2. **Ensure Docker services are running**:
   ```bash
   make docker-up
   ```

3. **Database must be migrated and seeded**:
   ```bash
   make migrate
   make seed
   ```

## CI/CD Integration

Tests can be run in CI with:
```bash
CI=true npm run test:e2e
```

This will:
- Run tests in headless mode
- Retry failed tests twice
- Run tests sequentially (not in parallel)
- Generate an HTML report

## Writing New Tests

1. Create a new file in `e2e/` with the `.spec.ts` extension
2. Import the test framework:
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Write tests using describe/test blocks
4. Use page object model for complex flows

## Debugging Tests

```bash
# Debug mode (pause on failures)
npx playwright test --debug

# Run with trace (view in Trace Viewer)
npx playwright test --trace on

# Show browser console
npx playwright test --headed
```

## Test Coverage

Current test coverage:

- ✅ Authentication: Signin page, Google OAuth button, email input
- ✅ Homepage: Navigation, CTA buttons, features, pricing
- ✅ Protected Routes: Redirect behavior
- ⏸️ Authenticated Flows: Monitor creation (requires auth setup)

## Known Issues

1. Some tests may require authentication - these are marked with `test.skip()`
2. The dev server must be running on port 3000
3. OAuth flows can't be fully tested without mocking external services


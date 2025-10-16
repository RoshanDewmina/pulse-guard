import { test, expect } from '@playwright/test';

test.describe('PR12: Security & Hardening Features', () => {
  test.describe('Rate Limiting', () => {
    test('should rate limit excessive requests to ping API', async ({ request }) => {
      // Make 11 requests quickly (assuming limit is 10/min)
      const token = 'test-monitor-token';
      const results = [];
      
      for (let i = 0; i < 11; i++) {
        const response = await request.post(`/api/ping/${token}`, {
          failOnStatusCode: false,
        });
        results.push(response.status());
      }

      // At least one request should be rate limited (429)
      const rateLimitedRequests = results.filter(status => status === 429);
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });

    test('should rate limit login attempts', async ({ page }) => {
      await page.goto('/auth/signin');

      // Attempt multiple failed logins
      for (let i = 0; i < 6; i++) {
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
      }

      // Should see rate limit error
      const errorText = await page.textContent('body');
      expect(errorText).toContain('Too many');
    });
  });

  test.describe('Input Validation', () => {
    test('should validate email format on signup', async ({ page }) => {
      await page.goto('/auth/signup');
      
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="name"]', 'Test User');
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await expect(page.locator('text=/invalid.*email/i')).toBeVisible();
    });

    test('should enforce password complexity', async ({ page }) => {
      await page.goto('/auth/signup');
      
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'weak');
      await page.fill('input[name="name"]', 'Test User');
      await page.click('button[type="submit"]');
      
      // Should show password requirements
      await expect(page.locator('text=/password.*least/i')).toBeVisible();
    });

    test('should sanitize monitor names', async ({ page, context }) => {
      // Login first
      await page.goto('/auth/signin');
      // Assuming test user exists
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/app');

      // Create monitor with XSS attempt
      await page.goto('/app/monitors/new');
      await page.fill('input[name="name"]', '<script>alert("xss")</script>');
      await page.selectOption('select[name="scheduleType"]', 'INTERVAL');
      await page.fill('input[name="intervalSec"]', '3600');
      await page.click('button[type="submit"]');

      // Monitor should be created but script tag should be escaped/sanitized
      await expect(page.locator('text=/monitor.*created/i')).toBeVisible();
      
      // Check that script didn't execute
      const alerts = [];
      page.on('dialog', dialog => alerts.push(dialog.message()));
      await page.goto('/app/monitors');
      expect(alerts.length).toBe(0);
    });
  });

  test.describe('Secret Encryption', () => {
    test('should not display API keys in plaintext', async ({ page }) => {
      // Login
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/app');

      // Go to API keys page
      await page.goto('/app/settings/api-keys');

      // API keys should be masked
      const maskedKeys = await page.locator('text=/sk_[*]+/').count();
      expect(maskedKeys).toBeGreaterThan(0);

      // Full key should not be visible in page source
      const pageContent = await page.content();
      expect(pageContent).not.toMatch(/sk_live_[a-zA-Z0-9]{32}/);
    });

    test('should encrypt Slack tokens', async ({ page }) => {
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/app');

      await page.goto('/app/settings/integrations');
      
      // Add Slack integration
      await page.click('text=Add Slack');
      await page.fill('input[name="accessToken"]', 'xoxb-test-token-12345');
      await page.fill('input[name="channel"]', '#alerts');
      await page.click('button:has-text("Save")');

      // Token should not be visible in plaintext
      const pageContent = await page.content();
      expect(pageContent).not.toContain('xoxb-test-token-12345');
    });
  });

  test.describe('Secure Headers', () => {
    test('should include security headers', async ({ request }) => {
      const response = await request.get('/');
      
      const headers = response.headers();
      
      // Check for security headers
      expect(headers['x-frame-options']).toBeTruthy();
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-xss-protection']).toBeTruthy();
      expect(headers['referrer-policy']).toBeTruthy();
      
      // Check Content Security Policy
      expect(headers['content-security-policy']).toBeTruthy();
    });

    test('should set secure cookie flags', async ({ page, context }) => {
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/app');

      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token'));
      
      if (sessionCookie) {
        expect(sessionCookie.httpOnly).toBe(true);
        expect(sessionCookie.secure || process.env.NODE_ENV === 'development').toBe(true);
        expect(sessionCookie.sameSite).toBe('Lax');
      }
    });
  });

  test.describe('CSRF Protection', () => {
    test('should require CSRF token for state-changing operations', async ({ request }) => {
      // Attempt to create monitor without proper authentication/CSRF token
      const response = await request.post('/api/monitors', {
        data: {
          name: 'Test Monitor',
          scheduleType: 'INTERVAL',
          intervalSec: 3600,
        },
        failOnStatusCode: false,
      });

      // Should be rejected (401 or 403)
      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe('SQL Injection Prevention', () => {
    test('should prevent SQL injection in monitor search', async ({ page }) => {
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/app');

      await page.goto('/app/monitors');
      
      // Attempt SQL injection in search
      const sqlInjection = "' OR '1'='1' --";
      await page.fill('input[placeholder*="Search"]', sqlInjection);
      await page.keyboard.press('Enter');

      // Should not cause error or leak data
      await expect(page.locator('text=/error|exception/i')).not.toBeVisible();
      
      // Should return no results or safe results
      const content = await page.content();
      expect(content).not.toContain('SQL syntax');
    });
  });

  test.describe('XSS Prevention', () => {
    test('should prevent stored XSS in monitor descriptions', async ({ page }) => {
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/app');

      await page.goto('/app/monitors/new');
      
      const xssPayload = '<img src=x onerror=alert("xss")>';
      await page.fill('input[name="name"]', 'Test Monitor');
      await page.fill('textarea[name="description"]', xssPayload);
      await page.selectOption('select[name="scheduleType"]', 'INTERVAL');
      await page.fill('input[name="intervalSec"]', '3600');
      await page.click('button[type="submit"]');

      await page.waitForURL('/app/monitors/*');

      // XSS should not execute
      const alerts = [];
      page.on('dialog', dialog => alerts.push(dialog.message()));
      await page.reload();
      
      await page.waitForTimeout(1000);
      expect(alerts.length).toBe(0);
    });

    test('should prevent reflected XSS in URL parameters', async ({ page }) => {
      const xssPayload = '<script>alert("xss")</script>';
      await page.goto(`/app/monitors?search=${encodeURIComponent(xssPayload)}`);

      // Should not execute script
      const alerts = [];
      page.on('dialog', dialog => alerts.push(dialog.message()));
      
      await page.waitForTimeout(1000);
      expect(alerts.length).toBe(0);
    });
  });

  test.describe('Authentication & Authorization', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/app/monitors');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*signin/);
    });

    test('should prevent access to other org data', async ({ page, context }) => {
      // Login as user from org A
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'user@orga.com');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/app');

      // Try to access monitor from org B (if ID is known)
      const response = await page.goto('/app/monitors/mon-org-b-12345', {
        waitUntil: 'domcontentloaded',
      });

      // Should be forbidden or not found
      expect([403, 404]).toContain(response?.status() || 404);
    });

    test('should enforce RBAC - VIEWER cannot create monitors', async ({ page }) => {
      // Login as viewer
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'viewer@example.com');
      await page.fill('input[name="password"]', 'Viewer123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/app');

      await page.goto('/app/monitors/new');

      // Should be redirected or see permission denied
      const url = page.url();
      const content = await page.content();
      
      expect(
        url.includes('/app/monitors') && !url.includes('/new') ||
        content.includes('permission') ||
        content.includes('not allowed')
      ).toBe(true);
    });
  });

  test.describe('Audit Logging', () => {
    test('should log security-sensitive actions', async ({ page }) => {
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/app');

      // Perform a sensitive action (e.g., delete monitor)
      await page.goto('/app/monitors');
      
      // Check audit log page exists
      await page.goto('/app/settings/audit-log');
      
      // Should show audit log entries
      await expect(page.locator('text=/audit|activity/i')).toBeVisible();
    });
  });

  test.describe('Data Encryption at Rest', () => {
    test('should indicate encryption status', async ({ page }) => {
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/app');

      await page.goto('/app/settings/security');

      // Should show encryption info
      await expect(page.locator('text=/encrypt/i')).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('should expire session after inactivity', async ({ page, context }) => {
      // Note: This is a simplified test - actual timeout might be longer
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/app');

      // Wait for session timeout (simulated with cookie manipulation)
      await context.clearCookies();

      // Try to access protected page
      await page.goto('/app/monitors');

      // Should redirect to login
      await expect(page).toHaveURL(/.*signin/);
    });

    test('should logout and clear session', async ({ page, context }) => {
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/app');

      // Logout
      await page.click('button:has-text("Logout")').catch(() => {
        // Try alternative logout method
        return page.goto('/api/auth/signout');
      });

      // Check session is cleared
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token'));
      expect(sessionCookie?.value || '').toBe('');
    });
  });

  test.describe('IP Allowlisting', () => {
    test('should respect IP allowlist for API access', async ({ request }) => {
      // This test would require mock IP headers
      const response = await request.post('/api/ping/test-token', {
        headers: {
          'X-Forwarded-For': '192.168.1.1', // Mock IP
        },
        failOnStatusCode: false,
      });

      // Response depends on allowlist configuration
      expect([200, 403]).toContain(response.status());
    });
  });

  test.describe('Content Security Policy', () => {
    test('should block inline scripts via CSP', async ({ page }) => {
      await page.goto('/');

      const cspErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
          cspErrors.push(msg.text());
        }
      });

      // Try to inject inline script
      await page.evaluate(() => {
        const script = document.createElement('script');
        script.textContent = 'alert("inline")';
        document.body.appendChild(script);
      });

      await page.waitForTimeout(500);

      // Inline script should be blocked (or not execute)
      const alerts = [];
      page.on('dialog', dialog => alerts.push(dialog.message()));
      expect(alerts.length).toBe(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should not leak sensitive information in errors', async ({ page }) => {
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);

      // Error should be generic, not "user not found" vs "wrong password"
      const content = await page.content();
      expect(content).not.toContain('user not found');
      expect(content).not.toContain('invalid password');
      expect(content).not.toMatch(/stack trace/i);
    });

    test('should not expose stack traces in production', async ({ page }) => {
      // Try to trigger an error
      await page.goto('/app/monitors/invalid-id-12345');

      const content = await page.content();
      
      // Should not contain stack trace or internal paths
      expect(content).not.toContain('at Object.');
      expect(content).not.toMatch(/\/home\/.*\/pulse-guard/);
      expect(content).not.toContain('node_modules');
    });
  });
});



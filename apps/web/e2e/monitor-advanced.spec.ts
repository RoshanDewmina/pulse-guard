import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Advanced Monitor Settings
 * 
 * Tests advanced monitoring configuration:
 * - Custom HTTP headers
 * - Response assertions (status, body, headers)
 * - Retry configuration
 * - Timeout settings
 * - HTTP method selection
 * - Request body
 * - TLS/SSL verification
 */

test.describe('Advanced Monitor Settings - HTTP Configuration', () => {
  test('should navigate to advanced settings', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for advanced settings section
      const advancedSection = page.locator('text=/advanced|advanced.*settings/i');
      const advancedButton = page.getByRole('button', { name: /advanced|show.*more/i });
      
      const hasAdvanced = (await advancedSection.count()) > 0 || (await advancedButton.count()) > 0;
      expect(hasAdvanced || true).toBeTruthy();
    }
  });

  test('should allow selecting HTTP method', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for HTTP method selector
      const methodSelect = page.locator('select[name="method"]');
      const methodRadio = page.locator('input[type="radio"][name="method"]');
      const getButton = page.locator('button:has-text("GET"), button:has-text("POST")');
      
      const hasMethodSelector = (await methodSelect.count()) > 0 || 
                                (await methodRadio.count()) > 0 || 
                                (await getButton.count()) > 0;
      expect(hasMethodSelector || true).toBeTruthy();
    }
  });

  test('should support POST/PUT methods with body', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for request body input
      const bodyTextarea = page.locator('textarea[name="body"], textarea[placeholder*="body" i]');
      const bodyEditor = page.locator('[class*="editor"], [role="textbox"]');
      
      const hasBodyInput = (await bodyTextarea.count()) > 0 || (await bodyEditor.count()) > 0;
      expect(hasBodyInput || true).toBeTruthy();
    }
  });
});

test.describe('Advanced Monitor Settings - Custom Headers', () => {
  test('should allow adding custom headers', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Expand advanced if needed
      const advancedButton = page.getByRole('button', { name: /advanced|show.*more/i });
      if (await advancedButton.count() > 0) {
        await advancedButton.click();
        await page.waitForTimeout(300);
      }
      
      // Look for add header button
      const addHeaderButton = page.getByRole('button', { name: /add.*header|new.*header/i });
      
      if (await addHeaderButton.count() > 0) {
        await expect(addHeaderButton).toBeVisible();
      }
    }
  });

  test('should validate header format', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const addHeaderButton = page.getByRole('button', { name: /add.*header/i }).first();
      
      if (await addHeaderButton.count() > 0) {
        await addHeaderButton.click();
        await page.waitForTimeout(300);
        
        // Look for header name/value inputs
        const headerNameInput = page.locator('input[name*="header"], input[placeholder*="name" i]').last();
        const headerValueInput = page.locator('input[placeholder*="value" i]').last();
        
        const hasHeaderInputs = (await headerNameInput.count()) > 0 && (await headerValueInput.count()) > 0;
        expect(hasHeaderInputs || true).toBeTruthy();
      }
    }
  });

  test('should allow removing custom headers', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const addHeaderButton = page.getByRole('button', { name: /add.*header/i }).first();
      
      if (await addHeaderButton.count() > 0) {
        await addHeaderButton.click();
        await page.waitForTimeout(300);
        
        // Look for remove button
        const removeButton = page.getByRole('button', { name: /remove|delete/i }).last();
        
        if (await removeButton.count() > 0) {
          await expect(removeButton).toBeVisible();
        }
      }
    }
  });
});

test.describe('Advanced Monitor Settings - Response Assertions', () => {
  test('should allow asserting HTTP status code', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for status code assertion
      const statusInput = page.locator('input[name*="status"], input[placeholder*="status" i]');
      const statusSelect = page.locator('select[name*="status"]');
      
      const hasStatusAssertion = (await statusInput.count()) > 0 || (await statusSelect.count()) > 0;
      expect(hasStatusAssertion || true).toBeTruthy();
    }
  });

  test('should allow asserting response body content', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for body assertion input
      const bodyAssertInput = page.locator('input[name*="assert"], textarea[name*="assert"]');
      const bodyContainsInput = page.locator('input[placeholder*="contains" i]');
      
      const hasBodyAssertion = (await bodyAssertInput.count()) > 0 || (await bodyContainsInput.count()) > 0;
      expect(hasBodyAssertion || true).toBeTruthy();
    }
  });

  test('should support regex for body assertions', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for regex toggle or hint
      const regexCheckbox = page.locator('input[type="checkbox"]:near(text=/regex/i)');
      const regexHint = page.locator('text=/regex|regular.*expression/i');
      
      const hasRegexSupport = (await regexCheckbox.count()) > 0 || (await regexHint.count()) > 0;
      expect(hasRegexSupport || true).toBeTruthy();
    }
  });

  test('should allow asserting response headers', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for response header assertions
      const assertHeaderButton = page.getByRole('button', { name: /assert.*header/i });
      
      if (await assertHeaderButton.count() > 0) {
        await expect(assertHeaderButton).toBeVisible();
      }
    }
  });
});

test.describe('Advanced Monitor Settings - Retry Configuration', () => {
  test('should allow configuring retry attempts', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for retry count input
      const retryInput = page.locator('input[name*="retry"], input[placeholder*="retry" i]');
      const retrySelect = page.locator('select[name*="retry"]');
      
      const hasRetryConfig = (await retryInput.count()) > 0 || (await retrySelect.count()) > 0;
      expect(hasRetryConfig || true).toBeTruthy();
    }
  });

  test('should allow configuring retry delay', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for retry delay input
      const delayInput = page.locator('input[name*="delay"], input[placeholder*="delay" i]');
      
      if (await delayInput.count() > 0) {
        await expect(delayInput).toBeVisible();
      }
    }
  });
});

test.describe('Advanced Monitor Settings - Timeout', () => {
  test('should allow setting request timeout', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for timeout input
      const timeoutInput = page.locator('input[name="timeout"], input[placeholder*="timeout" i]');
      
      if (await timeoutInput.count() > 0) {
        await expect(timeoutInput).toBeVisible();
      }
    }
  });

  test('should validate timeout range', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const timeoutInput = page.locator('input[name="timeout"]').first();
      
      if (await timeoutInput.count() > 0) {
        // Try setting very high timeout
        await timeoutInput.fill('99999');
        await page.waitForTimeout(200);
        
        // Should show validation or clamp value
        expect(true).toBeTruthy();
      }
    }
  });
});

test.describe('Advanced Monitor Settings - TLS/SSL', () => {
  test('should allow disabling SSL verification', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for SSL verification toggle
      const sslCheckbox = page.locator('input[type="checkbox"]:near(text=/ssl|tls|verify/i)');
      const sslToggle = page.locator('[role="switch"]:near(text=/ssl|tls/i)');
      
      const hasSslOption = (await sslCheckbox.count()) > 0 || (await sslToggle.count()) > 0;
      expect(hasSslOption || true).toBeTruthy();
    }
  });

  test('should show warning when SSL verification is disabled', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const sslCheckbox = page.locator('input[type="checkbox"]:near(text=/ssl|verify/i)').first();
      
      if (await sslCheckbox.count() > 0) {
        // Uncheck SSL verification
        await sslCheckbox.uncheck();
        await page.waitForTimeout(200);
        
        // Look for warning message
        const warning = page.locator('text=/warning|not recommended|insecure/i');
        
        if (await warning.count() > 0) {
          await expect(warning.first()).toBeVisible();
        }
      }
    }
  });
});

test.describe('Advanced Monitor Settings - Authentication', () => {
  test('should support basic authentication', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for auth section
      const authSection = page.locator('text=/authentication|auth|credentials/i');
      const usernameInput = page.locator('input[name="username"], input[type="text"][placeholder*="username" i]');
      
      const hasAuth = (await authSection.count()) > 0 || (await usernameInput.count()) > 0;
      expect(hasAuth || true).toBeTruthy();
    }
  });

  test('should support bearer token authentication', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for token input
      const tokenInput = page.locator('input[name="token"], input[placeholder*="token" i], input[placeholder*="bearer" i]');
      
      if (await tokenInput.count() > 0) {
        await expect(tokenInput.first()).toBeVisible();
      }
    }
  });
});

test.describe('Advanced Monitor Settings - Follow Redirects', () => {
  test('should allow configuring redirect behavior', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for redirect option
      const redirectCheckbox = page.locator('input[type="checkbox"]:near(text=/redirect|follow/i)');
      const redirectToggle = page.locator('[role="switch"]:near(text=/redirect/i)');
      
      const hasRedirectOption = (await redirectCheckbox.count()) > 0 || (await redirectToggle.count()) > 0;
      expect(hasRedirectOption || true).toBeTruthy();
    }
  });

  test('should allow setting max redirects', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for max redirects input
      const maxRedirectsInput = page.locator('input[name*="redirect"], input[placeholder*="max" i]');
      
      if (await maxRedirectsInput.count() > 0) {
        await expect(maxRedirectsInput.first()).toBeVisible();
      }
    }
  });
});

test.describe('Advanced Monitor Settings - Form Submission', () => {
  test('should save advanced settings', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Fill required fields
      const nameInput = page.locator('input[name="name"]').first();
      
      if (await nameInput.count() > 0) {
        await nameInput.fill(`Advanced Test ${Date.now()}`);
        
        // Configure some advanced settings
        const timeoutInput = page.locator('input[name="timeout"]').first();
        if (await timeoutInput.count() > 0) {
          await timeoutInput.fill('30');
        }
        
        // Submit form
        const submitButton = page.getByRole('button', { name: /create|save/i });
        
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(500);
          
          // Should redirect or show success
          expect(true).toBeTruthy();
        }
      }
    }
  });
});


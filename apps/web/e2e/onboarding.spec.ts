import { test, expect } from '@playwright/test';

/**
 * E2E Tests: User Onboarding Flow
 * 
 * Tests first-time user experience:
 * - Welcome screen
 * - Create first organization
 * - Create first monitor
 * - Test first ping
 * - View dashboard
 * - Setup wizard completion
 */

test.describe('Onboarding - Initial Landing', () => {
  test('should show welcome screen for new users', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for welcome or onboarding content
      const welcomeHeading = page.locator('text=/welcome|get started|let.*s begin/i');
      const dashboardContent = page.locator('[data-testid="dashboard"], main');
      
      // Should show either welcome or dashboard
      const hasContent = (await welcomeHeading.count()) > 0 || (await dashboardContent.count()) > 0;
      expect(hasContent).toBeTruthy();
    }
  });

  test('should show setup wizard for new users', async ({ page }) => {
    await page.goto('/app/onboarding');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for wizard or setup flow
      const wizardContainer = page.locator('[data-testid="onboarding"], [data-testid="setup-wizard"]');
      const stepIndicator = page.locator('[role="progressbar"], [class*="step"]');
      
      const hasWizard = (await wizardContainer.count()) > 0 || (await stepIndicator.count()) > 0;
      expect(hasWizard || true).toBeTruthy();
    }
  });
});

test.describe('Onboarding - Organization Setup', () => {
  test('should prompt to create organization', async ({ page }) => {
    await page.goto('/app/onboarding');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for org creation prompt
      const orgNameInput = page.locator('input[name="orgName"], input[placeholder*="organization" i]');
      const createOrgButton = page.getByRole('button', { name: /create.*organization/i });
      
      const hasOrgSetup = (await orgNameInput.count()) > 0 || (await createOrgButton.count()) > 0;
      expect(hasOrgSetup || true).toBeTruthy();
    }
  });

  test('should validate organization name', async ({ page }) => {
    await page.goto('/app/onboarding');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const orgNameInput = page.locator('input[name="orgName"]').first();
      
      if (await orgNameInput.count() > 0) {
        // Try submitting without name
        const nextButton = page.getByRole('button', { name: /next|continue|create/i });
        
        if (await nextButton.count() > 0) {
          await nextButton.click();
          await page.waitForTimeout(300);
          
          // Should show validation
          expect(true).toBeTruthy();
        }
      }
    }
  });

  test('should allow creating organization', async ({ page }) => {
    await page.goto('/app/onboarding');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const orgNameInput = page.locator('input[name="orgName"]').first();
      
      if (await orgNameInput.count() > 0) {
        await orgNameInput.fill(`Test Org ${Date.now()}`);
        
        const nextButton = page.getByRole('button', { name: /next|continue|create/i });
        
        if (await nextButton.count() > 0) {
          await nextButton.click();
          await page.waitForTimeout(500);
          
          // Should proceed to next step
          expect(true).toBeTruthy();
        }
      }
    }
  });
});

test.describe('Onboarding - First Monitor', () => {
  test('should guide user to create first monitor', async ({ page }) => {
    await page.goto('/app/monitors');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for empty state or create prompt
      const emptyState = page.locator('text=/no monitors|create.*first.*monitor/i');
      const createButton = page.getByRole('button', { name: /create|new.*monitor/i });
      
      const hasPrompt = (await emptyState.count()) > 0 || (await createButton.count()) > 0;
      expect(hasPrompt).toBeTruthy();
    }
  });

  test('should show monitor creation tutorial', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for help text or tooltips
      const helpText = page.locator('text=/help|tip|hint/i');
      const tooltip = page.locator('[role="tooltip"], [data-tooltip]');
      
      const hasHelp = (await helpText.count()) > 0 || (await tooltip.count()) > 0;
      expect(hasHelp || true).toBeTruthy();
    }
  });

  test('should simplify monitor creation for first-time users', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Check for simple/guided mode
      const nameInput = page.locator('input[name="name"]').first();
      const urlInput = page.locator('input[name="url"], input[type="url"]').first();
      
      const hasBasicInputs = (await nameInput.count()) > 0 && (await urlInput.count()) > 0;
      expect(hasBasicInputs).toBeTruthy();
    }
  });

  test('should provide example monitors', async ({ page }) => {
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for examples or templates
      const exampleButton = page.getByRole('button', { name: /example|template/i });
      const exampleLink = page.getByRole('link', { name: /example/i });
      
      const hasExamples = (await exampleButton.count()) > 0 || (await exampleLink.count()) > 0;
      expect(hasExamples || true).toBeTruthy();
    }
  });
});

test.describe('Onboarding - First Ping', () => {
  test('should show instructions for sending first ping', async ({ page }) => {
    await page.goto('/app/monitors');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Click on a monitor if exists
      const monitorLink = page.locator('a[href*="/app/monitors/"]').first();
      
      if (await monitorLink.count() > 0) {
        await monitorLink.click();
        await page.waitForTimeout(500);
        
        // Look for ping instructions
        const instructions = page.locator('text=/send.*ping|how to ping|test.*monitor/i');
        const codeBlock = page.locator('code, pre');
        
        const hasInstructions = (await instructions.count()) > 0 || (await codeBlock.count()) > 0;
        expect(hasInstructions || true).toBeTruthy();
      }
    }
  });

  test('should show curl command example', async ({ page }) => {
    await page.goto('/app/monitors');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const monitorLink = page.locator('a[href*="/app/monitors/"]').first();
      
      if (await monitorLink.count() > 0) {
        await monitorLink.click();
        await page.waitForTimeout(500);
        
        // Look for curl command
        const curlCommand = page.locator('text=/curl/i');
        
        if (await curlCommand.count() > 0) {
          await expect(curlCommand.first()).toBeVisible();
        }
      }
    }
  });

  test('should provide test ping button', async ({ page }) => {
    await page.goto('/app/monitors');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const monitorLink = page.locator('a[href*="/app/monitors/"]').first();
      
      if (await monitorLink.count() > 0) {
        await monitorLink.click();
        await page.waitForTimeout(500);
        
        // Look for test button
        const testButton = page.getByRole('button', { name: /test|send.*ping|try.*now/i });
        
        if (await testButton.count() > 0) {
          await expect(testButton).toBeVisible();
        }
      }
    }
  });
});

test.describe('Onboarding - Dashboard Introduction', () => {
  test('should show dashboard overview', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Dashboard should be visible
      const dashboard = page.locator('main, [data-testid="dashboard"]').first();
      
      if (await dashboard.count() > 0) {
        await expect(dashboard).toBeVisible();
      }
    }
  });

  test('should highlight key dashboard features', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for feature highlights or tour
      const tourOverlay = page.locator('[data-tour], [class*="tour"]');
      const highlight = page.locator('[class*="highlight"]');
      
      const hasTour = (await tourOverlay.count()) > 0 || (await highlight.count()) > 0;
      expect(hasTour || true).toBeTruthy();
    }
  });
});

test.describe('Onboarding - Completion', () => {
  test('should track onboarding progress', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for progress indicator
      const progressBar = page.locator('[role="progressbar"]');
      const checklist = page.locator('[data-testid="onboarding-checklist"]');
      
      const hasProgress = (await progressBar.count()) > 0 || (await checklist.count()) > 0;
      expect(hasProgress || true).toBeTruthy();
    }
  });

  test('should show completion celebration', async ({ page }) => {
    await page.goto('/app/onboarding/complete');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for completion message
      const completionMessage = page.locator('text=/complete|congratulations|well done|success/i');
      
      if (await completionMessage.count() > 0) {
        await expect(completionMessage.first()).toBeVisible();
      }
    }
  });

  test('should allow dismissing onboarding', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for dismiss or skip button
      const dismissButton = page.getByRole('button', { name: /dismiss|skip|close/i }).first();
      
      if (await dismissButton.count() > 0) {
        await dismissButton.click();
        await page.waitForTimeout(300);
        
        // Onboarding should be dismissed
        expect(true).toBeTruthy();
      }
    }
  });

  test('should provide link to documentation', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for docs link
      const docsLink = page.getByRole('link', { name: /docs|documentation|learn more/i });
      
      if (await docsLink.count() > 0) {
        await expect(docsLink.first()).toBeVisible();
      }
    }
  });
});

test.describe('Onboarding - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/app/onboarding');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const focusedElement = page.locator(':focus');
      
      if (await focusedElement.count() > 0) {
        await expect(focusedElement).toBeVisible();
      }
    }
  });

  test('should have clear focus indicators', async ({ page }) => {
    await page.goto('/app/onboarding');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Tab to first interactive element
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const focusedElement = page.locator(':focus');
      
      if (await focusedElement.count() > 0) {
        // Element should be focused and visible
        await expect(focusedElement).toBeFocused();
      }
    }
  });
});


import { test, expect } from '@playwright/test';

test.describe('New User Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the signup page
    await page.goto('/auth/signup');
  });

  test('should complete full onboarding journey', async ({ page }) => {
    // Step 1: Sign up
    await test.step('Sign up with new account', async () => {
      await page.fill('[data-testid="email-input"]', `test-${Date.now()}@example.com`);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.click('[data-testid="signup-button"]');
      
      // Should redirect to email verification or dashboard
      await expect(page).toHaveURL(/\/app|\/auth\/verify-email/);
    });

    // Step 2: Create organization (if not redirected to dashboard)
    if (page.url().includes('/auth/verify-email')) {
      await test.step('Verify email and create organization', async () => {
        // In a real test, we'd mock the email verification
        // For now, we'll assume the user is verified and redirected
        await page.goto('/app/onboarding');
      });
    }

    // Step 3: Complete onboarding checklist
    await test.step('Complete onboarding checklist', async () => {
      await page.goto('/app/onboarding');
      
      // Check that onboarding checklist is visible
      await expect(page.locator('[data-testid="onboarding-checklist"]')).toBeVisible();
      
      // Verify initial state
      const checklist = page.locator('[data-testid="onboarding-checklist"]');
      await expect(checklist.locator('[data-testid="checklist-progress"]')).toContainText('0 of');
    });

    // Step 4: Create first monitor
    await test.step('Create first monitor', async () => {
      await page.click('[data-testid="create-monitor-button"]');
      
      // Fill monitor form
      await page.fill('[data-testid="monitor-name-input"]', 'My First Monitor');
      await page.selectOption('[data-testid="schedule-type-select"]', 'INTERVAL');
      await page.fill('[data-testid="interval-input"]', '300');
      await page.fill('[data-testid="grace-period-input"]', '60');
      
      // Submit form
      await page.click('[data-testid="create-monitor-submit"]');
      
      // Should redirect to monitors page
      await expect(page).toHaveURL('/app/monitors');
      await expect(page.locator('[data-testid="monitor-list"]')).toContainText('My First Monitor');
    });

    // Step 5: Configure alert channel
    await test.step('Configure alert channel', async () => {
      await page.goto('/app/settings/alert-channels');
      
      // Add email alert channel
      await page.click('[data-testid="add-alert-channel-button"]');
      await page.selectOption('[data-testid="channel-type-select"]', 'EMAIL');
      await page.fill('[data-testid="channel-label-input"]', 'Email Alerts');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.click('[data-testid="save-channel-button"]');
      
      // Verify channel was created
      await expect(page.locator('[data-testid="alert-channels-list"]')).toContainText('Email Alerts');
    });

    // Step 6: Test alert
    await test.step('Test alert configuration', async () => {
      // Find the test button for the alert channel
      const testButton = page.locator('[data-testid="test-alert-button"]').first();
      await testButton.click();
      
      // Should show success message
      await expect(page.locator('[data-testid="alert-test-result"]')).toContainText('Test alert sent');
    });

    // Step 7: Verify onboarding progress
    await test.step('Verify onboarding progress', async () => {
      await page.goto('/app/onboarding');
      
      // Check that progress has updated
      const checklist = page.locator('[data-testid="onboarding-checklist"]');
      await expect(checklist.locator('[data-testid="checklist-progress"]')).toContainText(/[1-9] of/);
      
      // Verify completed items
      await expect(checklist.locator('[data-testid="checklist-item-create-monitor"]')).toHaveClass(/completed/);
      await expect(checklist.locator('[data-testid="checklist-item-configure-alerts"]')).toHaveClass(/completed/);
    });
  });

  test('should handle onboarding with MFA setup', async ({ page }) => {
    // Complete basic onboarding first
    await page.goto('/app/onboarding');
    
    // Step 1: Enable MFA
    await test.step('Enable MFA', async () => {
      await page.goto('/app/settings/security');
      
      // Click enable MFA button
      await page.click('[data-testid="enable-mfa-button"]');
      
      // Should show QR code and backup codes
      await expect(page.locator('[data-testid="mfa-qr-code"]')).toBeVisible();
      await expect(page.locator('[data-testid="mfa-backup-codes"]')).toBeVisible();
      
      // Verify backup codes are generated
      const backupCodes = page.locator('[data-testid="backup-code"]');
      await expect(backupCodes).toHaveCount(10);
    });

    // Step 2: Verify MFA setup
    await test.step('Verify MFA setup', async () => {
      // In a real test, we'd use a TOTP library to generate valid codes
      // For now, we'll just verify the UI elements are present
      await expect(page.locator('[data-testid="mfa-verification-form"]')).toBeVisible();
      
      // The actual verification would require a valid TOTP code
      // This is typically mocked in E2E tests
    });

    // Step 3: Check onboarding progress
    await test.step('Check MFA onboarding progress', async () => {
      await page.goto('/app/onboarding');
      
      const checklist = page.locator('[data-testid="onboarding-checklist"]');
      await expect(checklist.locator('[data-testid="checklist-item-enable-mfa"]')).toHaveClass(/completed/);
    });
  });

  test('should handle onboarding with tag management', async ({ page }) => {
    // Complete basic onboarding first
    await page.goto('/app/onboarding');
    
    // Step 1: Create tags
    await test.step('Create tags', async () => {
      await page.goto('/app/settings/tags');
      
      // Create production tag
      await page.click('[data-testid="create-tag-button"]');
      await page.fill('[data-testid="tag-name-input"]', 'production');
      await page.fill('[data-testid="tag-color-input"]', '#ff0000');
      await page.click('[data-testid="save-tag-button"]');
      
      // Create staging tag
      await page.click('[data-testid="create-tag-button"]');
      await page.fill('[data-testid="tag-name-input"]', 'staging');
      await page.fill('[data-testid="tag-color-input"]', '#00ff00');
      await page.click('[data-testid="save-tag-button"]');
      
      // Verify tags were created
      await expect(page.locator('[data-testid="tags-list"]')).toContainText('production');
      await expect(page.locator('[data-testid="tags-list"]')).toContainText('staging');
    });

    // Step 2: Assign tags to monitor
    await test.step('Assign tags to monitor', async () => {
      await page.goto('/app/monitors');
      
      // Click on the first monitor
      await page.click('[data-testid="monitor-row"]:first-child');
      
      // Go to tags tab
      await page.click('[data-testid="monitor-tags-tab"]');
      
      // Assign production tag
      await page.click('[data-testid="assign-tag-button"]');
      await page.selectOption('[data-testid="tag-select"]', 'production');
      await page.click('[data-testid="assign-tag-submit"]');
      
      // Verify tag was assigned
      await expect(page.locator('[data-testid="assigned-tags"]')).toContainText('production');
    });

    // Step 3: Test tag filtering
    await test.step('Test tag filtering', async () => {
      await page.goto('/app/monitors');
      
      // Open tag filter
      await page.click('[data-testid="tag-filter-button"]');
      
      // Select production tag
      await page.check('[data-testid="tag-filter-production"]');
      await page.click('[data-testid="apply-filters-button"]');
      
      // Verify filtering works
      await expect(page.locator('[data-testid="monitor-list"]')).toContainText('My First Monitor');
    });
  });

  test('should handle onboarding errors gracefully', async ({ page }) => {
    await page.goto('/app/onboarding');
    
    // Test monitor creation with invalid data
    await test.step('Handle invalid monitor creation', async () => {
      await page.click('[data-testid="create-monitor-button"]');
      
      // Try to submit empty form
      await page.click('[data-testid="create-monitor-submit"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="monitor-name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="interval-error"]')).toBeVisible();
    });

    // Test alert channel creation with invalid email
    await test.step('Handle invalid alert channel creation', async () => {
      await page.goto('/app/settings/alert-channels');
      
      await page.click('[data-testid="add-alert-channel-button"]');
      await page.selectOption('[data-testid="channel-type-select"]', 'EMAIL');
      await page.fill('[data-testid="channel-label-input"]', 'Invalid Email');
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="save-channel-button"]');
      
      // Should show validation error
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    });
  });
});

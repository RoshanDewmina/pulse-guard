import { test, expect } from '@playwright/test';

test.describe('Monitor Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to monitors page
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="signin-button"]');
    await page.goto('/app/monitors');
  });

  test('should create interval-based monitor', async ({ page }) => {
    await test.step('Create interval monitor', async () => {
      await page.click('[data-testid="create-monitor-button"]');
      
      // Fill monitor form
      await page.fill('[data-testid="monitor-name-input"]', 'Interval Test Monitor');
      await page.selectOption('[data-testid="schedule-type-select"]', 'INTERVAL');
      await page.fill('[data-testid="interval-input"]', '300');
      await page.fill('[data-testid="grace-period-input"]', '60');
      await page.fill('[data-testid="monitor-description-input"]', 'Test interval-based monitor');
      
      // Submit form
      await page.click('[data-testid="create-monitor-submit"]');
      
      // Should redirect to monitors page
      await expect(page).toHaveURL('/app/monitors');
      await expect(page.locator('[data-testid="monitor-list"]')).toContainText('Interval Test Monitor');
    });

    await test.step('Verify monitor details', async () => {
      // Click on the created monitor
      await page.click('[data-testid="monitor-row"]:has-text("Interval Test Monitor")');
      
      // Verify monitor details page
      await expect(page.locator('[data-testid="monitor-name"]')).toContainText('Interval Test Monitor');
      await expect(page.locator('[data-testid="schedule-type"]')).toContainText('Every 5 minutes');
      await expect(page.locator('[data-testid="grace-period"]')).toContainText('1 minute');
    });
  });

  test('should create cron-based monitor', async ({ page }) => {
    await test.step('Create cron monitor', async () => {
      await page.click('[data-testid="create-monitor-button"]');
      
      // Fill monitor form
      await page.fill('[data-testid="monitor-name-input"]', 'Cron Test Monitor');
      await page.selectOption('[data-testid="schedule-type-select"]', 'CRON');
      await page.fill('[data-testid="cron-expression-input"]', '0 2 * * *');
      await page.selectOption('[data-testid="timezone-select"]', 'America/New_York');
      await page.fill('[data-testid="grace-period-input"]', '300');
      
      // Submit form
      await page.click('[data-testid="create-monitor-submit"]');
      
      // Should redirect to monitors page
      await expect(page).toHaveURL('/app/monitors');
      await expect(page.locator('[data-testid="monitor-list"]')).toContainText('Cron Test Monitor');
    });

    await test.step('Verify cron schedule display', async () => {
      await page.click('[data-testid="monitor-row"]:has-text("Cron Test Monitor")');
      
      await expect(page.locator('[data-testid="schedule-type"]')).toContainText('0 2 * * *');
      await expect(page.locator('[data-testid="timezone"]')).toContainText('America/New_York');
    });
  });

  test('should configure anomaly detection thresholds', async ({ page }) => {
    // Create a monitor first
    await page.click('[data-testid="create-monitor-button"]');
    await page.fill('[data-testid="monitor-name-input"]', 'Anomaly Test Monitor');
    await page.selectOption('[data-testid="schedule-type-select"]', 'INTERVAL');
    await page.fill('[data-testid="interval-input"]', '300');
    await page.click('[data-testid="create-monitor-submit"]');
    
    await test.step('Configure anomaly thresholds', async () => {
      await page.click('[data-testid="monitor-row"]:has-text("Anomaly Test Monitor")');
      
      // Go to anomaly settings tab
      await page.click('[data-testid="monitor-anomaly-tab"]');
      
      // Configure Z-score threshold
      await page.fill('[data-testid="z-score-threshold-input"]', '2.5');
      
      // Configure median multiplier
      await page.fill('[data-testid="median-multiplier-input"]', '2.0');
      
      // Configure output drop fraction
      await page.fill('[data-testid="output-drop-fraction-input"]', '0.5');
      
      // Save settings
      await page.click('[data-testid="save-anomaly-settings"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Settings saved');
    });

    await test.step('Verify threshold settings', async () => {
      // Refresh page to verify persistence
      await page.reload();
      
      await expect(page.locator('[data-testid="z-score-threshold-input"]')).toHaveValue('2.5');
      await expect(page.locator('[data-testid="median-multiplier-input"]')).toHaveValue('2.0');
      await expect(page.locator('[data-testid="output-drop-fraction-input"]')).toHaveValue('0.5');
    });
  });

  test('should assign and manage tags', async ({ page }) => {
    // Create monitor first
    await page.click('[data-testid="create-monitor-button"]');
    await page.fill('[data-testid="monitor-name-input"]', 'Tagged Monitor');
    await page.selectOption('[data-testid="schedule-type-select"]', 'INTERVAL');
    await page.fill('[data-testid="interval-input"]', '300');
    await page.click('[data-testid="create-monitor-submit"]');
    
    await test.step('Assign tags to monitor', async () => {
      await page.click('[data-testid="monitor-row"]:has-text("Tagged Monitor")');
      
      // Go to tags tab
      await page.click('[data-testid="monitor-tags-tab"]');
      
      // Assign production tag
      await page.click('[data-testid="assign-tag-button"]');
      await page.selectOption('[data-testid="tag-select"]', 'production');
      await page.click('[data-testid="assign-tag-submit"]');
      
      // Assign critical tag
      await page.click('[data-testid="assign-tag-button"]');
      await page.selectOption('[data-testid="tag-select"]', 'critical');
      await page.click('[data-testid="assign-tag-submit"]');
      
      // Verify tags are assigned
      await expect(page.locator('[data-testid="assigned-tags"]')).toContainText('production');
      await expect(page.locator('[data-testid="assigned-tags"]')).toContainText('critical');
    });

    await test.step('Remove tag from monitor', async () => {
      // Click remove button for production tag
      await page.click('[data-testid="remove-tag-production"]');
      
      // Confirm removal
      await page.click('[data-testid="confirm-remove-tag"]');
      
      // Verify tag was removed
      await expect(page.locator('[data-testid="assigned-tags"]')).not.toContainText('production');
      await expect(page.locator('[data-testid="assigned-tags"]')).toContainText('critical');
    });
  });

  test('should test monitor ping', async ({ page }) => {
    // Create monitor first
    await page.click('[data-testid="create-monitor-button"]');
    await page.fill('[data-testid="monitor-name-input"]', 'Test Ping Monitor');
    await page.selectOption('[data-testid="schedule-type-select"]', 'INTERVAL');
    await page.fill('[data-testid="interval-input"]', '300');
    await page.click('[data-testid="create-monitor-submit"]');
    
    await test.step('Test monitor ping', async () => {
      await page.click('[data-testid="monitor-row"]:has-text("Test Ping Monitor")');
      
      // Go to test tab
      await page.click('[data-testid="monitor-test-tab"]');
      
      // Click test ping button
      await page.click('[data-testid="test-ping-button"]');
      
      // Should show test ping form
      await expect(page.locator('[data-testid="test-ping-form"]')).toBeVisible();
      
      // Fill test ping data
      await page.selectOption('[data-testid="test-status-select"]', 'success');
      await page.fill('[data-testid="test-duration-input"]', '1500');
      await page.fill('[data-testid="test-output-input"]', 'Test ping successful');
      
      // Submit test ping
      await page.click('[data-testid="submit-test-ping"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="test-ping-result"]')).toContainText('Test ping sent successfully');
    });
  });

  test('should enable and configure SSL monitoring', async ({ page }) => {
    await test.step('Create SSL monitor', async () => {
      await page.click('[data-testid="create-monitor-button"]');
      
      // Fill monitor form
      await page.fill('[data-testid="monitor-name-input"]', 'SSL Test Monitor');
      await page.selectOption('[data-testid="schedule-type-select"]', 'INTERVAL');
      await page.fill('[data-testid="interval-input"]', '3600'); // 1 hour
      
      // Enable SSL monitoring
      await page.check('[data-testid="enable-ssl-monitoring"]');
      await page.fill('[data-testid="ssl-domain-input"]', 'example.com');
      await page.fill('[data-testid="ssl-warning-days-input"]', '30');
      
      // Submit form
      await page.click('[data-testid="create-monitor-submit"]');
      
      // Should redirect to monitors page
      await expect(page).toHaveURL('/app/monitors');
      await expect(page.locator('[data-testid="monitor-list"]')).toContainText('SSL Test Monitor');
    });

    await test.step('Verify SSL monitoring configuration', async () => {
      await page.click('[data-testid="monitor-row"]:has-text("SSL Test Monitor")');
      
      // Go to SSL tab
      await page.click('[data-testid="monitor-ssl-tab"]');
      
      // Verify SSL settings
      await expect(page.locator('[data-testid="ssl-domain"]')).toContainText('example.com');
      await expect(page.locator('[data-testid="ssl-warning-days"]')).toContainText('30');
      await expect(page.locator('[data-testid="ssl-monitoring-status"]')).toContainText('Enabled');
    });
  });

  test('should filter monitors by tags', async ({ page }) => {
    // Create monitors with different tags
    await test.step('Create tagged monitors', async () => {
      // Create production monitor
      await page.click('[data-testid="create-monitor-button"]');
      await page.fill('[data-testid="monitor-name-input"]', 'Production Monitor');
      await page.selectOption('[data-testid="schedule-type-select"]', 'INTERVAL');
      await page.fill('[data-testid="interval-input"]', '300');
      await page.click('[data-testid="create-monitor-submit"]');
      
      // Assign production tag
      await page.click('[data-testid="monitor-row"]:has-text("Production Monitor")');
      await page.click('[data-testid="monitor-tags-tab"]');
      await page.click('[data-testid="assign-tag-button"]');
      await page.selectOption('[data-testid="tag-select"]', 'production');
      await page.click('[data-testid="assign-tag-submit"]');
      
      // Go back to monitors list
      await page.goto('/app/monitors');
      
      // Create staging monitor
      await page.click('[data-testid="create-monitor-button"]');
      await page.fill('[data-testid="monitor-name-input"]', 'Staging Monitor');
      await page.selectOption('[data-testid="schedule-type-select"]', 'INTERVAL');
      await page.fill('[data-testid="interval-input"]', '300');
      await page.click('[data-testid="create-monitor-submit"]');
      
      // Assign staging tag
      await page.click('[data-testid="monitor-row"]:has-text("Staging Monitor")');
      await page.click('[data-testid="monitor-tags-tab"]');
      await page.click('[data-testid="assign-tag-button"]');
      await page.selectOption('[data-testid="tag-select"]', 'staging');
      await page.click('[data-testid="assign-tag-submit"]');
    });

    await test.step('Filter monitors by tags', async () => {
      await page.goto('/app/monitors');
      
      // Open tag filter
      await page.click('[data-testid="tag-filter-button"]');
      
      // Select production tag
      await page.check('[data-testid="tag-filter-production"]');
      await page.click('[data-testid="apply-filters-button"]');
      
      // Should only show production monitor
      await expect(page.locator('[data-testid="monitor-list"]')).toContainText('Production Monitor');
      await expect(page.locator('[data-testid="monitor-list"]')).not.toContainText('Staging Monitor');
      
      // Clear filters
      await page.click('[data-testid="clear-filters-button"]');
      
      // Should show all monitors
      await expect(page.locator('[data-testid="monitor-list"]')).toContainText('Production Monitor');
      await expect(page.locator('[data-testid="monitor-list"]')).toContainText('Staging Monitor');
    });
  });

  test('should handle monitor errors gracefully', async ({ page }) => {
    await test.step('Handle invalid monitor creation', async () => {
      await page.click('[data-testid="create-monitor-button"]');
      
      // Try to submit empty form
      await page.click('[data-testid="create-monitor-submit"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="monitor-name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="interval-error"]')).toBeVisible();
    });

    await test.step('Handle invalid cron expression', async () => {
      await page.selectOption('[data-testid="schedule-type-select"]', 'CRON');
      await page.fill('[data-testid="cron-expression-input"]', 'invalid-cron');
      await page.click('[data-testid="create-monitor-submit"]');
      
      // Should show cron validation error
      await expect(page.locator('[data-testid="cron-expression-error"]')).toBeVisible();
    });

    await test.step('Handle invalid anomaly thresholds', async () => {
      await page.fill('[data-testid="monitor-name-input"]', 'Test Monitor');
      await page.selectOption('[data-testid="schedule-type-select"]', 'INTERVAL');
      await page.fill('[data-testid="interval-input"]', '300');
      await page.click('[data-testid="create-monitor-submit"]');
      
      // Go to anomaly settings
      await page.click('[data-testid="monitor-row"]:has-text("Test Monitor")');
      await page.click('[data-testid="monitor-anomaly-tab"]');
      
      // Set invalid Z-score threshold
      await page.fill('[data-testid="z-score-threshold-input"]', '0.5'); // Too low
      await page.click('[data-testid="save-anomaly-settings"]');
      
      // Should show validation error
      await expect(page.locator('[data-testid="z-score-threshold-error"]')).toBeVisible();
    });
  });
});

import { test, expect } from '@playwright/test';

test.describe('Incident Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to monitors page
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="signin-button"]');
    await page.goto('/app/monitors');
  });

  test('should handle incident lifecycle', async ({ page }) => {
    // Create a monitor first
    await test.step('Create monitor for incident testing', async () => {
      await page.click('[data-testid="create-monitor-button"]');
      await page.fill('[data-testid="monitor-name-input"]', 'Incident Test Monitor');
      await page.selectOption('[data-testid="schedule-type-select"]', 'INTERVAL');
      await page.fill('[data-testid="interval-input"]', '300');
      await page.fill('[data-testid="grace-period-input"]', '60');
      await page.click('[data-testid="create-monitor-submit"]');
    });

    // Simulate incident creation (in real test, this would be triggered by evaluator)
    await test.step('Create incident', async () => {
      // Navigate to incidents page
      await page.goto('/app/incidents');
      
      // Create incident manually (in real test, this would be automatic)
      await page.click('[data-testid="create-incident-button"]');
      await page.selectOption('[data-testid="incident-monitor-select"]', 'Incident Test Monitor');
      await page.selectOption('[data-testid="incident-kind-select"]', 'MISSED');
      await page.fill('[data-testid="incident-summary-input"]', 'Monitor did not run on time');
      await page.fill('[data-testid="incident-details-input"]', 'The monitor failed to execute within the expected timeframe');
      await page.click('[data-testid="create-incident-submit"]');
      
      // Should redirect to incidents page
      await expect(page).toHaveURL('/app/incidents');
      await expect(page.locator('[data-testid="incidents-list"]')).toContainText('Incident Test Monitor');
    });

    await test.step('View incident details', async () => {
      // Click on the incident
      await page.click('[data-testid="incident-row"]:first-child');
      
      // Verify incident details
      await expect(page.locator('[data-testid="incident-summary"]')).toContainText('Monitor did not run on time');
      await expect(page.locator('[data-testid="incident-kind"]')).toContainText('MISSED');
      await expect(page.locator('[data-testid="incident-status"]')).toContainText('OPEN');
      await expect(page.locator('[data-testid="incident-monitor"]')).toContainText('Incident Test Monitor');
    });

    await test.step('Acknowledge incident', async () => {
      // Click acknowledge button
      await page.click('[data-testid="acknowledge-incident-button"]');
      
      // Should show confirmation dialog
      await expect(page.locator('[data-testid="acknowledge-confirmation"]')).toBeVisible();
      
      // Confirm acknowledgment
      await page.click('[data-testid="confirm-acknowledge"]');
      
      // Should update incident status
      await expect(page.locator('[data-testid="incident-status"]')).toContainText('ACKED');
      await expect(page.locator('[data-testid="acknowledged-at"]')).toBeVisible();
    });

    await test.step('Add incident notes', async () => {
      // Go to notes tab
      await page.click('[data-testid="incident-notes-tab"]');
      
      // Add a note
      await page.fill('[data-testid="incident-note-input"]', 'Investigating the root cause of the missed execution');
      await page.click('[data-testid="add-note-button"]');
      
      // Verify note was added
      await expect(page.locator('[data-testid="incident-notes-list"]')).toContainText('Investigating the root cause');
    });

    await test.step('Snooze incident', async () => {
      // Go back to incident details
      await page.click('[data-testid="incident-details-tab"]');
      
      // Click snooze button
      await page.click('[data-testid="snooze-incident-button"]');
      
      // Select snooze duration
      await page.selectOption('[data-testid="snooze-duration-select"]', '1-hour');
      await page.fill('[data-testid="snooze-reason-input"]', 'Waiting for maintenance window');
      await page.click('[data-testid="confirm-snooze"]');
      
      // Should show snooze status
      await expect(page.locator('[data-testid="incident-snooze-status"]')).toContainText('Snoozed until');
    });

    await test.step('Resolve incident', async () => {
      // Click resolve button
      await page.click('[data-testid="resolve-incident-button"]');
      
      // Should show resolution form
      await expect(page.locator('[data-testid="resolve-incident-form"]')).toBeVisible();
      
      // Fill resolution details
      await page.fill('[data-testid="resolution-summary-input"]', 'Fixed the cron job configuration');
      await page.fill('[data-testid="resolution-details-input"]', 'Updated the cron expression and verified execution');
      await page.click('[data-testid="confirm-resolve"]');
      
      // Should update incident status
      await expect(page.locator('[data-testid="incident-status"]')).toContainText('RESOLVED');
      await expect(page.locator('[data-testid="resolved-at"]')).toBeVisible();
    });
  });

  test('should handle different incident types', async ({ page }) => {
    await test.step('Create FAIL incident', async () => {
      await page.goto('/app/incidents');
      await page.click('[data-testid="create-incident-button"]');
      await page.selectOption('[data-testid="incident-monitor-select"]', 'Incident Test Monitor');
      await page.selectOption('[data-testid="incident-kind-select"]', 'FAIL');
      await page.fill('[data-testid="incident-summary-input"]', 'Job failed with error code 1');
      await page.fill('[data-testid="incident-details-input"]', 'Database connection timeout');
      await page.click('[data-testid="create-incident-submit"]');
      
      // Verify incident was created
      await expect(page.locator('[data-testid="incidents-list"]')).toContainText('Job failed with error code 1');
    });

    await test.step('Create LATE incident', async () => {
      await page.click('[data-testid="create-incident-button"]');
      await page.selectOption('[data-testid="incident-monitor-select"]', 'Incident Test Monitor');
      await page.selectOption('[data-testid="incident-kind-select"]', 'LATE');
      await page.fill('[data-testid="incident-summary-input"]', 'Job ran 15 minutes late');
      await page.fill('[data-testid="incident-details-input"]', 'System was under heavy load');
      await page.click('[data-testid="create-incident-submit"]');
      
      // Verify incident was created
      await expect(page.locator('[data-testid="incidents-list"]')).toContainText('Job ran 15 minutes late');
    });

    await test.step('Create ANOMALY incident', async () => {
      await page.click('[data-testid="create-incident-button"]');
      await page.selectOption('[data-testid="incident-monitor-select"]', 'Incident Test Monitor');
      await page.selectOption('[data-testid="incident-kind-select"]', 'ANOMALY');
      await page.fill('[data-testid="incident-summary-input"]', 'Job duration 3x longer than normal');
      await page.fill('[data-testid="incident-details-input"]', 'Duration: 4500ms (normal: ~1500ms)');
      await page.click('[data-testid="create-incident-submit"]');
      
      // Verify incident was created
      await expect(page.locator('[data-testid="incidents-list"]')).toContainText('Job duration 3x longer than normal');
    });
  });

  test('should filter and search incidents', async ({ page }) => {
    // Create multiple incidents first
    await test.step('Create test incidents', async () => {
      await page.goto('/app/incidents');
      
      // Create OPEN incident
      await page.click('[data-testid="create-incident-button"]');
      await page.selectOption('[data-testid="incident-monitor-select"]', 'Incident Test Monitor');
      await page.selectOption('[data-testid="incident-kind-select"]', 'MISSED');
      await page.fill('[data-testid="incident-summary-input"]', 'Open Incident');
      await page.click('[data-testid="create-incident-submit"]');
      
      // Create ACKED incident
      await page.click('[data-testid="create-incident-button"]');
      await page.selectOption('[data-testid="incident-monitor-select"]', 'Incident Test Monitor');
      await page.selectOption('[data-testid="incident-kind-select"]', 'FAIL');
      await page.fill('[data-testid="incident-summary-input"]', 'Acknowledged Incident');
      await page.click('[data-testid="create-incident-submit"]');
      
      // Acknowledge the second incident
      await page.click('[data-testid="incident-row"]:has-text("Acknowledged Incident")');
      await page.click('[data-testid="acknowledge-incident-button"]');
      await page.click('[data-testid="confirm-acknowledge"]');
      await page.goto('/app/incidents');
    });

    await test.step('Filter by status', async () => {
      // Filter by OPEN status
      await page.selectOption('[data-testid="status-filter-select"]', 'OPEN');
      await page.click('[data-testid="apply-filters-button"]');
      
      // Should only show OPEN incidents
      await expect(page.locator('[data-testid="incidents-list"]')).toContainText('Open Incident');
      await expect(page.locator('[data-testid="incidents-list"]')).not.toContainText('Acknowledged Incident');
      
      // Clear filters
      await page.click('[data-testid="clear-filters-button"]');
    });

    await test.step('Filter by kind', async () => {
      // Filter by MISSED kind
      await page.selectOption('[data-testid="kind-filter-select"]', 'MISSED');
      await page.click('[data-testid="apply-filters-button"]');
      
      // Should only show MISSED incidents
      await expect(page.locator('[data-testid="incidents-list"]')).toContainText('Open Incident');
      await expect(page.locator('[data-testid="incidents-list"]')).not.toContainText('Acknowledged Incident');
      
      // Clear filters
      await page.click('[data-testid="clear-filters-button"]');
    });

    await test.step('Search incidents', async () => {
      // Search for specific incident
      await page.fill('[data-testid="incident-search-input"]', 'Open');
      await page.click('[data-testid="search-incidents-button"]');
      
      // Should only show matching incidents
      await expect(page.locator('[data-testid="incidents-list"]')).toContainText('Open Incident');
      await expect(page.locator('[data-testid="incidents-list"]')).not.toContainText('Acknowledged Incident');
    });
  });

  test('should handle incident bulk operations', async ({ page }) => {
    await test.step('Select multiple incidents', async () => {
      await page.goto('/app/incidents');
      
      // Select first incident
      await page.check('[data-testid="incident-checkbox"]:first-child');
      
      // Select second incident
      await page.check('[data-testid="incident-checkbox"]:nth-child(2)');
      
      // Should show bulk actions
      await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
    });

    await test.step('Bulk acknowledge incidents', async () => {
      // Click bulk acknowledge
      await page.click('[data-testid="bulk-acknowledge-button"]');
      
      // Confirm bulk action
      await page.click('[data-testid="confirm-bulk-acknowledge"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="bulk-action-success"]')).toContainText('2 incidents acknowledged');
    });

    await test.step('Bulk resolve incidents', async () => {
      // Select incidents again
      await page.check('[data-testid="incident-checkbox"]:first-child');
      await page.check('[data-testid="incident-checkbox"]:nth-child(2)');
      
      // Click bulk resolve
      await page.click('[data-testid="bulk-resolve-button"]');
      
      // Fill resolution details
      await page.fill('[data-testid="bulk-resolution-summary"]', 'Bulk resolution');
      await page.click('[data-testid="confirm-bulk-resolve"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="bulk-action-success"]')).toContainText('2 incidents resolved');
    });
  });

  test('should handle incident deduplication', async ({ page }) => {
    await test.step('Create duplicate incident', async () => {
      await page.goto('/app/incidents');
      
      // Create first incident
      await page.click('[data-testid="create-incident-button"]');
      await page.selectOption('[data-testid="incident-monitor-select"]', 'Incident Test Monitor');
      await page.selectOption('[data-testid="incident-kind-select"]', 'MISSED');
      await page.fill('[data-testid="incident-summary-input"]', 'Duplicate Test Incident');
      await page.click('[data-testid="create-incident-submit"]');
      
      // Try to create duplicate incident
      await page.click('[data-testid="create-incident-button"]');
      await page.selectOption('[data-testid="incident-monitor-select"]', 'Incident Test Monitor');
      await page.selectOption('[data-testid="incident-kind-select"]', 'MISSED');
      await page.fill('[data-testid="incident-summary-input"]', 'Duplicate Test Incident');
      await page.click('[data-testid="create-incident-submit"]');
      
      // Should show deduplication message
      await expect(page.locator('[data-testid="deduplication-message"]')).toContainText('Duplicate incident detected');
    });
  });

  test('should handle incident error states', async ({ page }) => {
    await test.step('Handle invalid incident creation', async () => {
      await page.goto('/app/incidents');
      await page.click('[data-testid="create-incident-button"]');
      
      // Try to submit empty form
      await page.click('[data-testid="create-incident-submit"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="incident-monitor-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="incident-summary-error"]')).toBeVisible();
    });

    await test.step('Handle incident not found', async () => {
      // Try to access non-existent incident
      await page.goto('/app/incidents/non-existent-id');
      
      // Should show 404 error
      await expect(page.locator('[data-testid="incident-not-found"]')).toBeVisible();
    });

    await test.step('Handle unauthorized incident access', async () => {
      // Try to access incident from different organization
      await page.goto('/app/incidents/unauthorized-id');
      
      // Should show unauthorized error
      await expect(page.locator('[data-testid="unauthorized-access"]')).toBeVisible();
    });
  });
});

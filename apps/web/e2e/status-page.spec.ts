import { test, expect } from '@playwright/test';

test.describe('Status Page Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to status pages
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="signin-button"]');
    await page.goto('/app/status-pages');
  });

  test('should create and configure status page', async ({ page }) => {
    await test.step('Create new status page', async () => {
      await page.click('[data-testid="create-status-page-button"]');
      
      // Fill status page form
      await page.fill('[data-testid="status-page-name-input"]', 'My Status Page');
      await page.fill('[data-testid="status-page-subdomain-input"]', 'my-status');
      await page.fill('[data-testid="status-page-description-input"]', 'Public status page for our services');
      
      // Submit form
      await page.click('[data-testid="create-status-page-submit"]');
      
      // Should redirect to status page settings
      await expect(page).toHaveURL(/\/app\/status-pages\/[^\/]+/);
      await expect(page.locator('[data-testid="status-page-name"]')).toContainText('My Status Page');
    });

    await test.step('Configure status page theme', async () => {
      // Go to theme tab
      await page.click('[data-testid="status-page-theme-tab"]');
      
      // Select theme
      await page.selectOption('[data-testid="theme-select"]', 'dark');
      
      // Set primary color
      await page.fill('[data-testid="primary-color-input"]', '#ff0000');
      
      // Set logo
      await page.setInputFiles('[data-testid="logo-upload"]', 'test-logo.png');
      
      // Save theme settings
      await page.click('[data-testid="save-theme-settings"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="theme-saved-success"]')).toBeVisible();
    });

    await test.step('Add components to status page', async () => {
      // Go to components tab
      await page.click('[data-testid="status-page-components-tab"]');
      
      // Add API component
      await page.click('[data-testid="add-component-button"]');
      await page.selectOption('[data-testid="component-type-select"]', 'API');
      await page.fill('[data-testid="component-name-input"]', 'Main API');
      await page.selectOption('[data-testid="component-monitor-select"]', 'API Monitor');
      await page.click('[data-testid="add-component-submit"]');
      
      // Add Database component
      await page.click('[data-testid="add-component-button"]');
      await page.selectOption('[data-testid="component-type-select"]', 'Database');
      await page.fill('[data-testid="component-name-input"]', 'Database');
      await page.selectOption('[data-testid="component-monitor-select"]', 'DB Monitor');
      await page.click('[data-testid="add-component-submit"]');
      
      // Verify components were added
      await expect(page.locator('[data-testid="components-list"]')).toContainText('Main API');
      await expect(page.locator('[data-testid="components-list"]')).toContainText('Database');
    });

    await test.step('Configure status page settings', async () => {
      // Go to settings tab
      await page.click('[data-testid="status-page-settings-tab"]');
      
      // Enable public access
      await page.check('[data-testid="public-access-checkbox"]');
      
      // Set custom domain
      await page.fill('[data-testid="custom-domain-input"]', 'status.example.com');
      
      // Enable incident notifications
      await page.check('[data-testid="incident-notifications-checkbox"]');
      
      // Save settings
      await page.click('[data-testid="save-status-page-settings"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="settings-saved-success"]')).toBeVisible();
    });
  });

  test('should view public status page', async ({ page }) => {
    // Create status page first
    await test.step('Create status page for testing', async () => {
      await page.click('[data-testid="create-status-page-button"]');
      await page.fill('[data-testid="status-page-name-input"]', 'Test Status Page');
      await page.fill('[data-testid="status-page-subdomain-input"]', 'test-status');
      await page.click('[data-testid="create-status-page-submit"]');
    });

    await test.step('View public status page', async () => {
      // Get the public URL
      const publicUrl = await page.locator('[data-testid="public-status-page-url"]').textContent();
      
      // Open public status page in new tab
      const newPage = await page.context().newPage();
      await newPage.goto(publicUrl!);
      
      // Verify status page is displayed
      await expect(newPage.locator('[data-testid="public-status-page"]')).toBeVisible();
      await expect(newPage.locator('[data-testid="status-page-title"]')).toContainText('Test Status Page');
      
      // Verify components are displayed
      await expect(newPage.locator('[data-testid="status-components"]')).toBeVisible();
      
      // Close the new page
      await newPage.close();
    });
  });

  test('should manage status page incidents', async ({ page }) => {
    // Create status page first
    await test.step('Create status page with components', async () => {
      await page.click('[data-testid="create-status-page-button"]');
      await page.fill('[data-testid="status-page-name-input"]', 'Incident Test Page');
      await page.fill('[data-testid="status-page-subdomain-input"]', 'incident-test');
      await page.click('[data-testid="create-status-page-submit"]');
      
      // Add component
      await page.click('[data-testid="status-page-components-tab"]');
      await page.click('[data-testid="add-component-button"]');
      await page.selectOption('[data-testid="component-type-select"]', 'API');
      await page.fill('[data-testid="component-name-input"]', 'Test API');
      await page.selectOption('[data-testid="component-monitor-select"]', 'API Monitor');
      await page.click('[data-testid="add-component-submit"]');
    });

    await test.step('Create status page incident', async () => {
      // Go to incidents tab
      await page.click('[data-testid="status-page-incidents-tab"]');
      
      // Create incident
      await page.click('[data-testid="create-incident-button"]');
      await page.fill('[data-testid="incident-title-input"]', 'API Service Outage');
      await page.selectOption('[data-testid="incident-severity-select"]', 'major');
      await page.fill('[data-testid="incident-description-input"]', 'We are experiencing issues with our API service');
      await page.click('[data-testid="create-incident-submit"]');
      
      // Verify incident was created
      await expect(page.locator('[data-testid="incidents-list"]')).toContainText('API Service Outage');
    });

    await test.step('Update incident status', async () => {
      // Click on incident
      await page.click('[data-testid="incident-row"]:first-child');
      
      // Update status to investigating
      await page.selectOption('[data-testid="incident-status-select"]', 'investigating');
      await page.fill('[data-testid="incident-update-input"]', 'We are currently investigating the issue');
      await page.click('[data-testid="update-incident-button"]');
      
      // Verify status was updated
      await expect(page.locator('[data-testid="incident-status"]')).toContainText('Investigating');
    });

    await test.step('Resolve incident', async () => {
      // Update status to resolved
      await page.selectOption('[data-testid="incident-status-select"]', 'resolved');
      await page.fill('[data-testid="incident-update-input"]', 'The issue has been resolved');
      await page.click('[data-testid="update-incident-button"]');
      
      // Verify incident was resolved
      await expect(page.locator('[data-testid="incident-status"]')).toContainText('Resolved');
    });
  });

  test('should handle status page customization', async ({ page }) => {
    // Create status page first
    await test.step('Create status page for customization', async () => {
      await page.click('[data-testid="create-status-page-button"]');
      await page.fill('[data-testid="status-page-name-input"]', 'Custom Status Page');
      await page.fill('[data-testid="status-page-subdomain-input"]', 'custom-status');
      await page.click('[data-testid="create-status-page-submit"]');
    });

    await test.step('Customize status page appearance', async () => {
      // Go to theme tab
      await page.click('[data-testid="status-page-theme-tab"]');
      
      // Set custom CSS
      await page.fill('[data-testid="custom-css-input"]', '.status-page { background: #f0f0f0; }');
      
      // Set custom HTML
      await page.fill('[data-testid="custom-html-input"]', '<div class="custom-header">Custom Header</div>');
      
      // Save customization
      await page.click('[data-testid="save-customization"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="customization-saved-success"]')).toBeVisible();
    });

    await test.step('Configure status page notifications', async () => {
      // Go to notifications tab
      await page.click('[data-testid="status-page-notifications-tab"]');
      
      // Enable email notifications
      await page.check('[data-testid="email-notifications-checkbox"]');
      await page.fill('[data-testid="notification-email-input"]', 'notifications@example.com');
      
      // Enable webhook notifications
      await page.check('[data-testid="webhook-notifications-checkbox"]');
      await page.fill('[data-testid="webhook-url-input"]', 'https://hooks.slack.com/test');
      
      // Save notification settings
      await page.click('[data-testid="save-notification-settings"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="notifications-saved-success"]')).toBeVisible();
    });
  });

  test('should handle status page errors', async ({ page }) => {
    await test.step('Handle invalid status page creation', async () => {
      await page.click('[data-testid="create-status-page-button"]');
      
      // Try to submit empty form
      await page.click('[data-testid="create-status-page-submit"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="status-page-name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="status-page-subdomain-error"]')).toBeVisible();
    });

    await test.step('Handle duplicate subdomain', async () => {
      // Create first status page
      await page.fill('[data-testid="status-page-name-input"]', 'First Status Page');
      await page.fill('[data-testid="status-page-subdomain-input"]', 'duplicate-test');
      await page.click('[data-testid="create-status-page-submit"]');
      
      // Go back to create another
      await page.goto('/app/status-pages');
      await page.click('[data-testid="create-status-page-button"]');
      
      // Try to use same subdomain
      await page.fill('[data-testid="status-page-name-input"]', 'Second Status Page');
      await page.fill('[data-testid="status-page-subdomain-input"]', 'duplicate-test');
      await page.click('[data-testid="create-status-page-submit"]');
      
      // Should show duplicate error
      await expect(page.locator('[data-testid="subdomain-duplicate-error"]')).toBeVisible();
    });

    await test.step('Handle invalid custom domain', async () => {
      // Create status page
      await page.fill('[data-testid="status-page-name-input"]', 'Invalid Domain Page');
      await page.fill('[data-testid="status-page-subdomain-input"]', 'invalid-domain');
      await page.click('[data-testid="create-status-page-submit"]');
      
      // Go to settings
      await page.click('[data-testid="status-page-settings-tab"]');
      
      // Set invalid custom domain
      await page.fill('[data-testid="custom-domain-input"]', 'invalid-domain-format');
      await page.click('[data-testid="save-status-page-settings"]');
      
      // Should show validation error
      await expect(page.locator('[data-testid="custom-domain-error"]')).toBeVisible();
    });
  });

  test('should manage status page access', async ({ page }) => {
    // Create status page first
    await test.step('Create status page for access testing', async () => {
      await page.click('[data-testid="create-status-page-button"]');
      await page.fill('[data-testid="status-page-name-input"]', 'Access Test Page');
      await page.fill('[data-testid="status-page-subdomain-input"]', 'access-test');
      await page.click('[data-testid="create-status-page-submit"]');
    });

    await test.step('Configure private access', async () => {
      // Go to settings tab
      await page.click('[data-testid="status-page-settings-tab"]');
      
      // Disable public access
      await page.uncheck('[data-testid="public-access-checkbox"]');
      
      // Set access password
      await page.fill('[data-testid="access-password-input"]', 'secretpassword');
      
      // Save settings
      await page.click('[data-testid="save-status-page-settings"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="settings-saved-success"]')).toBeVisible();
    });

    await test.step('Test private access', async () => {
      // Get the public URL
      const publicUrl = await page.locator('[data-testid="public-status-page-url"]').textContent();
      
      // Open public status page in new tab
      const newPage = await page.context().newPage();
      await newPage.goto(publicUrl!);
      
      // Should show password prompt
      await expect(newPage.locator('[data-testid="password-prompt"]')).toBeVisible();
      
      // Enter password
      await newPage.fill('[data-testid="password-input"]', 'secretpassword');
      await newPage.click('[data-testid="submit-password"]');
      
      // Should show status page
      await expect(newPage.locator('[data-testid="public-status-page"]')).toBeVisible();
      
      // Close the new page
      await newPage.close();
    });
  });
});

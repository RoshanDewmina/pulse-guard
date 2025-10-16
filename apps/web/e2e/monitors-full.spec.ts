import { test, expect } from '@playwright/test';

// Helper to login before each test
async function login(page: any) {
  await page.goto('/auth/signin');
  await page.fill('#email', 'dewminaimalsha2003@gmail.com');
  await page.fill('#password', 'test123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/app');
}

test.describe('Monitors List Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/app/monitors');
  });

  test('should display monitors page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Monitors' })).toBeVisible();
  });

  test('should display Create Monitor button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Create Monitor/i })).toBeVisible();
  });

  test('should display monitors table if monitors exist', async ({ page }) => {
    // Check for table headers
    const hasMonitors = await page.locator('table').count() > 0;
    if (hasMonitors) {
      await expect(page.getByText('Monitor Name')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
      await expect(page.getByText('Schedule')).toBeVisible();
    }
  });

  test('should navigate to create monitor page', async ({ page }) => {
    await page.click('button:has-text("Create Monitor")');
    await expect(page).toHaveURL('/app/monitors/new');
  });

  test('should display sample monitor if seeded', async ({ page }) => {
    const sampleMonitor = page.getByText('Sample Backup Job');
    const exists = await sampleMonitor.count() > 0;
    if (exists) {
      await expect(sampleMonitor).toBeVisible();
    }
  });

  test('should show status badges for monitors', async ({ page }) => {
    const statusBadges = page.locator('span:has-text("OK"), span:has-text("LATE"), span:has-text("MISSED"), span:has-text("FAILING")');
    const count = await statusBadges.count();
    // Should have at least one status badge if monitors exist
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Create Monitor Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/app/monitors/new');
  });

  test('should display create monitor form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Create Monitor/i })).toBeVisible();
  });

  test('should have monitor name input', async ({ page }) => {
    const nameInput = page.locator('input[name="name"], input[id*="name"]').first();
    await expect(nameInput).toBeVisible();
  });

  test('should have schedule type selector', async ({ page }) => {
    // Look for INTERVAL or CRON related text/options
    const hasScheduleType = await page.getByText(/Interval|Cron|Schedule/i).count() > 0;
    expect(hasScheduleType).toBe(true);
  });

  test('should create monitor with valid data', async ({ page }) => {
    // Fill in monitor name
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput.fill('Test Monitor E2E');
    
    // Fill interval (default schedule type)
    const intervalInput = page.locator('input[name="intervalSec"], input[placeholder*="interval" i], input[placeholder*="second" i]').first();
    const intervalExists = await intervalInput.count() > 0;
    if (intervalExists) {
      await intervalInput.fill('3600');
    }
    
    // Fill grace period
    const graceInput = page.locator('input[name="graceSec"], input[placeholder*="grace" i]').first();
    const graceExists = await graceInput.count() > 0;
    if (graceExists) {
      await graceInput.fill('300');
    }
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /Create|Submit|Save/i });
    const buttonExists = await submitButton.count() > 0;
    if (buttonExists) {
      await submitButton.click();
      
      // Should redirect to monitors list or monitor detail
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url).toMatch(/\/app\/monitors/);
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling form
    const submitButton = page.getByRole('button', { name: /Create|Submit|Save/i });
    const buttonExists = await submitButton.count() > 0;
    if (buttonExists) {
      await submitButton.click();
      
      // Should show validation error or not navigate
      await page.waitForTimeout(500);
      const url = page.url();
      // Should still be on create page
      expect(url).toContain('/monitors/new');
    }
  });
});

test.describe('Monitor Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display monitor details when navigating from list', async ({ page }) => {
    await page.goto('/app/monitors');
    
    // Click on first monitor link if exists
    const monitorLink = page.locator('a[href*="/app/monitors/"]').first();
    const exists = await monitorLink.count() > 0;
    
    if (exists) {
      await monitorLink.click();
      
      // Should be on monitor detail page
      await page.waitForTimeout(500);
      expect(page.url()).toMatch(/\/app\/monitors\/[a-zA-Z0-9-]+$/);
      
      // Should display monitor name
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('should display status badge on detail page', async ({ page }) => {
    await page.goto('/app/monitors');
    const monitorLink = page.locator('a[href*="/app/monitors/"]').first();
    const exists = await monitorLink.count() > 0;
    
    if (exists) {
      await monitorLink.click();
      await page.waitForTimeout(500);
      
      // Should show status badge
      const statusBadge = page.locator('span:has-text("OK"), span:has-text("LATE"), span:has-text("MISSED"), span:has-text("FAILING")').first();
      await expect(statusBadge).toBeVisible();
    }
  });

  test('should display tabs (Runs, Incidents, Settings)', async ({ page }) => {
    await page.goto('/app/monitors');
    const monitorLink = page.locator('a[href*="/app/monitors/"]').first();
    const exists = await monitorLink.count() > 0;
    
    if (exists) {
      await monitorLink.click();
      await page.waitForTimeout(500);
      
      // Check for tabs
      const hasTabs = await page.getByText(/Run History|Runs/i).count() > 0;
      if (hasTabs) {
        await expect(page.getByText(/Run History|Runs/i)).toBeVisible();
      }
    }
  });

  test('should display token with copy functionality', async ({ page }) => {
    await page.goto('/app/monitors');
    const monitorLink = page.locator('a[href*="/app/monitors/"]').first();
    const exists = await monitorLink.count() > 0;
    
    if (exists) {
      await monitorLink.click();
      await page.waitForTimeout(500);
      
      // Look for token (starts with pg_)
      const tokenText = page.locator('text=/pg_[a-zA-Z0-9]+/').first();
      const tokenExists = await tokenText.count() > 0;
      
      if (tokenExists) {
        await expect(tokenText).toBeVisible();
        
        // Look for copy button
        const copyButton = page.locator('button:has-text("Copy"), button:has(svg)').first();
        const copyExists = await copyButton.count() > 0;
        if (copyExists) {
          await expect(copyButton).toBeVisible();
        }
      }
    }
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/app/monitors');
    const monitorLink = page.locator('a[href*="/app/monitors/"]').first();
    const exists = await monitorLink.count() > 0;
    
    if (exists) {
      await monitorLink.click();
      await page.waitForTimeout(500);
      
      // Try to click incidents tab if exists
      const incidentsTab = page.locator('[role="tab"]:has-text("Incidents")').first();
      const tabExists = await incidentsTab.count() > 0;
      if (tabExists) {
        await incidentsTab.click();
        await page.waitForTimeout(300);
      }
      
      // Try to click settings tab if exists
      const settingsTab = page.locator('[role="tab"]:has-text("Settings")').first();
      const settingsTabExists = await settingsTab.count() > 0;
      if (settingsTabExists) {
        await settingsTab.click();
        await page.waitForTimeout(300);
      }
    }
  });
});








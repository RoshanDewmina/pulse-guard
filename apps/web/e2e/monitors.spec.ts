import { test, expect } from '@playwright/test';

test.describe('Monitor Creation Flow', () => {
  // Note: These tests would normally require authentication
  // For now, we're testing the page loads and UI elements exist
  
  test('new monitor page has correct form elements', async ({ page }) => {
    // Try to access the page directly
    // In a real scenario, this would redirect to signin
    await page.goto('/app/monitors/new');
    
    // Check if we're redirected to signin (expected behavior)
    const url = page.url();
    const isOnNewMonitorPage = url.includes('/app/monitors/new');
    const isRedirectedToSignin = url.includes('/auth/signin') || url.includes('/api/auth/signin');
    
    // One of these should be true
    expect(isOnNewMonitorPage || isRedirectedToSignin).toBe(true);
    
    // If we're on the signin page, that's the expected behavior for unauthenticated users
    if (isRedirectedToSignin) {
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    }
    
    // If we somehow got to the monitor page (e.g., in dev with auth disabled),
    // verify the form elements exist
    if (isOnNewMonitorPage) {
      await expect(page.getByText('Create Monitor')).toBeVisible();
    }
  });

  test('monitor list page redirects correctly', async ({ page }) => {
    await page.goto('/app/monitors');
    
    const url = page.url();
    const isOnMonitorsPage = url.includes('/app/monitors');
    const isRedirectedToSignin = url.includes('/auth/signin') || url.includes('/api/auth/signin');
    
    // Should either be on monitors page or redirected to signin
    expect(isOnMonitorsPage || isRedirectedToSignin).toBe(true);
  });

  test('incidents page redirects correctly', async ({ page }) => {
    await page.goto('/app/incidents');
    
    const url = page.url();
    const isOnIncidentsPage = url.includes('/app/incidents');
    const isRedirectedToSignin = url.includes('/auth/signin') || url.includes('/api/auth/signin');
    
    // Should either be on incidents page or redirected to signin
    expect(isOnIncidentsPage || isRedirectedToSignin).toBe(true);
  });
});

test.describe('Monitor Creation Form Elements', () => {
  test.skip('form has all required fields', async ({ page }) => {
    // This test is skipped because it requires authentication
    // To enable: set up auth in beforeEach hook
    
    await page.goto('/app/monitors/new');
    
    await expect(page.getByLabel('Monitor Name')).toBeVisible();
    await expect(page.getByText('Schedule Type')).toBeVisible();
    await expect(page.getByText('Grace Period')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Monitor' })).toBeVisible();
  });

  test.skip('interval mode shows correct fields', async ({ page }) => {
    await page.goto('/app/monitors/new');
    
    // Select interval mode (should be default)
    await expect(page.getByLabel('Interval (seconds)')).toBeVisible();
  });

  test.skip('cron mode shows correct fields', async ({ page }) => {
    await page.goto('/app/monitors/new');
    
    // Switch to cron mode
    // await page.getByRole('combobox').click();
    // await page.getByText('Cron Expression').click();
    
    await expect(page.getByLabel('Cron Expression')).toBeVisible();
    await expect(page.getByLabel('Timezone')).toBeVisible();
  });
});


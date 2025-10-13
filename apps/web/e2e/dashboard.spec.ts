import { test, expect } from '@playwright/test';

// Helper to login before each test
async function login(page: any) {
  await page.goto('/auth/signin');
  await page.fill('#email', 'dewminaimalsha2003@gmail.com');
  await page.fill('#password', 'test123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/app');
}

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display organization name', async ({ page }) => {
    await expect(page.getByText('Dev Organization')).toBeVisible();
  });

  test('should display status cards', async ({ page }) => {
    // Check for all 4 status cards
    await expect(page.getByText('Healthy')).toBeVisible();
    await expect(page.getByText('Late')).toBeVisible();
    await expect(page.getByText('Missed')).toBeVisible();
    await expect(page.getByText('Failing')).toBeVisible();
  });

  test('should display monitor counts in status cards', async ({ page }) => {
    // Should have numeric values in cards
    const healthyCard = page.locator('div:has-text("Healthy")').first();
    await expect(healthyCard.locator('div.text-2xl')).toBeVisible();
  });

  test('should have Create Monitor button', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /Create Monitor/i });
    await expect(createButton).toBeVisible();
  });

  test('should navigate to create monitor page when button clicked', async ({ page }) => {
    await page.click('button:has-text("Create Monitor")');
    await expect(page).toHaveURL('/app/monitors/new');
  });

  test('should display recent monitors section', async ({ page }) => {
    await expect(page.getByText(/monitors running smoothly|jobs completed late|jobs missed|jobs failing/i)).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Monitors/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Incidents/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Settings/i })).toBeVisible();
  });

  test('should navigate via navigation menu', async ({ page }) => {
    await page.click('button:has-text("Monitors")');
    await expect(page).toHaveURL('/app/monitors');
    
    await page.click('button:has-text("Incidents")');
    await expect(page).toHaveURL('/app/incidents');
    
    await page.click('button:has-text("Settings")');
    await expect(page).toHaveURL('/app/settings');
    
    await page.click('button:has-text("Dashboard")');
    await expect(page).toHaveURL('/app');
  });

  test('should display user dropdown menu', async ({ page }) => {
    const userButton = page.locator('[role="button"]:has-text("Dev User")');
    await expect(userButton).toBeVisible();
    
    await userButton.click();
    await expect(page.getByText('Sign Out')).toBeVisible();
  });

  test('should have Tokiflow branding in header', async ({ page }) => {
    await expect(page.getByText('Tokiflow').first()).toBeVisible();
  });
});







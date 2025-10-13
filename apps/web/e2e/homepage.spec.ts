import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check main heading
    await expect(page.getByRole('heading', { name: /Never Miss a Critical Job Again/ })).toBeVisible();
    
    // Check Tokiflow branding
    await expect(page.getByText('Tokiflow').first()).toBeVisible();
    
    // Check tagline
    await expect(page.getByText(/Monitor your cron jobs and scheduled tasks/)).toBeVisible();
  });

  test('navigation buttons work', async ({ page }) => {
    await page.goto('/');
    
    // Check Sign In button in header
    const headerSignInButton = page.getByRole('link', { name: 'Sign In' }).first();
    await expect(headerSignInButton).toBeVisible();
    await expect(headerSignInButton).toHaveAttribute('href', '/auth/signin');
    
    // Check Get Started button
    const getStartedButton = page.getByRole('link', { name: 'Get Started' });
    await expect(getStartedButton).toBeVisible();
  });

  test('CTA buttons are functional', async ({ page }) => {
    await page.goto('/');
    
    // Check "Start Monitoring Free" button
    const startMonitoringButton = page.getByRole('link', { name: 'Start Monitoring Free' });
    await expect(startMonitoringButton).toBeVisible();
    await expect(startMonitoringButton).toHaveAttribute('href', '/auth/signin');
    
    // Check "View Features" button (which we just fixed)
    const viewFeaturesButton = page.getByRole('link', { name: 'View Features' });
    await expect(viewFeaturesButton).toBeVisible();
    await expect(viewFeaturesButton).toHaveAttribute('href', '#features');
  });

  test('View Features button scrolls to features section', async ({ page }) => {
    await page.goto('/');
    
    // Click View Features button
    await page.getByRole('link', { name: 'View Features' }).click();
    
    // Wait a moment for scroll
    await page.waitForTimeout(500);
    
    // Check that features section is visible
    const featuresHeading = page.getByRole('heading', { name: 'Beyond Simple Heartbeats' });
    await expect(featuresHeading).toBeVisible();
  });

  test('features section displays correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check for feature cards
    await expect(page.getByRole('heading', { name: 'Smart Alerts' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Anomaly Detection' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fast DX' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Privacy First' })).toBeVisible();
  });

  test('pricing section displays correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check pricing header
    await expect(page.getByRole('heading', { name: 'Simple, Transparent Pricing' })).toBeVisible();
    
    // Check pricing tiers
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Business' })).toBeVisible();
  });

  test('quick setup code snippet is visible', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Create your first monitor in 60 seconds')).toBeVisible();
    await expect(page.getByText(/curl https:\/\/api\.pulseguard\.com/)).toBeVisible();
  });

  test('footer displays correctly', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check footer content
    await expect(page.getByText('© 2024 Tokiflow. All rights reserved.')).toBeVisible();
  });

  test('page is responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.getByRole('heading', { name: /Never Miss a Critical Job Again/ })).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('heading', { name: /Never Miss a Critical Job Again/ })).toBeVisible();
  });
});


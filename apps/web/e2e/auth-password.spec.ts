import { test, expect } from '@playwright/test';

test.describe('Password Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await page.fill('#email', 'dewminaimalsha2003@gmail.com');
    await page.fill('#password', 'test123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/app');
    await expect(page.getByText('Dev Organization')).toBeVisible();
  });

  test('should show error with invalid password', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await page.fill('#email', 'dewminaimalsha2003@gmail.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
  });

  test('should show error with non-existent email', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await page.fill('#email', 'nonexistent@example.com');
    await page.fill('#password', 'test123');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
  });

  test('should persist session across page navigation', async ({ page }) => {
    // Login
    await page.goto('/auth/signin');
    await page.fill('#email', 'dewminaimalsha2003@gmail.com');
    await page.fill('#password', 'test123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/app');
    
    // Navigate to monitors
    await page.goto('/app/monitors');
    await expect(page).not.toHaveURL('/auth/signin');
    
    // Navigate to incidents
    await page.goto('/app/incidents');
    await expect(page).not.toHaveURL('/auth/signin');
    
    // Navigate to settings
    await page.goto('/app/settings');
    await expect(page).not.toHaveURL('/auth/signin');
  });

  test('should redirect to signin when accessing protected routes unauthenticated', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL('/auth/signin');
    
    await page.goto('/app/monitors');
    await expect(page).toHaveURL('/auth/signin');
    
    await page.goto('/app/incidents');
    await expect(page).toHaveURL('/auth/signin');
  });

  test('should logout successfully', async ({ page, context }) => {
    // Login first
    await page.goto('/auth/signin');
    await page.fill('#email', 'dewminaimalsha2003@gmail.com');
    await page.fill('#password', 'test123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/app');
    
    // Logout via dropdown menu
    await page.click('[role="button"]:has-text("Dev User")');
    await page.click('text=Sign Out');
    
    // Should clear session
    await page.goto('/app');
    await expect(page).toHaveURL('/auth/signin');
  });
});








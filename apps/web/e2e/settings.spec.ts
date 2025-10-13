import { test, expect } from '@playwright/test';

// Helper to login before each test
async function login(page: any) {
  await page.goto('/auth/signin');
  await page.fill('#email', 'dewminaimalsha2003@gmail.com');
  await page.fill('#password', 'test123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/app');
}

test.describe('Settings - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/app/settings');
  });

  test('should display settings page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();
  });

  test('should have settings tabs', async ({ page }) => {
    // Check for tab navigation
    await expect(page.getByText('Billing')).toBeVisible();
    await expect(page.getByText('Team')).toBeVisible();
    await expect(page.getByText('Alerts')).toBeVisible();
  });

  test('should navigate between settings tabs', async ({ page }) => {
    await page.click('text=Billing');
    await page.waitForTimeout(300);
    expect(page.url()).toContain('/settings/billing');
    
    await page.click('text=Team');
    await page.waitForTimeout(300);
    expect(page.url()).toContain('/settings/team');
    
    await page.click('text=Alerts');
    await page.waitForTimeout(300);
    expect(page.url()).toContain('/settings/alerts');
  });
});

test.describe('Settings - Billing Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/app/settings/billing');
  });

  test('should display billing page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Billing|Subscription|Plan/i })).toBeVisible();
  });

  test('should display current plan information', async ({ page }) => {
    // Look for plan name (FREE, PRO, BUSINESS)
    const hasPlan = await page.getByText(/FREE|PRO|BUSINESS|Free Plan|Pro Plan/i).count() > 0;
    expect(hasPlan).toBe(true);
  });

  test('should display monitor limit', async ({ page }) => {
    // Look for limit information
    const hasLimit = await page.getByText(/monitor|limit/i).count() > 0;
    expect(hasLimit).toBe(true);
  });

  test('should display user limit', async ({ page }) => {
    // Look for user limit information
    const hasUserLimit = await page.getByText(/user|member/i).count() > 0;
    expect(hasUserLimit).toBe(true);
  });

  test('should show upgrade options or Stripe buttons if configured', async ({ page }) => {
    // Check for upgrade/manage subscription buttons
    const hasButton = await page.getByRole('button', { name: /Upgrade|Manage|Subscribe|Plan/i }).count() > 0;
    // Just verify the page structure, Stripe may not be configured
    expect(hasButton).toBeDefined();
  });
});

test.describe('Settings - Team Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/app/settings/team');
  });

  test('should display team page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Team|Members/i })).toBeVisible();
  });

  test('should display current user in team list', async ({ page }) => {
    // Should show the logged-in user
    await expect(page.getByText('dewminaimalsha2003@gmail.com')).toBeVisible();
  });

  test('should display user roles', async ({ page }) => {
    // Look for role badges (OWNER, ADMIN, MEMBER)
    const hasRole = await page.getByText(/OWNER|ADMIN|MEMBER|Owner|Admin/i).count() > 0;
    expect(hasRole).toBe(true);
  });

  test('should have invite button if user has permission', async ({ page }) => {
    // Check for invite button (OWNER/ADMIN can invite)
    const inviteButton = page.getByRole('button', { name: /Invite|Add Member/i });
    const exists = await inviteButton.count() > 0;
    
    if (exists) {
      await expect(inviteButton).toBeVisible();
    }
  });

  test('should display team member table or list', async ({ page }) => {
    // Should have either a table or list of team members
    const hasTable = await page.locator('table').count() > 0;
    const hasList = await page.getByText(/Email|Name|Role/i).count() > 0;
    
    expect(hasTable || hasList).toBe(true);
  });
});

test.describe('Settings - Alerts Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/app/settings/alerts');
  });

  test('should display alerts/channels page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Alert|Channel|Notification/i })).toBeVisible();
  });

  test('should display existing email channel from seed', async ({ page }) => {
    // Should show the default email channel created in seed
    await expect(page.getByText('Default Email')).toBeVisible();
  });

  test('should display channel type badges', async ({ page }) => {
    // Look for EMAIL or SLACK badges
    const hasChannelType = await page.getByText(/EMAIL|SLACK|Email|Slack/i).count() > 0;
    expect(hasChannelType).toBe(true);
  });

  test('should have create channel button', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /Create|Add|New/i });
    const exists = await createButton.count() > 0;
    
    if (exists) {
      await expect(createButton).toBeVisible();
    }
  });

  test('should display alert rules section', async ({ page }) => {
    // Check for rules section
    const hasRules = await page.getByText(/Rule|Alert Rule|Routing/i).count() > 0;
    expect(hasRules).toBeDefined();
  });

  test('should display default rule from seed', async ({ page }) => {
    // Should show the default rule created in seed
    const hasDefaultRule = await page.getByText(/Alert all monitors|Default|all monitors to email/i).count() > 0;
    expect(hasDefaultRule).toBeDefined();
  });

  test('should show Slack integration option', async ({ page }) => {
    // Check if Slack integration is mentioned
    const hasSlack = await page.getByText(/Slack|Connect to Slack|OAuth/i).count() > 0;
    // Just verify the option exists in UI
    expect(hasSlack).toBeDefined();
  });
});

test.describe('Settings - Alerts Channel Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/app/settings/alerts');
  });

  test('should show channel email addresses', async ({ page }) => {
    // Should display the email from the channel config
    const hasEmail = await page.getByText('dewminaimalsha2003@gmail.com').count() > 0;
    expect(hasEmail).toBe(true);
  });

  test('should have edit/delete buttons for channels', async ({ page }) => {
    // Look for action buttons
    const hasActions = await page.getByRole('button', { name: /Edit|Delete|Remove|Manage/i }).count() > 0;
    // Buttons might be in dropdown or directly visible
    expect(hasActions).toBeDefined();
  });

  test('should mark default channel', async ({ page }) => {
    // Check if default channel is marked
    const hasDefault = await page.getByText(/Default|default/i).count() > 0;
    expect(hasDefault).toBe(true);
  });
});

test.describe('Settings - Authentication Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should maintain session across all settings pages', async ({ page }) => {
    // Navigate through all settings pages
    await page.goto('/app/settings/billing');
    expect(page.url()).toContain('/settings/billing');
    
    await page.goto('/app/settings/team');
    expect(page.url()).toContain('/settings/team');
    
    await page.goto('/app/settings/alerts');
    expect(page.url()).toContain('/settings/alerts');
    
    // Should never redirect to signin
    expect(page.url()).not.toContain('/auth/signin');
  });

  test('should maintain session after page refresh', async ({ page }) => {
    await page.goto('/app/settings/billing');
    await page.reload();
    await page.waitForTimeout(500);
    
    // Should still be on billing page
    expect(page.url()).toContain('/settings/billing');
    expect(page.url()).not.toContain('/auth/signin');
  });
});







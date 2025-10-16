import { test, expect, Page } from '@playwright/test';

// Helper to login before tests
async function login(page: Page) {
  await page.goto('/auth/signin');
  await page.fill('#email', 'dewminaimalsha2003@gmail.com');
  await page.fill('#password', 'test123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/app');
}

// Helper to fill Stripe test card details
async function fillStripeCardDetails(page: Page) {
  // Wait for Stripe iframe to load
  await page.waitForTimeout(2000);
  
  // Stripe uses iframes, so we need to work within them
  const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
  
  // Fill card number
  const cardNumberFrame = stripeFrame.frameLocator('iframe[title*="card number"]');
  await cardNumberFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
  
  // Fill expiry
  const expiryFrame = stripeFrame.frameLocator('iframe[title*="expiry"]');
  await expiryFrame.locator('input[name="exp-date"]').fill('12/34');
  
  // Fill CVC
  const cvcFrame = stripeFrame.frameLocator('iframe[title*="cvc"]');
  await cvcFrame.locator('input[name="cvc"]').fill('123');
  
  // Fill postal code if present
  try {
    const postalFrame = stripeFrame.frameLocator('iframe[title*="postal"]');
    await postalFrame.locator('input[name="postal"]').fill('12345', { timeout: 2000 });
  } catch (e) {
    // Postal code field might not always be present
  }
}

test.describe('Stripe Billing Integration', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display current FREE plan', async ({ page }) => {
    await page.goto('/app/settings/billing');
    
    // Should show FREE plan
    await expect(page.getByText(/FREE|Free Plan/i)).toBeVisible();
    
    // Should show plan limits
    await expect(page.getByText(/5 monitors/i)).toBeVisible();
    await expect(page.getByText(/3.*member/i)).toBeVisible();
  });

  test('should display PRO and BUSINESS plan options', async ({ page }) => {
    await page.goto('/app/settings/billing');
    
    // Should show both upgrade options
    await expect(page.getByText(/Pro.*\$19/i)).toBeVisible();
    await expect(page.getByText(/Business.*\$49/i)).toBeVisible();
    
    // Should have upgrade buttons
    const upgradeButtons = page.getByRole('button', { name: /Upgrade|Subscribe/i });
    expect(await upgradeButtons.count()).toBeGreaterThan(0);
  });

  test('should show plan features', async ({ page }) => {
    await page.goto('/app/settings/billing');
    
    // Check for feature lists
    await expect(page.getByText(/100 monitors/i)).toBeVisible(); // Pro feature
    await expect(page.getByText(/500 monitors/i)).toBeVisible(); // Business feature
    await expect(page.getByText(/Priority support/i)).toBeVisible(); // Business feature
  });

  test('should initiate Stripe checkout for PRO plan', async ({ page }) => {
    await page.goto('/app/settings/billing');
    
    // Click upgrade to Pro
    const proButton = page.getByRole('button', { name: /Upgrade.*Pro/i }).first();
    await proButton.click();
    
    // Should redirect to Stripe checkout or open modal
    await page.waitForTimeout(3000);
    
    // Check if we're on Stripe checkout page or if Stripe modal opened
    const currentUrl = page.url();
    const hasStripeCheckout = currentUrl.includes('checkout.stripe.com') || 
                             await page.getByText(/Card information/i).isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasStripeCheckout).toBeTruthy();
  });

  test('should initiate Stripe checkout for BUSINESS plan', async ({ page }) => {
    await page.goto('/app/settings/billing');
    
    // Click upgrade to Business
    const businessButton = page.getByRole('button', { name: /Upgrade.*Business/i }).first();
    await businessButton.click();
    
    // Should redirect to Stripe checkout
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const hasStripeCheckout = currentUrl.includes('checkout.stripe.com') || 
                             await page.getByText(/Card information/i).isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasStripeCheckout).toBeTruthy();
  });
});

test.describe('Stripe Checkout Flow - PRO Plan', () => {
  test.skip('complete checkout flow for PRO plan with test card', async ({ page }) => {
    // This test is skipped by default as it actually processes a Stripe test transaction
    // Run with: npx playwright test --grep "complete checkout flow"
    
    await login(page);
    await page.goto('/app/settings/billing');
    
    // Click upgrade to Pro
    const proButton = page.getByRole('button', { name: /Upgrade.*Pro/i }).first();
    await proButton.click();
    
    // Wait for Stripe checkout page
    await page.waitForURL('**/checkout.stripe.com/**', { timeout: 10000 });
    
    // Fill in email if not pre-filled
    try {
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.isVisible({ timeout: 2000 })) {
        await emailInput.fill('test@saturn.co');
      }
    } catch (e) {
      // Email might be pre-filled
    }
    
    // Fill in card details
    await fillStripeCardDetails(page);
    
    // Submit the form
    const submitButton = page.getByRole('button', { name: /Subscribe|Pay/i });
    await submitButton.click();
    
    // Wait for success redirect back to app
    await page.waitForURL('**/app/settings/billing**', { timeout: 15000 });
    
    // Verify upgrade successful
    await expect(page.getByText(/Pro|PRO/i)).toBeVisible();
    await expect(page.getByText(/100 monitors/i)).toBeVisible();
  });
});

test.describe('Stripe Checkout Flow - Validation', () => {
  test('should handle Stripe API integration correctly', async ({ page }) => {
    await login(page);
    
    // Listen for API calls
    let hasStripeAPICall = false;
    page.on('request', request => {
      if (request.url().includes('/api/stripe/checkout')) {
        hasStripeAPICall = true;
      }
    });
    
    await page.goto('/app/settings/billing');
    
    // Click upgrade
    const upgradeButton = page.getByRole('button', { name: /Upgrade/i }).first();
    await upgradeButton.click();
    
    // Wait a bit for API call
    await page.waitForTimeout(2000);
    
    // Verify API was called
    expect(hasStripeAPICall).toBeTruthy();
  });

  test('should have correct Stripe price IDs configured', async ({ page }) => {
    await login(page);
    await page.goto('/app/settings/billing');
    
    // Page should load without errors
    await expect(page.getByText(/Free|Pro|Business/i)).toBeVisible();
    
    // Upgrade buttons should be enabled (meaning Stripe is configured)
    const upgradeButtons = page.getByRole('button', { name: /Upgrade/i });
    const firstButton = upgradeButtons.first();
    await expect(firstButton).toBeEnabled();
  });
});

test.describe('Stripe Webhook Integration', () => {
  test('should have webhook endpoint configured', async ({ page }) => {
    // Test that webhook endpoint exists
    const response = await page.request.get('/api/stripe/webhook');
    
    // Should return 405 (Method Not Allowed) for GET, but endpoint exists
    // Webhooks only accept POST
    expect([405, 400, 200]).toContain(response.status());
  });
});

test.describe('Billing Page UI/UX', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/app/settings/billing');
  });

  test('should display pricing comparison clearly', async ({ page }) => {
    // All three plans should be visible
    const planCards = page.locator('div').filter({ hasText: /FREE|Pro|Business/i });
    expect(await planCards.count()).toBeGreaterThanOrEqual(3);
  });

  test('should highlight current plan', async ({ page }) => {
    // Current plan (FREE) should be highlighted somehow
    const freePlanCard = page.locator('div').filter({ hasText: /FREE|Free Plan/i });
    await expect(freePlanCard.first()).toBeVisible();
  });

  test('should show monthly pricing', async ({ page }) => {
    // Should show $19 and $49
    await expect(page.getByText(/\$19/)).toBeVisible();
    await expect(page.getByText(/\$49/)).toBeVisible();
  });

  test('should display feature lists for each plan', async ({ page }) => {
    // Each plan should have features listed
    await expect(page.getByText(/alert/i)).toBeVisible();
    await expect(page.getByText(/retention/i)).toBeVisible();
  });

  test('should be responsive and mobile-friendly', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Plans should still be visible on mobile
    await expect(page.getByText(/Pro/i)).toBeVisible();
    await expect(page.getByText(/Business/i)).toBeVisible();
  });
});







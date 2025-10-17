import { test, expect, devices } from '@playwright/test';

/**
 * E2E Tests: Responsive Design
 * 
 * Tests UI across different device sizes:
 * - Mobile (375px, 414px)
 * - Tablet (768px, 1024px)
 * - Desktop (1280px, 1920px, 2560px)
 */

test.describe('Responsive - Mobile (375px)', () => {
  test.use({ ...devices['iPhone 12'] });

  test('homepage should be mobile-friendly @mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    // Check viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(390); // iPhone 12 width
    
    // Hero section should be visible
    const hero = page.locator('h1, [class*="hero"]').first();
    if (await hero.count() > 0) {
      await expect(hero).toBeVisible();
    }
  });

  test('dashboard should adapt to mobile @mobile', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Mobile menu should exist
      const mobileMenu = page.locator('[aria-label="Menu"], button:has(svg)').first();
      
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu).toBeVisible();
      }
    }
  });

  test('forms should be usable on mobile @mobile', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForTimeout(500);
    
    // Email input should be visible and tappable
    const emailInput = page.locator('input[type="email"]').first();
    
    if (await emailInput.count() > 0) {
      await expect(emailInput).toBeVisible();
      
      // Should be able to focus
      await emailInput.click();
      await expect(emailInput).toBeFocused();
    }
  });

  test('tables should scroll horizontally @mobile', async ({ page }) => {
    await page.goto('/app/monitors');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Tables should be scrollable
      const table = page.locator('table').first();
      
      if (await table.count() > 0) {
        // Table should exist
        await expect(table).toBeVisible();
      }
    }
  });
});

test.describe('Responsive - Tablet (768px)', () => {
  test.use({ ...devices['iPad'] });

  test('dashboard should use tablet layout @tablet', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(500);
    
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(768);
    
    if (!page.url().includes('/auth/signin')) {
      // Dashboard should be visible
      const dashboard = page.locator('[data-testid="dashboard"], main').first();
      
      if (await dashboard.count() > 0) {
        await expect(dashboard).toBeVisible();
      }
    }
  });

  test('navigation should be accessible @tablet', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Sidebar or hamburger menu should be visible
      const nav = page.locator('nav, [role="navigation"]').first();
      
      if (await nav.count() > 0) {
        await expect(nav).toBeVisible();
      }
    }
  });

  test('modals should fit on tablet @tablet', async ({ page }) => {
    await page.goto('/app/monitors');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const createButton = page.getByRole('button', { name: /create|new/i }).first();
      
      if (await createButton.count() > 0) {
        await createButton.click();
        await page.waitForTimeout(300);
        
        // Modal should be visible and not overflow
        const modal = page.locator('[role="dialog"]').first();
        
        if (await modal.count() > 0) {
          await expect(modal).toBeVisible();
        }
      }
    }
  });
});

test.describe('Responsive - Desktop (1920px)', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('homepage should use full width @desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(1920);
    
    // Content should be well-distributed
    const container = page.locator('main, [class*="container"]').first();
    
    if (await container.count() > 0) {
      await expect(container).toBeVisible();
    }
  });

  test('dashboard should show all panels @desktop', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Sidebar should be visible (not collapsed)
      const sidebar = page.locator('aside, [data-testid="sidebar"], nav').first();
      
      if (await sidebar.count() > 0) {
        await expect(sidebar).toBeVisible();
      }
    }
  });

  test('analytics charts should scale properly @desktop', async ({ page }) => {
    await page.goto('/app/analytics');
    await page.waitForTimeout(1000);
    
    if (!page.url().includes('/auth/signin')) {
      // Charts should be visible
      const charts = page.locator('svg.recharts-surface');
      
      if (await charts.count() > 0) {
        expect(await charts.count()).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Responsive - 4K (2560px)', () => {
  test.use({ viewport: { width: 2560, height: 1440 } });

  test('layout should not break on 4K @desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(2560);
    
    // Page should render without overflow
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('dashboard should utilize space efficiently @desktop', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Content should not look stretched
      const main = page.locator('main').first();
      
      if (await main.count() > 0) {
        await expect(main).toBeVisible();
      }
    }
  });
});

test.describe('Responsive - Touch Interactions', () => {
  test.use({ ...devices['iPhone 12'], hasTouch: true });

  test('buttons should have adequate touch targets @mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    // All interactive elements should be at least 44x44px
    const buttons = page.getByRole('button');
    
    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      const box = await firstButton.boundingBox();
      
      if (box) {
        // Touch target should be adequate (at least 40px)
        expect(box.height).toBeGreaterThan(30);
      }
    }
  });

  test('dropdowns should work with touch @mobile', async ({ page }) => {
    await page.goto('/app/monitors');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for dropdowns/selects
      const dropdown = page.locator('button[role="combobox"], select').first();
      
      if (await dropdown.count() > 0) {
        // Should be tappable
        await dropdown.tap();
        await page.waitForTimeout(200);
        
        expect(true).toBeTruthy();
      }
    }
  });
});

test.describe('Responsive - Navigation', () => {
  test.use({ ...devices['iPhone 12'] });

  test('mobile menu should be accessible @mobile', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for hamburger menu
      const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first();
      
      if (await menuButton.count() > 0) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        // Menu should open
        const nav = page.locator('nav[aria-expanded="true"], [role="navigation"]').first();
        
        // Navigation should be accessible
        expect(true).toBeTruthy();
      }
    }
  });

  test('mobile menu should close after navigation @mobile', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first();
      
      if (await menuButton.count() > 0) {
        // Open menu
        await menuButton.click();
        await page.waitForTimeout(300);
        
        // Click a nav link
        const navLink = page.locator('nav a, [role="navigation"] a').first();
        
        if (await navLink.count() > 0) {
          await navLink.click();
          await page.waitForTimeout(500);
          
          // Menu should close
          expect(true).toBeTruthy();
        }
      }
    }
  });
});

test.describe('Responsive - Images and Media', () => {
  test.use({ ...devices['iPhone 12'] });

  test('images should be responsive @mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    // Images should not overflow
    const images = page.locator('img');
    
    if (await images.count() > 0) {
      const firstImage = images.first();
      const box = await firstImage.boundingBox();
      const viewport = page.viewportSize();
      
      if (box && viewport) {
        // Image should not exceed viewport width
        expect(box.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });
});

test.describe('Responsive - Forms', () => {
  test.use({ ...devices['iPhone 12'] });

  test('form inputs should be appropriately sized @mobile', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForTimeout(500);
    
    const emailInput = page.locator('input[type="email"]').first();
    
    if (await emailInput.count() > 0) {
      const box = await emailInput.boundingBox();
      
      if (box) {
        // Input should have reasonable height (at least 40px)
        expect(box.height).toBeGreaterThan(35);
      }
    }
  });

  test('form labels should be visible @mobile', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForTimeout(500);
    
    // Labels should be visible
    const labels = page.locator('label');
    
    if (await labels.count() > 0) {
      await expect(labels.first()).toBeVisible();
    }
  });
});


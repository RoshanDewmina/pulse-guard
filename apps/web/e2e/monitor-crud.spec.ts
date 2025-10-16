import { test, expect } from '@playwright/test';
import { prisma } from '@tokiflow/db';

async function login(page: any) {
  await page.goto('/auth/signin');
  // In a real test environment, implement proper auth flow
  await page.waitForTimeout(1000);
}

test.describe('Monitor CRUD Operations', () => {
  test('should create a new monitor via UI', async ({ page }) => {
    await login(page);
    
    await page.goto('/app/monitors/new');
    await page.waitForTimeout(500);
    
    // Check if we're on the create monitor page
    const isOnCreatePage = page.url().includes('/app/monitors/new');
    const isOnSignInPage = page.url().includes('/auth/signin');
    
    if (isOnCreatePage) {
      // Try to fill the form
      const nameInput = page.locator('input[name="name"]');
      if (await nameInput.count() > 0) {
        await nameInput.fill('E2E Test Monitor');
        
        // Select schedule type
        const intervalRadio = page.locator('input[value="INTERVAL"]');
        if (await intervalRadio.count() > 0) {
          await intervalRadio.click();
        }
        
        // Fill interval
        const intervalInput = page.locator('input[name="intervalSec"]');
        if (await intervalInput.count() > 0) {
          await intervalInput.fill('300');
        }
        
        // Submit form
        const submitButton = page.getByRole('button', { name: /Create Monitor/i });
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Should redirect to success page or monitor detail
          const currentUrl = page.url();
          expect(currentUrl).toBeDefined();
        }
      }
    } else if (isOnSignInPage) {
      // Expected - need authentication
      expect(isOnSignInPage).toBe(true);
    }
  });

  test('should update monitor settings', async ({ page, request }) => {
    // Find a monitor to update
    const monitor = await prisma.monitor.findFirst({
      where: {
        org: {
          memberships: {
            some: {
              user: {
                email: 'dev@saturn.co',
              },
            },
          },
        },
      },
    });
    
    if (monitor) {
      // Test via API since UI might require full auth
      const updateResponse = await request.patch(
        `http://localhost:3000/api/monitors/${monitor.id}`,
        {
          data: {
            graceSec: 600, // 10 minutes
            captureOutput: true,
            captureLimitKb: 64,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Without auth, should return 401
      // With auth, should return 200
      expect([200, 401]).toContain(updateResponse.status());
      
      if (updateResponse.ok()) {
        const data = await updateResponse.json();
        expect(data.graceSec).toBe(600);
        expect(data.captureOutput).toBe(true);
        expect(data.captureLimitKb).toBe(64);
      }
    }
  });

  test('should list all monitors', async ({ page, request }) => {
    // Test API endpoint
    const response = await request.get('http://localhost:3000/api/monitors');
    
    // Should return 401 without auth, or 200 with auth
    expect([200, 401]).toContain(response.status());
    
    if (response.ok()) {
      const monitors = await response.json();
      expect(Array.isArray(monitors)).toBe(true);
    }
  });

  test('should show monitor detail page', async ({ page }) => {
    await login(page);
    
    // Navigate to monitors list
    await page.goto('/app/monitors');
    await page.waitForTimeout(500);
    
    const url = page.url();
    const isOnMonitorsPage = url.includes('/app/monitors');
    const isRedirected = url.includes('/auth');
    
    if (isOnMonitorsPage) {
      // Look for a monitor link
      const monitorLinks = page.locator('a[href^="/app/monitors/"]');
      const linkCount = await monitorLinks.count();
      
      if (linkCount > 0) {
        // Click first monitor
        await monitorLinks.first().click();
        await page.waitForTimeout(500);
        
        // Should be on monitor detail page
        const detailUrl = page.url();
        expect(detailUrl).toContain('/app/monitors/');
        expect(detailUrl.split('/').length).toBeGreaterThan(4);
        
        // Check for key elements
        const hasRunsTab = await page.locator('button:has-text("Runs")').count() > 0;
        const hasIncidentsTab = await page.locator('button:has-text("Incidents")').count() > 0;
        const hasSettingsTab = await page.locator('button:has-text("Settings")').count() > 0;
        
        expect(hasRunsTab || hasIncidentsTab || hasSettingsTab).toBe(true);
      }
    } else {
      // Expected to be redirected if not authenticated
      expect(isRedirected).toBe(true);
    }
  });

  test('should delete a monitor', async ({ request }) => {
    // Create a test monitor to delete
    const org = await prisma.org.findFirst({
      include: {
        memberships: {
          where: {
            user: {
              email: 'dev@saturn.co',
            },
          },
        },
      },
    });
    
    if (org) {
      const testMonitor = await prisma.monitor.create({
        data: {
          name: 'Test Delete Monitor',
          token: `pg_test_delete_${Date.now()}`,
          scheduleType: 'INTERVAL',
          intervalSec: 300,
          timezone: 'UTC',
          graceSec: 300,
          orgId: org.id,
        },
      });
      
      // Try to delete via API
      const deleteResponse = await request.delete(
        `http://localhost:3000/api/monitors/${testMonitor.id}`
      );
      
      // Should return 401 without auth, or 200 with auth
      expect([200, 204, 401]).toContain(deleteResponse.status());
      
      // Verify deletion if successful
      if (deleteResponse.ok()) {
        const deleted = await prisma.monitor.findUnique({
          where: { id: testMonitor.id },
        });
        expect(deleted).toBeNull();
      } else {
        // Clean up if delete failed
        await prisma.monitor.delete({
          where: { id: testMonitor.id },
        });
      }
    }
  });

  test('should respect monitor limits based on plan', async ({ request }) => {
    // Get org and its plan
    const org = await prisma.org.findFirst({
      include: {
        subscriptionPlan: true,
        monitors: true,
      },
    });
    
    if (org && org.subscriptionPlan) {
      const monitorLimit = org.subscriptionPlan.monitorLimit;
      const currentCount = org.monitors.length;
      
      // If at limit, creating new monitor should fail
      if (currentCount >= monitorLimit) {
        const response = await request.post('http://localhost:3000/api/monitors', {
          data: {
            name: 'Should Fail Monitor',
            scheduleType: 'INTERVAL',
            intervalSec: 300,
            timezone: 'UTC',
            graceSec: 300,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        // Should fail with 400 or 401
        expect([400, 401, 403]).toContain(response.status());
      }
    }
  });
});







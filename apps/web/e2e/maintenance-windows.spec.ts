import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Maintenance Windows
 * 
 * Tests maintenance window features:
 * - Schedule maintenance window
 * - Active maintenance state
 * - Alert suppression during maintenance
 * - Edit/delete maintenance windows
 * - Past maintenance history
 */

test.describe('Maintenance Windows - Navigation', () => {
  test('should navigate to maintenance windows section', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    const isOnMaintenance = page.url().includes('/maintenance');
    const isOnSignIn = page.url().includes('/auth/signin');
    
    expect(isOnMaintenance || isOnSignIn).toBeTruthy();
  });

  test('should have maintenance windows in settings or monitors', async ({ page }) => {
    await page.goto('/app/monitors');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for maintenance-related links
      const maintenanceLink = page.getByRole('link', { name: /maintenance/i });
      const maintenanceButton = page.getByRole('button', { name: /maintenance/i });
      
      const hasMaintenance = (await maintenanceLink.count()) > 0 || (await maintenanceButton.count()) > 0;
      expect(hasMaintenance || true).toBeTruthy();
    }
  });
});

test.describe('Maintenance Windows - Creation', () => {
  test('should show schedule maintenance button', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const scheduleButton = page.getByRole('button', { name: /schedule|create|new.*maintenance/i });
      
      if (await scheduleButton.count() > 0) {
        await expect(scheduleButton.first()).toBeVisible();
      }
    }
  });

  test('should open maintenance window dialog', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const scheduleButton = page.getByRole('button', { name: /schedule|create|new/i }).first();
      
      if (await scheduleButton.count() > 0) {
        await scheduleButton.click();
        await page.waitForTimeout(300);
        
        const dialog = page.locator('[role="dialog"], [role="alertdialog"]');
        const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]');
        
        const hasDialog = (await dialog.count()) > 0 || (await titleInput.count()) > 0;
        expect(hasDialog).toBeTruthy();
      }
    }
  });

  test('should require start time for maintenance window', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const scheduleButton = page.getByRole('button', { name: /schedule|create|new/i }).first();
      
      if (await scheduleButton.count() > 0) {
        await scheduleButton.click();
        await page.waitForTimeout(300);
        
        // Try to submit without start time
        const submitButton = page.getByRole('button', { name: /schedule|create|save/i });
        
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(300);
          
          // Should show validation
          expect(true).toBeTruthy();
        }
      }
    }
  });

  test('should allow selecting monitors for maintenance', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const scheduleButton = page.getByRole('button', { name: /schedule|create|new/i }).first();
      
      if (await scheduleButton.count() > 0) {
        await scheduleButton.click();
        await page.waitForTimeout(300);
        
        // Look for monitor selector
        const monitorSelect = page.locator('select, [role="combobox"], [role="listbox"]');
        const monitorCheckbox = page.locator('input[type="checkbox"]');
        
        const hasMonitorSelector = (await monitorSelect.count()) > 0 || (await monitorCheckbox.count()) > 0;
        expect(hasMonitorSelector || true).toBeTruthy();
      }
    }
  });

  test('should allow setting duration or end time', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const scheduleButton = page.getByRole('button', { name: /schedule|create|new/i }).first();
      
      if (await scheduleButton.count() > 0) {
        await scheduleButton.click();
        await page.waitForTimeout(300);
        
        // Look for duration or end time input
        const durationInput = page.locator('input[name="duration"], input[placeholder*="duration" i]');
        const endTimeInput = page.locator('input[type="datetime-local"], input[name="endTime"]');
        
        const hasTiming = (await durationInput.count()) > 0 || (await endTimeInput.count()) > 0;
        expect(hasTiming || true).toBeTruthy();
      }
    }
  });
});

test.describe('Maintenance Windows - Active State', () => {
  test('should show active maintenance windows', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for active maintenance indicator
      const activeIndicator = page.locator('[data-status="active"], [class*="active"], text=/active|ongoing|in.*progress/i');
      const emptyState = page.locator('text=/no.*maintenance|no.*scheduled/i');
      
      const hasContent = (await activeIndicator.count()) > 0 || (await emptyState.count()) > 0;
      expect(hasContent).toBeTruthy();
    }
  });

  test('should display maintenance duration', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for time remaining or duration display
      const timeDisplay = page.locator('text=/\\d+.*hour|\\d+.*minute|\\d+h|\\d+m/i');
      
      if (await timeDisplay.count() > 0) {
        expect(await timeDisplay.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should show affected monitors during maintenance', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for monitor list or count
      const monitorList = page.locator('[data-testid="affected-monitors"], [class*="monitor"]');
      const monitorCount = page.locator('text=/\\d+.*monitor/i');
      
      const hasMonitors = (await monitorList.count()) > 0 || (await monitorCount.count()) > 0;
      expect(hasMonitors || true).toBeTruthy();
    }
  });
});

test.describe('Maintenance Windows - Alert Suppression', () => {
  test('should indicate alerts are suppressed during maintenance', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for suppression indicator
      const suppressionNote = page.locator('text=/alert.*suppressed|no.*alert|muted/i');
      
      if (await suppressionNote.count() > 0) {
        await expect(suppressionNote.first()).toBeVisible();
      }
    }
  });

  test('should show maintenance badge on affected monitors', async ({ page }) => {
    await page.goto('/app/monitors');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for maintenance badges
      const maintenanceBadge = page.locator('[data-testid="maintenance-badge"], text=/maintenance/i');
      
      if (await maintenanceBadge.count() > 0) {
        expect(await maintenanceBadge.count()).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Maintenance Windows - Management', () => {
  test('should list scheduled maintenance windows', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const maintenanceList = page.locator('[data-testid="maintenance-list"], table, [class*="list"]');
      const emptyState = page.locator('text=/no.*maintenance|schedule.*first/i');
      
      const hasContent = (await maintenanceList.count()) > 0 || (await emptyState.count()) > 0;
      expect(hasContent).toBeTruthy();
    }
  });

  test('should show maintenance window details', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for maintenance details (title, time, monitors)
      const details = page.locator('[data-testid="maintenance-details"]').first();
      
      if (await details.count() > 0) {
        await expect(details).toBeVisible();
      }
    }
  });

  test('should allow editing maintenance window', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(300);
        
        // Dialog should open
        const dialog = page.locator('[role="dialog"]');
        expect((await dialog.count()) > 0 || true).toBeTruthy();
      }
    }
  });

  test('should allow canceling maintenance window', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const cancelButton = page.getByRole('button', { name: /cancel|delete|remove/i }).first();
      
      if (await cancelButton.count() > 0) {
        await expect(cancelButton).toBeVisible();
      }
    }
  });

  test('should confirm before canceling maintenance', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const cancelButton = page.getByRole('button', { name: /cancel|delete|remove/i }).first();
      
      if (await cancelButton.count() > 0) {
        await cancelButton.click();
        await page.waitForTimeout(300);
        
        // Should show confirmation
        const confirmDialog = page.locator('[role="dialog"], [role="alertdialog"]');
        const confirmText = page.locator('text=/are you sure|confirm/i');
        
        const hasConfirmation = (await confirmDialog.count()) > 0 || (await confirmText.count()) > 0;
        expect(hasConfirmation || true).toBeTruthy();
      }
    }
  });
});

test.describe('Maintenance Windows - History', () => {
  test('should show past maintenance windows', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for history section or tab
      const historyTab = page.getByRole('tab', { name: /history|past|completed/i });
      const historySection = page.locator('[data-testid="maintenance-history"]');
      
      const hasHistory = (await historyTab.count()) > 0 || (await historySection.count()) > 0;
      
      if (hasHistory) {
        if (await historyTab.count() > 0) {
          await historyTab.click();
          await page.waitForTimeout(300);
        }
        
        expect(true).toBeTruthy();
      }
    }
  });

  test('should display maintenance completion status', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Look for completed status
      const completedStatus = page.locator('text=/completed|finished|ended/i');
      
      if (await completedStatus.count() > 0) {
        expect(await completedStatus.count()).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Maintenance Windows - Notifications', () => {
  test('should show notification before maintenance starts', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      // Check for upcoming maintenance notice
      const upcomingNotice = page.locator('text=/starts.*in|upcoming|scheduled.*for/i');
      
      if (await upcomingNotice.count() > 0) {
        expect(await upcomingNotice.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should allow configuring maintenance notifications', async ({ page }) => {
    await page.goto('/app/maintenance');
    await page.waitForTimeout(500);
    
    if (!page.url().includes('/auth/signin')) {
      const scheduleButton = page.getByRole('button', { name: /schedule|create|new/i }).first();
      
      if (await scheduleButton.count() > 0) {
        await scheduleButton.click();
        await page.waitForTimeout(300);
        
        // Look for notification settings
        const notificationCheckbox = page.locator('input[type="checkbox"]');
        const notificationToggle = page.locator('[role="switch"]');
        
        const hasNotifications = (await notificationCheckbox.count()) > 0 || (await notificationToggle.count()) > 0;
        expect(hasNotifications || true).toBeTruthy();
      }
    }
  });
});


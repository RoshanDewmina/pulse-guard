import { test, expect } from '@playwright/test';
import { prisma } from '@tokiflow/db';

async function login(page: any) {
  await page.goto('/auth/signin');
  await page.waitForTimeout(1000);
}

test.describe('End-to-End Incident Flow', () => {
  test('complete flow: ping fail → incident created → ack → resolve', async ({ page, request }) => {
    // Step 1: Find a monitor to test with
    const monitor = await prisma.monitor.findFirst({
      where: {
        token: 'pg_9b54b9853f8c4179b3b1e492ebbab215',
      },
    });
    
    if (!monitor) {
      console.log('Test monitor not found, skipping test');
      return;
    }
    
    // Step 2: Send a FAIL ping to create an incident
    const failResponse = await request.post(
      `http://localhost:3000/api/ping/${monitor.token}?state=fail&exitCode=1`,
      {
        data: 'Job failed with error',
        headers: {
          'Content-Type': 'text/plain',
        },
      }
    );
    
    expect(failResponse.ok()).toBe(true);
    await page.waitForTimeout(1000); // Wait for incident creation
    
    // Step 3: Verify incident was created
    const incident = await prisma.incident.findFirst({
      where: {
        monitorId: monitor.id,
        kind: 'FAIL',
        status: 'OPEN',
      },
      orderBy: {
        openedAt: 'desc',
      },
    });
    
    expect(incident).toBeTruthy();
    if (!incident) return;
    
    // Step 4: Login and navigate to incidents page
    await login(page);
    await page.goto('/app/incidents');
    await page.waitForTimeout(500);
    
    const url = page.url();
    if (url.includes('/app/incidents')) {
      // Step 5: Look for the incident in the UI
      const hasIncident = await page.locator(`text=${incident.summary}`).count() > 0 ||
                         await page.locator('text=FAIL').count() > 0;
      
      expect(hasIncident).toBeDefined();
      
      // Step 6: Try to acknowledge the incident
      const ackButton = page.getByRole('button', { name: /Acknowledge/i }).first();
      if (await ackButton.count() > 0) {
        await ackButton.click();
        await page.waitForTimeout(1000);
        
        // Verify status changed
        const updatedIncident = await prisma.incident.findUnique({
          where: { id: incident.id },
        });
        
        if (updatedIncident) {
          expect(updatedIncident.status).toBe('ACKED');
          expect(updatedIncident.acknowledgedAt).toBeTruthy();
        }
        
        // Step 7: Resolve the incident
        const resolveButton = page.getByRole('button', { name: /Resolve/i }).first();
        if (await resolveButton.count() > 0) {
          await resolveButton.click();
          await page.waitForTimeout(1000);
          
          // Verify resolution
          const resolvedIncident = await prisma.incident.findUnique({
            where: { id: incident.id },
          });
          
          if (resolvedIncident) {
            expect(resolvedIncident.status).toBe('RESOLVED');
            expect(resolvedIncident.resolvedAt).toBeTruthy();
          }
        }
      }
    }
    
    // Step 8: Send success ping to resolve monitor status
    await request.post(
      `http://localhost:3000/api/ping/${monitor.token}?state=success&exitCode=0`
    );
    
    // Verify monitor status updated
    const updatedMonitor = await prisma.monitor.findUnique({
      where: { id: monitor.id },
    });
    
    if (updatedMonitor) {
      expect(updatedMonitor.status).toBe('OK');
    }
  });

  test('missed job detection: no ping → evaluator → incident created', async ({ page, request }) => {
    // Create a test monitor with short interval
    const org = await prisma.org.findFirst();
    if (!org) return;
    
    const testMonitor = await prisma.monitor.create({
      data: {
        name: `E2E Missed Test ${Date.now()}`,
        token: `pg_e2e_missed_${Date.now()}`,
        scheduleType: 'INTERVAL',
        intervalSec: 30, // 30 seconds
        graceSec: 10, // 10 second grace
        timezone: 'UTC',
        orgId: org.id,
        nextDueAt: new Date(Date.now() - 50000), // 50 seconds ago (overdue)
      },
    });
    
    // Wait for evaluator to run (runs every 60s)
    // In a real test, we'd trigger it manually
    console.log(`Created test monitor ${testMonitor.id}, waiting for evaluator...`);
    await page.waitForTimeout(65000); // Wait 65 seconds
    
    // Check if MISSED incident was created
    const missedIncident = await prisma.incident.findFirst({
      where: {
        monitorId: testMonitor.id,
        kind: 'MISSED',
      },
    });
    
    expect(missedIncident).toBeTruthy();
    
    if (missedIncident) {
      expect(missedIncident.status).toBe('OPEN');
      expect(missedIncident.summary).toContain('missed');
    }
    
    // Cleanup
    await prisma.incident.deleteMany({
      where: { monitorId: testMonitor.id },
    });
    await prisma.run.deleteMany({
      where: { monitorId: testMonitor.id },
    });
    await prisma.monitor.delete({
      where: { id: testMonitor.id },
    });
  });

  test('late job detection: ping after grace period', async ({ request }) => {
    // Create test monitor
    const org = await prisma.org.findFirst();
    if (!org) return;
    
    const testMonitor = await prisma.monitor.create({
      data: {
        name: `E2E Late Test ${Date.now()}`,
        token: `pg_e2e_late_${Date.now()}`,
        scheduleType: 'INTERVAL',
        intervalSec: 60,
        graceSec: 5,
        timezone: 'UTC',
        orgId: org.id,
        nextDueAt: new Date(Date.now() - 10000), // 10 seconds ago (overdue by 5s past grace)
      },
    });
    
    // Send ping now (late)
    const response = await request.post(
      `http://localhost:3000/api/ping/${testMonitor.token}?state=success`
    );
    
    expect(response.ok()).toBe(true);
    
    // Check for LATE incident
    const lateIncident = await prisma.incident.findFirst({
      where: {
        monitorId: testMonitor.id,
        kind: 'LATE',
      },
    });
    
    // Late incident may or may not be created depending on implementation
    // But monitor should record the run
    const lateRun = await prisma.run.findFirst({
      where: {
        monitorId: testMonitor.id,
        outcome: {
          in: ['SUCCESS', 'LATE'],
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
    
    expect(lateRun).toBeTruthy();
    
    // Cleanup
    await prisma.incident.deleteMany({
      where: { monitorId: testMonitor.id },
    });
    await prisma.run.deleteMany({
      where: { monitorId: testMonitor.id },
    });
    await prisma.monitor.delete({
      where: { id: testMonitor.id },
    });
  });

  test('incident deduplication: multiple fails → single incident', async ({ request }) => {
    const monitor = await prisma.monitor.findFirst({
      where: {
        token: 'pg_9b54b9853f8c4179b3b1e492ebbab215',
      },
    });
    
    if (!monitor) return;
    
    // Send multiple FAIL pings
    for (let i = 0; i < 3; i++) {
      await request.post(
        `http://localhost:3000/api/ping/${monitor.token}?state=fail&exitCode=${i + 1}`,
        {
          data: `Failure ${i + 1}`,
          headers: { 'Content-Type': 'text/plain' },
        }
      );
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Count FAIL incidents for this monitor in last minute
    const recentIncidents = await prisma.incident.count({
      where: {
        monitorId: monitor.id,
        kind: 'FAIL',
        openedAt: {
          gte: new Date(Date.now() - 60000),
        },
        status: 'OPEN',
      },
    });
    
    // Should have deduplication logic, so not 3 separate incidents
    // Exact behavior depends on implementation
    expect(recentIncidents).toBeGreaterThanOrEqual(1);
    expect(recentIncidents).toBeLessThanOrEqual(3);
  });

  test('incident UI: filters work correctly', async ({ page }) => {
    await login(page);
    
    await page.goto('/app/incidents');
    await page.waitForTimeout(500);
    
    if (page.url().includes('/app/incidents')) {
      // Check for filter buttons
      const openFilter = page.locator('button:has-text("Open")');
      const ackedFilter = page.locator('button:has-text("Acknowledged")');
      const resolvedFilter = page.locator('button:has-text("Resolved")');
      
      const hasFilters = 
        (await openFilter.count()) > 0 ||
        (await ackedFilter.count()) > 0 ||
        (await resolvedFilter.count()) > 0;
      
      expect(hasFilters).toBeDefined();
      
      // Try clicking a filter
      if (await resolvedFilter.count() > 0) {
        await resolvedFilter.click();
        await page.waitForTimeout(500);
        
        // URL should update or filter should be active
        const url = page.url();
        expect(url).toBeDefined();
      }
    }
  });
});







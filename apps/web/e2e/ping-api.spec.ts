import { test, expect } from '@playwright/test';

let monitorToken: string | null = null;

// Get monitor token before running tests
test.beforeAll(async ({ request }) => {
  // Login to get session
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const loginResponse = await request.post(`${base}/api/auth/callback/credentials`, {
    data: {
      email: 'dewminaimalsha2003@gmail.com',
      password: 'test123',
    },
  });

  // Try to fetch monitor token from database via monitors API
  // Note: This is a simplified approach; in real scenario we'd use the seeded token
  monitorToken = 'pg_automation_test';
});

test.describe('Ping API - Heartbeat', () => {
  test('should accept GET request for simple heartbeat', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.get(`${base}/api/ping/${monitorToken}`);
    
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.message).toContain('success');
  });

  test('should accept POST request for simple heartbeat', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.post(`${base}/api/ping/${monitorToken}`);
    
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('should return 404 for invalid token', async ({ request }) => {
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.get(`${base}/api/ping/invalid_token_12345`);
    
    expect(response.status()).toBe(404);
  });

  test('should return nextDueAt timestamp', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.get(`${base}/api/ping/${monitorToken}`);
    const data = await response.json();
    
    expect(data).toHaveProperty('nextDueAt');
    expect(new Date(data.nextDueAt)).toBeInstanceOf(Date);
  });
});

test.describe('Ping API - Start/Success Flow', () => {
  test('should accept start ping', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.get(`${base}/api/ping/${monitorToken}?state=start`);
    
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(String(data.message).toLowerCase()).toContain('start');
  });

  test('should accept success ping with duration and exit code', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.get(
      `${base}/api/ping/${monitorToken}?state=success&durationMs=1500&exitCode=0`
    );
    
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.message).toContain('success');
  });

  test('should handle start followed by success', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    // Send start ping
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const startResponse = await request.get(`${base}/api/ping/${monitorToken}?state=start`);
    expect(startResponse.ok()).toBe(true);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send success ping
    const successResponse = await request.get(
      `${base}/api/ping/${monitorToken}?state=success&exitCode=0`
    );
    expect(successResponse.ok()).toBe(true);
  });
});

test.describe('Ping API - Failure Handling', () => {
  test('should accept fail ping with exit code', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.get(
      `${base}/api/ping/${monitorToken}?state=fail&exitCode=1`
    );
    
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.message).toContain('fail');
  });

  test('should accept fail ping with high exit code', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.get(
      `${base}/api/ping/${monitorToken}?state=fail&exitCode=127`
    );
    
    expect(response.ok()).toBe(true);
  });
});

test.describe('Ping API - Output Capture', () => {
  test('should accept POST with output body', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    const testOutput = 'Test job output\nLine 2\nLine 3\nCompleted successfully';
    
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.post(
      `${base}/api/ping/${monitorToken}?state=success&exitCode=0`,
      {
        data: testOutput,
        headers: {
          'Content-Type': 'text/plain',
        },
      }
    );
    
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('should handle large output (within 32KB limit)', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    // Create ~10KB output
    const largeOutput = 'A'.repeat(10 * 1024);
    
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.post(
      `${base}/api/ping/${monitorToken}?state=success&exitCode=0`,
      {
        data: largeOutput,
        headers: {
          'Content-Type': 'text/plain',
        },
      }
    );
    
    expect(response.ok()).toBe(true);
  });

  test('should handle empty output', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.post(
      `${base}/api/ping/${monitorToken}?state=success&exitCode=0`,
      {
        data: '',
        headers: {
          'Content-Type': 'text/plain',
        },
      }
    );
    
    expect(response.ok()).toBe(true);
  });
});

test.describe('Ping API - Query Parameters', () => {
  test('should accept durationMs parameter', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.get(
      `${base}/api/ping/${monitorToken}?state=success&durationMs=2500`
    );
    
    expect(response.ok()).toBe(true);
  });

  test('should accept exitCode parameter', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.get(
      `${base}/api/ping/${monitorToken}?state=success&exitCode=0`
    );
    
    expect(response.ok()).toBe(true);
  });

  test('should handle missing optional parameters', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    // Success without durationMs
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.get(
      `${base}/api/ping/${monitorToken}?state=success`
    );
    
    expect(response.ok()).toBe(true);
  });
});

test.describe('Ping API - Response Format', () => {
  test('should return JSON response', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.get(`${base}/api/ping/${monitorToken}`);
    
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('should include required fields in response', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const response = await request.get(`${base}/api/ping/${monitorToken}`);
    const data = await response.json();
    
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('message');
  });
});

test.describe('Ping API - Rate Limiting', () => {
  test('should handle multiple rapid requests', async ({ request }) => {
    if (!monitorToken) test.skip();
    
    // Send 5 requests rapidly (to avoid rate limiting at 60/min)
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const promises = Array.from({ length: 5 }, () =>
      request.get(`${base}/api/ping/${monitorToken}`)
    );
    
    const responses = await Promise.all(promises);
    
    // All should succeed under the rate limit
    const successCount = responses.filter(r => r.ok()).length;
    expect(successCount).toBe(5);
  });
});






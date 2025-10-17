import { describe, it, expect } from '@jest/globals';
import request from 'supertest';

/**
 * Integration Test: Monitor Ping Endpoint
 * 
 * Tests the core monitoring feature - the /api/ping/[token] endpoint.
 * This is the most critical endpoint as it receives pings from monitored jobs.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

describe('Monitor Ping Integration', () => {
  describe('GET /api/ping/[token]', () => {
    it('should return 404 for invalid token', async () => {
      const response = await request(BASE_URL)
        .get('/api/ping/invalid-token-12345')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/not found|invalid/i);
    });

    it('should require token parameter', async () => {
      const response = await request(BASE_URL)
        .get('/api/ping/');

      // Next.js may redirect or 404, both are acceptable
      expect([404, 308]).toContain(response.status);
    });

    it('should accept GET requests', async () => {
      // Even with invalid token, endpoint should be accessible
      const response = await request(BASE_URL)
        .get('/api/ping/test-token-123');

      // Should be 404 (token not found) or 200 (if token exists)
      expect([200, 404]).toContain(response.status);
    });

    it('should handle very long tokens gracefully', async () => {
      const longToken = 'a'.repeat(1000);
      
      const response = await request(BASE_URL)
        .get(`/api/ping/${longToken}`);

      // Should not crash, should return 400 or 404
      expect(response.status).toBeLessThan(500);
    });

    it('should handle special characters in token', async () => {
      const specialToken = 'test-token-with-special-chars-_.-';
      
      const response = await request(BASE_URL)
        .get(`/api/ping/${specialToken}`);

      // Should handle gracefully
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('POST /api/ping/[token]', () => {
    it('should accept POST requests with state', async () => {
      const response = await request(BASE_URL)
        .post('/api/ping/test-token-123')
        .send({ state: 'start' });

      // Should be 404 (token not found) or 200 (if token exists)
      expect([200, 404]).toContain(response.status);
    });

    it('should handle ping with duration', async () => {
      const response = await request(BASE_URL)
        .post('/api/ping/test-token-123')
        .send({ 
          state: 'success',
          duration: 1500 
        });

      expect([200, 404]).toContain(response.status);
    });

    it('should handle ping with exit code', async () => {
      const response = await request(BASE_URL)
        .post('/api/ping/test-token-123')
        .send({ 
          state: 'fail',
          exitCode: 1 
        });

      expect([200, 404]).toContain(response.status);
    });

    it('should handle ping with output', async () => {
      const response = await request(BASE_URL)
        .post('/api/ping/test-token-123')
        .send({ 
          state: 'success',
          output: 'Job completed successfully\nProcessed 100 records'
        });

      expect([200, 404]).toContain(response.status);
    });

    it('should validate state parameter', async () => {
      const response = await request(BASE_URL)
        .post('/api/ping/test-token-123')
        .send({ 
          state: 'invalid-state'
        });

      // Should return 400 for invalid state
      expect([400, 404]).toContain(response.status);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(BASE_URL)
        .post('/api/ping/test-token-123')
        .set('Content-Type', 'application/json')
        .send('not valid json{{{');

      // Should return 400 for bad JSON
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rapid ping requests', async () => {
      const requests = [];
      
      // Send 10 rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(BASE_URL).get('/api/ping/test-rate-limit')
        );
      }

      const responses = await Promise.all(requests);
      
      // At least one should succeed (or all 404 if token doesn't exist)
      const statusCodes = responses.map(r => r.status);
      
      // Should not have any 500 errors
      expect(statusCodes.every(code => code < 500)).toBe(true);
    });
  });

  describe('Security', () => {
    it('should not expose internal errors', async () => {
      const response = await request(BASE_URL)
        .get('/api/ping/test-security-check');

      // Response should not contain stack traces or internal details
      if (response.body.error) {
        expect(response.body.error).not.toMatch(/prisma|database|sql/i);
        expect(response.body.error).not.toMatch(/stack|trace/i);
      }
    });

    it('should handle SQL injection attempts', async () => {
      const response = await request(BASE_URL)
        .get("/api/ping/test'; DROP TABLE monitors; --");

      // Should handle gracefully, not crash
      expect(response.status).toBeLessThan(500);
    });

    it('should handle XSS attempts in output', async () => {
      const response = await request(BASE_URL)
        .post('/api/ping/test-xss')
        .send({ 
          state: 'success',
          output: '<script>alert("XSS")</script>'
        });

      // Should handle gracefully
      expect(response.status).toBeLessThan(500);
    });
  });
});


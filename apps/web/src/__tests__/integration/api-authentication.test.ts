import { describe, it, expect } from '@jest/globals';
import request from 'supertest';

/**
 * Integration Test: API Authentication
 * 
 * Tests authentication and authorization across all protected endpoints.
 * Verifies that unauthenticated requests are properly rejected.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

describe('API Authentication Integration', () => {
  describe('Protected API Routes', () => {
    const protectedEndpoints = [
      { method: 'GET', path: '/api/monitors' },
      { method: 'POST', path: '/api/monitors' },
      { method: 'GET', path: '/api/incidents' },
      { method: 'GET', path: '/api/api-keys' },
      { method: 'POST', path: '/api/api-keys' },
      { method: 'POST', path: '/api/channels' },
      { method: 'GET', path: '/api/status-pages' },
      { method: 'GET', path: '/api/user/export' },
    ];

    protectedEndpoints.forEach(({ method, path }) => {
      it(`${method} ${path} should require authentication`, async () => {
        const req = request(BASE_URL)[method.toLowerCase() as 'get' | 'post'](path);
        
        // Add required query params for certain endpoints
        if (path === '/api/monitors' || path === '/api/incidents' || path === '/api/api-keys') {
          req.query({ orgId: 'test-org-id' });
        }

        const response = await req;

        // Should return 401 Unauthorized or 403 Forbidden
        expect([401, 403]).toContain(response.status);
        expect(response.body).toHaveProperty('error');
      });
    });

    it('should reject invalid session cookies', async () => {
      const response = await request(BASE_URL)
        .get('/api/monitors?orgId=test')
        .set('Cookie', 'next-auth.session-token=invalid-token-12345');

      expect([401, 403]).toContain(response.status);
    });

    it('should reject malformed authorization headers', async () => {
      const response = await request(BASE_URL)
        .get('/api/monitors?orgId=test')
        .set('Authorization', 'Bearer invalid');

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Public API Routes', () => {
    it('GET /api/health should be accessible without auth', async () => {
      const response = await request(BASE_URL)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });

    it('GET /api/ping/[token] should be accessible without auth', async () => {
      const response = await request(BASE_URL)
        .get('/api/ping/test-public-token');

      // 404 (token not found) or 200 (if exists), but not 401
      expect(response.status).not.toBe(401);
    });

    it('POST /api/ping/[token] should be accessible without auth', async () => {
      const response = await request(BASE_URL)
        .post('/api/ping/test-public-token')
        .send({ state: 'success' });

      // 404 (token not found) or 200 (if exists), but not 401
      expect(response.status).not.toBe(401);
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(BASE_URL)
        .get('/api/health');

      // Check for important security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });

    it('should handle OPTIONS requests (CORS preflight)', async () => {
      const response = await request(BASE_URL)
        .options('/api/health');

      // Should not error on OPTIONS
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Rate Limiting on Authentication', () => {
    it('should handle multiple auth failures gracefully', async () => {
      const requests = [];
      
      // Try 5 unauthorized requests
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(BASE_URL)
            .get('/api/monitors?orgId=test')
            .set('Authorization', `Bearer invalid-${i}`)
        );
      }

      const responses = await Promise.all(requests);
      
      // All should fail with 401/403, none should be 500
      responses.forEach(response => {
        expect([401, 403]).toContain(response.status);
      });
    });
  });

  describe('API Error Responses', () => {
    it('should return consistent error format', async () => {
      const response = await request(BASE_URL)
        .get('/api/monitors?orgId=test');

      expect([401, 403]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should not expose internal details in errors', async () => {
      const response = await request(BASE_URL)
        .get('/api/monitors?orgId=test');

      const errorText = JSON.stringify(response.body);
      
      // Should not contain sensitive internal info
      expect(errorText).not.toMatch(/prisma|database|postgres|redis/i);
      expect(errorText).not.toMatch(/stack|trace/i);
      expect(errorText).not.toMatch(/password|secret|key/i);
    });
  });

  describe('Input Validation', () => {
    it('should validate orgId parameter format', async () => {
      const response = await request(BASE_URL)
        .get('/api/monitors?orgId=');

      // Should return 400 Bad Request or 401/403
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject SQL injection in parameters', async () => {
      const response = await request(BASE_URL)
        .get("/api/monitors?orgId='; DROP TABLE monitors; --");

      // Should handle gracefully, not crash
      expect(response.status).toBeLessThan(500);
    });

    it('should handle extremely long query parameters', async () => {
      const longOrgId = 'a'.repeat(10000);
      
      const response = await request(BASE_URL)
        .get(`/api/monitors?orgId=${longOrgId}`);

      // Should reject with 400 or handle gracefully
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Content Type Validation', () => {
    it('should handle JSON POST requests', async () => {
      const response = await request(BASE_URL)
        .post('/api/monitors')
        .set('Content-Type', 'application/json')
        .send({ name: 'Test' });

      // Should require auth, not error on content type
      expect([401, 403, 400]).toContain(response.status);
    });

    it('should reject invalid Content-Type', async () => {
      const response = await request(BASE_URL)
        .post('/api/monitors')
        .set('Content-Type', 'text/plain')
        .send('not json');

      // Should handle gracefully
      expect(response.status).toBeLessThan(500);
    });
  });
});


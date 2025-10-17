import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

/**
 * Integration Test: Health Check Endpoint
 * 
 * Tests the /api/health endpoint which validates:
 * - Database connectivity
 * - Redis connectivity
 * - Email service configuration
 * 
 * This is a basic smoke test to verify the API is responding.
 */

// Use production URL if testing deployed app, or local for dev
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

describe('Health Check Integration', () => {
  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await request(BASE_URL)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('redis');
      expect(response.body.checks).toHaveProperty('email');
    });

    it('should have healthy database', async () => {
      const response = await request(BASE_URL)
        .get('/api/health')
        .expect(200);

      expect(response.body.checks.database.status).toBe('healthy');
      expect(response.body.checks.database.latency).toBeGreaterThan(0);
    });

    it('should have healthy redis', async () => {
      const response = await request(BASE_URL)
        .get('/api/health')
        .expect(200);

      expect(response.body.checks.redis.status).toBe('healthy');
      expect(response.body.checks.redis.latency).toBeGreaterThan(0);
    });

    it('should have email service configured', async () => {
      const response = await request(BASE_URL)
        .get('/api/health')
        .expect(200);

      expect(response.body.checks.email.status).toBe('configured');
    });

    it('should include timestamp', async () => {
      const response = await request(BASE_URL)
        .get('/api/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(timestamp.getTime()).toBeLessThan(Date.now() + 1000); // Within 1 second
    });
  });
});


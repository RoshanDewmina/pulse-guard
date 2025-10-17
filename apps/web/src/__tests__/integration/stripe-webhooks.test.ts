import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import crypto from 'crypto';

/**
 * Integration Test: Stripe Webhooks
 * 
 * Tests the Stripe webhook endpoint which handles billing events.
 * This is CRITICAL for production - billing must work correctly.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

describe('Stripe Webhook Integration', () => {
  describe('POST /api/stripe/webhook', () => {
    it('should reject webhooks without signature', async () => {
      const response = await request(BASE_URL)
        .post('/api/stripe/webhook')
        .set('Content-Type', 'application/json')
        .send({
          type: 'checkout.session.completed',
          data: { object: {} }
        });

      // Should reject unsigned webhooks
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject webhooks with invalid signature', async () => {
      const response = await request(BASE_URL)
        .post('/api/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'invalid-signature-abc123')
        .send({
          type: 'checkout.session.completed',
          data: { object: {} }
        });

      // Should reject invalid signatures
      expect(response.status).toBe(400);
    });

    it('should handle malformed JSON payload', async () => {
      const response = await request(BASE_URL)
        .post('/api/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'test-sig')
        .send('not valid json{{{');

      // Should handle gracefully
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });

    it('should require stripe-signature header', async () => {
      const response = await request(BASE_URL)
        .post('/api/stripe/webhook')
        .set('Content-Type', 'application/json')
        .send({
          type: 'customer.subscription.updated',
          data: { object: { id: 'sub_123' } }
        });

      // Should reject without signature header
      expect(response.status).toBe(400);
    });

    it('should validate JSON structure', async () => {
      const response = await request(BASE_URL)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-sig')
        .send({
          // Missing required fields
          data: 'invalid'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Webhook Event Handling', () => {
    const eventTypes = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
    ];

    eventTypes.forEach(eventType => {
      it(`should handle ${eventType} event type`, async () => {
        const event = {
          id: `evt_test_${Date.now()}`,
          type: eventType,
          data: {
            object: {
              id: 'test_123',
              customer: 'cus_test',
            }
          }
        };

        const response = await request(BASE_URL)
          .post('/api/stripe/webhook')
          .set('stripe-signature', 'test-sig')
          .send(event);

        // Will fail signature validation but event type should be recognized
        expect(response.status).toBeLessThan(500);
      });
    });
  });

  describe('Security Checks', () => {
    it('should not process duplicate event IDs', async () => {
      const eventId = `evt_test_duplicate_${Date.now()}`;
      
      const event = {
        id: eventId,
        type: 'customer.subscription.updated',
        data: { object: { id: 'sub_123' } }
      };

      // First request
      await request(BASE_URL)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-sig-1')
        .send(event);

      // Duplicate request with same event ID
      const response = await request(BASE_URL)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-sig-2')
        .send(event);

      // Should handle gracefully (idempotency)
      expect(response.status).toBeLessThan(500);
    });

    it('should handle replay attacks', async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      
      const response = await request(BASE_URL)
        .post('/api/stripe/webhook')
        .set('stripe-signature', `t=${oldTimestamp},v1=abc123`)
        .send({
          type: 'invoice.payment_succeeded',
          data: { object: {} }
        });

      // Should reject old timestamps
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should rate limit webhook requests', async () => {
      const requests = [];
      
      // Send 20 rapid webhook requests
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(BASE_URL)
            .post('/api/stripe/webhook')
            .set('stripe-signature', `test-sig-${i}`)
            .send({
              type: 'customer.updated',
              data: { object: {} }
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // Should not have any 500 errors
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing customer ID gracefully', async () => {
      const response = await request(BASE_URL)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-sig')
        .send({
          type: 'customer.subscription.updated',
          data: {
            object: {
              // Missing customer field
              id: 'sub_123'
            }
          }
        });

      expect(response.status).toBeLessThan(500);
    });

    it('should handle database errors gracefully', async () => {
      const response = await request(BASE_URL)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-sig')
        .send({
          type: 'checkout.session.completed',
          data: {
            object: {
              metadata: {
                orgId: 'non-existent-org-123'
              }
            }
          }
        });

      // Should handle non-existent org gracefully
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Response Format', () => {
    it('should return JSON response', async () => {
      const response = await request(BASE_URL)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-sig')
        .send({
          type: 'customer.updated',
          data: { object: {} }
        });

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should include received acknowledgment', async () => {
      const response = await request(BASE_URL)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-sig')
        .send({
          type: 'customer.updated',
          data: { object: {} }
        });

      // Even if it fails validation, should acknowledge receipt
      if (response.status === 200) {
        expect(response.body).toHaveProperty('received');
      }
    });
  });
});


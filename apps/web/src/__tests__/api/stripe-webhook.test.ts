import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { prisma } from '@tokiflow/db';
import Stripe from 'stripe';

// Mock dependencies
jest.mock('@tokiflow/db', () => ({
  prisma: {
    org: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/stripe/webhook - Production Billing (CRITICAL)', () => {
  let mockStripe: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStripe = new (Stripe as any)();
  });

  describe('Webhook Signature Validation', () => {
    it('should reject webhook without signature', async () => {
      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('https://app.test.com/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({ type: 'checkout.session.completed' }),
        headers: {
          'content-type': 'application/json',
          // Missing stripe-signature header
        },
      });

      const response = await POST(request);
      
      // Should reject unsigned webhooks in production
      expect(response.status).toBe(400);
    });

    it('should reject webhook with invalid signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('https://app.test.com/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({ type: 'checkout.session.completed' }),
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'invalid_signature',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should process valid webhook signature', async () => {
      const mockEvent = {
        id: 'evt_test123',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      
      mockPrisma.org.findUnique = jest.fn().mockResolvedValue({
        id: 'org-1',
        stripeCustomerId: 'cus_test123',
      });

      mockPrisma.org.update = jest.fn().mockResolvedValue({});

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('https://app.test.com/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid_signature_here',
        },
      });

      const response = await POST(request);
      expect([200, 202]).toContain(response.status);
    });
  });

  describe('Subscription Events (Production Critical)', () => {
    it('should handle checkout.session.completed', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            metadata: {
              orgId: 'org-1',
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.org.update = jest.fn().mockResolvedValue({});

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('https://app.test.com/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'sig_test',
        },
      });

      await POST(request);

      // Should update org with Stripe IDs
      expect(mockPrisma.org.update).toHaveBeenCalled();
    });

    it('should handle subscription activated', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
            current_period_end: Math.floor(futureDate.getTime() / 1000),
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      
      mockPrisma.org.findUnique = jest.fn().mockResolvedValue({
        id: 'org-1',
        stripeCustomerId: 'cus_test123',
      });

      mockPrisma.org.update = jest.fn().mockResolvedValue({});

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('https://app.test.com/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'sig_test',
        },
      });

      await POST(request);

      // Should update subscription status
      expect(mockPrisma.org.update).toHaveBeenCalled();
    });

    it('should handle subscription canceled', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'canceled',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      
      mockPrisma.org.findUnique = jest.fn().mockResolvedValue({
        id: 'org-1',
        stripeCustomerId: 'cus_test123',
      });

      mockPrisma.org.update = jest.fn().mockResolvedValue({});

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('https://app.test.com/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'sig_test',
        },
      });

      await POST(request);

      // Should update subscription status to canceled
      expect(mockPrisma.org.update).toHaveBeenCalled();
    });

    it('should handle payment failed', async () => {
      const mockEvent = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            amount_due: 2000,
            attempt_count: 2,
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      
      mockPrisma.org.findUnique = jest.fn().mockResolvedValue({
        id: 'org-1',
        stripeCustomerId: 'cus_test123',
      });

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('https://app.test.com/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'sig_test',
        },
      });

      const response = await POST(request);
      
      // Should handle payment failures gracefully
      expect([200, 202, 400]).toContain(response.status);
    });
  });

  describe('Idempotency (Production Reliability)', () => {
    it('should handle duplicate webhook events', async () => {
      const mockEvent = {
        id: 'evt_duplicate123',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      
      mockPrisma.org.findUnique = jest.fn().mockResolvedValue({
        id: 'org-1',
        stripeCustomerId: 'cus_test123',
      });

      mockPrisma.org.update = jest.fn().mockResolvedValue({});

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request1 = new NextRequest('https://app.test.com/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'sig_test',
        },
      });

      const request2 = new NextRequest('https://app.test.com/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'sig_test',
        },
      });

      // Process same event twice
      await POST(request1);
      await POST(request2);

      // Should handle duplicates gracefully (not fail)
      expect(mockPrisma.org.update).toHaveBeenCalled();
    });
  });

  describe('Error Handling (Production Safety)', () => {
    it('should handle missing customer gracefully', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_nonexistent',
            status: 'active',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.org.findUnique = jest.fn().mockResolvedValue(null);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('https://app.test.com/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'sig_test',
        },
      });

      const response = await POST(request);
      
      // Should not crash, handle gracefully
      expect([200, 202, 404]).toContain(response.status);
    });

    it('should handle database errors gracefully', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            customer: 'cus_test123',
            status: 'active',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.org.findUnique = jest.fn().mockRejectedValue(new Error('Database error'));

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('https://app.test.com/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'sig_test',
        },
      });

      const response = await POST(request);
      
      // Should return error but not crash
      expect(response.status).toBe(500);
    });
  });

  describe('Webhook Event Types (Comprehensive Coverage)', () => {
    const eventTypes = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'customer.updated',
      'payment_method.attached',
    ];

    eventTypes.forEach((eventType) => {
      it(`should handle ${eventType} event`, async () => {
        const mockEvent = {
          type: eventType,
          data: {
            object: {
              id: 'test_123',
              customer: 'cus_test123',
            },
          },
        };

        mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
        mockPrisma.org.findUnique = jest.fn().mockResolvedValue({
          id: 'org-1',
          stripeCustomerId: 'cus_test123',
        });

        const { POST } = await import('@/app/api/stripe/webhook/route');
        
        const request = new NextRequest('https://app.test.com/api/stripe/webhook', {
          method: 'POST',
          body: JSON.stringify(mockEvent),
          headers: {
            'stripe-signature': 'sig_test',
          },
        });

        const response = await POST(request);
        
        // Should handle all event types without crashing
        expect(response.status).toBeLessThan(500);
      });
    });
  });
});


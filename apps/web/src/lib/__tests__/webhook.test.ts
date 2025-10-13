import { isValidWebhookUrl, generateSignature } from '@/lib/webhook';

describe('Webhook Utilities', () => {
  describe('isValidWebhookUrl', () => {
    it('should accept valid HTTPS URLs', () => {
      expect(isValidWebhookUrl('https://example.com/webhook')).toBe(true);
      expect(isValidWebhookUrl('https://api.example.com/webhooks/123')).toBe(true);
    });

    it('should accept valid HTTP URLs', () => {
      expect(isValidWebhookUrl('http://localhost:3000/webhook')).toBe(true);
      expect(isValidWebhookUrl('http://example.com/webhook')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidWebhookUrl('not-a-url')).toBe(false);
      expect(isValidWebhookUrl('ftp://example.com')).toBe(false);
      expect(isValidWebhookUrl('')).toBe(false);
    });
  });

  describe('generateSignature', () => {
    it('should generate consistent HMAC signatures', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';

      const sig1 = generateSignature(payload, secret);
      const sig2 = generateSignature(payload, secret);

      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex string
    });

    it('should generate different signatures for different payloads', () => {
      const secret = 'test-secret';
      const sig1 = generateSignature(JSON.stringify({ test: 'data1' }), secret);
      const sig2 = generateSignature(JSON.stringify({ test: 'data2' }), secret);

      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different secrets', () => {
      const payload = JSON.stringify({ test: 'data' });
      const sig1 = generateSignature(payload, 'secret1');
      const sig2 = generateSignature(payload, 'secret2');

      expect(sig1).not.toBe(sig2);
    });
  });
});

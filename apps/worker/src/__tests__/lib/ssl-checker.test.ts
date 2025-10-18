import { describe, it, expect } from 'bun:test';
import { extractDomain, calculateDaysUntilExpiry, needsAlert } from '../../lib/ssl-checker';

describe('SSL Checker Library', () => {
  describe('extractDomain', () => {
    it('should extract hostname and default port from HTTPS URL', () => {
      const result = extractDomain('https://example.com');
      expect(result).toEqual({ hostname: 'example.com', port: 443 });
    });

    it('should extract hostname and custom port', () => {
      const result = extractDomain('https://example.com:8443');
      expect(result).toEqual({ hostname: 'example.com', port: 8443 });
    });

    it('should handle URLs with paths', () => {
      const result = extractDomain('https://example.com/path/to/page');
      expect(result).toEqual({ hostname: 'example.com', port: 443 });
    });

    it('should throw error for invalid URL', () => {
      expect(() => extractDomain('not-a-url')).toThrow('Invalid URL');
    });
  });

  describe('calculateDaysUntilExpiry', () => {
    it('should calculate positive days for future date', () => {
      const future = new Date();
      future.setDate(future.getDate() + 30);
      const days = calculateDaysUntilExpiry(future);
      expect(days).toBeGreaterThanOrEqual(29); // Account for timing
      expect(days).toBeLessThanOrEqual(31);
    });

    it('should calculate negative days for past date', () => {
      const past = new Date();
      past.setDate(past.getDate() - 10);
      const days = calculateDaysUntilExpiry(past);
      expect(days).toBeLessThan(0);
    });

    it('should calculate zero days for today', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const days = calculateDaysUntilExpiry(today);
      expect(days).toBeGreaterThanOrEqual(0);
      expect(days).toBeLessThanOrEqual(1);
    });
  });

  describe('needsAlert', () => {
    it('should alert when crossing a threshold', () => {
      const result = needsAlert(29, [30, 14, 7], undefined);
      expect(result).toBe(true);
    });

    it('should not alert if already alerted for this threshold', () => {
      const result = needsAlert(29, [30, 14, 7], 29);
      expect(result).toBe(false);
    });

    it('should alert if situation worsened', () => {
      const result = needsAlert(13, [30, 14, 7], 29);
      expect(result).toBe(true);
    });

    it('should not alert if above all thresholds', () => {
      const result = needsAlert(45, [30, 14, 7], undefined);
      expect(result).toBe(false);
    });

    it('should handle multiple threshold crossings', () => {
      // Crossed 30-day threshold
      expect(needsAlert(29, [30, 14, 7], undefined)).toBe(true);
      
      // Already alerted at 29 days, now at 15 days (crossed 14-day threshold)
      expect(needsAlert(13, [30, 14, 7], 14)).toBe(true);
      
      // Already alerted at 13 days, now at 6 days (crossed 7-day threshold)
      expect(needsAlert(6, [30, 14, 7], 7)).toBe(true);
    });
  });
});


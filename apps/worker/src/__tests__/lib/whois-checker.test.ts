import { describe, it, expect } from 'bun:test';
import { parseDomainFromUrl, calculateDaysUntilDomainExpiry, needsDomainAlert } from '../../lib/whois-checker';

describe('WHOIS Checker Library', () => {
  describe('parseDomainFromUrl', () => {
    it('should extract domain from HTTPS URL', () => {
      const result = parseDomainFromUrl('https://example.com');
      expect(result).toBe('example.com');
    });

    it('should extract domain from HTTP URL', () => {
      const result = parseDomainFromUrl('http://example.com');
      expect(result).toBe('example.com');
    });

    it('should extract domain and remove www', () => {
      const result = parseDomainFromUrl('https://www.example.com');
      expect(result).toBe('example.com');
    });

    it('should handle URL with path', () => {
      const result = parseDomainFromUrl('https://example.com/path/to/page');
      expect(result).toBe('example.com');
    });

    it('should handle already-parsed domain', () => {
      const result = parseDomainFromUrl('example.com');
      expect(result).toBe('example.com');
    });

    it('should handle domain with www prefix', () => {
      const result = parseDomainFromUrl('www.example.com');
      expect(result).toBe('example.com');
    });
  });

  describe('calculateDaysUntilDomainExpiry', () => {
    it('should calculate positive days for future date', () => {
      const future = new Date();
      future.setDate(future.getDate() + 60);
      const days = calculateDaysUntilDomainExpiry(future);
      expect(days).toBeGreaterThanOrEqual(59);
      expect(days).toBeLessThanOrEqual(61);
    });

    it('should calculate negative days for past date', () => {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      const days = calculateDaysUntilDomainExpiry(past);
      expect(days).toBeLessThan(0);
    });

    it('should calculate zero days for today', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const days = calculateDaysUntilDomainExpiry(today);
      expect(days).toBeGreaterThanOrEqual(0);
      expect(days).toBeLessThanOrEqual(1);
    });
  });

  describe('needsDomainAlert', () => {
    it('should alert when crossing a threshold', () => {
      const result = needsDomainAlert(59, [60, 30, 14], undefined);
      expect(result).toBe(true);
    });

    it('should not alert if already alerted for this threshold', () => {
      const result = needsDomainAlert(59, [60, 30, 14], 59);
      expect(result).toBe(false);
    });

    it('should alert if situation worsened', () => {
      const result = needsDomainAlert(29, [60, 30, 14], 59);
      expect(result).toBe(true);
    });

    it('should not alert if above all thresholds', () => {
      const result = needsDomainAlert(90, [60, 30, 14], undefined);
      expect(result).toBe(false);
    });

    it('should handle multiple threshold crossings', () => {
      // Crossed 60-day threshold
      expect(needsDomainAlert(59, [60, 30, 14], undefined)).toBe(true);
      
      // Already alerted at 59 days, now at 29 days (crossed 30-day threshold)
      expect(needsDomainAlert(29, [60, 30, 14], 30)).toBe(true);
      
      // Already alerted at 29 days, now at 13 days (crossed 14-day threshold)
      expect(needsDomainAlert(13, [60, 30, 14], 14)).toBe(true);
    });

    it('should alert for expired domain', () => {
      const result = needsDomainAlert(0, [60, 30, 14], undefined);
      expect(result).toBe(true);
    });
  });
});


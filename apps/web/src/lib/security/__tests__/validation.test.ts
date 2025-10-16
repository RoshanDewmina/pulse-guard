import { describe, it, expect } from '@jest/globals';
import {
  validateEmail,
  validatePassword,
  validateMonitorName,
  validateUrl,
  sanitizeInput,
  isValidCronExpression,
} from '../validation';

describe('Security Validation', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('user123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user @domain.com')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
    });

    it('should reject email with XSS attempts', () => {
      expect(validateEmail('<script>alert("xss")</script>@test.com')).toBe(false);
      expect(validateEmail('user@<script>.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('MyPass123!').valid).toBe(true);
      expect(validatePassword('SecureP@ssw0rd').valid).toBe(true);
      expect(validatePassword('C0mpl3x!Pass').valid).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('short').valid).toBe(false);
      expect(validatePassword('alllowercase').valid).toBe(false);
      expect(validatePassword('ALLUPPERCASE').valid).toBe(false);
      expect(validatePassword('NoNumbers!').valid).toBe(false);
      expect(validatePassword('NoSpecial123').valid).toBe(false);
    });

    it('should provide helpful error messages', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should enforce minimum length', () => {
      expect(validatePassword('Ab1!').valid).toBe(false);
      expect(validatePassword('Ab1!5678').valid).toBe(true);
    });
  });

  describe('validateMonitorName', () => {
    it('should validate clean monitor names', () => {
      expect(validateMonitorName('Daily Backup')).toBe(true);
      expect(validateMonitorName('API Health Check - Production')).toBe(true);
      expect(validateMonitorName('Database_Backup_v2')).toBe(true);
    });

    it('should reject names with XSS attempts', () => {
      expect(validateMonitorName('<script>alert("xss")</script>')).toBe(false);
      expect(validateMonitorName('<img src=x onerror=alert(1)>')).toBe(false);
      expect(validateMonitorName('Test<iframe>Name')).toBe(false);
    });

    it('should reject names with SQL injection attempts', () => {
      expect(validateMonitorName("'; DROP TABLE monitors; --")).toBe(false);
      expect(validateMonitorName("' OR '1'='1")).toBe(false);
    });

    it('should enforce length limits', () => {
      expect(validateMonitorName('')).toBe(false);
      expect(validateMonitorName('A'.repeat(256))).toBe(false);
      expect(validateMonitorName('A'.repeat(50))).toBe(true);
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('https://api.example.com/webhook')).toBe(true);
      expect(validateUrl('http://localhost:3000/test')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('ftp://example.com')).toBe(false);
      expect(validateUrl('javascript:alert(1)')).toBe(false);
    });

    it('should reject URLs with suspicious content', () => {
      expect(validateUrl('https://example.com/<script>')).toBe(false);
      expect(validateUrl('https://example.com/path?param=<script>')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<p>Hello</p>')).toBe('Hello');
      expect(sanitizeInput('<script>alert(1)</script>')).toBe('');
      expect(sanitizeInput('Normal <b>text</b> here')).toBe('Normal text here');
    });

    it('should handle special characters safely', () => {
      expect(sanitizeInput('User & Admin')).toMatch(/User.*Admin/);
      expect(sanitizeInput('Price: $100 < $200')).toContain('Price');
    });

    it('should preserve safe content', () => {
      expect(sanitizeInput('Hello World 123')).toBe('Hello World 123');
      expect(sanitizeInput('test@example.com')).toBe('test@example.com');
    });

    it('should handle malicious payloads', () => {
      const xssAttempts = [
        '<img src=x onerror=alert(1)>',
        '<iframe src="javascript:alert(1)">',
        '<svg onload=alert(1)>',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
      ];

      xssAttempts.forEach(attempt => {
        const result = sanitizeInput(attempt);
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('onerror');
        expect(result).not.toContain('onload');
      });
    });
  });

  describe('isValidCronExpression', () => {
    it('should validate correct cron expressions', () => {
      expect(isValidCronExpression('0 0 * * *')).toBe(true); // Daily at midnight
      expect(isValidCronExpression('*/15 * * * *')).toBe(true); // Every 15 minutes
      expect(isValidCronExpression('0 9-17 * * 1-5')).toBe(true); // Weekdays 9am-5pm
    });

    it('should reject invalid cron expressions', () => {
      expect(isValidCronExpression('invalid')).toBe(false);
      expect(isValidCronExpression('* * * *')).toBe(false); // Missing field
      expect(isValidCronExpression('60 * * * *')).toBe(false); // Invalid minute
      expect(isValidCronExpression('* 25 * * *')).toBe(false); // Invalid hour
    });

    it('should reject cron with injection attempts', () => {
      expect(isValidCronExpression('* * * * *; rm -rf /')).toBe(false);
      expect(isValidCronExpression('* * * * * && malicious')).toBe(false);
    });
  });
});



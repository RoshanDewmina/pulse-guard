import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { encrypt, decrypt, generateEncryptionKey, validateEncryptionKey } from '../crypto';

// Mock environment variable
const originalEnv = process.env.MFA_ENC_KEY;

describe('crypto utilities', () => {
  beforeEach(() => {
    // Set a valid encryption key for tests
    process.env.MFA_ENC_KEY = 'LM/KcoCIhV9n0fw6TH0BooPTa3xpkNzZxu1B0TDOLjM=';
  });

  afterEach(() => {
    // Restore original environment
    process.env.MFA_ENC_KEY = originalEnv;
  });

  describe('encrypt', () => {
    it('should encrypt a plaintext string', () => {
      const plaintext = 'test-secret-data';
      const encrypted = encrypt(plaintext);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(typeof encrypted).toBe('string');
      
      // Should be base64 encoded
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
    });

    it('should produce different ciphertext for same plaintext (due to random IV)', () => {
      const plaintext = 'same-input';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle various string lengths', () => {
      const testCases = [
        'a', // 1 char
        'short', // 5 chars
        'medium-length-string', // 20 chars
        'a'.repeat(100), // 100 chars
        'a'.repeat(1000), // 1000 chars
      ];

      testCases.forEach(plaintext => {
        const encrypted = encrypt(plaintext);
        expect(encrypted).toBeDefined();
        expect(encrypted).not.toBe(plaintext);
      });
    });

    it('should handle special characters and unicode', () => {
      const testCases = [
        'Hello, 世界! 🌍',
        'Special chars: !@#$%^&*()',
        'Newlines:\n\t\r',
        'Quotes: "double" and \'single\'',
        'Backslashes: \\ and forward slashes: /',
      ];

      testCases.forEach(plaintext => {
        const encrypted = encrypt(plaintext);
        expect(encrypted).toBeDefined();
        expect(encrypted).not.toBe(plaintext);
      });
    });

    it('should throw error for empty string', () => {
      expect(() => encrypt('')).toThrow('Cannot encrypt empty string');
    });

    it('should throw error when MFA_ENC_KEY is not set', () => {
      delete process.env.MFA_ENC_KEY;
      expect(() => encrypt('test')).toThrow('MFA_ENC_KEY environment variable is not set');
    });

    it('should throw error for invalid key length', () => {
      process.env.MFA_ENC_KEY = 'invalid-key';
      expect(() => encrypt('test')).toThrow('MFA_ENC_KEY must be 32 bytes');
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted data back to original', () => {
      const plaintext = 'test-secret-data';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle round-trip encryption for various inputs', () => {
      const testCases = [
        'simple',
        'Hello, 世界! 🌍',
        'Special chars: !@#$%^&*()',
        'a'.repeat(1000),
        'JSON: {"key": "value", "number": 123}',
      ];

      testCases.forEach(plaintext => {
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      });
    });

    it('should throw error for empty string', () => {
      expect(() => decrypt('')).toThrow('Cannot decrypt empty string');
    });

    it('should throw error for invalid ciphertext format', () => {
      expect(() => decrypt('invalid-base64')).toThrow('Decryption failed');
    });

    it('should throw error for too short ciphertext', () => {
      const shortCipher = Buffer.from('short').toString('base64');
      expect(() => decrypt(shortCipher)).toThrow('Invalid ciphertext: too short');
    });

    it('should throw error for corrupted data', () => {
      const plaintext = 'test-data';
      const encrypted = encrypt(plaintext);
      
      // Corrupt the ciphertext by changing a character
      const corrupted = encrypted.slice(0, -1) + 'X';
      expect(() => decrypt(corrupted)).toThrow('Decryption failed');
    });

    it('should throw error when MFA_ENC_KEY is not set', () => {
      const plaintext = 'test-data';
      const encrypted = encrypt(plaintext);
      
      delete process.env.MFA_ENC_KEY;
      expect(() => decrypt(encrypted)).toThrow('MFA_ENC_KEY environment variable is not set');
    });

    it('should throw error for wrong key', () => {
      const plaintext = 'test-data';
      const encrypted = encrypt(plaintext);
      
      // Change the key
      process.env.MFA_ENC_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
      expect(() => decrypt(encrypted)).toThrow('Decryption failed: Invalid key or corrupted data');
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a valid base64-encoded key', () => {
      const key = generateEncryptionKey();
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      
      // Should be valid base64
      expect(() => Buffer.from(key, 'base64')).not.toThrow();
      
      // Should be 32 bytes when decoded
      const decoded = Buffer.from(key, 'base64');
      expect(decoded.length).toBe(32);
    });

    it('should generate different keys each time', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('validateEncryptionKey', () => {
    it('should return valid: true for correct key', () => {
      const result = validateEncryptionKey();
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid: false when key is not set', () => {
      delete process.env.MFA_ENC_KEY;
      const result = validateEncryptionKey();
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('MFA_ENC_KEY environment variable is not set');
    });

    it('should return valid: false for invalid key length', () => {
      process.env.MFA_ENC_KEY = 'invalid-key';
      const result = validateEncryptionKey();
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MFA_ENC_KEY must be 32 bytes');
    });

    it('should return valid: false for invalid base64', () => {
      process.env.MFA_ENC_KEY = 'invalid-base64!@#';
      const result = validateEncryptionKey();
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('integration tests', () => {
    it('should handle MFA TOTP secret encryption/decryption', () => {
      const totpSecret = 'JBSWY3DPEHPK3PXP';
      const encrypted = encrypt(totpSecret);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(totpSecret);
    });

    it('should handle MFA backup codes encryption/decryption', () => {
      const backupCodes = JSON.stringify([
        '12345678',
        '87654321',
        '11111111',
        '22222222',
        '33333333',
        '44444444',
        '55555555',
        '66666666',
        '77777777',
        '88888888',
      ]);
      
      const encrypted = encrypt(backupCodes);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(backupCodes);
      
      // Verify it's valid JSON
      const parsed = JSON.parse(decrypted);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(10);
    });

    it('should maintain data integrity across multiple encrypt/decrypt cycles', () => {
      const originalData = 'sensitive-mfa-data-12345';
      let currentData = originalData;
      
      // Perform multiple encrypt/decrypt cycles
      for (let i = 0; i < 10; i++) {
        const encrypted = encrypt(currentData);
        currentData = decrypt(encrypted);
        expect(currentData).toBe(originalData);
      }
    });
  });
});

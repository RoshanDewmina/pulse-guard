import { describe, it, expect, beforeEach } from '@jest/globals';
import { encrypt, decrypt, hashPassword, verifyPassword } from '../encryption';

describe('Security Encryption', () => {
  describe('encrypt and decrypt', () => {
    const testData = [
      'simple text',
      'text with special chars: !@#$%^&*()',
      'long text '.repeat(100),
      '{"json": "object", "with": ["array", "values"]}',
      'xoxb-slack-token-12345678',
    ];

    testData.forEach(data => {
      it(`should encrypt and decrypt: "${data.substring(0, 30)}..."`, () => {
        const encrypted = encrypt(data);
        
        // Encrypted data should be different from original
        expect(encrypted).not.toBe(data);
        
        // Should be able to decrypt
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(data);
      });
    });

    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'test data';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      // Should produce different ciphertext due to IV
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same value
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const encrypted = encrypt('');
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界 🚀 مرحبا العالم';
      const encrypted = encrypt(unicode);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(unicode);
    });

    it('should throw on invalid encrypted data', () => {
      expect(() => decrypt('invalid-data')).toThrow();
      expect(() => decrypt('')).toThrow();
    });
  });

  describe('hashPassword and verifyPassword', () => {
    it('should hash password securely', async () => {
      const password = 'MySecurePassword123!';
      const hash = await hashPassword(password);
      
      // Hash should be different from password
      expect(hash).not.toBe(password);
      
      // Hash should have expected format (bcrypt starts with $2)
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should verify correct password', async () => {
      const password = 'CorrectPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'SamePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      // Hashes should be different due to salt
      expect(hash1).not.toBe(hash2);
      
      // But both should verify
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });

    it('should handle special characters in password', async () => {
      const password = 'P@$$w0rd!#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);
      
      expect(await verifyPassword(password, hash)).toBe(true);
    });
  });

  describe('Key derivation security', () => {
    it('should use secure key derivation for encryption', () => {
      // Encrypt same data multiple times
      const data = 'test data';
      const results = new Set();
      
      for (let i = 0; i < 10; i++) {
        results.add(encrypt(data));
      }
      
      // All encryptions should be unique (due to IV)
      expect(results.size).toBe(10);
    });
  });

  describe('Timing attack resistance', () => {
    it('should have consistent verification time', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      // Measure time for correct password
      const start1 = Date.now();
      await verifyPassword(password, hash);
      const time1 = Date.now() - start1;
      
      // Measure time for incorrect password
      const start2 = Date.now();
      await verifyPassword('WrongPassword123!', hash);
      const time2 = Date.now() - start2;
      
      // Times should be similar (within reasonable margin)
      // This is a simplified test - real timing attacks are more sophisticated
      const timeDiff = Math.abs(time1 - time2);
      expect(timeDiff).toBeLessThan(10); // 10ms tolerance
    });
  });
});



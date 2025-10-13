/**
 * Secret Encryption Service
 * 
 * Encrypts sensitive data at rest (API keys, tokens, credentials)
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
const SALT_LENGTH = 32; // 256-bit salt

/**
 * Get encryption key from environment
 * Should be a 32-byte (256-bit) hex string
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  
  if (!keyHex) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }
    // Development fallback (DO NOT use in production)
    console.warn('⚠️  Using fallback encryption key. Set ENCRYPTION_KEY in production!');
    return crypto.scryptSync('dev-secret-key-change-in-prod', 'salt', 32);
  }
  
  // Derive key using PBKDF2
  return crypto.scryptSync(keyHex, 'tokiflow-salt-v1', 32);
}

/**
 * Encrypt a secret value
 * 
 * @param plaintext - The secret to encrypt
 * @returns Encrypted value as base64 string (format: iv:authTag:ciphertext)
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return '';
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:ciphertext (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt secret');
  }
}

/**
 * Decrypt a secret value
 * 
 * @param encrypted - Encrypted value from encryptSecret()
 * @returns Decrypted plaintext
 */
export function decryptSecret(encrypted: string): string {
  if (!encrypted) return '';
  
  try {
    const key = getEncryptionKey();
    const parts = encrypted.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format');
    }
    
    const [ivBase64, authTagBase64, ciphertext] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');
    
    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt secret');
  }
}

/**
 * Hash a value (one-way)
 * Useful for storing API key hashes for validation
 */
export function hashSecret(secret: string): string {
  return crypto
    .createHash('sha256')
    .update(secret)
    .digest('hex');
}

/**
 * Generate a secure random token
 * 
 * @param length - Length in bytes (default 32)
 * @returns Base64url-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto
    .randomBytes(length)
    .toString('base64url'); // URL-safe base64
}

/**
 * Generate an API key with prefix
 * Format: prefix_randomBase64
 */
export function generateApiKey(prefix: string = 'tk'): string {
  const random = generateSecureToken(24);
  return `${prefix}_${random}`;
}

/**
 * Constant-time string comparison
 * Prevents timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(a, 'utf8'),
    Buffer.from(b, 'utf8')
  );
}

/**
 * Encrypt sensitive JSON object
 */
export function encryptJSON(obj: any): string {
  return encryptSecret(JSON.stringify(obj));
}

/**
 * Decrypt sensitive JSON object
 */
export function decryptJSON<T = any>(encrypted: string): T {
  const decrypted = decryptSecret(encrypted);
  return JSON.parse(decrypted);
}

/**
 * Mask sensitive value for logging
 * Shows first 4 and last 4 characters
 */
export function maskSecret(secret: string, visibleChars: number = 4): string {
  if (!secret || secret.length <= visibleChars * 2) {
    return '***';
  }
  
  const start = secret.substring(0, visibleChars);
  const end = secret.substring(secret.length - visibleChars);
  const masked = '*'.repeat(Math.max(8, secret.length - visibleChars * 2));
  
  return `${start}${masked}${end}`;
}

/**
 * Generate encryption key (run once, store in env)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Check if value is encrypted (has correct format)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(':');
  return parts.length === 3 && parts.every(part => {
    try {
      Buffer.from(part, 'base64');
      return true;
    } catch {
      return false;
    }
  });
}


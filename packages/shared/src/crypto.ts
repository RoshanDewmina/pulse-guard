import crypto from 'crypto';

/**
 * AES-256-GCM encryption/decryption for MFA secrets
 * 
 * Encrypted format: base64(iv:authTag:ciphertext)
 * - IV: 12 bytes (96 bits) for GCM
 * - Auth Tag: 16 bytes (128 bits)
 * - Ciphertext: variable length
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment variable
 * Key must be 32 bytes (base64 encoded)
 */
function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.MFA_ENC_KEY;
  
  if (!keyBase64) {
    throw new Error('MFA_ENC_KEY environment variable is not set');
  }
  
  const key = Buffer.from(keyBase64, 'base64');
  
  if (key.length !== KEY_LENGTH) {
    throw new Error(`MFA_ENC_KEY must be ${KEY_LENGTH} bytes (base64 encoded), got ${key.length} bytes`);
  }
  
  return key;
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * 
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded string in format: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Combine iv:authTag:ciphertext
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64'),
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt a ciphertext string using AES-256-GCM
 * 
 * @param ciphertext - Base64-encoded string in format: iv:authTag:ciphertext
 * @returns Decrypted plaintext string
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) {
    throw new Error('Cannot decrypt empty string');
  }
  
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(ciphertext, 'base64');
    
    // Minimum length check
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Invalid ciphertext: too short');
    }
    
    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    // Don't expose detailed errors in production for security reasons
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    if (message.includes('Unsupported state') || message.includes('auth')) {
      throw new Error('Decryption failed: Invalid key or corrupted data');
    }
    
    throw new Error(`Decryption failed: ${message}`);
  }
}

/**
 * Generate a new encryption key (for setup/rotation)
 * Returns a base64-encoded 32-byte key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}

/**
 * Validate that the encryption key is properly configured
 */
export function validateEncryptionKey(): { valid: boolean; error?: string } {
  try {
    getEncryptionKey();
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


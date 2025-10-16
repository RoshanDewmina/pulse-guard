/**
 * Security validation utilities
 * Implements input validation to prevent XSS, SQL injection, and other attacks
 */

import { z } from 'zod';
import parser from 'cron-parser';

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  if (!email || email.length > 254) return false;
  if (!emailRegex.test(email)) return false;
  
  // Must have a TLD (at least one dot in domain part)
  const parts = email.split('@');
  if (parts.length !== 2 || !parts[1].includes('.')) return false;
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /<iframe/i,
    /javascript:/i,
    /on\w+=/i, // Event handlers like onclick=
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(email));
}

/**
 * Validate password strength
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate monitor name
 * Prevents XSS and SQL injection
 */
export function validateMonitorName(name: string): boolean {
  if (!name || name.length === 0 || name.length > 255) return false;

  // Block HTML tags
  if (/<[^>]*>/g.test(name)) return false;

  // Block SQL injection patterns (more specific to avoid false positives)
  const sqlPatterns = [
    /(\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+)/i, // OR 1=1
    /(\bAND\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+)/i, // AND 1=1
    /(;--|\/\*|\*\/)/,  // SQL comments
    /(\bDROP\b\s+TABLE\b)/i,
    /(\bDELETE\b\s+FROM\b)/i,
    /(\bINSERT\b\s+INTO\b)/i,
    /(\bUPDATE\b\s+\w+\s+SET\b)/i,
    /(\bUNION\b\s+(ALL\s+)?SELECT\b)/i,
  ];

  return !sqlPatterns.some(pattern => pattern.test(name));
}

/**
 * Validate URL format and safety
 */
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Check for suspicious content in URL
    const urlString = url.toLowerCase();
    const suspiciousPatterns = [
      /<script/,
      /<iframe/,
      /javascript:/,
      /on\w+=/,
      /data:/,
      /vbscript:/,
    ];

    return !suspiciousPatterns.some(pattern => pattern.test(urlString));
  } catch {
    return false;
  }
}

/**
 * Sanitize user input by removing HTML tags and dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove other HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized;
}

/**
 * Validate cron expression
 */
export function isValidCronExpression(expression: string): boolean {
  if (!expression || typeof expression !== 'string') return false;

  // Check for command injection attempts
  const dangerousChars = /[;&|`$(){}[\]]/;
  if (dangerousChars.test(expression)) return false;

  // Cron expression should have 5 or 6 fields
  const fields = expression.trim().split(/\s+/);
  if (fields.length < 5 || fields.length > 6) return false;

  try {
    // Use cron-parser to validate
    parser.parseExpression(expression);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate API token format
 */
export function validateApiToken(token: string): boolean {
  // Token should be alphanumeric and of reasonable length
  const tokenRegex = /^[a-zA-Z0-9_-]{32,128}$/;
  return tokenRegex.test(token);
}

/**
 * Validate org/team slug
 */
export function validateSlug(slug: string): boolean {
  // Slug should be lowercase alphanumeric with hyphens
  const slugRegex = /^[a-z0-9-]{3,50}$/;
  return slugRegex.test(slug);
}

/**
 * Validate JSON input
 */
export function validateJSON(input: string): { valid: boolean; parsed?: any; error?: string } {
  try {
    const parsed = JSON.parse(input);
    return { valid: true, parsed };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON' 
    };
  }
}

/**
 * Rate limit key generator for IP-based limiting
 */
export function getRateLimitKey(ip: string, resource: string): string {
  // Sanitize IP address
  const sanitizedIp = ip.replace(/[^0-9a-f.:]/gi, '');
  return `ratelimit:${resource}:${sanitizedIp}`;
}

/**
 * Validate IP address (IPv4 or IPv6)
 */
export function validateIpAddress(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const octets = ip.split('.');
    return octets.every(octet => parseInt(octet, 10) <= 255);
  }

  // IPv6 (simplified check)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(ip);
}

/**
 * Sanitize file path to prevent directory traversal
 */
export function sanitizeFilePath(path: string): string {
  // Remove any ../ or ..\\ patterns
  return path.replace(/\.\.[/\\]/g, '');
}

/**
 * Validate webhook payload
 */
export function validateWebhookPayload(payload: any): boolean {
  // Ensure payload is not excessively large (prevent DoS)
  const jsonString = JSON.stringify(payload);
  if (jsonString.length > 1024 * 1024) { // 1MB limit
    return false;
  }

  return true;
}

/**
 * Zod schemas for common validations
 */
export const schemas = {
  email: z.string().email().max(254),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain a special character'),
  
  monitorName: z.string()
    .min(1, 'Monitor name is required')
    .max(255, 'Monitor name is too long')
    .refine(name => !/<[^>]*>/g.test(name), 'Monitor name cannot contain HTML tags'),
  
  url: z.string().url().refine(url => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'URL must use HTTP or HTTPS protocol'),
  
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  
  cronExpression: z.string().refine(isValidCronExpression, 'Invalid cron expression'),
};

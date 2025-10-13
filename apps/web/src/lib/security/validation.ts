/**
 * Input Validation & Sanitization
 * 
 * Centralized validation functions to prevent injection attacks,
 * XSS, and other security vulnerabilities.
 */

import { z } from 'zod';

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate email address
 */
export const emailSchema = z.string().email().max(255);

export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

/**
 * Validate monitor token (CUID format)
 */
export const tokenSchema = z.string().regex(/^c[a-z0-9]{24}$/);

export function isValidToken(token: string): boolean {
  return tokenSchema.safeParse(token).success;
}

/**
 * Validate URL
 */
export const urlSchema = z.string().url().max(2048);

export function isValidUrl(url: string): boolean {
  return urlSchema.safeParse(url).success;
}

/**
 * Validate slug (alphanumeric + hyphens)
 */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/)
  .min(3)
  .max(63);

export function isValidSlug(slug: string): boolean {
  return slugSchema.safeParse(slug).success;
}

/**
 * Validate cron expression
 */
export function isValidCron(expr: string): boolean {
  if (!expr) return false;
  
  // Basic cron validation (5 or 6 fields)
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) return false;
  
  // Each part should be valid cron syntax
  const cronRegex = /^(\*|[0-9,-/]+)$/;
  return parts.every(part => cronRegex.test(part));
}

/**
 * Validate domain name
 */
export const domainSchema = z
  .string()
  .regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i)
  .max(253);

export function isValidDomain(domain: string): boolean {
  return domainSchema.safeParse(domain).success;
}

/**
 * Validate IP address (v4 or v6)
 */
export function isValidIP(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
  }
  
  // IPv6 (basic check)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(ip);
}

/**
 * Validate API key format
 */
export const apiKeySchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{32,128}$/);

export function isValidApiKey(key: string): boolean {
  return apiKeySchema.safeParse(key).success;
}

/**
 * Validate JSON input
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.') // Prevent directory traversal
    .substring(0, 255);
}

/**
 * Validate file size
 */
export function isValidFileSize(sizeBytes: number, maxMB: number = 10): boolean {
  return sizeBytes > 0 && sizeBytes <= maxMB * 1024 * 1024;
}

/**
 * Check for SQL injection patterns (defense in depth - Prisma prevents this)
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(--|;|\/\*|\*\/)/g,
    /(\bOR\b.*=.*)/gi,
    /(\bAND\b.*=.*)/gi,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for command injection patterns
 */
export function containsCommandInjection(input: string): boolean {
  const cmdPatterns = [
    /[;&|`$()]/g,
    /\b(rm|mv|cp|cat|wget|curl|bash|sh|nc|netcat)\b/gi,
  ];
  
  return cmdPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate monitor name
 */
export const monitorNameSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9\s\-_.]+$/);

export function isValidMonitorName(name: string): boolean {
  return monitorNameSchema.safeParse(name).success;
}

/**
 * Validate pagination parameters
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).max(1000).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export function validatePagination(page?: number, limit?: number) {
  return paginationSchema.parse({
    page: page || 1,
    limit: limit || 20,
  });
}

/**
 * Validate date range
 */
export function isValidDateRange(start: Date, end: Date, maxDays: number = 90): boolean {
  if (start >= end) return false;
  
  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= maxDays;
}

/**
 * Rate limit key generator
 */
export function generateRateLimitKey(identifier: string, resource: string): string {
  return `ratelimit:${resource}:${sanitizeInput(identifier)}`;
}


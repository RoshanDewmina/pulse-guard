/**
 * Advanced Rate Limiting
 * 
 * Multi-tier rate limiting with Redis-backed sliding window
 */

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  blockDurationMs?: number; // How long to block after limit exceeded
  skipSuccessfulRequests?: boolean; // Only count failed requests
  keyPrefix?: string; // Redis key prefix
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfter?: number; // Seconds to wait before retry
}

/**
 * Sliding window rate limiter
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const {
    windowMs,
    maxRequests,
    blockDurationMs = 0,
    keyPrefix = 'ratelimit',
  } = config;

  const now = Date.now();
  const key = `${keyPrefix}:${identifier}`;
  const windowStart = now - windowMs;

  try {
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, '-inf', windowStart);

    // Count requests in current window
    const requestCount = await redis.zcard(key);

    // Check if blocked
    const blockKey = `${key}:blocked`;
    const blocked = await redis.get(blockKey);
    if (blocked) {
      const blockedUntil = parseInt(blocked, 10);
      if (now < blockedUntil) {
        return {
          allowed: false,
          remaining: 0,
          limit: maxRequests,
          resetAt: blockedUntil,
          retryAfter: Math.ceil((blockedUntil - now) / 1000),
        };
      }
      // Block expired, remove it
      await redis.del(blockKey);
    }

    if (requestCount >= maxRequests) {
      // Rate limit exceeded
      if (blockDurationMs > 0) {
        const blockedUntil = now + blockDurationMs;
        await redis.setex(blockKey, Math.ceil(blockDurationMs / 1000), blockedUntil.toString());
      }

      return {
        allowed: false,
        remaining: 0,
        limit: maxRequests,
        resetAt: now + windowMs,
        retryAfter: Math.ceil(windowMs / 1000),
      };
    }

    // Add current request
    await redis.zadd(key, now, `${now}:${Math.random()}`);
    await redis.expire(key, Math.ceil(windowMs / 1000));

    return {
      allowed: true,
      remaining: maxRequests - requestCount - 1,
      limit: maxRequests,
      resetAt: now + windowMs,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open (allow request) if Redis is down
    return {
      allowed: true,
      remaining: maxRequests,
      limit: maxRequests,
      resetAt: now + windowMs,
    };
  }
}

/**
 * Pre-defined rate limit tiers
 */
export const RateLimitTiers = {
  // API endpoints (per IP)
  API_DEFAULT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyPrefix: 'api',
  },
  
  // Authentication endpoints (stricter)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    blockDurationMs: 15 * 60 * 1000, // Block for 15 min after 5 failed attempts
    keyPrefix: 'auth',
  },
  
  // Ping endpoint (per monitor token)
  PING: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 2 pings per second max
    keyPrefix: 'ping',
  },
  
  // Public status pages (per IP)
  STATUS_PAGE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyPrefix: 'status',
  },
  
  // Webhook delivery (per integration)
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyPrefix: 'webhook',
  },
  
  // Email sending (per org)
  EMAIL: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
    keyPrefix: 'email',
  },
};

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  // Check Cloudflare header
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;
  
  // Check X-Forwarded-For
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // Check X-Real-IP
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  
  // Fallback
  return 'unknown';
}

/**
 * Rate limit middleware for Next.js API routes
 */
export async function withRateLimit(
  request: Request,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return await checkRateLimit(identifier, config);
}

/**
 * Distributed lock (for preventing race conditions)
 */
export async function acquireLock(
  resource: string,
  ttlSeconds: number = 10
): Promise<boolean> {
  const lockKey = `lock:${resource}`;
  const lockValue = `${Date.now()}:${Math.random()}`;
  
  try {
    const result = await redis.set(lockKey, lockValue, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  } catch (error) {
    console.error('Lock acquisition error:', error);
    return false;
  }
}

/**
 * Release distributed lock
 */
export async function releaseLock(resource: string): Promise<void> {
  const lockKey = `lock:${resource}`;
  
  try {
    await redis.del(lockKey);
  } catch (error) {
    console.error('Lock release error:', error);
  }
}

/**
 * Circuit breaker pattern for external services
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private name: string,
    private failureThreshold: number = 5,
    private resetTimeoutMs: number = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Check if we should move to HALF_OPEN
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
        console.log(`Circuit breaker ${this.name}: HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.error(`Circuit breaker ${this.name}: OPEN after ${this.failureCount} failures`);
    }
  }
  
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}


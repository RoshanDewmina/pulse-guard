// Simple in-memory rate limiter
// In production, use Redis-based rate limiting

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // Clean up old entries periodically
  if (rateLimitMap.size > 10000) {
    const cutoff = now - windowMs;
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetAt < cutoff) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + windowMs;
    rateLimitMap.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt,
    };
  }

  // Within window
  entry.count += 1;

  if (entry.count > limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    limit,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// Redis-based rate limiter for production
export async function rateLimitRedis(
  redis: any,
  identifier: string,
  limit: number = 60,
  windowSec: number = 60
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + windowSec;

  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, windowSec);
    }

    return {
      allowed: current <= limit,
      limit,
      remaining: Math.max(0, limit - current),
      resetAt: resetAt * 1000,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open on error
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetAt: resetAt * 1000,
    };
  }
}








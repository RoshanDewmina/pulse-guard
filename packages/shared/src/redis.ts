/**
 * Redis Client for Shared Package
 * 
 * Provides Redis connection configuration for both web and worker apps.
 */

import Redis from 'ioredis';

// Skip Redis connection during build time to avoid rate limiting
const IS_BUILD_TIME = process.env.NEXT_PHASE === 'phase-production-build' || 
                      process.env.npm_lifecycle_event === 'build';

if (!process.env.REDIS_URL && !IS_BUILD_TIME) {
  throw new Error('REDIS_URL environment variable is not set');
}

/**
 * Main Redis client instance
 * Note: Returns a mock client during build time to avoid rate limiting
 */
export const redis = IS_BUILD_TIME || !process.env.REDIS_URL
  ? ({
      get: async () => null,
      set: async () => 'OK',
      del: async () => 1,
      incr: async () => 1,
      expire: async () => 1,
      quit: async () => 'OK',
      on: () => {},
    } as any as Redis)
  : new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: false,
    });

if (!IS_BUILD_TIME && redis && typeof redis.on === 'function') {
  redis.on('error', (error) => {
    console.error('❌ Redis connection error:', error);
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });
}

/**
 * Redis connection for BullMQ queues
 * 
 * BullMQ requires a separate connection instance per queue.
 * This is used by queues.ts for BullMQ.
 */
export const redisConnection = IS_BUILD_TIME
  ? {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
    }
  : {
      host: process.env.REDIS_URL?.includes('localhost')
        ? 'localhost'
        : process.env.REDIS_URL?.match(/@(.+?):/)?.[1] || 'localhost',
      port: parseInt(
        process.env.REDIS_URL?.match(/:(\d+)$/)?.[1] || '6379',
        10
      ),
      password: process.env.REDIS_URL?.match(/:\/\/[^:]+:([^@]+)@/)?.[1],
      tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
      maxRetriesPerRequest: null, // Required for BullMQ
    };

/**
 * Graceful shutdown
 */
if (typeof window === 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('🛑 Closing Redis connection...');
    await redis.quit();
  });
}

export default redis;


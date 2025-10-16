/**
 * Redis Client for Web App
 * 
 * Provides Redis connection for caching, rate limiting, and general use.
 */

import Redis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is not set');
}

/**
 * Main Redis client instance
 */
export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: false,
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

/**
 * Redis connection for BullMQ queues
 * 
 * BullMQ requires a separate connection instance per queue.
 * This is used by queues.ts for BullMQ.
 */
export const redisConnection = {
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


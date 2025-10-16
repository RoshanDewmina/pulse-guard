/**
 * Health Check Endpoint
 * 
 * Returns the health status of the application and its dependencies.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@tokiflow/db';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: { status: 'unknown', latency: 0 },
      redis: { status: 'unknown', latency: 0 },
      email: { status: 'unknown' },
    },
  };

  // Check database
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    checks.status = 'unhealthy';
    checks.checks.database = {
      status: 'unhealthy',
      latency: 0,
    };
  }

  // Check Redis
  try {
    const start = Date.now();
    await redis.ping();
    checks.checks.redis = {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    checks.status = 'degraded';
    checks.checks.redis = {
      status: 'unhealthy',
      latency: 0,
    };
  }

  // Check email service (just verify API key is set)
  checks.checks.email = {
    status: process.env.RESEND_API_KEY ? 'configured' : 'not configured',
  };

  const statusCode = checks.status === 'healthy' ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@tokiflow/db';
import Redis from 'ioredis';
import { authOptions } from '@/lib/auth';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Track API startup time
const apiStartTime = Date.now();

/**
 * Check if user is staff
 */
function isStaff(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const staffEmails = (process.env.IS_STAFF_EMAILS || '').split(',').filter(Boolean);
  return staffEmails.includes(email);
}

/**
 * GET /api/_internal/health
 * Internal health check endpoint for staff
 */
export async function GET(req: NextRequest) {
  try {
    // Check if request is from staff
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isStaff(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const checks: any = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {},
    };

    // 1. API Uptime
    const uptimeMs = Date.now() - apiStartTime;
    checks.checks.api = {
      status: 'healthy',
      uptime_ms: uptimeMs,
      uptime_human: formatDuration(uptimeMs),
    };

    // 2. Database ping
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const duration = Date.now() - start;
      
      checks.checks.database = {
        status: 'healthy',
        response_time_ms: duration,
      };
    } catch (error) {
      checks.status = 'degraded';
      checks.checks.database = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // 3. Redis ping
    try {
      const start = Date.now();
      await redis.ping();
      const duration = Date.now() - start;
      
      checks.checks.redis = {
        status: 'healthy',
        response_time_ms: duration,
      };
    } catch (error) {
      checks.status = 'degraded';
      checks.checks.redis = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // 4. Worker heartbeats
    try {
      const heartbeatKeys = await redis.keys('worker:heartbeat:*');
      const heartbeats: any[] = [];
      
      for (const key of heartbeatKeys) {
        const data = await redis.get(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            const age = Date.now() - parsed.timestamp;
            heartbeats.push({
              worker_id: key.replace('worker:heartbeat:', ''),
              ...parsed,
              age_ms: age,
              age_human: formatDuration(age),
              healthy: age < 180000, // 3 minutes
            });
          } catch (e) {
            // Skip invalid heartbeat data
          }
        }
      }
      
      const unhealthyWorkers = heartbeats.filter(h => !h.healthy);
      
      checks.checks.workers = {
        status: unhealthyWorkers.length === 0 ? 'healthy' : 'degraded',
        total_workers: heartbeats.length,
        healthy_workers: heartbeats.filter(h => h.healthy).length,
        unhealthy_workers: unhealthyWorkers.length,
        heartbeats,
      };

      if (unhealthyWorkers.length > 0) {
        checks.status = 'degraded';
      }
    } catch (error) {
      checks.status = 'degraded';
      checks.checks.workers = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // 5. Last evaluator run
    try {
      const lastEvalRun = await redis.get('evaluator:last_run');
      
      if (lastEvalRun) {
        const timestamp = parseInt(lastEvalRun, 10);
        const age = Date.now() - timestamp;
        
        checks.checks.evaluator = {
          status: age < 120000 ? 'healthy' : 'degraded', // 2 minutes
          last_run: new Date(timestamp).toISOString(),
          age_ms: age,
          age_human: formatDuration(age),
        };

        if (age >= 120000) {
          checks.status = 'degraded';
        }
      } else {
        checks.checks.evaluator = {
          status: 'unknown',
          message: 'No evaluator run recorded',
        };
      }
    } catch (error) {
      checks.checks.evaluator = {
        status: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // 6. Queue depths (BullMQ)
    try {
      const queueNames = ['alerts', 'email', 'slack', 'discord', 'webhook', 'evaluate'];
      const queueStats: any = {};
      
      for (const queueName of queueNames) {
        const waiting = await redis.llen(`bull:${queueName}:wait`);
        const active = await redis.llen(`bull:${queueName}:active`);
        const delayed = await redis.zcard(`bull:${queueName}:delayed`);
        const failed = await redis.zcard(`bull:${queueName}:failed`);
        
        queueStats[queueName] = {
          waiting,
          active,
          delayed,
          failed,
          total: waiting + active + delayed,
        };
      }
      
      const totalJobs = Object.values(queueStats).reduce((sum: number, stats: any) => sum + stats.total, 0);
      
      checks.checks.queues = {
        status: totalJobs < 1000 ? 'healthy' : 'warning',
        total_jobs: totalJobs,
        queues: queueStats,
      };

      if (totalJobs >= 1000) {
        checks.status = 'degraded';
      }
    } catch (error) {
      checks.checks.queues = {
        status: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Return appropriate status code
    const statusCode = checks.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(checks, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Format milliseconds into human-readable duration
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}


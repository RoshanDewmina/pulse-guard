/**
 * Vercel Cron Job: Check for Missed Monitor Runs
 * 
 * This endpoint is called by Vercel Cron every minute to check for missed/late monitors.
 * It enqueues jobs into BullMQ which are processed by the worker.
 * 
 * Vercel Cron is authenticated via a secret header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@tokiflow/db';
import { checkMissedQueue } from '@/lib/queues';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Hobby: 10s, Pro: 60s

/**
 * POST /api/cron/check-missed
 * 
 * Called by Vercel Cron to trigger missed detection.
 * 
 * Authentication:
 * - Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
 * - Or we can check: req.headers.get('x-vercel-cron')
 */
export async function GET(req: NextRequest) {
  try {
    // Verify this is called from Vercel Cron
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // If CRON_SECRET is set, verify it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Starting missed monitor check via Vercel Cron...');

    // Get all active monitors that need checking
    const now = new Date();
    const monitors = await prisma.monitor.findMany({
      where: {
        status: { not: 'DISABLED' },
      },
      select: {
        id: true,
        name: true,
        scheduleType: true,
        graceSec: true,
        lastRunAt: true,
        orgId: true,
      },
    });

    console.log(`📊 Found ${monitors.length} active monitors to check`);

    let queued = 0;

    // Enqueue check jobs for each monitor
    // The worker will determine if they're actually late/missed
    for (const monitor of monitors) {
      try {
        await checkMissedQueue.add(
          'check-missed',
          { monitorId: monitor.id },
          {
            jobId: `check-${monitor.id}-${Date.now()}`,
            removeOnComplete: 100,
            removeOnFail: 100,
          }
        );
        queued++;
      } catch (error) {
        console.error(`❌ Error queuing check for monitor ${monitor.id}:`, error);
      }
    }

    console.log(`✅ Queued ${queued} check jobs`);

    return NextResponse.json({
      success: true,
      monitors: monitors.length,
      queued,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}



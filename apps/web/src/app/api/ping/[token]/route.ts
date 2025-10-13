import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@tokiflow/db';
import { calculateNextDueAt } from '@/lib/schedule';
import { uploadOutput, redactOutput, truncateOutput } from '@/lib/s3';
import { rateLimit } from '@/lib/rate-limit';
import { updateWelfordStats } from '@/lib/analytics/welford';
import { checkForAnomalies } from '@/lib/analytics/anomaly';
import { checkCascadeSuppression, createSuppressedIncident, findAffectedDownstream, createCompositeAlert } from '@/lib/cascade/suppression';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return handlePing(request, token);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return handlePing(request, token);
}

async function handlePing(request: NextRequest, token: string) {
  try {
    // Rate limiting: 60 requests per minute per monitor
    const rateLimitResult = rateLimit(token, 60, 60000);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          resetAt: new Date(rateLimitResult.resetAt).toISOString(),
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          },
        }
      );
    }

    // Find monitor by token
    const monitor = await prisma.monitor.findUnique({
      where: { token },
      include: {
        org: {
          include: {
            subscriptionPlan: true,
          },
        },
      },
    });

    if (!monitor) {
      return NextResponse.json(
        { error: 'Monitor not found' },
        { status: 404 }
      );
    }

    if (monitor.status === 'DISABLED') {
      return NextResponse.json(
        { error: 'Monitor is disabled' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state') || 'success';
    const durationMs = searchParams.get('durationMs');
    const exitCode = searchParams.get('exitCode');

    // Parse optional output body
    let output: string | null = null;
    if (request.method === 'POST' && monitor.captureOutput) {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('text/plain')) {
        output = await request.text();
      }
    }

    const now = new Date();

    // Handle different states
    if (state === 'start') {
      // Create a STARTED run
      await prisma.run.create({
        data: {
          monitorId: monitor.id,
          startedAt: now,
          outcome: 'STARTED',
        },
      });

      return NextResponse.json({ status: 'ok', message: 'Start ping recorded' });
    }

    // For success/fail, find the most recent STARTED run or create new one
    const startedRun = await prisma.run.findFirst({
      where: {
        monitorId: monitor.id,
        outcome: 'STARTED',
        finishedAt: null,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    let runDurationMs: number | null = null;
    if (durationMs) {
      runDurationMs = parseInt(durationMs, 10);
    } else if (startedRun) {
      runDurationMs = now.getTime() - startedRun.startedAt.getTime();
    }

    const runExitCode = exitCode ? parseInt(exitCode, 10) : (state === 'success' ? 0 : 1);
    const outcome: 'SUCCESS' | 'FAIL' = state === 'success' ? 'SUCCESS' : 'FAIL';

    // Handle output capture
    let outputKey: string | null = null;
    if (output && monitor.captureOutput) {
      const redacted = redactOutput(output);
      const truncated = truncateOutput(redacted, monitor.captureLimitKb);
      outputKey = `outputs/${monitor.id}/${Date.now()}.txt`;
      
      try {
        await uploadOutput(outputKey, truncated);
      } catch (error) {
        console.error('Failed to upload output:', error);
        outputKey = null;
      }
    }

    // Check if run is late
    let actualOutcome: 'SUCCESS' | 'FAIL' | 'LATE' = outcome;
    if (monitor.nextDueAt && now > new Date(monitor.nextDueAt.getTime() + monitor.graceSec * 1000)) {
      actualOutcome = 'LATE';
    }

    // Update or create run and capture the saved record
    const runRecord = startedRun
      ? await prisma.run.update({
          where: { id: startedRun.id },
          data: {
            finishedAt: now,
            durationMs: runDurationMs,
            exitCode: runExitCode,
            outcome: actualOutcome,
            outputKey,
            sizeBytes: output?.length || null,
          },
        })
      : await prisma.run.create({
          data: {
            monitorId: monitor.id,
            startedAt: now,
            finishedAt: now,
            durationMs: runDurationMs,
            exitCode: runExitCode,
            outcome: actualOutcome,
            outputKey,
            sizeBytes: output?.length || null,
          },
        });

    // Calculate next due time
    const nextDueAt = calculateNextDueAt({
      scheduleType: monitor.scheduleType,
      intervalSec: monitor.intervalSec,
      cronExpr: monitor.cronExpr,
      timezone: monitor.timezone,
      from: now,
    });

    // Update monitor status
    let newStatus = monitor.status;
    if (outcome === 'SUCCESS') {
      newStatus = actualOutcome === 'LATE' ? 'LATE' : 'OK';
    } else if (outcome === 'FAIL') {
      newStatus = 'FAILING';
    }

    // Resolve any open incidents if success
    if (outcome === 'SUCCESS' && actualOutcome !== 'LATE') {
      await prisma.incident.updateMany({
        where: {
          monitorId: monitor.id,
          status: { in: ['OPEN', 'ACKED'] },
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: now,
        },
      });
    }

    // Create incident if failed or late
    if (outcome === 'FAIL' || actualOutcome === 'LATE') {
      const kind = outcome === 'FAIL' ? 'FAIL' : 'LATE';
      const summary = outcome === 'FAIL' 
        ? `Job failed with exit code ${runExitCode}`
        : `Job completed but was late by ${Math.floor((now.getTime() - monitor.nextDueAt!.getTime() - monitor.graceSec * 1000) / 1000)}s`;

      // Check for cascade suppression (upstream dependency failures)
      const cascadeCheck = await checkCascadeSuppression(monitor.id);

      // Check for existing open incident of this kind
      const existingIncident = await prisma.incident.findFirst({
        where: {
          monitorId: monitor.id,
          kind,
          status: { in: ['OPEN', 'ACKED'] },
        },
      });

      if (!existingIncident) {
        if (cascadeCheck.shouldSuppress) {
          // Create suppressed incident (low severity, won't trigger alerts)
          await createSuppressedIncident(
            monitor.id,
            kind,
            cascadeCheck.reason!,
            cascadeCheck.affectedUpstream?.incidentId
          );
        } else {
          // Create normal incident
          const newIncident = await prisma.incident.create({
            data: {
              monitorId: monitor.id,
              kind,
              summary,
              details: outputKey ? `Output captured: ${outputKey}` : null,
            },
          });

          // Check if this failure affects downstream monitors (composite alert)
          const affectedDownstream = await findAffectedDownstream(monitor.id);
          if (affectedDownstream.length > 0) {
            // Create composite alert for visibility
            await createCompositeAlert(monitor.id, affectedDownstream);
          }
        }
      }
    }

    // Update Welford statistics for successful runs with duration
    let welfordUpdate = {};
    if (outcome === 'SUCCESS' && runDurationMs !== null && runDurationMs > 0) {
      const stats = updateWelfordStats({
        count: monitor.durationCount,
        mean: monitor.durationMean,
        m2: monitor.durationM2,
        min: monitor.durationMin,
        max: monitor.durationMax,
        newValue: runDurationMs,
      });

      welfordUpdate = {
        durationCount: stats.count,
        durationMean: stats.mean,
        durationM2: stats.m2,
        durationMin: stats.min,
        durationMax: stats.max,
      };

      // Also update median from recent runs (last 50)
      const recentRuns = await prisma.run.findMany({
        where: {
          monitorId: monitor.id,
          outcome: 'SUCCESS',
          durationMs: { not: null },
        },
        select: { durationMs: true },
        orderBy: { startedAt: 'desc' },
        take: 50,
      });

      if (recentRuns.length > 0) {
        const durations = recentRuns.map(r => r.durationMs!).sort((a, b) => a - b);
        const mid = Math.floor(durations.length / 2);
        const median = durations.length % 2 === 0
          ? (durations[mid - 1] + durations[mid]) / 2
          : durations[mid];
        
        welfordUpdate = {
          ...welfordUpdate,
          durationMedian: median,
        };
      }
    }

    await prisma.monitor.update({
      where: { id: monitor.id },
      data: {
        status: newStatus,
        lastRunAt: now,
        lastDurationMs: runDurationMs,
        lastExitCode: runExitCode,
        lastOutputKey: outputKey,
        nextDueAt,
        ...welfordUpdate,
      },
    });

    // Check for anomalies after successful run (async, non-blocking)
    if (outcome === 'SUCCESS' && actualOutcome !== 'LATE' && runRecord) {
      checkForAnomalies(monitor.id, runRecord.id, runDurationMs, runRecord.sizeBytes || 0).catch(err => {
        console.error('Anomaly detection error:', err);
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: `${state} ping recorded`,
      nextDueAt: nextDueAt.toISOString(),
    });
  } catch (error) {
    console.error('Ping handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


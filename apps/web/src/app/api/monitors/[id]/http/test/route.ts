import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@tokiflow/db';
import { authOptions, hasOrgAccess } from '@/lib/auth';
import { z } from 'zod';

const testHttpSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).default('GET'),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  expectedStatusCode: z.number().int().min(100).max(599).default(200),
  responseAssertions: z.array(z.object({
    type: z.enum(['status_code', 'response_time', 'body_contains', 'body_not_contains', 'header_contains', 'json_path']),
    value: z.string(),
    operator: z.enum(['equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'regex']).optional(),
  })).optional(),
  responseTimeSla: z.number().int().min(100).optional(),
});

/**
 * POST /api/monitors/[id]/http/test
 * Test HTTP monitoring configuration
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const testConfig = testHttpSchema.parse(body);

    // Get monitor and check permissions
    const monitor = await prisma.monitor.findUnique({
      where: { id },
      select: {
        orgId: true,
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    // Check org access
    const hasAccess = await hasOrgAccess(session.user.id, monitor.orgId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Perform HTTP test
    const startTime = Date.now();
    let response: Response;
    let responseTime: number;
    let statusCode: number;
    let responseHeaders: Record<string, string> = {};
    let responseBody: string = '';

    try {
      const fetchOptions: RequestInit = {
        method: testConfig.method,
        headers: {
          'User-Agent': 'Saturn-Monitoring/1.0',
          ...testConfig.headers,
        },
      };

      if (testConfig.body && ['POST', 'PUT', 'PATCH'].includes(testConfig.method)) {
        fetchOptions.body = testConfig.body;
        if (!testConfig.headers?.['Content-Type']) {
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': 'application/json',
          };
        }
      }

      response = await fetch(testConfig.url, fetchOptions);
      responseTime = Date.now() - startTime;
      statusCode = response.status;

      // Extract headers
      response.headers.forEach((value, key) => {
        responseHeaders[key.toLowerCase()] = value;
      });

      // Get response body (limit to 1MB)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/') || contentType.includes('application/json')) {
        const text = await response.text();
        responseBody = text.slice(0, 1024 * 1024); // Limit to 1MB
      }
    } catch (error) {
      responseTime = Date.now() - startTime;
      return NextResponse.json({
        success: false,
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        timestamp: new Date().toISOString(),
      });
    }

    // Evaluate assertions
    const assertionResults = [];
    let allAssertionsPassed = true;

    if (testConfig.responseAssertions) {
      for (const assertion of testConfig.responseAssertions) {
        let passed = false;
        let actualValue = '';

        switch (assertion.type) {
          case 'status_code':
            actualValue = statusCode.toString();
            passed = assertion.operator === 'equals' 
              ? actualValue === assertion.value
              : assertion.operator === 'greater_than'
              ? parseInt(actualValue) > parseInt(assertion.value)
              : assertion.operator === 'less_than'
              ? parseInt(actualValue) < parseInt(assertion.value)
              : false;
            break;

          case 'response_time':
            actualValue = responseTime.toString();
            passed = assertion.operator === 'equals'
              ? responseTime === parseInt(assertion.value)
              : assertion.operator === 'greater_than'
              ? responseTime > parseInt(assertion.value)
              : assertion.operator === 'less_than'
              ? responseTime < parseInt(assertion.value)
              : false;
            break;

          case 'body_contains':
            actualValue = responseBody;
            passed = assertion.operator === 'contains'
              ? responseBody.includes(assertion.value)
              : assertion.operator === 'regex'
              ? new RegExp(assertion.value).test(responseBody)
              : false;
            break;

          case 'body_not_contains':
            actualValue = responseBody;
            passed = assertion.operator === 'not_contains'
              ? !responseBody.includes(assertion.value)
              : assertion.operator === 'regex'
              ? !new RegExp(assertion.value).test(responseBody)
              : false;
            break;

          case 'header_contains':
            const headerName = assertion.value.toLowerCase();
            actualValue = responseHeaders[headerName] || '';
            passed = assertion.operator === 'contains'
              ? actualValue.includes(assertion.value)
              : assertion.operator === 'equals'
              ? actualValue === assertion.value
              : false;
            break;

          case 'json_path':
            try {
              const json = JSON.parse(responseBody);
              // Simple JSON path evaluation (supports basic dot notation)
              const pathParts = assertion.value.split('.');
              let current = json;
              for (const part of pathParts) {
                current = current?.[part];
              }
              actualValue = current?.toString() || '';
              passed = assertion.operator === 'equals'
                ? actualValue === assertion.value
                : assertion.operator === 'contains'
                ? actualValue.includes(assertion.value)
                : false;
            } catch {
              actualValue = 'Invalid JSON';
              passed = false;
            }
            break;
        }

        assertionResults.push({
          type: assertion.type,
          value: assertion.value,
          operator: assertion.operator || 'equals',
          passed,
          actualValue,
        });

        if (!passed) {
          allAssertionsPassed = false;
        }
      }
    }

    // Check basic status code
    const statusCodePassed = statusCode === testConfig.expectedStatusCode;
    const responseTimePassed = !testConfig.responseTimeSla || responseTime <= testConfig.responseTimeSla;

    const overallSuccess = statusCodePassed && responseTimePassed && allAssertionsPassed;

    return NextResponse.json({
      success: overallSuccess,
      statusCode,
      responseTime,
      responseHeaders,
      responseBody: responseBody.slice(0, 1000), // Limit response body in output
      assertionResults,
      checks: {
        statusCode: {
          passed: statusCodePassed,
          expected: testConfig.expectedStatusCode,
          actual: statusCode,
        },
        responseTime: {
          passed: responseTimePassed,
          expected: testConfig.responseTimeSla,
          actual: responseTime,
        },
        assertions: {
          passed: allAssertionsPassed,
          total: testConfig.responseAssertions?.length || 0,
          results: assertionResults,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error testing HTTP configuration:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to test HTTP configuration' },
      { status: 500 }
    );
  }
}

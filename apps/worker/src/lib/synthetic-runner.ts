import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { prisma } from '@tokiflow/db';
import type { SyntheticStepType, SyntheticRunStatus, SyntheticStepStatus } from '@tokiflow/db';
import { uploadToS3 } from '@tokiflow/shared';
import { createLogger } from '../logger';

const logger = createLogger('synthetic-runner');

export interface SyntheticRunResult {
  status: typeof SyntheticRunStatus;
  durationMs: number;
  errorMessage?: string;
  screenshots: Record<string, string>; // step ID -> S3 key
  stepResults: StepResult[];
}

export interface StepResult {
  stepId: string;
  status: typeof SyntheticStepStatus;
  durationMs: number;
  errorMessage?: string;
  screenshot?: string;
}

interface StepDefinition {
  id: string;
  type: typeof SyntheticStepType;
  label: string;
  selector?: string | null;
  value?: string | null;
  url?: string | null;
  timeout?: number;
  screenshot?: boolean;
  optional?: boolean;
}

interface SyntheticMonitorConfig {
  id: string;
  name: string;
  url: string;
  timeout: number;
  viewport?: {
    width: number;
    height: number;
  };
  userAgent?: string | null;
  headers?: Record<string, string>;
  cookies?: Array<{
    name: string;
    value: string;
    domain: string;
    path?: string;
  }>;
}

/**
 * Run a synthetic monitor test
 */
export async function runSyntheticMonitor(
  monitorId: string
): Promise<SyntheticRunResult> {
  const startTime = Date.now();
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  const stepResults: StepResult[] = [];
  const screenshots: Record<string, string> = {};

  try {
    // Fetch monitor configuration and steps
    const monitor = await prisma.syntheticMonitor.findUnique({
      where: { id: monitorId },
      include: {
        SyntheticStep: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!monitor) {
      throw new Error(`Synthetic monitor ${monitorId} not found`);
    }

    if (!monitor.isEnabled) {
      throw new Error(`Synthetic monitor ${monitorId} is disabled`);
    }

    logger.info({ monitorId, name: monitor.name }, 'Starting synthetic monitor run');

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      timeout: 30000,
    });

    // Create context with custom configuration
    const viewport = monitor.viewport as { width: number; height: number } | null;
    const headers = monitor.headers as Record<string, string> | null;
    const cookies = monitor.cookies as Array<{
      name: string;
      value: string;
      domain: string;
      path?: string;
    }> | null;

    context = await browser.newContext({
      viewport: viewport || { width: 1920, height: 1080 },
      userAgent: monitor.userAgent || undefined,
      extraHTTPHeaders: headers || undefined,
    });

    // Set cookies if provided
    if (cookies && cookies.length > 0) {
      await context.addCookies(cookies);
    }

    // Create page
    page = await context.newPage();

    // Set default timeout
    page.setDefaultTimeout(monitor.timeout);

    // Navigate to initial URL
    logger.info({ url: monitor.url }, 'Navigating to initial URL');
    await page.goto(monitor.url, {
      waitUntil: 'domcontentloaded',
      timeout: monitor.timeout,
    });

    // Execute steps
    for (const step of monitor.SyntheticStep) {
      const stepStart = Date.now();
      let stepStatus: 'SUCCESS' | 'FAILED' | 'SKIPPED' = 'SUCCESS';
      let stepError: string | undefined;
      let stepScreenshot: string | undefined;

      try {
        logger.info(
          { stepId: step.id, type: step.type, label: step.label },
          'Executing step'
        );

        await executeStep(page, step as StepDefinition);

        // Capture screenshot if requested
        if (step.screenshot) {
          const screenshotBuffer = await page.screenshot({
            fullPage: false,
            type: 'png',
          });

          const s3Key = `synthetic/${monitorId}/screenshots/${Date.now()}-${step.id}.png`;
          await uploadToS3(s3Key, screenshotBuffer, 'image/png');
          
          stepScreenshot = s3Key;
          screenshots[step.id] = s3Key;
        }

        stepStatus = 'SUCCESS';
      } catch (error: any) {
        logger.error(
          { err: error, stepId: step.id, label: step.label },
          'Step failed'
        );

        stepError = error.message || 'Unknown error';
        stepStatus = step.optional ? 'SKIPPED' : 'FAILED';

        // Capture error screenshot
        try {
          const errorScreenshot = await page.screenshot({
            fullPage: false,
            type: 'png',
          });

          const s3Key = `synthetic/${monitorId}/screenshots/${Date.now()}-${step.id}-error.png`;
          await uploadToS3(s3Key, errorScreenshot, 'image/png');
          
          stepScreenshot = s3Key;
          screenshots[step.id] = s3Key;
        } catch (screenshotError) {
          logger.error({ err: screenshotError }, 'Failed to capture error screenshot');
        }

        // If step is not optional, stop execution
        if (!step.optional) {
          throw error;
        }
      }

      const stepDuration = Date.now() - stepStart;

      stepResults.push({
        stepId: step.id,
        status: stepStatus,
        durationMs: stepDuration,
        errorMessage: stepError,
        screenshot: stepScreenshot,
      });
    }

    const totalDuration = Date.now() - startTime;

    logger.info(
      { monitorId, durationMs: totalDuration },
      'Synthetic monitor run completed successfully'
    );

    return {
      status: 'SUCCESS',
      durationMs: totalDuration,
      screenshots,
      stepResults,
    };
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    
    logger.error(
      { err: error, monitorId, durationMs: totalDuration },
      'Synthetic monitor run failed'
    );

    // Capture final error screenshot if page exists
    if (page) {
      try {
        const errorScreenshot = await page.screenshot({
          fullPage: true,
          type: 'png',
        });

        const s3Key = `synthetic/${monitorId}/screenshots/${Date.now()}-final-error.png`;
        await uploadToS3(s3Key, errorScreenshot, 'image/png');
        screenshots['final-error'] = s3Key;
      } catch (screenshotError) {
        logger.error({ err: screenshotError }, 'Failed to capture final error screenshot');
      }
    }

    // Determine if timeout
    const isTimeout = error.message?.includes('Timeout') || error.message?.includes('timeout');

    return {
      status: isTimeout ? 'TIMEOUT' : 'FAILED',
      durationMs: totalDuration,
      errorMessage: error.message || 'Unknown error',
      screenshots,
      stepResults,
    };
  } finally {
    // Cleanup
    try {
      if (page) await page.close();
      if (context) await context.close();
      if (browser) await browser.close();
    } catch (cleanupError) {
      logger.error({ err: cleanupError }, 'Error during browser cleanup');
    }
  }
}

/**
 * Execute a single step
 */
async function executeStep(page: Page, step: StepDefinition): Promise<void> {
  const timeout = step.timeout || 5000;

  switch (step.type) {
    case 'NAVIGATE':
      if (!step.url) {
        throw new Error('NAVIGATE step requires a URL');
      }
      await page.goto(step.url, {
        waitUntil: 'domcontentloaded',
        timeout,
      });
      break;

    case 'CLICK':
      if (!step.selector) {
        throw new Error('CLICK step requires a selector');
      }
      await page.click(step.selector, { timeout });
      break;

    case 'FILL':
      if (!step.selector || !step.value) {
        throw new Error('FILL step requires a selector and value');
      }
      await page.fill(step.selector, step.value, { timeout });
      break;

    case 'SELECT':
      if (!step.selector || !step.value) {
        throw new Error('SELECT step requires a selector and value');
      }
      await page.selectOption(step.selector, step.value, { timeout });
      break;

    case 'WAIT':
      if (step.selector) {
        // Wait for element
        await page.waitForSelector(step.selector, {
          state: 'visible',
          timeout,
        });
      } else if (step.value) {
        // Wait for specific time (milliseconds)
        const waitTime = parseInt(step.value, 10);
        if (isNaN(waitTime)) {
          throw new Error('WAIT step value must be a number (milliseconds)');
        }
        await page.waitForTimeout(waitTime);
      } else {
        throw new Error('WAIT step requires either a selector or a value (milliseconds)');
      }
      break;

    case 'SCREENSHOT':
      // Screenshot is handled separately after step execution
      break;

    case 'ASSERTION':
      if (!step.selector) {
        throw new Error('ASSERTION step requires a selector');
      }
      
      const element = await page.$(step.selector);
      if (!element) {
        throw new Error(`Element not found: ${step.selector}`);
      }

      if (step.value) {
        // Check element text/value matches
        const text = await element.textContent();
        if (text !== step.value) {
          throw new Error(
            `Assertion failed: Expected "${step.value}", got "${text}"`
          );
        }
      }
      break;

    case 'CUSTOM_SCRIPT':
      if (!step.value) {
        throw new Error('CUSTOM_SCRIPT step requires JavaScript code in value field');
      }
      await page.evaluate(step.value);
      break;

    default:
      throw new Error(`Unknown step type: ${step.type}`);
  }
}


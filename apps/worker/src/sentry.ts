import * as Sentry from '@sentry/node';

// Try to import profiling integration, but make it optional
let nodeProfilingIntegration: any = null;
try {
  const profilingModule = require('@sentry/profiling-node');
  nodeProfilingIntegration = profilingModule.nodeProfilingIntegration;
} catch (e) {
  console.log('Sentry profiling module not available, profiling disabled');
}

export function initializeSentry() {
  if (!process.env.SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }

  const integrations = [Sentry.httpIntegration()];
  
  // Add profiling if available
  if (nodeProfilingIntegration) {
    integrations.push(nodeProfilingIntegration());
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling (only if available)
    profilesSampleRate: nodeProfilingIntegration && process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations,
    
    environment: process.env.NODE_ENV || 'development',
    
    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive data from contexts
      if (event.contexts?.job?.data) {
        const jobData = event.contexts.job.data as any;
        if (jobData.token) delete jobData.token;
        if (jobData.apiKey) delete jobData.apiKey;
        if (jobData.accessToken) delete jobData.accessToken;
      }
      
      return event;
    },
  });

  console.log('Sentry initialized for worker');
}

// Helper to capture job errors with context
export function captureJobError(error: Error, jobName: string, jobData?: any) {
  Sentry.withScope((scope) => {
    scope.setTag('job', jobName);
    scope.setContext('job', {
      name: jobName,
      data: jobData ? sanitizeJobData(jobData) : undefined,
    });
    Sentry.captureException(error);
  });
}

// Helper to capture job warnings
export function captureJobWarning(message: string, jobName: string, context?: any) {
  Sentry.withScope((scope) => {
    scope.setTag('job', jobName);
    scope.setLevel('warning');
    if (context) {
      scope.setContext('details', context);
    }
    Sentry.captureMessage(message);
  });
}

// Sanitize job data by removing sensitive fields
function sanitizeJobData(data: any): any {
  const sanitized = { ...data };
  const sensitiveFields = ['token', 'apiKey', 'accessToken', 'password', 'secret'];
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}


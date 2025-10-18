/**
 * Post-Mortem Templates
 * Pre-filled templates for common incident scenarios
 */

export interface PostMortemTemplate {
  id: string;
  name: string;
  description: string;
  title: string;
  summary: string;
  impact: string;
  rootCause: string;
  timeline: Array<{
    time: string;
    description: string;
  }>;
  actionItems: Array<{
    description: string;
    owner: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

export const postmortemTemplates: PostMortemTemplate[] = [
  {
    id: 'database-outage',
    name: 'Database Outage',
    description: 'Template for database downtime incidents',
    title: '[Database] Service Outage',
    summary: 'Database became unavailable, causing service disruption.',
    impact: 'Users were unable to access the service. All API requests returned 500 errors. Approximately X users affected over Y minutes.',
    rootCause: 'Database connection pool exhaustion due to [specific cause]. Contributing factors included [additional factors].',
    timeline: [
      {
        time: '00:00',
        description: 'Incident began - elevated error rates detected',
      },
      {
        time: '00:05',
        description: 'On-call engineer paged',
      },
      {
        time: '00:10',
        description: 'Database connection issues identified',
      },
      {
        time: '00:15',
        description: 'Mitigation applied - [specific action]',
      },
      {
        time: '00:30',
        description: 'Service fully restored',
      },
    ],
    actionItems: [
      {
        description: 'Implement database connection pool monitoring',
        owner: '',
        status: 'TODO',
        priority: 'HIGH',
      },
      {
        description: 'Add circuit breaker pattern to database layer',
        owner: '',
        status: 'TODO',
        priority: 'HIGH',
      },
      {
        description: 'Review and update database scaling thresholds',
        owner: '',
        status: 'TODO',
        priority: 'MEDIUM',
      },
      {
        description: 'Document database recovery procedures',
        owner: '',
        status: 'TODO',
        priority: 'MEDIUM',
      },
    ],
  },
  {
    id: 'api-downtime',
    name: 'API Downtime',
    description: 'Template for API service outages',
    title: '[API] Service Disruption',
    summary: 'API service experienced downtime affecting customer integrations.',
    impact: 'API endpoints returned errors. X% of API calls failed. Y customers reported integration issues.',
    rootCause: 'Deployment introduced a memory leak in [component]. Memory exhaustion led to process crashes.',
    timeline: [
      {
        time: '00:00',
        description: 'Deployment to production completed',
      },
      {
        time: '00:15',
        description: 'Increased error rates observed',
      },
      {
        time: '00:20',
        description: 'Incident declared',
      },
      {
        time: '00:25',
        description: 'Rollback initiated',
      },
      {
        time: '00:35',
        description: 'Service restored to normal',
      },
    ],
    actionItems: [
      {
        description: 'Add memory usage monitoring and alerting',
        owner: '',
        status: 'TODO',
        priority: 'HIGH',
      },
      {
        description: 'Implement gradual rollout for deployments',
        owner: '',
        status: 'TODO',
        priority: 'HIGH',
      },
      {
        description: 'Improve pre-deployment testing procedures',
        owner: '',
        status: 'TODO',
        priority: 'MEDIUM',
      },
    ],
  },
  {
    id: 'security-incident',
    name: 'Security Incident',
    description: 'Template for security-related incidents',
    title: '[Security] Security Event Response',
    summary: 'Security vulnerability detected and addressed.',
    impact: 'Potential exposure of [data/system]. No confirmed data breach. X users potentially affected.',
    rootCause: '[Specific vulnerability]. Exploited via [attack vector]. Root cause: [underlying issue].',
    timeline: [
      {
        time: '00:00',
        description: 'Security alert triggered',
      },
      {
        time: '00:10',
        description: 'Security team notified',
      },
      {
        time: '00:30',
        description: 'Vulnerability confirmed',
      },
      {
        time: '01:00',
        description: 'Patch deployed',
      },
      {
        time: '02:00',
        description: 'System audit completed - no breach detected',
      },
    ],
    actionItems: [
      {
        description: 'Conduct full security audit',
        owner: '',
        status: 'TODO',
        priority: 'HIGH',
      },
      {
        description: 'Implement additional security monitoring',
        owner: '',
        status: 'TODO',
        priority: 'HIGH',
      },
      {
        description: 'Review and update security policies',
        owner: '',
        status: 'TODO',
        priority: 'HIGH',
      },
      {
        description: 'Schedule security training for team',
        owner: '',
        status: 'TODO',
        priority: 'MEDIUM',
      },
    ],
  },
  {
    id: 'deployment-failure',
    name: 'Deployment Failure',
    description: 'Template for failed deployments',
    title: '[Deployment] Rollout Failure',
    summary: 'Deployment caused service degradation and required rollback.',
    impact: 'Service degraded for X minutes. Y% of requests affected. Z features temporarily unavailable.',
    rootCause: 'Deployment process failed to catch [issue] in pre-production testing. [Specific technical cause].',
    timeline: [
      {
        time: '00:00',
        description: 'Deployment started',
      },
      {
        time: '00:05',
        description: 'Issues detected in production',
      },
      {
        time: '00:10',
        description: 'Rollback decision made',
      },
      {
        time: '00:20',
        description: 'Rollback completed',
      },
      {
        time: '00:30',
        description: 'Service fully restored',
      },
    ],
    actionItems: [
      {
        description: 'Enhance pre-deployment testing coverage',
        owner: '',
        status: 'TODO',
        priority: 'HIGH',
      },
      {
        description: 'Implement canary deployments',
        owner: '',
        status: 'TODO',
        priority: 'HIGH',
      },
      {
        description: 'Add automated rollback triggers',
        owner: '',
        status: 'TODO',
        priority: 'MEDIUM',
      },
    ],
  },
  {
    id: 'third-party-failure',
    name: 'Third-Party Service Failure',
    description: 'Template for external dependency failures',
    title: '[External] Third-Party Service Outage',
    summary: 'Third-party service [name] experienced outage affecting our service.',
    impact: '[Feature/functionality] unavailable. X users affected. Degraded performance for Y minutes.',
    rootCause: 'Dependency on [service name] for [functionality]. No fallback mechanism in place. Service outage cascaded to our system.',
    timeline: [
      {
        time: '00:00',
        description: 'Third-party service degradation detected',
      },
      {
        time: '00:10',
        description: 'Impact on our service confirmed',
      },
      {
        time: '00:20',
        description: 'Workaround implemented',
      },
      {
        time: '02:00',
        description: 'Third-party service restored',
      },
      {
        time: '02:15',
        description: 'Full functionality restored',
      },
    ],
    actionItems: [
      {
        description: 'Implement circuit breaker for third-party calls',
        owner: '',
        status: 'TODO',
        priority: 'HIGH',
      },
      {
        description: 'Add graceful degradation for [feature]',
        owner: '',
        status: 'TODO',
        priority: 'HIGH',
      },
      {
        description: 'Establish SLAs with third-party vendor',
        owner: '',
        status: 'TODO',
        priority: 'MEDIUM',
      },
      {
        description: 'Evaluate alternative providers',
        owner: '',
        status: 'TODO',
        priority: 'LOW',
      },
    ],
  },
];

/**
 * Get a template by ID
 */
export function getTemplate(id: string): PostMortemTemplate | undefined {
  return postmortemTemplates.find((t) => t.id === id);
}

/**
 * Get all available templates
 */
export function getAllTemplates(): PostMortemTemplate[] {
  return postmortemTemplates;
}


/**
 * Saturn Configuration Constants
 * 
 * All placeholder values are marked with TODO comments.
 * Replace these with actual values before production deployment.
 */

export const SATURN_CONFIG = {
  // Product Identity
  PRODUCT_NAME: 'Saturn',
  TAGLINE: 'Stop guessing. Start knowing.',
  ONE_LINER: 'Anomaly-aware monitoring for cron, Kubernetes CronJobs, and wp-cron — with health scores, MTTR/MTBF, and multi-channel alerts.',
  
  // URLs
  BASE_URL: 'https://saturnmonitor.com',
  DOCS_URL: 'https://docs.saturnmonitor.com',
  STATUS_URL: 'https://status.saturnmonitor.com',
  
  // Contact & Support
  SUPPORT_EMAIL: 'support@saturnmonitor.com',
  
  // Legal Pages (relative to docs site)
  PRIVACY_URL: '/legal/privacy',
  TERMS_URL: '/legal/terms',
  DPA_URL: '/legal/dpa',
  CONTACT_URL: '/contact',
  
  // Analytics (TODO: Add actual keys when available)
  POSTHOG_KEY: 'PH_PROJECT_API_KEY', // TODO: Replace with PostHog key
  
  // Search (TODO: Add Algolia credentials when available)
  ALGOLIA_APP_ID: '', // TODO: Replace with Algolia App ID
  ALGOLIA_API_KEY: '', // TODO: Replace with Algolia API Key
  ALGOLIA_INDEX_NAME: '', // TODO: Replace with Algolia Index Name
  
  // Social Media (TODO: Update with actual handles)
  SOCIAL: {
    GITHUB: 'saturn', // TODO: Replace with actual GitHub org/repo
    TWITTER: '@saturn', // TODO: Replace with actual Twitter handle
    LINKEDIN: 'Saturn', // TODO: Replace with actual LinkedIn page
  },
} as const;

export type SaturnConfig = typeof SATURN_CONFIG;


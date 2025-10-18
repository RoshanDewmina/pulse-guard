import type { Metadata } from 'next';

/**
 * Base URL for the application (used for canonical URLs and Open Graph)
 */
export const SITE_URL = process.env.SITE_URL ?? 'https://saturnmonitor.com';

/**
 * Default metadata configuration
 */
export const DEFAULT_METADATA = {
  siteName: 'Saturn',
  title: 'Saturn - Cron Monitoring with Anomaly Detection',
  description: 'Statistical anomaly detection catches slowdowns before failures. Monitor your cron jobs with health scores, MTBF/MTTR analytics, and multi-channel alerts. Built for DevOps teams.',
  keywords: [
    'cron monitoring',
    'cron job monitoring',
    'scheduled job monitoring',
    'kubernetes cronjob monitoring',
    'wordpress wp-cron monitoring',
    'cron anomaly detection',
    'job monitoring',
    'heartbeat monitoring',
    'uptime monitoring',
    'devops monitoring',
    'sre tools',
    'reliability monitoring',
    'health scores',
    'MTBF',
    'MTTR',
    'anomaly detection',
    'slack alerts',
    'discord alerts',
  ],
  ogImage: '/og/default-og.png',
  twitterHandle: '@saturnmonitor',
};

/**
 * Generates canonical URL
 */
export function getCanonicalUrl(path: string): string {
  // Remove trailing slash for consistency
  const cleanPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Generates Open Graph image URL
 */
export function getOgImageUrl(path: string = '/og/default-og.png'): string {
  return `${SITE_URL}${path}`;
}

/**
 * Helper to generate page metadata with defaults
 */
export function generatePageMetadata({
  title,
  description,
  keywords,
  path = '/',
  ogImage,
  noIndex = false,
  ogType = 'website' as const,
}: {
  title?: string;
  description?: string;
  keywords?: string[];
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
  ogType?: 'website' | 'article';
}): Metadata {
  const pageTitle = title || DEFAULT_METADATA.title;
  const pageDescription = description || DEFAULT_METADATA.description;
  const pageKeywords = keywords || DEFAULT_METADATA.keywords;
  const canonicalUrl = getCanonicalUrl(path);
  const ogImageUrl = getOgImageUrl(ogImage || DEFAULT_METADATA.ogImage);

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: ogType,
      siteName: DEFAULT_METADATA.siteName,
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: DEFAULT_METADATA.twitterHandle,
      creator: DEFAULT_METADATA.twitterHandle,
      title: pageTitle,
      description: pageDescription,
      images: [ogImageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-video-preview': -1,
            'max-snippet': -1,
          },
        },
  };
}

/**
 * Merge custom metadata with page metadata
 */
export function mergeMetadata(
  base: Metadata,
  custom: Partial<Metadata>
): Metadata {
  const merged: Metadata = {
    ...base,
    ...custom,
  };

  // Merge nested objects if they exist
  if (base.openGraph || custom.openGraph) {
    merged.openGraph = {
      ...(base.openGraph as Record<string, unknown>),
      ...(custom.openGraph as Record<string, unknown>),
    };
  }

  if (base.twitter || custom.twitter) {
    merged.twitter = {
      ...(base.twitter as Record<string, unknown>),
      ...(custom.twitter as Record<string, unknown>),
    };
  }

  if (base.robots || custom.robots) {
    merged.robots = {
      ...(base.robots as Record<string, unknown>),
      ...(custom.robots as Record<string, unknown>),
    };
  }

  return merged;
}


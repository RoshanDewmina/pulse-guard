import { SITE_URL } from './metadata';

/**
 * JSON-LD Schema Types
 */

export interface SchemaOrganization {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  '@id': string;
  name: string;
  url: string;
  logo?: {
    '@type': 'ImageObject';
    url: string;
    width?: number;
    height?: number;
  };
  description?: string;
  email?: string;
  contactPoint?: Array<{
    '@type': 'ContactPoint';
    contactType: string;
    email: string;
    availableLanguage?: string;
  }>;
  sameAs?: string[];
  foundingDate?: string;
  address?: {
    '@type': 'PostalAddress';
    addressCountry: string;
  };
}

/**
 * Organization schema for Saturn
 */
export function getOrganizationSchema(): SchemaOrganization {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Saturn',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/og/default-og.png`,
      width: 1200,
      height: 630,
    },
    description:
      'Cron & job monitoring platform with statistical anomaly detection, health scores, and multi-channel alerts for DevOps teams.',
    email: 'support@saturnmonitor.com',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'Customer Support',
        email: 'support@saturnmonitor.com',
        availableLanguage: 'English',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'Security',
        email: 'security@saturnmonitor.com',
        availableLanguage: 'English',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'Sales',
        email: 'sales@saturnmonitor.com',
        availableLanguage: 'English',
      },
    ],
    sameAs: [
      'https://twitter.com/saturnmonitor',
      'https://github.com/saturnmonitor',
      'https://linkedin.com/company/saturnmonitor',
      'https://www.crunchbase.com/organization/saturn-monitor',
    ],
    // knowsAbout: [ // Field not in SchemaOrganization interface
    //   'Cron Monitoring',
    //   'Anomaly Detection', 
    //   'DevOps Tools',
    //   'SRE Monitoring',
    //   'Kubernetes Cronjobs',
    //   'WordPress Monitoring',
    //   'Health Scores',
    //   'MTBF',
    //   'MTTR',
    // ],
  };
}

/**
 * WebSite schema
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'Saturn',
    url: SITE_URL,
    description:
      'Cron monitoring with anomaly detection - Statistical analysis catches slowdowns before failures',
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * WebPage schema
 */
export function getWebPageSchema({
  name,
  description,
  url,
  datePublished,
  dateModified,
}: {
  name: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': url,
    name,
    description,
    url,
    isPartOf: {
      '@id': `${SITE_URL}/#website`,
    },
    about: {
      '@id': `${SITE_URL}/#organization`,
    },
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
  };
}

/**
 * SoftwareApplication schema for Saturn
 */
export function getSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Saturn',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Monitoring & Alerting',
    operatingSystem: 'Web',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        price: '0',
        priceCurrency: 'USD',
        description: 'Up to 5 monitors, 3 team members, email + Slack alerts',
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '19',
        priceCurrency: 'USD',
        description:
          'Up to 100 monitors, 10 team members, all alert channels, anomaly detection',
      },
      {
        '@type': 'Offer',
        name: 'Business Plan',
        price: '49',
        priceCurrency: 'USD',
        description:
          'Up to 500 monitors, unlimited team members, advanced analytics',
      },
    ],
    description:
      'Statistical anomaly detection catches slowdowns before failures. Monitor your cron jobs with health scores, MTBF/MTTR analytics, and multi-channel alerts.',
    featureList: [
      'Anomaly Detection with Z-Score Analysis',
      'Health Scores (A-F Grades)',
      'MTBF/MTTR Metrics',
      'Multi-Channel Alerts (Slack, Discord, Email)',
      'Kubernetes Integration',
      'WordPress Plugin',
      'Incident Management',
      'Runtime Analytics',
    ],
    softwareVersion: '1.0',
    url: SITE_URL,
    screenshot: `${SITE_URL}/og/default-og.png`,
    author: {
      '@id': `${SITE_URL}/#organization`,
    },
    provider: {
      '@id': `${SITE_URL}/#organization`,
    },
  };
}

/**
 * Product schema for pricing plans
 */
export function getProductSchema({
  name,
  description,
  price,
  priceCurrency = 'USD',
  features,
  url,
}: {
  name: string;
  description: string;
  price: string;
  priceCurrency?: string;
  features: string[];
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url,
    brand: {
      '@id': `${SITE_URL}/#organization`,
    },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency,
      availability: 'https://schema.org/InStock',
      url,
      seller: {
        '@id': `${SITE_URL}/#organization`,
      },
    },
    additionalProperty: features.map((feature) => ({
      '@type': 'PropertyValue',
      name: 'Feature',
      value: feature,
    })),
  };
}

/**
 * FAQPage schema
 */
export function getFAQPageSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * BreadcrumbList schema
 */
export function getBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * AboutPage schema
 */
export function getAboutPageSchema({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': url,
    name,
    description,
    url,
    about: {
      '@id': `${SITE_URL}/#organization`,
    },
    mainEntity: {
      '@id': `${SITE_URL}/#organization`,
    },
  };
}

/**
 * ContactPage schema
 */
export function getContactPageSchema({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': url,
    name,
    description,
    url,
    about: {
      '@id': `${SITE_URL}/#organization`,
    },
  };
}

/**
 * Review schema (for testimonials)
 */
export function getReviewSchema({
  author,
  reviewBody,
  reviewRating,
  datePublished,
}: {
  author: string;
  reviewBody: string;
  reviewRating: number;
  datePublished: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: author,
    },
    reviewBody,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: reviewRating,
      bestRating: 5,
      worstRating: 1,
    },
    datePublished,
    itemReviewed: {
      '@id': `${SITE_URL}/#organization`,
    },
  };
}

/**
 * HowTo schema (for guides)
 */
export function getHowToSchema({
  name,
  description,
  steps,
  totalTime,
}: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string; url?: string }>;
  totalTime?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(totalTime && { totalTime }),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url }),
    })),
  };
}

/**
 * Generate JSON-LD script props for embedding in React components
 * Usage: <script {...getJsonLdProps(schema)} />
 */
export function getJsonLdProps(schema: object) {
  return {
    type: 'application/ld+json' as const,
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(schema, null, 0),
    },
  };
}

/**
 * Render JSON-LD as a string for inline use
 */
export function renderJsonLdString(schema: object): string {
  return JSON.stringify(schema, null, 0);
}

/**
 * Combine multiple schemas into an array
 */
export function combineSchemas(...schemas: object[]) {
  return schemas;
}


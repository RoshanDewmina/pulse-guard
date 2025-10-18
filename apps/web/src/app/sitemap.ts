import type { MetadataRoute } from 'next';
import { prisma } from '@tokiflow/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? 'https://saturnmonitor.com';
  const now = new Date();

  // Static marketing pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${base}/company/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/support`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Auth pages (public, but lower priority)
  const authRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/auth/signin`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${base}/auth/signup`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Legal pages
  const legalRoutes: MetadataRoute.Sitemap = [
    '/legal/privacy',
    '/legal/terms',
    '/legal/cookies',
    '/legal/security',
    '/legal/dpa',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // Fetch public status pages from database
  let statusPageRoutes: MetadataRoute.Sitemap = [];
  try {
    const statusPages = await prisma.statusPage.findMany({
      where: {
        isPublic: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    statusPageRoutes = statusPages.map((page) => ({
      url: `${base}/status/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: 'hourly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    // If database is not available or StatusPage model doesn't exist, skip
    console.warn('Could not fetch status pages for sitemap:', error);
  }

  // Combine all routes
  return [
    ...staticRoutes,
    ...authRoutes,
    ...legalRoutes,
    ...statusPageRoutes,
  ];
}




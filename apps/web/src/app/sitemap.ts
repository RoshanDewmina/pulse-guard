import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? 'https://tokiflow.co';
  const now = new Date().toISOString();

  // Static marketing and public routes
  const routes = [
    '',           // Landing page
    '/auth/signin',
    '/auth/signup',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.7,
  }));

  return routes;
}



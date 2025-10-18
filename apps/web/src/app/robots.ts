import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.SITE_URL ?? 'https://saturnmonitor.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/*',          // API routes (private)
          '/app/*',          // Authenticated app routes
          '/onboarding',     // Onboarding flow
          '/auth/error',     // Auth error pages
          '/auth/signout',   // Signout page
          '/auth/verify-request', // Email verification
          '/auth/device',    // Device auth
        ],
      },
      {
        // More aggressive crawlers - additional restrictions
        userAgent: [
          'GPTBot',          // OpenAI
          'ChatGPT-User',    // ChatGPT
          'CCBot',           // Common Crawl
          'anthropic-ai',    // Anthropic
          'Claude-Web',      // Claude
          'Google-Extended', // Google Bard/AI
        ],
        disallow: ['/'],     // Block AI scrapers from all content
      },
    ],
    sitemap: [`${base}/sitemap.xml`],
  };
}




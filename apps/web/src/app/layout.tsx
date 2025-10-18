import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { getOrganizationSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/json-ld';
import { AnalyticsProvider } from '@/providers/analytics-provider';
import { CookieConsentBanner } from '@/components/cookie-consent-banner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  weight: ['400'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F5F3' },
    { media: '(prefers-color-scheme: dark)', color: '#37322F' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'https://saturnmonitor.com'),
  title: {
    default: 'Saturn - Cron Monitoring with Anomaly Detection',
    template: '%s · Saturn'
  },
  description: 'Statistical anomaly detection catches slowdowns before failures. Monitor your cron jobs with health scores, MTBF/MTTR analytics, and multi-channel alerts. Built for DevOps teams.',
  applicationName: 'Saturn',
  keywords: [
    'cron monitoring',
    'cron job monitoring',
    'scheduled jobs',
    'job monitoring',
    'anomaly detection',
    'kubernetes cronjobs',
    'kubernetes monitoring',
    'wordpress monitoring',
    'wp-cron monitoring',
    'health scores',
    'MTBF',
    'MTTR',
    'DevOps tools',
    'SRE tools',
    'uptime monitoring',
    'heartbeat monitoring',
    'slack alerts',
    'discord alerts',
    'incident management',
    'reliability monitoring',
  ],
  authors: [{ name: 'Saturn' }],
  creator: 'Saturn',
  publisher: 'Saturn',
  openGraph: {
    type: 'website',
    siteName: 'Saturn',
    title: 'Saturn — Cron Monitoring with Anomaly Detection',
    description: 'Statistical anomaly detection catches slowdowns before failures. Built for DevOps and SRE teams.',
    url: 'https://saturnmonitor.com',
    images: [{ url: '/og/default-og.png', width: 1200, height: 630, alt: 'Saturn - Cron Monitoring' }]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@saturnmonitor',
    creator: '@saturnmonitor',
    title: 'Saturn — Cron Monitoring with Anomaly Detection',
    description: 'Statistical anomaly detection catches slowdowns before failures. Built for DevOps teams.',
    images: ['/og/default-og.png']
  },
  alternates: {
    canonical: '/'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    }
  },
  verification: {
    // Add your verification tokens here after registering with:
    // google: 'YOUR_GOOGLE_SITE_VERIFICATION',
    // yandex: 'YOUR_YANDEX_VERIFICATION',
    // bing: 'YOUR_BING_VERIFICATION',
  },
  category: 'technology',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Generate Organization schema for root layout
  const organizationSchema = getOrganizationSchema();

  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} antialiased scroll-smooth`}>
      <head>
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" />
        
        {/* Organization schema in root layout */}
        <JsonLd data={organizationSchema} />
      </head>
      <body className="font-sans antialiased">
        <AnalyticsProvider>
          {children}
          <Toaster />
          <CookieConsentBanner />
        </AnalyticsProvider>
      </body>
    </html>
  );
}


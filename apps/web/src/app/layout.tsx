import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  weight: ['400'],
  display: 'swap',
  preload: true,
});

export const viewport: Viewport = {
  themeColor: '#0EA5E9'
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'https://saturn.io'),
  title: {
    default: 'Saturn - Cron Monitoring with Anomaly Detection',
    template: '%s · Saturn'
  },
  description: 'Statistical anomaly detection catches slowdowns before failures. Monitor your cron jobs with health scores, MTBF/MTTR analytics, and multi-channel alerts. Built for DevOps teams.',
  applicationName: 'Saturn',
  keywords: ['cron monitoring', 'scheduled jobs', 'anomaly detection', 'kubernetes cronjobs', 'wordpress monitoring', 'health scores', 'MTBF', 'MTTR', 'DevOps', 'SRE'],
  openGraph: {
    type: 'website',
    siteName: 'Saturn',
    title: 'Saturn — Cron Monitoring with Anomaly Detection',
    description: 'Statistical anomaly detection catches slowdowns before failures. Built for DevOps and SRE teams.',
    url: 'https://saturn.io',
    images: [{ url: '/og/default-og.png', width: 1200, height: 630, alt: 'Saturn - Cron Monitoring' }]
  },
  twitter: {
    card: 'summary_large_image',
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
      'max-image-preview': 'large'
    }
  }
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} antialiased`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}


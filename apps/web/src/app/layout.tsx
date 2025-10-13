import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#0EA5E9'
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'https://tokiflow.co'),
  title: {
    default: 'Tokiflow',
    template: '%s · Tokiflow'
  },
  description: 'Tokiflow — Cron & job monitoring with smart Slack alerts, runtime analytics, and anomaly detection.',
  applicationName: 'Tokiflow',
  keywords: ['cron monitoring', 'job monitoring', 'heartbeat monitoring', 'Slack alerts', 'runtime analytics', 'anomaly detection'],
  openGraph: {
    type: 'website',
    siteName: 'Tokiflow',
    title: 'Tokiflow — Cron & Job Monitoring',
    description: 'Detect missed, late, or failing jobs fast. Slack-first alerts with runtime and output context.',
    url: 'https://tokiflow.co',
    images: [{ url: '/og/default-og.png', width: 1200, height: 630, alt: 'Tokiflow' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tokiflow — Cron & Job Monitoring',
    description: 'Slack-first cron alerts with runtime analytics and anomaly detection.',
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
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}


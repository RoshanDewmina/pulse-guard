import Link from "next/link"
import SiteHeader from "@/components/site-header"
import { generatePageMetadata } from "@/lib/seo/metadata"
import { getAboutPageSchema, getBreadcrumbSchema } from "@/lib/seo/schema"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata = generatePageMetadata({
  title: "About Saturn | Cron Monitoring with Anomaly Detection",
  description: "Our mission to make scheduled job reliability observable and proactive. Built for DevOps teams who refuse to let cron jobs fail silently. Learn about our technology, values, and vision.",
  keywords: [
    'about saturn',
    'cron monitoring company',
    'anomaly detection technology',
    'devops monitoring solution',
    'welford algorithm',
    'z-score analysis',
    'kubernetes monitoring',
    'wordpress monitoring',
    'reliability engineering',
  ],
  path: '/company/about',
  ogType: 'website',
})

export default function AboutPage() {
  const aboutSchema = getAboutPageSchema({
    name: 'About Saturn',
    description: 'Learn about Saturn\'s mission to make scheduled job reliability observable and proactive through statistical anomaly detection.',
    url: 'https://saturnmonitor.com/company/about',
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: 'https://saturnmonitor.com' },
    { name: 'Company', url: 'https://saturnmonitor.com/company' },
    { name: 'About', url: 'https://saturnmonitor.com/company/about' },
  ]);

  return (
    <>
      <JsonLd data={aboutSchema} />
      <JsonLd data={breadcrumbSchema} />
      
      <div className="min-h-screen bg-[#F7F5F3]">
        {/* Header */}
        <SiteHeader />

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-lg shadow-sm border border-[rgba(55,50,47,0.08)] p-8 md:p-12">
          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold text-[#37322F] font-serif mb-4">
              About Saturn
            </h1>
            <p className="text-xl text-[rgba(55,50,47,0.80)] font-sans">
              Making scheduled job reliability observable and proactive
            </p>
          </header>

          {/* Mission */}
          <section className="mb-12">
            <h2 className="text-3xl font-semibold text-[#37322F] font-serif mb-4 pb-2 border-b border-[rgba(55,50,47,0.12)]">
              Our Mission
            </h2>
            <p className="text-lg text-[rgba(55,50,47,0.90)] font-sans leading-relaxed">
              Cron jobs run the internet—database backups, ETL pipelines, cache warming, report generation—yet they fail
              silently in the dark. Saturn brings them into the light with <strong>statistical anomaly detection</strong> that
              catches slowdowns <em>before</em> they become failures.
            </p>
            <p className="text-lg text-[rgba(55,50,47,0.90)] font-sans leading-relaxed mt-4">
              We believe DevOps and SRE teams deserve better than "it ran at some point, probably." They deserve confidence.
            </p>
          </section>

          {/* Problem */}
          <section className="mb-12">
            <h2 className="text-3xl font-semibold text-[#37322F] font-serif mb-4 pb-2 border-b border-[rgba(55,50,47,0.12)]">
              The Problem We're Solving
            </h2>
            <p className="text-[rgba(55,50,47,0.90)] font-sans mb-4">
              Every night, thousands of critical cron jobs fail silently:
            </p>
            <ul className="space-y-2 text-[rgba(55,50,47,0.90)] font-sans ml-6 list-disc">
              <li><strong>Database backups</strong> that never complete (you discover this during a restore)</li>
              <li><strong>ETL pipelines</strong> that take 3 hours instead of 30 minutes (downstream systems starve)</li>
              <li><strong>Cache warmers</strong> that timeout (your app serves stale data)</li>
              <li><strong>Report generators</strong> that skip (executives make decisions on yesterday's numbers)</li>
            </ul>
            <p className="text-[rgba(55,50,47,0.90)] font-sans mt-4">
              <strong>You don't need another ping service. You need a partner that understands reliability.</strong>
            </p>
          </section>

          {/* What Makes Saturn Different */}
          <section className="mb-12">
            <h2 className="text-3xl font-semibold text-[#37322F] font-serif mb-4 pb-2 border-b border-[rgba(55,50,47,0.12)]">
              What Makes Saturn Different
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-[#37322F] font-sans mb-2">
                  1. Statistical Anomaly Detection (Unique)
                </h3>
                <p className="text-[rgba(55,50,47,0.90)] font-sans">
                  We're the only cron monitoring platform with <strong>Welford's online algorithm</strong> for incremental statistics:
                </p>
                <ul className="space-y-1 text-[rgba(55,50,47,0.90)] font-sans ml-6 list-disc mt-2">
                  <li>Baseline established in just 10 runs</li>
                  <li>Z-score analysis triggers incidents when runtime exceeds 3σ (99.7% confidence)</li>
                  <li>Memory-efficient: O(1) usage (40 bytes per monitor, not 40KB of historical data)</li>
                  <li>Catches regressions early: "Your backup is 2× slower than usual—investigate before it fails"</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#37322F] font-sans mb-2">
                  2. Kubernetes & WordPress Integrations (Unique)
                </h3>
                <ul className="space-y-1 text-[rgba(55,50,47,0.90)] font-sans ml-6 list-disc">
                  <li><strong>Kubernetes Sidecar</strong> (Go container): Automatically wraps CronJobs, deploys via Helm in 5 minutes</li>
                  <li><strong>WordPress Plugin</strong> (PHP): Monitors wp-cron (notorious for breaking on low-traffic sites)</li>
                </ul>
                <p className="text-[rgba(55,50,47,0.90)] font-sans mt-2">
                  <strong>Nobody else has these.</strong> We built them because 43% of websites run WordPress, and Kubernetes
                  is the infrastructure standard.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#37322F] font-sans mb-2">
                  3. Health Scoring System (Unique)
                </h3>
                <p className="text-[rgba(55,50,47,0.90)] font-sans">
                  Every monitor gets a <strong>0-100 health score</strong> with letter grade (A-F) based on:
                </p>
                <ul className="space-y-1 text-[rgba(55,50,47,0.90)] font-sans ml-6 list-disc mt-2">
                  <li>Uptime percentage (last 30 days)</li>
                  <li>MTBF (Mean Time Between Failures)</li>
                  <li>MTTR (Mean Time To Resolution)</li>
                  <li>Anomaly frequency</li>
                  <li>Incident severity</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="mb-12">
            <h2 className="text-3xl font-semibold text-[#37322F] font-serif mb-4 pb-2 border-b border-[rgba(55,50,47,0.12)]">
              Our Values
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-[#37322F] font-sans mb-2">Reliability {`>`} Vanity Metrics</h4>
                <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                  Health scores over ping counts. MTBF/MTTR over uptime percentages. Actionable insights over noise.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-[#37322F] font-sans mb-2">Developer Empathy</h4>
                <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                  CLI-first, API-first, infrastructure-as-code ready. No magic, no lock-in.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-[#37322F] font-sans mb-2">Clarity Over Cleverness</h4>
                <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                  We document how anomaly detection works. Rate limits are clear. No hidden fees, no BS.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-[#37322F] font-sans mb-2">Security by Default</h4>
                <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                  TLS 1.3, SHA-256 token hashing, row-level security, automatic redaction. No shortcuts.
                </p>
              </div>
            </div>
          </section>

          {/* Tech Stack */}
          <section className="mb-12">
            <h2 className="text-3xl font-semibold text-[#37322F] font-serif mb-4 pb-2 border-b border-[rgba(55,50,47,0.12)]">
              Our Technology
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-[#37322F] font-sans mb-2">Application Stack</h4>
                <ul className="space-y-1 text-sm text-[rgba(55,50,47,0.80)] font-sans ml-6 list-disc">
                  <li>Next.js 15 (React), Tailwind CSS</li>
                  <li>TypeScript, Prisma ORM</li>
                  <li>BullMQ (6 specialized workers)</li>
                  <li>CLI with OAuth 2.0 Device Flow</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-[#37322F] font-sans mb-2">Infrastructure</h4>
                <ul className="space-y-1 text-sm text-[rgba(55,50,47,0.80)] font-sans ml-6 list-disc">
                  <li>Vercel (web), Fly.io (workers)</li>
                  <li>Neon (Postgres), Upstash (Redis)</li>
                  <li>MinIO (S3-compatible storage)</li>
                  <li>Stripe, Resend, Sentry</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="mb-12">
            <h2 className="text-3xl font-semibold text-[#37322F] font-serif mb-4 pb-2 border-b border-[rgba(55,50,47,0.12)]">
              Pricing & Philosophy
            </h2>
            <p className="text-[rgba(55,50,47,0.90)] font-sans mb-4">
              Our free tier is <strong>genuinely useful</strong>:
            </p>
            <table className="w-full mb-4">
              <thead>
                <tr>
                  <th className="text-left p-2 bg-[rgba(55,50,47,0.04)]">Plan</th>
                  <th className="text-left p-2 bg-[rgba(55,50,47,0.04)]">Price</th>
                  <th className="text-left p-2 bg-[rgba(55,50,47,0.04)]">Monitors</th>
                  <th className="text-left p-2 bg-[rgba(55,50,47,0.04)]">Best For</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border-t"><strong>FREE</strong></td>
                  <td className="p-2 border-t">$0/month</td>
                  <td className="p-2 border-t">5</td>
                  <td className="p-2 border-t">Side projects, proof-of-concept</td>
                </tr>
                <tr>
                  <td className="p-2 border-t"><strong>PRO</strong></td>
                  <td className="p-2 border-t">$19/month</td>
                  <td className="p-2 border-t">100</td>
                  <td className="p-2 border-t">Startups, full feature set</td>
                </tr>
                <tr>
                  <td className="p-2 border-t"><strong>BUSINESS</strong></td>
                  <td className="p-2 border-t">$49/month</td>
                  <td className="p-2 border-t">500</td>
                  <td className="p-2 border-t">Scale-ups, agencies</td>
                </tr>
                <tr>
                  <td className="p-2 border-t"><strong>ENTERPRISE</strong></td>
                  <td className="p-2 border-t">Custom</td>
                  <td className="p-2 border-t">Unlimited</td>
                  <td className="p-2 border-t">Compliance, SLA, SSO</td>
                </tr>
              </tbody>
            </table>
            <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
              <Link href="/#pricing" className="text-blue-600 underline">View detailed pricing →</Link>
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-3xl font-semibold text-[#37322F] font-serif mb-4 pb-2 border-b border-[rgba(55,50,47,0.12)]">
              Contact & Community
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-[#37322F] font-sans mb-2">Support</h4>
                <ul className="space-y-2 text-sm text-[rgba(55,50,47,0.80)] font-sans">
                  <li><a href="mailto:support@saturnmonitor.com" className="text-blue-600 underline">support@saturnmonitor.com</a></li>
                  <li>Response: 24h (FREE/PRO), 4h (BUSINESS), 1h (ENTERPRISE)</li>
                  <li><a href="https://docs.saturnmonitor.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Documentation</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-[#37322F] font-sans mb-2">Security & Legal</h4>
                <ul className="space-y-2 text-sm text-[rgba(55,50,47,0.80)] font-sans">
                  <li><a href="mailto:security@saturnmonitor.com" className="text-blue-600 underline">security@saturnmonitor.com</a> (monitored 24/7)</li>
                  <li><a href="mailto:legal@saturnmonitor.com" className="text-blue-600 underline">legal@saturnmonitor.com</a> (compliance & DPA)</li>
                  <li><a href="mailto:sales@saturnmonitor.com" className="text-blue-600 underline">sales@saturnmonitor.com</a> (Enterprise)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Note */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              For the complete About page with full story, milestones, and detailed differentiators,
              see <code>website/docs/company/about.md</code>.
            </p>
          </div>
        </article>
      </main>
    </div>
    </>
  )
}


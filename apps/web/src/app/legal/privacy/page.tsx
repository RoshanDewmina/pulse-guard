import LegalPageLayout from "@/components/legal-page-layout"
import Link from "next/link"

export const metadata = {
  title: "Privacy Policy | Saturn",
  description: "How Saturn collects, uses, and protects your data. Transparent notice of our data practices for DevOps and engineering teams.",
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="October 16, 2025">
      <div className="space-y-6">
        <p className="text-lg font-medium text-[#37322F]">
          Saturn, Inc. ("Saturn", "we", "us", or "our") provides cron and scheduled job monitoring services with statistical anomaly detection. This Privacy Policy explains how we collect, use, disclose, and protect information when you use our Services.
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> The complete Privacy Policy with all technical details is available in the{" "}
            <code className="bg-blue-100 px-2 py-1 rounded text-xs">website/docs/legal/privacy-policy.md</code> file in the repository.
            This page provides a summary of key points.
          </p>
        </div>

        <h2>1. Information We Collect</h2>

        <h3>1.1 Account & Authentication Data</h3>
        <ul>
          <li><strong>Email address</strong>: For account creation and magic link authentication</li>
          <li><strong>Google OAuth profile</strong>: Basic profile information (email, name, picture)</li>
          <li><strong>Password hash</strong>: bcrypt-hashed passwords (never plaintext)</li>
          <li><strong>Organization membership</strong>: Your role (OWNER, ADMIN, MEMBER)</li>
          <li><strong>Session data</strong>: JWT tokens via NextAuth v5</li>
        </ul>

        <h3>1.2 Billing & Payment Information</h3>
        <ul>
          <li><strong>Stripe Customer ID</strong>: Links your organization to billing</li>
          <li><strong>Subscription metadata</strong>: Plan type, billing cycle, limits</li>
          <li><strong>What we DON'T store</strong>: Credit card numbers, CVV codes (handled by Stripe)</li>
        </ul>

        <h3>1.3 Monitoring Data</h3>
        <ul>
          <li>Monitor definitions (names, schedules, cron expressions)</li>
          <li>Ping timestamps and states (start/success/fail)</li>
          <li>Runtime metrics and durations</li>
          <li>Anomaly statistics (using Welford's algorithm): mean, stddev, z-scores</li>
          <li>Incident records and resolution data</li>
          <li>Health scores (0-100, A-F grades)</li>
          <li>MTBF/MTTR calculations</li>
        </ul>

        <h3>1.4 Output Capture (Optional)</h3>
        <p>If you enable output capture:</p>
        <ul>
          <li><strong>Job output</strong>: stdout/stderr up to 10KB (100KB for Enterprise)</li>
          <li><strong>Storage</strong>: MinIO (S3-compatible) with pattern <code>outputs/{`{monitorId}/{timestamp}`}.txt</code></li>
          <li><strong>Automatic redaction</strong>: Passwords, API keys, AWS credentials, private keys, credit cards</li>
          <li><strong>Access control</strong>: Organization-scoped (row-level security)</li>
        </ul>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6">
          <p className="text-sm text-yellow-900">
            <strong>IMPORTANT:</strong> While we apply best-effort redaction, you are responsible for reviewing what data your jobs output. Do not include PHI or highly sensitive data unless absolutely necessary.
          </p>
        </div>

        <h2>2. How We Use Your Data</h2>
        <ul>
          <li><strong>Provide the Services</strong>: Monitor jobs, detect anomalies, send alerts</li>
          <li><strong>Enforce security</strong>: Rate limiting, RBAC, row-level security</li>
          <li><strong>Anomaly detection</strong>: Calculate z-scores, trigger incidents</li>
          <li><strong>Analytics & insights</strong>: Health scores, MTBF/MTTR, uptime</li>
          <li><strong>Alerting</strong>: Send notifications via email, Slack, Discord, webhooks</li>
          <li><strong>Billing</strong>: Process subscriptions, enforce plan limits</li>
          <li><strong>Support</strong>: Troubleshoot issues, respond to inquiries</li>
        </ul>

        <h2>3. Data Sharing</h2>

        <h3>Service Providers (Sub-Processors)</h3>
        <ul>
          <li><strong>Vercel</strong> (USA): Web application hosting</li>
          <li><strong>Fly.io</strong> (USA): Background worker hosting</li>
          <li><strong>Neon</strong> (USA): PostgreSQL database</li>
          <li><strong>Upstash</strong> (USA): Redis caching and queues</li>
          <li><strong>MinIO</strong>: Object storage for output capture</li>
          <li><strong>Sentry</strong> (USA): Error tracking</li>
          <li><strong>Resend</strong> (USA): Transactional email</li>
          <li><strong>Stripe</strong> (USA/Ireland): Payment processing</li>
        </ul>

        <h2>4. Your Privacy Rights</h2>

        <h3>For All Users</h3>
        <ul>
          <li><strong>Access</strong>: Request a copy of your data</li>
          <li><strong>Correction</strong>: Update inaccurate information</li>
          <li><strong>Deletion</strong>: Request account and data deletion</li>
          <li><strong>Portability</strong>: Receive data in machine-readable format (JSON/CSV)</li>
        </ul>

        <h3>GDPR Rights (EEA/UK Users)</h3>
        <ul>
          <li><strong>Restriction</strong>: Limit processing of your data</li>
          <li><strong>Object</strong>: Object to processing based on legitimate interests</li>
          <li><strong>Withdraw consent</strong>: For consent-based processing</li>
          <li><strong>Lodge a complaint</strong>: With your local supervisory authority</li>
        </ul>

        <h3>CCPA Rights (California Residents)</h3>
        <ul>
          <li><strong>Know</strong>: What personal information we collect and use</li>
          <li><strong>Delete</strong>: Request deletion of personal information</li>
          <li><strong>Opt-out</strong>: We do NOT sell personal information</li>
          <li><strong>Non-discrimination</strong>: Exercise rights without penalty</li>
        </ul>

        <h2>5. Data Security</h2>
        <ul>
          <li><strong>Encryption in transit</strong>: TLS 1.2+ for all HTTPS connections</li>
          <li><strong>Token hashing</strong>: SHA-256 (irreversible)</li>
          <li><strong>Row-level security</strong>: Automatic org-level data isolation</li>
          <li><strong>Rate limiting</strong>: 60-120 requests/minute</li>
          <li><strong>Secure headers</strong>: HSTS, CSP, X-Frame-Options</li>
          <li><strong>Input validation</strong>: Zod schemas prevent injection attacks</li>
          <li><strong>CSRF protection</strong>: NextAuth v5 built-in</li>
        </ul>

        <h2>6. Data Retention</h2>
        <ul>
          <li><strong>Active monitors & pings</strong>: While account is active</li>
          <li><strong>Run history</strong>: 7 days (FREE), 90 days (PRO), 365 days (BUSINESS)</li>
          <li><strong>Output capture</strong>: Configurable (default 30 days)</li>
          <li><strong>Deleted monitors</strong>: Data deleted within 30 days</li>
          <li><strong>Closed accounts</strong>: Data deleted within 90 days</li>
          <li><strong>Billing records</strong>: 7 years (tax compliance)</li>
        </ul>

        <h2>7. Contact Information</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <ul className="space-y-2">
            <li><strong>General support</strong>: <a href="mailto:support@saturn.io" className="text-blue-600 underline">support@saturn.io</a></li>
            <li><strong>Legal inquiries</strong>: <a href="mailto:legal@saturn.io" className="text-blue-600 underline">legal@saturn.io</a></li>
            <li><strong>Security reports</strong>: <a href="mailto:security@saturn.io" className="text-blue-600 underline">security@saturn.io</a></li>
          </ul>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            For the complete Privacy Policy with all technical details, international transfer mechanisms, and legal bases,
            please refer to the comprehensive document in <code>website/docs/legal/privacy-policy.md</code>.
          </p>
        </div>
      </div>
    </LegalPageLayout>
  )
}



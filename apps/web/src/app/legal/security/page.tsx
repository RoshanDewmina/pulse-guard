import LegalPageLayout from "@/components/legal-page-layout"
import { generatePageMetadata } from "@/lib/seo/metadata"
import { getWebPageSchema, getBreadcrumbSchema } from "@/lib/seo/schema"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata = generatePageMetadata({
  title: "Security Overview | Saturn",
  description: "Saturn's security architecture, data protection measures, and compliance roadmap for enterprise DevOps teams.",
  keywords: ['security', 'data protection', 'encryption', 'compliance', 'infosec'],
  path: '/legal/security',
})

export default function SecurityPage() {
  const webPageSchema = getWebPageSchema({
    name: 'Security Overview',
    description: 'Saturn\'s security architecture, data protection measures, and compliance roadmap.',
    url: 'https://saturnmonitor.com/legal/security',
    datePublished: '2025-10-16',
    dateModified: '2025-10-16',
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: 'https://saturnmonitor.com' },
    { name: 'Legal', url: 'https://saturnmonitor.com/legal' },
    { name: 'Security', url: 'https://saturnmonitor.com/legal/security' },
  ]);

  return (
    <>
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      
      <LegalPageLayout title="Security Overview" lastUpdated="October 16, 2025">
        <div className="space-y-6">
        <p className="text-lg font-medium text-[#37322F]">
          Saturn is built with security-first architecture for DevOps and engineering teams monitoring business-critical scheduled jobs.
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> The complete Security Overview is in{" "}
            <code className="bg-blue-100 px-2 py-1 rounded text-xs">website/docs/legal/security.md</code>.
          </p>
        </div>

        <h2>Infrastructure</h2>
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Provider</th>
              <th>Security</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Web hosting</td>
              <td>Vercel</td>
              <td>SOC 2 Type II, ISO 27001</td>
            </tr>
            <tr>
              <td>Workers</td>
              <td>Fly.io</td>
              <td>SOC 2 Type II</td>
            </tr>
            <tr>
              <td>Database</td>
              <td>Neon (Postgres)</td>
              <td>SOC 2 Type II, GDPR-compliant</td>
            </tr>
            <tr>
              <td>Caching</td>
              <td>Upstash (Redis)</td>
              <td>SOC 2 Type II</td>
            </tr>
            <tr>
              <td>Storage</td>
              <td>MinIO (S3-compatible)</td>
              <td>Encryption at rest</td>
            </tr>
            <tr>
              <td>Payments</td>
              <td>Stripe</td>
              <td>PCI DSS Level 1</td>
            </tr>
          </tbody>
        </table>

        <h2>Data Protection</h2>
        <ul>
          <li><strong>Encryption in transit</strong>: TLS 1.2+ (TLS 1.3 preferred)</li>
          <li><strong>Encryption at rest</strong>: AES-256 (provider-managed keys)</li>
          <li><strong>Token hashing</strong>: SHA-256 (irreversible)</li>
          <li><strong>Row-level security</strong>: Automatic filtering by organization ID</li>
          <li><strong>OAuth tokens</strong>: AES-256-GCM encryption</li>
        </ul>

        <h2>Application Security</h2>
        <ul>
          <li><strong>Input validation</strong>: Zod schemas for all API inputs</li>
          <li><strong>SQL injection</strong>: Prisma ORM with parameterized queries</li>
          <li><strong>XSS prevention</strong>: React automatic escaping</li>
          <li><strong>CSRF protection</strong>: NextAuth v5 double-submit cookies</li>
          <li><strong>Rate limiting</strong>: Redis-backed sliding window (60-120 req/min)</li>
          <li><strong>Secure headers</strong>: HSTS, CSP, X-Frame-Options, X-Content-Type-Options</li>
        </ul>

        <h2>Output Redaction</h2>
        <p>Automatic pattern-based redaction for:</p>
        <ul>
          <li>Passwords (e.g., <code>password=secret</code> → <code>password=***REDACTED***</code>)</li>
          <li>API keys (e.g., <code>api_key: abc123</code> → <code>api_key: ***REDACTED***</code>)</li>
          <li>Bearer tokens (JWT patterns)</li>
          <li>AWS credentials (<code>AKIA*</code>, <code>AWS_SECRET_ACCESS_KEY</code>)</li>
          <li>Private keys (<code>-----BEGIN PRIVATE KEY-----</code>)</li>
          <li>Credit cards (last 4 digits preserved)</li>
        </ul>

        <h2>Vulnerability Disclosure</h2>
        <p>Report security vulnerabilities to: <a href="mailto:security@saturn.io" className="text-blue-600 underline">security@saturn.io</a></p>
        <p><strong>Response timeline</strong>:</p>
        <ul>
          <li>Initial response within 24 hours</li>
          <li>Triage within 72 hours</li>
          <li>Critical vulnerabilities patched within 7 days</li>
          <li>Coordinated disclosure 30 days after fix</li>
        </ul>

        <h2>Compliance</h2>
        <ul>
          <li>✅ <strong>GDPR</strong>: DPA available, SCCs for international transfers</li>
          <li>✅ <strong>CCPA</strong>: Data disclosure transparency, no data sales</li>
          <li>🔄 <strong>SOC 2 Type I</strong>: Planned</li>
          <li>🔄 <strong>SOC 2 Type II</strong>: Planned</li>
        </ul>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            For the complete Security Overview with detailed architecture and measures,
            see <code>website/docs/legal/security.md</code>.
          </p>
        </div>
      </div>
    </LegalPageLayout>
    </>
  )
}




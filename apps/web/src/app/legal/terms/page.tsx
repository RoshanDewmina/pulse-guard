import LegalPageLayout from "@/components/legal-page-layout"

export const metadata = {
  title: "Terms of Service | Saturn",
  description: "Terms and conditions for using Saturn's cron monitoring platform. Clear, developer-friendly legal terms for engineering teams.",
}

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="October 16, 2025">
      <div className="space-y-6">
        <p className="text-lg font-medium text-[#37322F]">
          These Terms of Service govern your access to and use of Saturn's cron and scheduled job monitoring platform.
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> The complete Terms of Service is available in{" "}
            <code className="bg-blue-100 px-2 py-1 rounded text-xs">website/docs/legal/terms-of-service.md</code>.
            This page provides key highlights.
          </p>
        </div>

        <h2>1. Acceptance & Eligibility</h2>
        <p>
          By creating an account or using the Services, you agree to these Terms. You must be at least 16 years old and
          capable of forming a binding contract.
        </p>

        <h2>2. Organizations & Roles</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Role</th>
                <th>Permissions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>OWNER</strong></td>
                <td>Full access: monitors, incidents, team, billing, delete organization</td>
              </tr>
              <tr>
                <td><strong>ADMIN</strong></td>
                <td>Manage monitors, incidents, alerts, team; no billing access</td>
              </tr>
              <tr>
                <td><strong>MEMBER</strong></td>
                <td>Create/edit own monitors, view team monitors, acknowledge incidents</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>3. Rate Limits</h2>
        <ul>
          <li><strong>Ping API</strong>: 120 requests per minute per monitor token</li>
          <li><strong>General API</strong>: 60 requests per minute per API key</li>
          <li><strong>Auth endpoints</strong>: 5 attempts per 15 minutes (then 15-minute block)</li>
        </ul>

        <h2>4. Pricing Plans</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Price</th>
                <th>Monitors</th>
                <th>Users</th>
                <th>Key Features</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>FREE</strong></td>
                <td>$0/month</td>
                <td>5</td>
                <td>3</td>
                <td>Email + Slack, 7-day history</td>
              </tr>
              <tr>
                <td><strong>PRO</strong></td>
                <td>$19/month</td>
                <td>100</td>
                <td>10</td>
                <td>All channels, anomaly detection, 90-day history</td>
              </tr>
              <tr>
                <td><strong>BUSINESS</strong></td>
                <td>$49/month</td>
                <td>500</td>
                <td>Unlimited</td>
                <td>Priority support, 365-day history, advanced analytics</td>
              </tr>
              <tr>
                <td><strong>ENTERPRISE</strong></td>
                <td>Custom</td>
                <td>Unlimited</td>
                <td>Unlimited</td>
                <td>SLA, SSO, DPA, custom retention</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>5. Output Capture Responsibility</h2>
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6">
          <p className="text-sm text-yellow-900">
            <strong>Important:</strong> You are responsible for what data your jobs output. Our automatic redaction is
            best-effort and may not catch all sensitive data. Do NOT include PHI or PCI data unless essential for debugging.
          </p>
        </div>

        <h2>6. Webhooks & Integrations</h2>
        <ul>
          <li><strong>HMAC signatures</strong>: All webhooks include <code>X-Saturn-Signature</code> header (HMAC SHA-256)</li>
          <li><strong>Verification</strong>: You must verify signatures before processing</li>
          <li><strong>Retries</strong>: Exponential backoff, max 3 attempts</li>
          <li><strong>TLS-only</strong>: Webhooks only sent to HTTPS endpoints</li>
        </ul>

        <h2>7. Limitation of Liability</h2>
        <p>
          Saturn's total liability shall not exceed the greater of: (A) The amount you paid in the last 12 months, OR (B) $100 USD.
        </p>
        <p>
          We are not liable for indirect, incidental, special, consequential, or punitive damages, including loss of profits,
          revenue, data, or business opportunities.
        </p>

        <h2>8. Data Export & Termination</h2>
        <ul>
          <li>You may export your data anytime via dashboard or API</li>
          <li>You may terminate your account at any time</li>
          <li>Data deleted within 90 days after account closure</li>
          <li>Outstanding fees become immediately due upon termination</li>
        </ul>

        <h2>9. Acceptable Use</h2>
        <p><strong>You may NOT</strong>:</p>
        <ul>
          <li>Reverse engineer or decompile the Services</li>
          <li>Bypass rate limits or security measures</li>
          <li>Share accounts or API tokens with unauthorized parties</li>
          <li>Use the Services to violate any law or third-party rights</li>
          <li>Monitor third-party systems without authorization</li>
        </ul>

        <h2>10. Contact</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <ul className="space-y-2">
            <li><strong>General support</strong>: <a href="mailto:support@saturn.io" className="text-blue-600 underline">support@saturn.io</a></li>
            <li><strong>Legal inquiries</strong>: <a href="mailto:legal@saturn.io" className="text-blue-600 underline">legal@saturn.io</a></li>
            <li><strong>Enterprise sales</strong>: <a href="mailto:sales@saturn.io" className="text-blue-600 underline">sales@saturn.io</a></li>
          </ul>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            For the complete Terms of Service with all clauses and legal language,
            please refer to <code>website/docs/legal/terms-of-service.md</code>.
          </p>
        </div>
      </div>
    </LegalPageLayout>
  )
}



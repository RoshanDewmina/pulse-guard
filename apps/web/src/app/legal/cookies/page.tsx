import LegalPageLayout from "@/components/legal-page-layout"
import { generatePageMetadata } from "@/lib/seo/metadata"
import { getWebPageSchema, getBreadcrumbSchema } from "@/lib/seo/schema"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata = generatePageMetadata({
  title: "Cookie Policy | Saturn",
  description: "How Saturn uses cookies and similar technologies. Transparent disclosure of tracking technologies.",
  keywords: ['cookie policy', 'cookies', 'tracking technologies', 'web analytics'],
  path: '/legal/cookies',
})

export default function CookiePolicyPage() {
  const webPageSchema = getWebPageSchema({
    name: 'Cookie Policy',
    description: 'How Saturn uses cookies and similar technologies.',
    url: 'https://saturnmonitor.com/legal/cookies',
    datePublished: '2025-10-16',
    dateModified: '2025-10-16',
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: 'https://saturnmonitor.com' },
    { name: 'Legal', url: 'https://saturnmonitor.com/legal' },
    { name: 'Cookie Policy', url: 'https://saturnmonitor.com/legal/cookies' },
  ]);

  return (
    <>
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      
      <LegalPageLayout title="Cookie Policy" lastUpdated="October 16, 2025">
        <div className="space-y-6">
        <p className="text-lg font-medium text-[#37322F]">
          This Cookie Policy explains how Saturn uses cookies and similar technologies on our website and web application.
        </p>

        <h2>What Are Cookies?</h2>
        <p>
          Cookies are small text files stored on your device when you visit a website. They allow the website to recognize
          your device and remember information about your visit.
        </p>

        <h2>Cookies We Use</h2>

        <h3>Strictly Necessary Cookies</h3>
        <p>These cookies are essential for the Services to function. You cannot opt out without disabling core functionality.</p>
        <table>
          <thead>
            <tr>
              <th>Cookie Name</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>next-auth.session-token</code></td>
              <td>Stores your login session (JWT token)</td>
              <td>7 days</td>
            </tr>
            <tr>
              <td><code>__Host-next-auth.csrf-token</code></td>
              <td>Protects against CSRF attacks</td>
              <td>Session</td>
            </tr>
            <tr>
              <td><code>next-auth.callback-url</code></td>
              <td>Stores redirect URL after login</td>
              <td>Session</td>
            </tr>
          </tbody>
        </table>

        <p><strong>Security Features</strong>:</p>
        <ul>
          <li><code>httpOnly</code>: Cannot be accessed by JavaScript (XSS protection)</li>
          <li><code>secure</code>: Only transmitted over HTTPS</li>
          <li><code>SameSite=Lax</code>: Prevents some cross-site attacks</li>
        </ul>

        <h3>Functional Cookies</h3>
        <p>These cookies enhance your experience but are not strictly necessary.</p>
        <table>
          <thead>
            <tr>
              <th>Cookie Name</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>saturn_theme</code></td>
              <td>Remembers dark/light mode preference</td>
              <td>1 year</td>
            </tr>
            <tr>
              <td><code>saturn_timezone</code></td>
              <td>Stores timezone for schedule display</td>
              <td>1 year</td>
            </tr>
            <tr>
              <td><code>saturn_org_last</code></td>
              <td>Remembers last active organization</td>
              <td>30 days</td>
            </tr>
          </tbody>
        </table>

        <h2>Managing Cookies</h2>
        <p>You can control cookies through your browser settings:</p>
        <ul>
          <li><strong>Chrome</strong>: Settings → Privacy and Security → Cookies and other site data</li>
          <li><strong>Firefox</strong>: Settings → Privacy & Security → Cookies and Site Data</li>
          <li><strong>Safari</strong>: Preferences → Privacy → Manage Website Data</li>
          <li><strong>Edge</strong>: Settings → Cookies and site permissions</li>
        </ul>

        <h2>Third-Party Cookies</h2>

        <h3>Stripe (Payment Processing)</h3>
        <p>
          When you visit billing pages, Stripe may set cookies for fraud detection and payment security.
          See <a href="https://stripe.com/cookies-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Stripe's Cookie Policy</a>.
        </p>

        <h3>Sentry (Error Tracking)</h3>
        <p>
          Sentry may set cookies to track error sessions and correlate errors with user actions.
          See <a href="https://sentry.io/trust/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Sentry's Privacy Policy</a>.
        </p>

        <h2>No Marketing Cookies</h2>
        <div className="bg-green-50 border-l-4 border-green-500 p-4 my-6">
          <p className="text-sm text-green-900">
            <strong>Good news:</strong> We do NOT use marketing or advertising cookies. Saturn does not serve ads, track you
            across other websites, or sell your data to marketers.
          </p>
        </div>

        <h2>GDPR & ePrivacy Compliance</h2>
        <p><strong>Legal basis</strong>:</p>
        <ul>
          <li><strong>Strictly necessary cookies</strong>: Exempted from consent requirements (GDPR Art. 6(1)(f))</li>
          <li><strong>Functional cookies</strong>: Legitimate interest with easy opt-out</li>
        </ul>

        <h2>Contact</h2>
        <p>
          Questions about cookies? Email us at{" "}
          <a href="mailto:support@saturn.io" className="text-blue-600 underline">support@saturn.io</a> or{" "}
          <a href="mailto:legal@saturn.io" className="text-blue-600 underline">legal@saturn.io</a>.
        </p>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            For the complete Cookie Policy, see <code>website/docs/legal/cookie-policy.md</code>.
          </p>
        </div>
      </div>
    </LegalPageLayout>
    </>
  )
}




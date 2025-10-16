import LegalPageLayout from "@/components/legal-page-layout"

export const metadata = {
  title: "Data Processing Addendum (DPA) | Saturn",
  description: "GDPR-compliant Data Processing Addendum for Enterprise customers. Article 28 compliance.",
}

export default function DPAPage() {
  return (
    <LegalPageLayout title="Data Processing Addendum (DPA)" lastUpdated="October 16, 2025">
      <div className="space-y-6">
        <p className="text-lg font-medium text-[#37322F]">
          This Data Processing Addendum (DPA) supplements the Saturn Terms of Service and applies to Enterprise customers
          subject to data protection laws, including the EU GDPR.
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> The complete DPA with all annexes and Standard Contractual Clauses (SCCs) is available in{" "}
            <code className="bg-blue-100 px-2 py-1 rounded text-xs">website/docs/legal/dpa.md</code>.
            Enterprise customers should contact <a href="mailto:legal@saturn.io" className="text-blue-700 underline">legal@saturn.io</a> to execute the DPA.
          </p>
        </div>

        <h2>Overview</h2>
        <p><strong>Parties</strong>:</p>
        <ul>
          <li><strong>Controller</strong>: You (the Customer)</li>
          <li><strong>Processor</strong>: Saturn, Inc.</li>
        </ul>

        <p><strong>Scope</strong>: All Personal Data processed by Saturn on behalf of Customer in connection with the Services.</p>

        <h2>Data Processing Terms</h2>
        <p>Saturn processes Personal Data only:</p>
        <ul>
          <li>As necessary to provide the Services</li>
          <li>As documented in the DPA and its Annexes</li>
          <li>As instructed by Customer via the Services</li>
          <li>As required by applicable law (with notice to Customer)</li>
        </ul>

        <h2>Sub-Processors</h2>
        <p>Saturn engages the following sub-processors:</p>
        <table>
          <thead>
            <tr>
              <th>Sub-processor</th>
              <th>Service</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Vercel Inc.</td>
              <td>Web Hosting</td>
              <td>USA (Global Edge Network)</td>
            </tr>
            <tr>
              <td>Fly.io, Inc.</td>
              <td>Worker Hosting</td>
              <td>USA</td>
            </tr>
            <tr>
              <td>Neon, Inc.</td>
              <td>Database</td>
              <td>USA</td>
            </tr>
            <tr>
              <td>Upstash, Inc.</td>
              <td>Caching & Queues</td>
              <td>USA</td>
            </tr>
            <tr>
              <td>Sentry.io, Inc.</td>
              <td>Error Tracking</td>
              <td>USA</td>
            </tr>
            <tr>
              <td>Resend, Inc.</td>
              <td>Email Delivery</td>
              <td>USA</td>
            </tr>
            <tr>
              <td>Stripe, Inc.</td>
              <td>Payment Processing</td>
              <td>USA/Ireland</td>
            </tr>
          </tbody>
        </table>

        <p>
          Saturn will notify Customer at least <strong>30 days in advance</strong> of engaging new sub-processors.
          Customer may object on reasonable data protection grounds.
        </p>

        <h2>Security Measures</h2>
        <p>Saturn implements appropriate technical and organizational measures (TOMs):</p>
        <ul>
          <li><strong>Encryption</strong>: TLS 1.2+ in transit, AES-256 at rest</li>
          <li><strong>Access controls</strong>: RBAC, MFA for employees, least privilege</li>
          <li><strong>Row-level security</strong>: Database queries scoped to Customer's organization</li>
          <li><strong>Token hashing</strong>: SHA-256 (irreversible)</li>
          <li><strong>Rate limiting</strong>: 60-120 requests/minute</li>
          <li><strong>Audit logging</strong>: All administrative actions logged</li>
          <li><strong>Incident response</strong>: Documented procedures for breaches</li>
        </ul>
        <p>See <a href="/legal/security" className="text-blue-600 underline">Security Overview</a> for full details.</p>

        <h2>Data Subject Rights</h2>
        <p>Saturn will assist Customer in fulfilling Data Subject requests, including:</p>
        <ul>
          <li><strong>Access</strong>: Export Personal Data in machine-readable format (JSON/CSV)</li>
          <li><strong>Rectification</strong>: Enable Customer to correct data via the Services</li>
          <li><strong>Erasure</strong>: Delete Personal Data within 30 days of Customer's instruction</li>
          <li><strong>Restriction</strong>: Temporarily suspend processing (e.g., disable monitors)</li>
          <li><strong>Portability</strong>: Export data in structured format</li>
        </ul>

        <h2>Data Breach Notification</h2>
        <p>
          Saturn will notify Customer <strong>without undue delay</strong> (and within <strong>72 hours</strong>) of becoming
          aware of a Personal Data Breach affecting Customer's data.
        </p>

        <h2>International Data Transfers</h2>
        <p>For Personal Data originating from the EEA, UK, or Switzerland, Saturn relies on:</p>
        <ul>
          <li><strong>Standard Contractual Clauses (SCCs)</strong>: EU Commission's SCCs (Module 2: Controller-to-Processor)</li>
          <li><strong>Supplementary measures</strong>: Encryption, access controls, contractual protections</li>
        </ul>

        <h2>Return and Deletion of Data</h2>
        <p>Upon termination or Customer's written request, Saturn will:</p>
        <ul>
          <li><strong>Return</strong> all Customer Personal Data in machine-readable format (JSON/CSV), OR</li>
          <li><strong>Delete</strong> all Customer Personal Data from production systems and backups</li>
        </ul>
        <p><strong>Timeline</strong>: Within 30 days of termination or request.</p>

        <h2>Audit Rights</h2>
        <p>Customer may audit Saturn's compliance with the DPA:</p>
        <ul>
          <li><strong>Frequency</strong>: Once per calendar year (unless required by Supervisory Authority)</li>
          <li><strong>Advance notice</strong>: At least 30 days</li>
          <li><strong>Audit alternatives</strong>: SOC 2 Type II reports, ISO 27001 certification (when available)</li>
        </ul>

        <h2>Contact for DPA Execution</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="mb-2">
            <strong>Enterprise customers:</strong> To execute a DPA, please contact:
          </p>
          <ul className="space-y-2">
            <li><strong>Email</strong>: <a href="mailto:legal@saturn.io" className="text-blue-600 underline">legal@saturn.io</a></li>
            <li><strong>Subject Line</strong>: "DPA Request - [Your Company Name]"</li>
          </ul>
        </div>

        <h2>Annexes</h2>
        <p>The complete DPA includes the following annexes:</p>
        <ul>
          <li><strong>Annex A</strong>: Details of Processing (subject matter, categories of data, data subjects)</li>
          <li><strong>Annex B</strong>: Security Measures (technical and organizational measures)</li>
          <li><strong>Annex C</strong>: Standard Contractual Clauses (EU Commission SCCs)</li>
          <li><strong>Annex D</strong>: UK International Data Transfer Addendum</li>
        </ul>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            For the complete DPA with all annexes, signature blocks, and Standard Contractual Clauses,
            see <code>website/docs/legal/dpa.md</code> or contact <a href="mailto:legal@saturn.io" className="text-blue-600 underline">legal@saturn.io</a>.
          </p>
        </div>
      </div>
    </LegalPageLayout>
  )
}



import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata({
  title: "Settings - Data",
  description: "Manage data retention and export settings.",
  path: '/app/settings/data',
  noIndex: true,
})
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnButton,
} from '@/components/saturn';
import { Download, Trash2, FileJson, AlertTriangle, Shield } from 'lucide-react';
import { ExportDataButton } from '@/components/export-data-button';
import { DeleteAccountButton } from '@/components/delete-account-button';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';

export default async function DataManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/app' },
        { label: 'Settings', href: '/app/settings' },
        { label: 'Data' },
      ]} />
      
      <PageHeader
        title="Data Management"
        description="Export your data and manage your account"
      />
      
      {/* Export Data */}
      <SaturnCard>
        <SaturnCardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              <SaturnCardTitle as="h2">Export Your Data</SaturnCardTitle>
            </div>
          </div>
          <SaturnCardDescription>
            Download all your data in JSON format (GDPR Article 20 - Right to Data Portability)
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 font-sans mb-2">What&apos;s included in the export?</h4>
              <ul className="text-sm text-blue-800 font-sans space-y-1">
                <li>• Your account information and profile</li>
                <li>• All monitors and their configurations</li>
                <li>• Run history and incidents</li>
                <li>• Alert channel configurations</li>
                <li>• Organization memberships</li>
                <li>• Activity logs and audit trail</li>
              </ul>
              <p className="text-xs text-blue-700 font-sans mt-3">
                Note: Sensitive credentials and hashed passwords are excluded for security.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <ExportDataButton variant="download" className="flex-1" />
              <ExportDataButton variant="email" className="flex-1" />
            </div>

            <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
              Large exports may take a few minutes. You&apos;ll receive an email when ready.
            </p>
          </div>
        </SaturnCardContent>
      </SaturnCard>

      {/* Privacy Information */}
      <SaturnCard>
        <SaturnCardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <SaturnCardTitle as="h2">Your Privacy Rights</SaturnCardTitle>
          </div>
          <SaturnCardDescription>
            Under GDPR and similar regulations, you have the following rights
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="space-y-4">
            {[
              {
                num: 1,
                title: 'Right to Access',
                desc: 'View and export all personal data we store about you',
              },
              {
                num: 2,
                title: 'Right to Rectification',
                desc: 'Correct any inaccurate personal data (available in profile settings)',
              },
              {
                num: 3,
                title: 'Right to Erasure',
                desc: 'Request deletion of your account and all associated data',
              },
              {
                num: 4,
                title: 'Right to Data Portability',
                desc: 'Receive your data in a structured, machine-readable format',
              },
            ].map((item) => (
              <div key={item.num} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold font-sans">
                  {item.num}
                </div>
                <div>
                  <h4 className="font-medium text-[#37322F] font-sans">{item.title}</h4>
                  <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SaturnCardContent>
      </SaturnCard>

      {/* Danger Zone */}
      <SaturnCard className="border-red-200">
        <SaturnCardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <SaturnCardTitle as="h2" className="text-red-700">Danger Zone</SaturnCardTitle>
          </div>
          <SaturnCardDescription>
            Irreversible actions that will permanently affect your account
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 font-sans mb-1">Delete Your Account</h4>
                  <p className="text-sm text-red-800 font-sans mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <ul className="text-sm text-red-700 font-sans space-y-1 mb-4">
                    <li>• All monitors will be deleted</li>
                    <li>• All run history will be lost</li>
                    <li>• All incidents and alerts will be removed</li>
                    <li>• You will lose access to all organizations</li>
                    <li>• This action is permanent and irreversible</li>
                  </ul>
                </div>
              </div>
              <DeleteAccountButton />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 font-sans mb-2">Before deleting your account:</h4>
              <ol className="text-sm text-gray-700 font-sans space-y-1 list-decimal list-inside">
                <li>Export your data (see above)</li>
                <li>Transfer organization ownership (if you&apos;re the only owner)</li>
                <li>Cancel any active subscriptions</li>
                <li>Remove integrations (Slack, webhooks, etc.)</li>
              </ol>
            </div>
          </div>
        </SaturnCardContent>
      </SaturnCard>

      {/* Data Retention */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle as="h3">Data Retention Policy</SaturnCardTitle>
          <SaturnCardDescription>
            How long we keep your data
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="space-y-3">
            {[
              ['Account data', 'Until account deletion'],
              ['Run history (Free plan)', '7 days'],
              ['Run history (Pro plan)', '90 days'],
              ['Run history (Business plan)', '365 days'],
              ['Audit logs', '90 days (anonymized after deletion)'],
              ['Deleted account data', '30 days (recovery period)'],
            ].map(([label, retention], idx, arr) => (
              <div
                key={label}
                className={`flex justify-between py-2 ${
                  idx < arr.length - 1 ? 'border-b border-[rgba(55,50,47,0.12)]' : ''
                }`}
              >
                <span className="text-sm font-medium text-[#37322F] font-sans">{label}</span>
                <span className="text-sm text-[rgba(55,50,47,0.80)] font-sans">{retention}</span>
              </div>
            ))}
          </div>
        </SaturnCardContent>
      </SaturnCard>

      {/* Contact */}
      <SaturnCard>
        <SaturnCardContent className="py-4">
          <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
            Have questions about your data or privacy?{' '}
            <a href="mailto:privacy@saturn.co" className="text-[#37322F] hover:underline font-medium">
              Contact our privacy team
            </a>
          </p>
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}

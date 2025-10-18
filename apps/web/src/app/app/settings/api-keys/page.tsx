import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@tokiflow/db';
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata({
  title: "Settings - API Keys",
  description: "Manage API keys for your organization.",
  path: '/app/settings/api-keys',
  noIndex: true,
})
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnButton,
  SaturnBadge,
  SaturnTable,
  SaturnTableHeader,
  SaturnTableBody,
  SaturnTableRow,
  SaturnTableHead,
  SaturnTableCell,
} from '@/components/saturn';
import { Key, Plus, Trash2, Copy, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import { ApiKeyManager } from '@/components/api-key-manager';

export default async function APIKeysPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Fetch API keys from database
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Mask the token hashes for display
  const maskedKeys = apiKeys.map((key) => ({
    ...key,
    key: `sk_****${key.tokenHash.slice(-4)}`,
  }));

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/app' },
        { label: 'Settings', href: '/app/settings' },
        { label: 'API Keys' },
      ]} />
      
      <PageHeader
        title="API Keys"
        description="Manage API keys for programmatic access"
      />
      
      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-900 font-sans">Keep your API keys secure</p>
          <p className="text-sm text-yellow-800 font-sans mt-1">
            API keys grant full access to your account. Never share them or commit them to version control.
            If a key is compromised, revoke it immediately.
          </p>
        </div>
      </div>

      {/* API Keys List */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle as="h2" className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Your API Keys
          </SaturnCardTitle>
          <SaturnCardDescription>
            API keys allow you to interact with Saturn programmatically
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <ApiKeyManager initialKeys={maskedKeys} />
        </SaturnCardContent>
      </SaturnCard>

      {/* Documentation */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle as="h3">Using the API</SaturnCardTitle>
          <SaturnCardDescription>
            Examples of how to use your API keys with Saturn
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-[#37322F] font-sans mb-2">Authentication</h4>
              <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans mb-2">
                Include your API key in the Authorization header:
              </p>
              <code className="block bg-gray-900 text-green-400 px-4 py-3 rounded-lg text-sm font-mono overflow-x-auto">
                curl https://Saturn.co/api/monitors \<br />
                &nbsp;&nbsp;-H &ldquo;Authorization: Bearer YOUR_API_KEY&rdquo;
              </code>
            </div>

            <div>
              <h4 className="font-medium text-[#37322F] font-sans mb-2">Create a monitor</h4>
              <code className="block bg-gray-900 text-green-400 px-4 py-3 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre">
{`curl -X POST https://Saturn.co/api/monitors \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Cron Job",
    "scheduleType": "INTERVAL",
    "intervalSec": 3600,
    "graceSec": 300
  }'`}
              </code>
            </div>

            <div>
              <h4 className="font-medium text-[#37322F] font-sans mb-2">Send a ping</h4>
              <code className="block bg-gray-900 text-green-400 px-4 py-3 rounded-lg text-sm font-mono overflow-x-auto">
                curl https://Saturn.co/api/ping/YOUR_MONITOR_TOKEN
              </code>
            </div>

            <div className="pt-4 border-t border-[rgba(55,50,47,0.12)]">
              <SaturnButton variant="secondary" fullWidth>
                View Full API Documentation
              </SaturnButton>
            </div>
          </div>
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@tokiflow/db';
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
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';

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
      <PageHeaderWithBreadcrumbs
        title="API Keys"
        description="Manage API keys for programmatic access"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Settings', href: '/app/settings' },
          { label: 'API Keys' },
        ]}
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
          {maskedKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-[rgba(55,50,47,0.40)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#37322F] font-sans mb-2">No API keys yet</h3>
              <p className="text-[rgba(55,50,47,0.80)] font-sans mb-4">
                Create your first API key to start using the Saturn API
              </p>
              <SaturnButton>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </SaturnButton>
            </div>
          ) : (
            <SaturnTable>
              <SaturnTableHeader>
                <SaturnTableRow>
                  <SaturnTableHead>Name</SaturnTableHead>
                  <SaturnTableHead>Key</SaturnTableHead>
                  <SaturnTableHead>Created</SaturnTableHead>
                  <SaturnTableHead>Last Used</SaturnTableHead>
                  <SaturnTableHead>Expires</SaturnTableHead>
                  <SaturnTableHead className="text-right">Actions</SaturnTableHead>
                </SaturnTableRow>
              </SaturnTableHeader>
              <SaturnTableBody>
                {maskedKeys.map((key) => (
                  <SaturnTableRow key={key.id}>
                    <SaturnTableCell className="font-medium text-[#37322F]">{key.name}</SaturnTableCell>
                    <SaturnTableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-[#37322F]">{key.key}</code>
                        <button className="p-1 hover:bg-[rgba(55,50,47,0.04)] rounded">
                          <Copy className="h-4 w-4 text-[rgba(55,50,47,0.80)]" />
                        </button>
                      </div>
                    </SaturnTableCell>
                    <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                      {format(key.createdAt, 'MMM d, yyyy')}
                    </SaturnTableCell>
                    <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                      {key.lastUsedAt ? format(key.lastUsedAt, 'MMM d, yyyy') : 'Never'}
                    </SaturnTableCell>
                    <SaturnTableCell>
                      <SaturnBadge variant="default" size="sm">Never</SaturnBadge>
                    </SaturnTableCell>
                    <SaturnTableCell className="text-right">
                      <SaturnButton variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </SaturnButton>
                    </SaturnTableCell>
                  </SaturnTableRow>
                ))}
              </SaturnTableBody>
            </SaturnTable>
          )}
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

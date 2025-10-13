import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Key, Plus, Trash2, Copy, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default async function APIKeysPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  // TODO: Fetch API keys from database
  const apiKeys: any[] = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-gray-600 mt-1">
            Manage API keys for programmatic access to Tokiflow
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-900">Keep your API keys secure</p>
          <p className="text-sm text-yellow-800 mt-1">
            API keys grant full access to your account. Never share them or commit them to version control.
            If a key is compromised, revoke it immediately.
          </p>
        </div>
      </div>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Your API Keys
          </CardTitle>
          <CardDescription>
            API keys allow you to interact with Tokiflow programmatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first API key to start using the Tokiflow API
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">{key.key}</code>
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {format(key.createdAt, 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {key.lastUsedAt ? format(key.lastUsedAt, 'MMM d, yyyy') : 'Never'}
                    </TableCell>
                    <TableCell>
                      {key.expiresAt ? (
                        <span className="text-sm text-gray-600">
                          {format(key.expiresAt, 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <Badge variant="secondary">Never</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Using the API</CardTitle>
          <CardDescription>
            Examples of how to use your API keys with Tokiflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Authentication</h4>
            <p className="text-sm text-gray-600 mb-2">
              Include your API key in the Authorization header:
            </p>
            <code className="block bg-gray-900 text-green-400 px-4 py-3 rounded text-sm font-mono overflow-x-auto">
              curl https://tokiflow.co/api/monitors \<br />
              &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY"
            </code>
          </div>

          <div>
            <h4 className="font-medium mb-2">Create a monitor</h4>
            <code className="block bg-gray-900 text-green-400 px-4 py-3 rounded text-sm font-mono overflow-x-auto whitespace-pre">
{`curl -X POST https://tokiflow.co/api/monitors \\
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
            <h4 className="font-medium mb-2">Send a ping</h4>
            <code className="block bg-gray-900 text-green-400 px-4 py-3 rounded text-sm font-mono overflow-x-auto">
              curl https://tokiflow.co/api/ping/YOUR_MONITOR_TOKEN
            </code>
          </div>

          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full">
              View Full API Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


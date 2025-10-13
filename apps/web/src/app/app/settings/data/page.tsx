import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, FileJson, AlertTriangle, Shield } from 'lucide-react';

export default async function DataManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Data & Privacy</h1>
        <p className="text-gray-600 mt-1">
          Manage your data and privacy settings (GDPR compliance)
        </p>
      </div>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              <CardTitle>Export Your Data</CardTitle>
            </div>
          </div>
          <CardDescription>
            Download all your data in JSON format (GDPR Article 20 - Right to Data Portability)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">What's included in the export?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your account information and profile</li>
              <li>• All monitors and their configurations</li>
              <li>• Run history and incidents</li>
              <li>• Alert channel configurations</li>
              <li>• Organization memberships</li>
              <li>• Activity logs and audit trail</li>
            </ul>
            <p className="text-xs text-blue-700 mt-3">
              Note: Sensitive credentials and hashed passwords are excluded for security.
            </p>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download Data (JSON)
            </Button>
            <Button variant="outline" className="flex-1">
              <FileJson className="h-4 w-4 mr-2" />
              Request Email Export
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Large exports may take a few minutes. You'll receive an email when ready.
          </p>
        </CardContent>
      </Card>

      {/* Privacy Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <CardTitle>Your Privacy Rights</CardTitle>
          </div>
          <CardDescription>
            Under GDPR and similar regulations, you have the following rights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium">Right to Access</h4>
                <p className="text-sm text-gray-600">
                  View and export all personal data we store about you
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium">Right to Rectification</h4>
                <p className="text-sm text-gray-600">
                  Correct any inaccurate personal data (available in profile settings)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold">
                3
              </div>
              <div>
                <h4 className="font-medium">Right to Erasure</h4>
                <p className="text-sm text-gray-600">
                  Request deletion of your account and all associated data
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold">
                4
              </div>
              <div>
                <h4 className="font-medium">Right to Data Portability</h4>
                <p className="text-sm text-gray-600">
                  Receive your data in a structured, machine-readable format
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-700">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions that will permanently affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-red-900 mb-1">Delete Your Account</h4>
                <p className="text-sm text-red-800 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <ul className="text-sm text-red-700 space-y-1 mb-4">
                  <li>• All monitors will be deleted</li>
                  <li>• All run history will be lost</li>
                  <li>• All incidents and alerts will be removed</li>
                  <li>• You will lose access to all organizations</li>
                  <li>• This action is permanent and irreversible</li>
                </ul>
              </div>
            </div>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My Account
            </Button>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Before deleting your account:</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Export your data (see above)</li>
              <li>Transfer organization ownership (if you're the only owner)</li>
              <li>Cancel any active subscriptions</li>
              <li>Remove integrations (Slack, webhooks, etc.)</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Data Retention Policy</CardTitle>
          <CardDescription>
            How long we keep your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">Account data</span>
            <span className="text-sm text-gray-600">Until account deletion</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">Run history (Free plan)</span>
            <span className="text-sm text-gray-600">7 days</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">Run history (Pro plan)</span>
            <span className="text-sm text-gray-600">90 days</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">Run history (Business plan)</span>
            <span className="text-sm text-gray-600">365 days</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">Audit logs</span>
            <span className="text-sm text-gray-600">90 days (anonymized after deletion)</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm font-medium">Deleted account data</span>
            <span className="text-sm text-gray-600">30 days (recovery period)</span>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600">
            Have questions about your data or privacy?{' '}
            <a href="mailto:privacy@tokiflow.co" className="text-blue-600 hover:underline">
              Contact our privacy team
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


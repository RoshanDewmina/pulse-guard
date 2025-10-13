import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Mail, MessageSquare, Webhook } from 'lucide-react';
import Link from 'next/link';

export default async function AlertsPage() {
  const session = await getServerSession(authOptions);
  const org = await getUserPrimaryOrg(session!.user.id);

  if (!org) {
    return <div>No organization found</div>;
  }

  const channels = await prisma.alertChannel.findMany({
    where: { orgId: org.id },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const rules = await prisma.rule.findMany({
    where: { orgId: org.id },
    include: {
      org: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const channelIcons = {
    EMAIL: <Mail className="w-4 h-4" />,
    SLACK: <MessageSquare className="w-4 h-4" />,
    DISCORD: <MessageSquare className="w-4 h-4" />,
    WEBHOOK: <Webhook className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Alert Channels */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Alert Channels</CardTitle>
              <CardDescription>Where to send alerts when incidents occur</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Add Email
              </Button>
              <Link href={`/api/slack/install?orgId=${org.id}`}>
                <Button variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Connect Slack
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No alert channels configured yet.</p>
              <p className="text-sm">Add an email or connect Slack to receive alerts.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel) => {
                  const config = channel.configJson as any;
                  return (
                    <TableRow key={channel.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {channelIcons[channel.type]}
                          <span>{channel.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{channel.label}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {channel.type === 'EMAIL' && config.email}
                        {channel.type === 'SLACK' && (config.teamName || config.channel)}
                        {channel.type === 'WEBHOOK' && config.url}
                      </TableCell>
                      <TableCell>
                        {channel.isDefault && <Badge variant="outline">Default</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Alert Rules */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Alert Rules</CardTitle>
              <CardDescription>Route incidents from monitors to channels</CardDescription>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No alert rules configured yet.</p>
              <p className="text-sm">Create rules to route incidents to specific channels.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Monitors</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Suppress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.monitorIds.length === 0 ? 'All Monitors' : `${rule.monitorIds.length} monitors`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.channelIds.length} channels</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {rule.suppressMinutes ? `${rule.suppressMinutes}m` : 'None'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


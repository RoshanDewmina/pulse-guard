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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Plus, Crown, Shield, User } from 'lucide-react';

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  const org = await getUserPrimaryOrg(session!.user.id);

  if (!org) {
    return <div>No organization found</div>;
  }

  const memberships = await prisma.membership.findMany({
    where: { orgId: org.id },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const roleIcon = {
    OWNER: <Crown className="w-4 h-4 text-yellow-600" />,
    ADMIN: <Shield className="w-4 h-4 text-blue-600" />,
    MEMBER: <User className="w-4 h-4 text-gray-600" />,
  };

  const roleVariant = {
    OWNER: 'default' as const,
    ADMIN: 'secondary' as const,
    MEMBER: 'outline' as const,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {memberships.length} member{memberships.length !== 1 ? 's' : ''} in {org.name}
              </CardDescription>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {org.subscriptionPlan && memberships.length >= org.subscriptionPlan.userLimit && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ You&apos;ve reached your team member limit ({org.subscriptionPlan.userLimit} members).
                Upgrade your plan to add more members.
              </p>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((membership) => (
                <TableRow key={membership.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={membership.user.imageUrl || ''} />
                        <AvatarFallback>
                          {membership.user.name?.[0] || membership.user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{membership.user.name || membership.user.email}</div>
                        <div className="text-sm text-gray-500">{membership.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleVariant[membership.role]} className="flex items-center gap-1 w-fit">
                      {roleIcon[membership.role]}
                      {membership.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {format(membership.createdAt, 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    {membership.userId !== session!.user.id && (
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm">
                          Change Role
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          Remove
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { Plus, FileText, Loader2, Clock, CheckCircle, FileEdit, Archive } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

interface PostMortem {
  id: string;
  title: string;
  summary: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt?: Date | string;
  Incident: {
    id: string;
    kind: string;
    summary: string;
  };
}

export default function PostMortemsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [postmortems, setPostmortems] = useState<PostMortem[]>([]);

  useEffect(() => {
    fetchPostMortems();
  }, []);

  const fetchPostMortems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/postmortems');
      if (!res.ok) throw new Error('Failed to fetch post-mortems');
      const data = await res.json();
      setPostmortems(data.postmortems || []);
    } catch (error) {
      console.error('Error fetching post-mortems:', error);
      toast.error('Failed to load post-mortems');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="secondary" className="gap-1">
            <FileEdit className="h-3 w-3" />
            Draft
          </Badge>
        );
      case 'IN_REVIEW':
        return (
          <Badge variant="default" className="gap-1 bg-yellow-500 hover:bg-yellow-600">
            <Clock className="h-3 w-3" />
            In Review
          </Badge>
        );
      case 'PUBLISHED':
        return (
          <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Published
          </Badge>
        );
      case 'ARCHIVED':
        return (
          <Badge variant="outline" className="gap-1">
            <Archive className="h-3 w-3" />
            Archived
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeaderWithBreadcrumbs
          title="Post-Mortems"
          description="Loading..."
          breadcrumbs={[
            { label: 'Dashboard', href: '/app' },
            { label: 'Post-Mortems' },
          ]}
        />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeaderWithBreadcrumbs
        title="Post-Mortems"
        description="Document and learn from incidents"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Post-Mortems' },
        ]}
        action={
          <Button onClick={() => router.push('/app/postmortems/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Post-Mortem
          </Button>
        }
      />

      {postmortems.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center max-w-md">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Post-Mortems</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Document incidents and create post-mortems to learn from failures and improve your systems
              </p>
              <Button onClick={() => router.push('/app/postmortems/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Post-Mortem
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {postmortems.map((pm) => (
            <Card
              key={pm.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/app/postmortems/${pm.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="truncate">{pm.title}</CardTitle>
                      {getStatusBadge(pm.status)}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {pm.summary}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Incident Info */}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">Related Incident</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pm.Incident.kind}: {pm.Incident.summary}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(pm.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {pm.publishedAt && (
                      <div>
                        <p className="text-muted-foreground">Published</p>
                        <p className="font-medium">
                          {format(new Date(pm.publishedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/app/postmortems/${pm.id}`);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    {pm.status === 'DRAFT' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/app/postmortems/${pm.id}/edit`);
                        }}
                      >
                        <FileEdit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


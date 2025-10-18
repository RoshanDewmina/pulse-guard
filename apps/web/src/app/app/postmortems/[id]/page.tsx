'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { ArrowLeft, Edit, Download, Loader2, AlertCircle, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PostMortem {
  id: string;
  title: string;
  summary: string;
  impact?: string;
  rootCause?: string;
  timeline: any[];
  actionItems: any[];
  contributors: string[];
  status: string;
  publishedAt?: Date | string;
  createdAt: Date | string;
  Incident: {
    id: string;
    kind: string;
    summary: string;
  };
}

export default function PostMortemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [postmortem, setPostmortem] = useState<PostMortem | null>(null);

  useEffect(() => {
    fetchPostMortem();
  }, [id]);

  const fetchPostMortem = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/postmortems/${id}`);
      if (!res.ok) throw new Error('Failed to fetch post-mortem');
      const data = await res.json();
      setPostmortem(data.postmortem);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load post-mortem');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/postmortems/${id}/export`);
      if (!res.ok) throw new Error('Failed to export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `postmortem-${id}.md`;
      a.click();
      toast.success('Post-mortem exported');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to export post-mortem');
    }
  };

  if (loading || !postmortem) {
    return (
      <div className="space-y-8">
        <PageHeaderWithBreadcrumbs
          title="Loading..."
          description="Please wait"
          breadcrumbs={[
            { label: 'Post-Mortems', href: '/app/postmortems' },
            { label: 'Loading...' },
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
        title={postmortem.title}
        description={`Post-mortem for ${postmortem.Incident.kind} incident`}
        breadcrumbs={[
          { label: 'Post-Mortems', href: '/app/postmortems' },
          { label: postmortem.title },
        ]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {postmortem.status === 'DRAFT' && (
              <Button onClick={() => router.push(`/app/postmortems/${id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        }
      />

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{postmortem.summary}</p>
        </CardContent>
      </Card>

      {/* Impact */}
      {postmortem.impact && (
        <Card>
          <CardHeader>
            <CardTitle>Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{postmortem.impact}</p>
          </CardContent>
        </Card>
      )}

      {/* Root Cause */}
      {postmortem.rootCause && (
        <Card>
          <CardHeader>
            <CardTitle>Root Cause</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{postmortem.rootCause}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {postmortem.timeline.length === 0 ? (
            <p className="text-muted-foreground text-sm">No timeline events</p>
          ) : (
            <div className="space-y-4">
              {postmortem.timeline.map((event: any, index: number) => (
                <div key={index} className="flex gap-4 border-l-2 pl-4">
                  <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{event.time}</p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          {postmortem.actionItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">No action items</p>
          ) : (
            <div className="space-y-3">
              {postmortem.actionItems.map((item: any, index: number) => (
                <div key={index} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-start justify-between">
                    <p className="font-medium">{item.description}</p>
                    <Badge>{item.status}</Badge>
                  </div>
                  {item.owner && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.owner}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


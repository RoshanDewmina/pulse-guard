import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { format } from 'date-fns';

/**
 * GET /api/postmortems/:id/export
 * Export post-mortem as Markdown
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const postmortem = await prisma.postMortem.findFirst({
      where: {
        id,
        Org: {
          Membership: {
            some: { userId: session.user.id },
          },
        },
      },
      include: {
        Incident: {
          include: {
            Monitor: { select: { name: true } },
          },
        },
      },
    });

    if (!postmortem) {
      return NextResponse.json({ error: 'Post-mortem not found' }, { status: 404 });
    }

    // Generate Markdown
    const markdown = generateMarkdown(postmortem);

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="postmortem-${id}.md"`,
      },
    });
  } catch (error) {
    console.error('Error exporting post-mortem:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateMarkdown(postmortem: any): string {
  const timeline = postmortem.timeline as Array<{ time: string; event: string }>;
  const actionItems = postmortem.actionItems as Array<{ title: string; owner: string; status: string }>;

  return `# ${postmortem.title}

**Incident**: ${postmortem.Incident.Monitor.name}  
**Date**: ${format(new Date(postmortem.Incident.openedAt), 'MMMM d, yyyy')}  
**Status**: ${postmortem.status}  
**Duration**: ${postmortem.Incident.resolvedAt ? `${Math.round((new Date(postmortem.Incident.resolvedAt).getTime() - new Date(postmortem.Incident.openedAt).getTime()) / 60000)} minutes` : 'Ongoing'}

---

## Summary

${postmortem.summary}

${postmortem.impact ? `## Impact\n\n${postmortem.impact}\n` : ''}

${postmortem.rootCause ? `## Root Cause\n\n${postmortem.rootCause}\n` : ''}

## Timeline

${timeline.map((item) => `- **${item.time}**: ${item.event}`).join('\n')}

## Action Items

${actionItems.map((item) => `- [ ] **${item.title}** (Owner: ${item.owner}, Status: ${item.status})`).join('\n')}

${postmortem.contributors.length > 0 ? `## Contributors\n\n${postmortem.contributors.join(', ')}\n` : ''}

---

*Generated on ${format(new Date(), 'MMMM d, yyyy HH:mm')}*
`;
}


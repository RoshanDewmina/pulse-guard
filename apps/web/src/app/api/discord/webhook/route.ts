import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';
import { isValidDiscordWebhook } from '@/lib/discord';

export const runtime = 'nodejs';

const createDiscordWebhookSchema = z.object({
  orgId: z.string(),
  webhookUrl: z.string().url(),
  label: z.string().min(1).max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createDiscordWebhookSchema.parse(body);

    // Validate Discord webhook URL
    if (!isValidDiscordWebhook(data.webhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid Discord webhook URL. Must be a discord.com or discordapp.com webhook URL.' },
        { status: 400 }
      );
    }

    // Check access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: session.user.id,
          orgId: data.orgId,
        },
      },
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if a Discord channel already exists for this org
    const existingChannel = await prisma.alertChannel.findFirst({
      where: {
        orgId: data.orgId,
        type: 'DISCORD',
      },
    });

    let channel;

    if (existingChannel) {
      // Update existing channel
      channel = await prisma.alertChannel.update({
        where: { id: existingChannel.id },
        data: {
          label: data.label || `Discord - ${new URL(data.webhookUrl).pathname.split('/')[3]}`,
          configJson: {
            webhookUrl: data.webhookUrl,
          },
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new channel
      channel = await prisma.alertChannel.create({
        data: {
          id: crypto.randomUUID(),
          orgId: data.orgId,
          type: 'DISCORD',
          label: data.label || `Discord - ${new URL(data.webhookUrl).pathname.split('/')[3]}`,
          configJson: {
            webhookUrl: data.webhookUrl,
          },
          isDefault: false,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ channel, created: !existingChannel }, { status: existingChannel ? 200 : 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Create Discord webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');
    const channelId = searchParams.get('channelId');

    if (!orgId || !channelId) {
      return NextResponse.json({ error: 'orgId and channelId are required' }, { status: 400 });
    }

    // Check access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: session.user.id,
          orgId,
        },
      },
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the channel
    await prisma.alertChannel.delete({
      where: {
        id: channelId,
        orgId,
        type: 'DISCORD',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Discord webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



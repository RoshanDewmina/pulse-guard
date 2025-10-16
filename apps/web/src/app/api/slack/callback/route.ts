import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@tokiflow/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    // Decode state
    const { orgId, userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/slack/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error('Slack OAuth error:', tokenData.error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app/settings/alerts?error=slack_auth_failed`
      );
    }

    // Store Slack credentials
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        provider: 'slack',
        providerId: tokenData.team.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        scope: tokenData.scope,
        updatedAt: new Date(),
      },
    });

    // Create default Slack alert channel
    await prisma.alertChannel.create({
      data: {
        id: crypto.randomUUID(),
        orgId,
        type: 'SLACK',
        label: `Slack - ${tokenData.team.name}`,
        configJson: {
          teamId: tokenData.team.id,
          teamName: tokenData.team.name,
          accessToken: tokenData.access_token,
          channel: tokenData.incoming_webhook?.channel || '#general',
          channelId: tokenData.incoming_webhook?.channel_id,
        },
        isDefault: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/app/settings/alerts?success=slack_connected`
    );
  } catch (error) {
    console.error('Slack callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/app/settings/alerts?error=slack_callback_failed`
    );
  }
}


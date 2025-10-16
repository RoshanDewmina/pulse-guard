import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/signin`);
    }

    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    // Build Slack OAuth URL
    const slackClientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/slack/callback`;
    const scopes = ['chat:write', 'commands', 'AlertChannel:read', 'users:read'];
    
    const state = Buffer.from(JSON.stringify({ orgId, userId: session.user.id })).toString('base64');

    const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&scope=${scopes.join(',')}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    return NextResponse.redirect(slackAuthUrl);
  } catch (error) {
    console.error('Slack install error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


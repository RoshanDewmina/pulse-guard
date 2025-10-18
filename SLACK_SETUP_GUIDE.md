# Slack Integration Setup Guide

This guide walks you through setting up the Slack integration for Saturn Monitor.

## Prerequisites

- A Slack workspace where you have permission to install apps
- Access to your Saturn Monitor deployment URL

## Step 1: Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Select **"From scratch"**
4. Enter the following details:
   - **App Name**: `Saturn Monitor` (or your preferred name)
   - **Pick a workspace**: Select your Slack workspace
5. Click **"Create App"**

## Step 2: Configure OAuth & Permissions

1. In the left sidebar, click **"OAuth & Permissions"**
2. Scroll down to **"Scopes"** → **"Bot Token Scopes"**
3. Add the following scopes:
   - `chat:write` - Send messages as the app
   - `channels:read` - View basic information about public channels
   - `commands` - Add shortcuts and/or slash commands
   - `users:read` - View people in the workspace

4. Scroll up to **"Redirect URLs"**
5. Click **"Add New Redirect URL"**
6. Enter: `https://yourdomain.com/api/slack/callback`
   - Replace `yourdomain.com` with your actual Saturn deployment URL
7. Click **"Add"**
8. Click **"Save URLs"**

## Step 3: Enable Interactive Components

1. In the left sidebar, click **"Interactivity & Shortcuts"**
2. Toggle **"Interactivity"** to **On**
3. Enter **Request URL**: `https://yourdomain.com/api/slack/actions`
   - Replace `yourdomain.com` with your actual Saturn deployment URL
4. Click **"Save Changes"**

## Step 4: Add Slash Commands

1. In the left sidebar, click **"Slash Commands"**
2. Click **"Create New Command"**
3. Enter the following details:
   - **Command**: `/pulse`
   - **Request URL**: `https://yourdomain.com/api/slack/commands`
     - Replace `yourdomain.com` with your actual Saturn deployment URL
   - **Short Description**: `Manage Saturn Monitor incidents`
   - **Usage Hint**: `[list|ack <incident-id>]`
4. Click **"Save"**

## Step 5: Get Your Credentials

1. In the left sidebar, click **"Basic Information"**
2. Scroll down to **"App Credentials"**
3. Copy the following values:
   - **Client ID**
   - **Client Secret**
   - **Signing Secret**

## Step 6: Configure Environment Variables

Add the following environment variables to your Saturn deployment:

```bash
SLACK_CLIENT_ID=your_client_id_here
SLACK_CLIENT_SECRET=your_client_secret_here
SLACK_SIGNING_SECRET=your_signing_secret_here
```

### For Local Development (.env.local)
```
SLACK_CLIENT_ID=xxxxxxxxxxx.xxxxxxxxxxxx
SLACK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SLACK_SIGNING_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### For Production (Vercel/Fly.io/etc)
Add these as environment variables in your deployment platform's dashboard.

## Step 7: Deploy and Test

1. Deploy your application with the new environment variables
2. Go to your Saturn Monitor dashboard → **Integrations**
3. Find the **Slack** integration card
4. Click **"Quick Setup"** or **"Setup"**
5. Click **"Connect to Slack"**
6. You'll be redirected to Slack to authorize the app
7. Select the channel where you want to receive alerts
8. Click **"Allow"**
9. You'll be redirected back to Saturn with a success message

## Step 8: Configure Alert Channels

1. Go to **Settings** → **Alerts** (or stay on the Integrations page)
2. You should see your Slack channel listed
3. Configure which monitors should send alerts to Slack
4. Test the integration by triggering an alert

## Features

Once configured, you'll have access to:

### Real-time Alerts
Receive rich, formatted incident alerts in your Slack channels with:
- Incident type and status
- Monitor details
- Recent run history
- Interactive buttons

### Interactive Buttons
Each alert includes buttons to:
- **Acknowledge** - Mark incident as acknowledged
- **View Dashboard** - Open the incident in Saturn
- **Mute 2h** - Temporarily silence alerts for this incident

### Slash Commands
Use `/pulse` commands to:
- `/pulse list` - List all open incidents
- `/pulse ack <incident-id>` - Acknowledge an incident

## Troubleshooting

### "slack_auth_failed" Error
- Verify your Client ID and Client Secret are correct
- Check that the Redirect URL matches exactly (including https://)
- Ensure the Slack app is installed in your workspace

### "Invalid Request" on Interactive Components
- Verify the Request URL is correct and accessible
- Check that your Signing Secret is correct
- Ensure the endpoint is deployed and responding

### Alerts Not Appearing in Slack
- Check that the Slack channel was created in Alert Channels
- Verify the alert channel is assigned to your monitors
- Check the worker logs for any errors
- Ensure the bot is invited to the channel (for private channels)

### Buttons Not Working
- Verify Interactive Components are enabled
- Check the Request URL is correct
- Ensure the Signing Secret matches
- Check worker logs for processing errors

## Security Notes

- Keep your Client Secret and Signing Secret confidential
- Use environment variables, never commit secrets to git
- Regularly rotate your secrets if compromised
- Review Slack app permissions periodically
- Consider using separate Slack apps for dev/staging/production

## API Routes Reference

The following API routes are used for Slack integration:

- `GET /api/slack/install` - Initiates OAuth flow
- `GET /api/slack/callback` - OAuth callback handler
- `POST /api/slack/actions` - Interactive component handler
- `POST /api/slack/commands` - Slash command handler

## Need Help?

If you encounter issues:
- Check the application logs for detailed error messages
- Review the Slack app event subscriptions and permissions
- Ensure all environment variables are set correctly
- Contact support at support@saturnmonitor.com



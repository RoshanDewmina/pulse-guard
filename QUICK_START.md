# ⚡ PulseGuard Quick Start

Get PulseGuard up and running in 10 minutes with this step-by-step guide.

## 🎯 What You'll Build

By the end of this guide, you'll have:
- ✅ A fully functional monitoring platform
- ✅ HTTP monitoring with custom assertions
- ✅ Multi-channel alerting (Email, Slack, Discord)
- ✅ Public status pages
- ✅ Team collaboration features
- ✅ MFA security
- ✅ Audit logging

---

## 🚀 Step 1: Prerequisites (2 minutes)

### Required Accounts

Create accounts for these services (all have free tiers):

| Service | Purpose | Sign Up |
|---------|---------|---------|
| **Vercel** | Web hosting | [vercel.com](https://vercel.com) |
| **Fly.io** | Worker hosting | [fly.io](https://fly.io) |
| **Neon** | Database | [neon.tech](https://neon.tech) |
| **Upstash** | Redis cache | [upstash.com](https://upstash.com) |
| **Resend** | Email delivery | [resend.com](https://resend.com) |

### Local Requirements

- **Node.js** 18.x or later
- **Bun** (recommended) or npm
- **Git**

```bash
# Install Bun (recommended)
curl -fsSL https://bun.sh/install | bash

# Or install Node.js
# Visit nodejs.org and download LTS version
```

---

## 🏗️ Step 2: Deploy Infrastructure (3 minutes)

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-username/pulse-guard.git
cd pulse-guard

# Install dependencies
bun install
```

### 2. Run Automated Setup

```bash
# This will guide you through setting up all services
./setup-env.sh
```

The script will:
- ✅ Create a Neon database
- ✅ Set up Upstash Redis
- ✅ Configure Resend email
- ✅ Generate all environment variables
- ✅ Create deployment configurations

### 3. Deploy Everything

```bash
# Deploy the entire stack
./deploy-all.sh production
```

This will:
- ✅ Deploy database migrations
- ✅ Deploy web app to Vercel
- ✅ Deploy worker to Fly.io
- ✅ Run health checks

---

## 🎉 Step 3: First Login (1 minute)

### 1. Access Your Application

Visit your deployed URL (shown in the deployment output):
```
https://your-app-name.vercel.app
```

### 2. Create Your Account

1. Click **"Sign Up"**
2. Enter your email and password
3. Verify your email (check your inbox)
4. Complete the onboarding flow

### 3. Create Your Organization

1. Enter your organization name
2. Choose a unique slug
3. Select your plan (start with Free)

---

## 📊 Step 4: Create Your First Monitor (2 minutes)

### 1. Add a Monitor

1. Click **"Add Monitor"**
2. Choose **"HTTP Check"**
3. Enter your website URL: `https://httpbin.org/status/200`
4. Set check interval: `5 minutes`
5. Click **"Create Monitor"**

### 2. Configure Advanced Settings

1. Click on your monitor
2. Go to **"Settings"**
3. Configure:
   - **Expected Status Code**: `200`
   - **Response Time SLA**: `5000ms`
   - **Custom Headers**: `User-Agent: PulseGuard`
   - **Response Assertions**: Check for specific content

### 3. Test Your Monitor

1. Click **"Test Now"**
2. Verify the test passes
3. Check the response details

---

## 🚨 Step 5: Set Up Alerting (1 minute)

### 1. Configure Email Alerts

1. Go to **Settings** → **Alert Channels**
2. Click **"Add Channel"**
3. Choose **"Email"**
4. Enter your email address
5. Test the channel

### 2. Add Slack Alerts (Optional)

1. Create a Slack app at [api.slack.com](https://api.slack.com)
2. Get your bot token
3. Add Slack channel in PulseGuard
4. Test notifications

### 3. Configure Alert Rules

1. Go to **Settings** → **Alert Rules**
2. Create a rule:
   - **When**: Monitor goes down
   - **Send to**: Email channel
   - **Message**: Custom alert message

---

## 🎯 Step 6: Create a Status Page (1 minute)

### 1. Create Status Page

1. Go to **Status Pages**
2. Click **"Create Status Page"**
3. Enter page details:
   - **Name**: "Our Services"
   - **Description**: "Service status and incidents"
   - **Domain**: `status.yourcompany.com` (optional)

### 2. Add Services

1. Add your monitors to the status page
2. Organize by categories
3. Set service descriptions

### 3. Customize Appearance

1. Upload your logo
2. Choose color scheme
3. Add custom CSS (optional)

---

## 🔐 Step 7: Enable Security Features (1 minute)

### 1. Enable MFA

1. Go to **Settings** → **Security**
2. Click **"Enable MFA"**
3. Scan QR code with authenticator app
4. Enter verification code
5. Save backup codes securely

### 2. Set Up Audit Logging

1. Go to **Settings** → **Audit Logs**
2. Review recent activity
3. Configure log retention
4. Set up log exports

### 3. Configure Team Access

1. Go to **Settings** → **Team**
2. Invite team members
3. Assign roles (Admin, Member, Viewer)
4. Configure permissions

---

## 🎊 Congratulations!

You now have a fully functional monitoring platform! Here's what you can do next:

### Immediate Next Steps

1. **Add More Monitors**:
   - Monitor your APIs
   - Set up heartbeat monitoring
   - Add SSL certificate monitoring

2. **Configure Advanced Features**:
   - Set up maintenance windows
   - Configure anomaly detection
   - Add synthetic monitoring

3. **Customize Your Setup**:
   - Add custom domains
   - Configure SAML SSO
   - Set up custom alerting rules

### Explore Advanced Features

- **Synthetic Monitoring**: Multi-step browser tests
- **SAML SSO**: Enterprise single sign-on
- **Audit Logging**: Comprehensive activity tracking
- **Maintenance Windows**: Scheduled maintenance management
- **Anomaly Detection**: AI-powered outlier detection

---

## 🔧 Troubleshooting

### Common Issues

#### "Database connection failed"
```bash
# Check your DATABASE_URL
echo $DATABASE_URL
# Should look like: postgresql://user:pass@host:port/db
```

#### "Redis connection failed"
```bash
# Check your REDIS_URL
echo $REDIS_URL
# Should look like: redis://user:pass@host:port
```

#### "Email not sending"
- Check your Resend API key
- Verify your FROM_EMAIL address
- Check spam folder

#### "Worker not processing jobs"
```bash
# Check worker status
fly status
# Check worker logs
fly logs
```

### Get Help

- **Documentation**: [docs.pulseguard.com](https://docs.pulseguard.com)
- **Community**: [Discord](https://discord.gg/pulseguard)
- **Issues**: [GitHub Issues](https://github.com/pulseguard/pulseguard/issues)
- **Email**: support@pulseguard.com

---

## 📚 What's Next?

### Learn More

- [Features Guide](./docs/FEATURES.md) - Complete feature overview
- [API Documentation](./docs/API.md) - Integrate with your apps
- [Security Guide](./docs/SECURITY.md) - Security best practices
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Advanced deployment options

### Advanced Configuration

- [Custom Domains](./docs/CUSTOM_DOMAINS.md)
- [SAML SSO Setup](./docs/SAML_SETUP.md)
- [Monitoring Best Practices](./docs/MONITORING_BEST_PRACTICES.md)
- [Alerting Strategies](./docs/ALERTING_STRATEGIES.md)

### Integration Guides

- [Kubernetes Integration](./integrations/kubernetes/README.md)
- [Terraform Provider](./integrations/terraform-provider/README.md)
- [WordPress Plugin](./integrations/wordpress/README.md)

---

## 🎉 You're All Set!

Your PulseGuard instance is now running and ready to monitor your services. Start adding monitors and enjoy the peace of mind that comes with comprehensive uptime monitoring!

**Happy Monitoring!** 🚀

---

**Last Updated**: January 2024  
**Quick Start Version**: v2.0

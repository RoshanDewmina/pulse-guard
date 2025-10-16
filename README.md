# 🛡️ PulseGuard

**Production-ready uptime monitoring and alerting platform**

Monitor your servers, APIs, cron jobs, and services with real-time alerts via email, Slack, Discord, and webhooks.

---

## ✨ Features

- 🔍 **HTTP/HTTPS Monitoring** - Monitor any endpoint with custom headers, methods, and assertions
- ⏰ **Cron Job Monitoring** - Heartbeat monitoring for scheduled tasks
- 📊 **Real-time Dashboards** - Beautiful, responsive monitoring dashboards
- 🚨 **Multi-channel Alerts** - Email, Slack, Discord, and webhook notifications
- 📈 **Analytics & Insights** - Track uptime, response times, and incident trends
- 🔐 **Secure & Private** - Self-hosted or managed, your data stays yours
- 🎯 **Status Pages** - Public and private status pages for your services
- 👥 **Team Collaboration** - Organizations, teams, and role-based access
- 💳 **Billing & Plans** - Built-in Stripe integration for SaaS monetization

---

## 🚀 Quick Start

### 1. Choose Your Deployment Method

**For First-Time Users:**
```bash
# 10-minute guided deployment
See: QUICK_START.md
```

**For Experienced Users:**
```bash
# Automated deployment
./setup-env.sh
./deploy-all.sh production
```

**For Manual Control:**
```bash
# Step-by-step CLI deployment
See: DEPLOY_CLI.md
```

### 2. Development Setup

```bash
# Install dependencies
bun install

# Set up environment
cp env.txt .env
# Edit .env with your local values

# Run database migrations
cd packages/db
npx prisma migrate dev

# Start development servers
bun run dev
```

---

## 📚 Documentation

### Deployment Guides

| Guide | Best For | Time |
|-------|----------|------|
| [📄 QUICK_START.md](./QUICK_START.md) | First deployment | 10 min |
| [📄 DEPLOY_CLI.md](./DEPLOY_CLI.md) | Production setup | 20 min |
| [📄 VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) | Web dashboard deployment | 15 min |
| [📄 DEPLOYMENT_README.md](./DEPLOYMENT_README.md) | Complete reference | - |

### Development Guides

- [📖 Development Guide](./docs/DEVELOPMENT.md) - Local development setup
- [🧪 Testing Guide](./docs/TESTING.md) - Running tests
- [🔐 Security Guide](./docs/SECURITY.md) - Security best practices
- [💳 Stripe Setup](./docs/STRIPE.md) - Payment integration
- [🐛 Sentry Setup](./docs/SENTRY_SETUP.md) - Error tracking

### Integration Guides

- [☸️ Kubernetes Integration](./integrations/kubernetes/README.md) - K8s monitoring
- [🔧 Terraform Provider](./integrations/terraform-provider/README.md) - Infrastructure as code
- [📝 WordPress Plugin](./integrations/wordpress/README.md) - WP-Cron monitoring

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     PulseGuard                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐         ┌──────────────┐             │
│  │   Next.js    │         │   Worker     │             │
│  │   Web App    │◄───────►│   (BullMQ)   │             │
│  └──────┬───────┘         └──────┬───────┘             │
│         │                         │                     │
│         │    ┌────────────┐       │                     │
│         └───►│   Redis    │◄──────┘                     │
│              └────────────┘                             │
│                    │                                    │
│              ┌─────▼──────┐                             │
│              │ PostgreSQL │                             │
│              └────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL (Prisma ORM)
- **Cache/Queue**: Redis (BullMQ)
- **Worker**: Node.js background jobs
- **Email**: Resend
- **Payments**: Stripe
- **Deployment**: Vercel (web) + Fly.io (worker)

---

## 📦 Project Structure

```
pulse-guard/
├── apps/
│   ├── web/              # Next.js web application
│   │   ├── src/
│   │   │   ├── app/      # App router pages
│   │   │   ├── components/  # React components
│   │   │   └── lib/      # Utilities
│   │   └── package.json
│   │
│   └── worker/           # Background job worker
│       ├── src/
│       │   ├── jobs/     # Job processors
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   ├── db/               # Shared database package
│   │   ├── prisma/       # Database schema
│   │   └── src/
│   │
│   └── cli/              # CLI tool
│
├── integrations/         # Third-party integrations
│   ├── kubernetes/       # K8s monitoring
│   ├── terraform-provider/  # Terraform integration
│   └── wordpress/        # WordPress plugin
│
├── docs/                 # Documentation
├── deploy-all.sh         # Automated deployment
├── setup-env.sh          # Environment setup
└── package.json          # Root package.json
```

---

## 🛠️ Deployment Scripts

### `./setup-env.sh`
Interactive environment variable setup.

```bash
./setup-env.sh
```

Generates:
- `.env.production` - All environment variables
- `set-vercel-env.sh` - Vercel environment setter
- `set-flyio-secrets.sh` - Fly.io secrets setter

---

### `./deploy-vercel-cli.sh`
Deploy web app to Vercel.

```bash
./deploy-vercel-cli.sh production
```

---

### `./deploy-flyio.sh`
Deploy worker to Fly.io.

```bash
./deploy-flyio.sh
```

---

### `./deploy-all.sh`
Deploy entire stack.

```bash
./deploy-all.sh production
```

Runs:
1. Database migrations
2. Web app deployment
3. Worker deployment
4. Health checks

---

## 🌐 Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection (pooled) |
| `DATABASE_URL_UNPOOLED` | PostgreSQL connection (direct) |
| `REDIS_URL` | Redis connection string |
| `NEXTAUTH_SECRET` | Auth secret (32+ chars) |
| `NEXTAUTH_URL` | Your app URL |
| `JWT_SECRET` | JWT signing secret |
| `RESEND_API_KEY` | Email API key |
| `FROM_EMAIL` | Sender email address |

### Optional

- Stripe keys for billing
- Slack/Discord for integrations
- S3 for output capture
- Sentry for error tracking

**See**: [Environment Variables Guide](./DEPLOY_CLI.md#environment-variables)

---

## 💰 Pricing & Hosting

### Free Tier
**$0/month** - Perfect for testing and personal use

- Vercel Free (100GB bandwidth)
- Fly.io Free (3 VMs)
- Neon Free (0.5GB)
- Upstash Free (10k commands/day)
- Resend Free (100 emails/day)

**Supports**: 50-100 monitors, 1-2 users

### Production Tier
**~$65/month** - Small teams and businesses

- Vercel Pro ($20)
- Fly.io ($10)
- Neon Pro ($20)
- Upstash ($5)
- Resend ($10)

**Supports**: 500-1000 monitors, 5-10 users

### Enterprise Tier
**$200-500+/month** - Large teams with high availability

- Custom Vercel plan
- Multiple Fly.io instances
- Dedicated database
- Premium Redis

**Supports**: 5000+ monitors, unlimited users

---

## 🧪 Testing

```bash
# Unit tests
bun test

# E2E tests
cd apps/web
bun run test:e2e

# Run all tests
./apps/web/scripts/run-all-tests.sh
```

**See**: [Testing Guide](./docs/TESTING.md)

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Support

- **Documentation**: Check the guides in the root directory
- **Issues**: Open a GitHub issue
- **Email**: support@yourdomain.com

---

## 🎉 Getting Started

1. **Read the Quick Start**: [QUICK_START.md](./QUICK_START.md)
2. **Set up your environment**: `./setup-env.sh`
3. **Deploy**: `./deploy-all.sh production`
4. **Create your first monitor**: Visit your deployed app
5. **Monitor away!** 🚀

---

**Built with ❤️ for developers who care about uptime**

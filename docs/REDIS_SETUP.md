# Redis Setup

Redis is required for background job processing (BullMQ) and rate limiting.

## Quick Setup (Upstash - Recommended)

### 1. Create Database

1. Sign up at https://upstash.com (free tier available)
2. Create database:
   - Name: `saturn-prod`
   - Type: Regional (or Global for multi-region)
   - Region: Closest to your app

### 2. Get Connection URL

Copy connection string from dashboard:
```
rediss://default:[password]@[host].upstash.io:6379
```

### 3. Add to Environment Variables

```env
REDIS_URL=rediss://default:YOUR_PASSWORD@host.upstash.io:6379
```

Add to:
- Vercel (web app)
- Fly.io/Render (worker)

## Alternative Options

### Local Development
```bash
# Start Redis via Docker Compose
make docker-up

# Connection string:
REDIS_URL=redis://localhost:6379
```

### Redis Cloud
1. Sign up at https://redis.com/try-free
2. Create database
3. Copy connection string
4. Add as REDIS_URL

### Self-Hosted
```bash
# Install Redis
# Ubuntu/Debian:
sudo apt install redis-server

# macOS:
brew install redis
brew services start redis

# Connection string:
REDIS_URL=redis://localhost:6379
```

## Testing

```bash
# Test connection
node -e "const Redis = require('ioredis'); const redis = new Redis(process.env.REDIS_URL); redis.ping().then(console.log).finally(() => redis.quit());"

# Should output: PONG
```

## Free Tier Limits

**Upstash:**
- 10,000 commands/day
- 256 MB storage
- Unlimited connections

**Redis Cloud:**
- 30 MB storage
- 30 connections max

## Troubleshooting

**Connection timeout:**
- Check firewall rules
- Verify Redis is running
- Ensure connection string is correct (rediss:// vs redis://)

**TLS/SSL errors:**
- Use `rediss://` (with double 's') for TLS
- For Upstash, always use TLS connection

**Worker not processing jobs:**
- Verify both web and worker have same REDIS_URL
- Check Redis dashboard for connection activity
- View worker logs for connection errors

## Configuration

BullMQ is configured in:
- `apps/web/src/lib/queue.ts` - Queue setup
- `apps/worker/src/queues.ts` - Worker setup
- `apps/worker/src/jobs/` - Job processors

Default queues:
- `evaluator` - Monitor evaluation (every 60s)
- `alerts` - Alert dispatching
- `email` - Email sending
- `slack` - Slack messages
- `discord` - Discord messages
- `webhook` - Webhook deliveries

## Monitoring

### View Queues
```bash
# In Redis CLI or GUI tool
KEYS bull:*
LLEN bull:evaluator:wait
LLEN bull:alerts:wait
```

### BullBoard (Optional)
Add BullBoard to view queue status in browser:
```typescript
// apps/web/src/app/api/admin/queues/route.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
```

Access at `/api/admin/queues`

## Resources

- Upstash Docs: https://docs.upstash.com/redis
- BullMQ Docs: https://docs.bullmq.io/
- Redis Docs: https://redis.io/docs/

# Redis Setup Guide

Tokiflow requires Redis for background job processing (alerts, emails, Slack notifications) and rate limiting.

## Option 1: Upstash Redis (Recommended for Vercel)

### Why Upstash?
- ✅ FREE tier: 10,000 commands/day
- ✅ Serverless-optimized (perfect for Vercel)
- ✅ Global replication available
- ✅ No connection limits
- ✅ REST API fallback

### Setup Steps

1. **Create Account**
   - Go to https://upstash.com
   - Sign up (free, no credit card required)

2. **Create Database**
   ```bash
   # Via Upstash Console:
   # 1. Click "Create Database"
   # 2. Name: tokiflow-prod
   # 3. Type: Regional (Global for multi-region)
   # 4. Region: Choose closest to your app
   # 5. Click "Create"
   ```

3. **Get Connection URL**
   - Click on your database
   - Copy the connection string:
     ```
     redis://default:[password]@[host]:6379
     ```
   - Or use REST API URL for edge compatibility

4. **Add to Environment Variables**
   ```env
   REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
   ```

5. **Test Connection**
   ```bash
   cd apps/web
   node -e "const Redis = require('ioredis'); const redis = new Redis(process.env.REDIS_URL); redis.ping().then(console.log).finally(() => redis.quit());"
   ```

### Free Tier Limits
- 10,000 commands/day
- 256 MB storage
- TLS/SSL included
- Unlimited connections

## Option 2: Redis Cloud

### Setup Steps

1. **Create Account**
   - Go to https://redis.com/try-free
   - Sign up for free tier

2. **Create Database**
   - Click "New Database"
   - Plan: Free (30MB)
   - Name: tokiflow
   - Click "Activate"

3. **Get Credentials**
   - Endpoint: `redis-xxxxx.c.cloud.redislabs.com:xxxxx`
   - Password: Copy from dashboard
   
4. **Connection URL**
   ```env
   REDIS_URL=redis://default:YOUR_PASSWORD@redis-xxxxx.c.cloud.redislabs.com:xxxxx
   ```

### Free Tier Limits
- 30 MB storage
- 30 connections
- No eviction (data persistence)

## Option 3: Local Development (Docker)

Already configured in `docker-compose.yml`:

```bash
# Start Redis locally
docker compose up redis -d

# Connection string
REDIS_URL=redis://localhost:6379
```

## Vercel Configuration

### Add Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. Add:
   ```
   Name: REDIS_URL
   Value: redis://default:[password]@[host]:6379
   Environments: Production, Preview, Development
   ```

3. Redeploy:
   ```bash
   vercel --prod
   ```

## Worker Configuration

The worker requires the same `REDIS_URL` environment variable.

### Railway
```bash
railway variables set REDIS_URL="redis://..."
```

### Render
Add in Environment tab:
```
REDIS_URL = redis://...
```

### Fly.io
```bash
fly secrets set REDIS_URL="redis://..."
```

## Testing Redis Connection

### Web App
```bash
cd apps/web
bun run dev

# Check logs for:
# "Redis connected" or "Using in-memory rate limiting"
```

### Worker
```bash
cd apps/worker
bun run dev

# Should see:
# ✅ Evaluator worker started
# ✅ Alert dispatcher worker started
# etc.
```

## Troubleshooting

### Connection Timeout
```
Error: connect ETIMEDOUT
```

**Solution:**
- Check firewall rules (Upstash/Redis Cloud dashboard)
- Verify connection string format
- Ensure TLS is enabled if required

### Authentication Failed
```
Error: NOAUTH Authentication required
```

**Solution:**
- Include password in connection URL
- Format: `redis://default:PASSWORD@host:port`

### Too Many Connections
```
Error: max number of clients reached
```

**Solution:**
- Upgrade plan or use Upstash (unlimited connections)
- Reduce `maxRetriesPerRequest` in connection config

### Worker Not Processing Jobs
```bash
# Check Redis queues
redis-cli -u $REDIS_URL

# List all keys
KEYS *

# Check queue lengths
LLEN bull:alerts:wait
LLEN bull:email:wait
LLEN bull:slack:wait
```

## Monitoring

### Upstash Dashboard
- Command usage
- Storage usage
- Latency metrics

### Redis Cloud Dashboard
- Memory usage
- Operations per second
- Connection count

### Manual Monitoring
```bash
# Connect to Redis
redis-cli -u $REDIS_URL

# Get info
INFO

# Monitor commands in real-time
MONITOR

# Check specific queue
LLEN bull:alerts:wait
LRANGE bull:alerts:wait 0 -1
```

## Cost Estimates

### Free Tier (Recommended for MVP)
- Upstash: 10,000 commands/day = ~100 alerts/day
- Redis Cloud: 30MB storage
- **Cost: $0/month**

### Paid Tier (Scale)
- Upstash Pro: $10/month (1M commands/day)
- Redis Cloud: $7/month (1GB storage)
- **Cost: $7-10/month**

## Performance Tips

1. **Connection Pooling**
   ```typescript
   const connection = new Redis(process.env.REDIS_URL, {
     maxRetriesPerRequest: 3,
     enableReadyCheck: true,
     lazyConnect: true,
   });
   ```

2. **Job Priorities**
   ```typescript
   await queue.add('critical-alert', data, { priority: 1 });
   await queue.add('routine-check', data, { priority: 10 });
   ```

3. **Rate Limiting**
   ```typescript
   // Configure in apps/web/src/lib/rate-limit.ts
   const limiter = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(60, "1 m"),
   });
   ```

## Security Best Practices

1. **Use TLS**
   ```env
   REDIS_URL=rediss://... # Note the 's' in rediss
   ```

2. **Rotate Passwords**
   - Regenerate credentials every 90 days
   - Update in Vercel/Railway immediately

3. **Firewall Rules**
   - Whitelist only your deployment IPs
   - Available in Upstash/Redis Cloud dashboards

4. **Don't Store Sensitive Data**
   - Use Redis only for job queues and caching
   - Sensitive data stays in PostgreSQL

## Next Steps

After setting up Redis:

1. ✅ Add `REDIS_URL` to Vercel
2. ✅ Add `REDIS_URL` to worker platform
3. ✅ Deploy and verify logs
4. ✅ Test alert delivery
5. ✅ Monitor command usage

Need help? Check the [troubleshooting section](#troubleshooting) or open an issue.


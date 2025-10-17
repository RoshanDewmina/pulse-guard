# Vercel DNS Setup Guide for Saturn Monitor

## 🌐 Current Status
- ✅ Main domain: `saturnmonitor.com` (configured)
- ✅ WWW subdomain: `www.saturnmonitor.com` (configured)
- ✅ Nameservers: Vercel DNS

## 📋 How to Add Subdomains in Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/roshandewminas-projects/pulse-guard/settings/domains

2. Click **"Add Domain"**

3. Enter subdomain (e.g., `app.saturnmonitor.com`)

4. Select **"Add"**

5. Vercel automatically configures:
   - DNS CNAME record
   - SSL certificate
   - HTTPS redirect

### Method 2: Via Vercel CLI

```bash
# Add a subdomain
vercel domains add app.saturnmonitor.com

# List all domains
vercel domains ls

# Remove a domain
vercel domains rm old-subdomain.saturnmonitor.com
```

## 🎯 Recommended Subdomains to Add

### Essential (Add First)

1. **app.saturnmonitor.com**
   - Purpose: Main application dashboard
   - Points to: Vercel (main Next.js app)
   - Add in Vercel: `app.saturnmonitor.com`

2. **api.saturnmonitor.com**
   - Purpose: API endpoints (if separating from main app)
   - Points to: Vercel
   - Add in Vercel: `api.saturnmonitor.com`

3. **status.saturnmonitor.com**
   - Purpose: Public status pages
   - Points to: Vercel
   - Add in Vercel: `status.saturnmonitor.com`

### Nice to Have

4. **docs.saturnmonitor.com**
   - Purpose: Documentation
   - Points to: Vercel
   - Add in Vercel: `docs.saturnmonitor.com`

5. **staging.saturnmonitor.com**
   - Purpose: Staging environment
   - Points to: Vercel preview deployment
   - Add in Vercel: `staging.saturnmonitor.com`

## 🔧 Special Configuration: Worker Subdomain

For the Fly.io worker, you need to add a CNAME manually:

### Add worker.saturnmonitor.com

**Via Vercel DNS Interface:**

1. Go to: https://vercel.com/roshandewminas-projects/domains/saturnmonitor.com/dns

2. Add Record:
   - Type: `CNAME`
   - Name: `worker`
   - Value: `saturn-worker.fly.dev`
   - TTL: `Auto`

**Or use Vercel CLI:**
```bash
# This might not work directly - use dashboard instead
vercel dns add saturnmonitor.com worker CNAME saturn-worker.fly.dev
```

## 📝 Domain Configuration in Your App

After adding subdomains, update your Next.js config:

### Update Environment Variables

Add subdomain-specific URLs if needed:

```env
# In Vercel Environment Variables
NEXT_PUBLIC_APP_URL=https://app.saturnmonitor.com
NEXT_PUBLIC_API_URL=https://api.saturnmonitor.com
NEXT_PUBLIC_STATUS_URL=https://status.saturnmonitor.com
NEXT_PUBLIC_WORKER_URL=https://worker.saturnmonitor.com
```

### Update next.config.js (if needed)

```javascript
// apps/web/next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.saturnmonitor.com/:path*'
      }
    ]
  }
}
```

## 🔒 SSL Certificates

Vercel automatically provisions SSL certificates for:
- All domains added via dashboard
- All subdomains
- Wildcard subdomains (if configured)

**Certificates are:**
- Free (Let's Encrypt)
- Auto-renewed
- Wildcard support available

## 🎨 Subdomain Routing in Next.js

If you want different content per subdomain:

### Option 1: Middleware-based routing

```typescript
// apps/web/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Route based on subdomain
  if (hostname.startsWith('app.')) {
    return NextResponse.rewrite(new URL('/app', request.url));
  }
  
  if (hostname.startsWith('status.')) {
    return NextResponse.rewrite(new URL('/status', request.url));
  }
  
  if (hostname.startsWith('docs.')) {
    return NextResponse.rewrite(new URL('/docs', request.url));
  }
  
  // Default: main site
  return NextResponse.next();
}
```

### Option 2: Separate Vercel Projects

- Create separate project for docs: docs-saturn
- Create separate project for status: status-saturn
- Link each to its subdomain

## 📊 Monitoring Your DNS

Check DNS propagation:
```bash
# Check A record
nslookup saturnmonitor.com

# Check CNAME
nslookup app.saturnmonitor.com

# Check all records
nslookup -type=ANY saturnmonitor.com
```

Online tools:
- https://dnschecker.org/
- https://www.whatsmydns.net/

## 🚀 Quick Setup Commands

```bash
# Navigate to project
cd /home/roshan/development/personal/pulse-guard

# Add essential subdomains
vercel domains add app.saturnmonitor.com
vercel domains add api.saturnmonitor.com
vercel domains add status.saturnmonitor.com
vercel domains add docs.saturnmonitor.com

# Verify domains
vercel domains ls
```

## ✅ Verification Checklist

- [ ] Main domain works: https://saturnmonitor.com
- [ ] WWW works: https://www.saturnmonitor.com
- [ ] App subdomain: https://app.saturnmonitor.com
- [ ] Status subdomain: https://status.saturnmonitor.com
- [ ] API subdomain: https://api.saturnmonitor.com
- [ ] Worker subdomain: https://worker.saturnmonitor.com
- [ ] All have valid SSL certificates
- [ ] All redirect HTTP to HTTPS

## 📞 Need Help?

- Vercel DNS Docs: https://vercel.com/docs/concepts/projects/custom-domains
- Vercel DNS Records: https://vercel.com/docs/concepts/projects/domains/dns
- Support: https://vercel.com/support


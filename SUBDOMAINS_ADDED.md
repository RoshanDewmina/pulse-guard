# Subdomains Added to Saturn Monitor

## ✅ Successfully Added via Vercel CLI

The following subdomains have been added to the `pulse-guard` project:

1. **app.saturnmonitor.com**
   - Purpose: Main application dashboard
   - Status: ✅ Added
   - Will point to: Vercel (Next.js app)

2. **api.saturnmonitor.com**
   - Purpose: API endpoints
   - Status: ✅ Added
   - Will point to: Vercel

3. **status.saturnmonitor.com**
   - Purpose: Public status pages
   - Status: ✅ Added
   - Will point to: Vercel

4. **docs.saturnmonitor.com**
   - Purpose: Documentation
   - Status: ✅ Added
   - Will point to: Vercel

## 🔍 Verification Steps

### 1. Check Vercel Dashboard

Visit: https://vercel.com/roshandewminas-projects/pulse-guard/settings/domains

You should see all four subdomains listed there with:
- Green checkmark (✓) for valid configuration
- SSL certificate status
- DNS configuration details

### 2. Verify DNS Records

Vercel automatically creates CNAME records for each subdomain:

```
app.saturnmonitor.com      CNAME  cname.vercel-dns.com
api.saturnmonitor.com      CNAME  cname.vercel-dns.com
status.saturnmonitor.com   CNAME  cname.vercel-dns.com
docs.saturnmonitor.com     CNAME  cname.vercel-dns.com
```

Check DNS propagation (may take 5-30 minutes):
```bash
# Check if CNAME records exist
nslookup app.saturnmonitor.com
nslookup api.saturnmonitor.com
nslookup status.saturnmonitor.com
nslookup docs.saturnmonitor.com
```

Or use online tools:
- https://dnschecker.org/
- https://www.whatsmydns.net/

### 3. Test HTTPS Access

Once DNS propagates (usually 5-30 minutes), test each subdomain:

```bash
curl -I https://app.saturnmonitor.com
curl -I https://api.saturnmonitor.com
curl -I https://status.saturnmonitor.com
curl -I https://docs.saturnmonitor.com
```

All should return HTTP 200 or redirect to the main app.

## 🚀 Next Steps

### 1. Update Environment Variables

Update `NEXTAUTH_URL` if you want to use a subdomain for authentication:

```env
# Option 1: Keep using main domain
NEXTAUTH_URL=https://saturnmonitor.com

# Option 2: Use app subdomain
NEXTAUTH_URL=https://app.saturnmonitor.com
```

If you change to app subdomain, update Google OAuth redirect URIs:
- Add: `https://app.saturnmonitor.com/api/auth/callback/google`

### 2. Configure Subdomain Routing (Optional)

If you want different content per subdomain, add middleware:

```typescript
// apps/web/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  if (hostname.startsWith('app.')) {
    // Route to app pages
    return NextResponse.rewrite(new URL('/app', request.url));
  }
  
  if (hostname.startsWith('status.')) {
    // Route to status pages
    return NextResponse.rewrite(new URL('/status', request.url));
  }
  
  if (hostname.startsWith('docs.')) {
    // Route to docs pages
    return NextResponse.rewrite(new URL('/docs', request.url));
  }
  
  if (hostname.startsWith('api.')) {
    // Route to API endpoints
    return NextResponse.rewrite(new URL('/api', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 3. Add Worker Subdomain (Manual)

For the Fly.io worker, you need to manually add a CNAME record:

**Via Vercel Dashboard:**
1. Go to: https://vercel.com/roshandewminas-projects/domains/saturnmonitor.com/dns
2. Click "Add Record"
3. Configure:
   - Type: `CNAME`
   - Name: `worker`
   - Value: `saturn-worker.fly.dev`
   - TTL: `Auto` (or 3600)
4. Save

**Result:** `worker.saturnmonitor.com` → Fly.io worker

### 4. SSL Certificates

Vercel automatically provisions SSL certificates for all subdomains:
- Free Let's Encrypt certificates
- Auto-renewal
- HTTPS redirect enabled by default

Check certificate status in dashboard:
https://vercel.com/roshandewminas-projects/pulse-guard/settings/domains

### 5. Test All Subdomains

Once DNS propagates, test each subdomain:

```bash
# Test main domain
curl -sI https://saturnmonitor.com | grep -E "(HTTP|location)"

# Test app subdomain
curl -sI https://app.saturnmonitor.com | grep -E "(HTTP|location)"

# Test API subdomain
curl -sI https://api.saturnmonitor.com | grep -E "(HTTP|location)"

# Test status subdomain
curl -sI https://status.saturnmonitor.com | grep -E "(HTTP|location)"

# Test docs subdomain
curl -sI https://docs.saturnmonitor.com | grep -E "(HTTP|location)"
```

## 📊 Current Domain Configuration

| Domain/Subdomain | Points To | SSL | Status |
|------------------|-----------|-----|--------|
| saturnmonitor.com | Vercel | ✅ | Live |
| www.saturnmonitor.com | Vercel | ✅ | Live |
| app.saturnmonitor.com | Vercel | 🔄 | Pending DNS |
| api.saturnmonitor.com | Vercel | 🔄 | Pending DNS |
| status.saturnmonitor.com | Vercel | 🔄 | Pending DNS |
| docs.saturnmonitor.com | Vercel | 🔄 | Pending DNS |
| worker.saturnmonitor.com | Fly.io | ⏳ | Not configured |

## 🔧 Troubleshooting

### If subdomains don't work after 30 minutes:

1. **Check Vercel Dashboard:**
   - Ensure domains show as "Valid"
   - Check for any error messages
   - Verify SSL certificate provisioned

2. **Check DNS:**
   ```bash
   # Should show Vercel's CNAME
   dig app.saturnmonitor.com CNAME +short
   ```

3. **Clear DNS Cache:**
   ```bash
   # Linux
   sudo systemctl restart systemd-resolved
   
   # macOS
   sudo dscacheutil -flushcache
   
   # Windows
   ipconfig /flushdns
   ```

4. **Check Nameservers:**
   ```bash
   dig saturnmonitor.com NS +short
   ```
   Should show Vercel nameservers (ns1.vercel-dns.com, etc.)

## ✅ Summary

- ✅ 4 subdomains added via CLI
- ⏳ DNS propagation in progress (5-30 minutes)
- ⏳ SSL certificates will be auto-provisioned
- 📝 Worker subdomain needs manual DNS configuration
- 📝 Consider updating environment variables if using app subdomain

Check back in 10-15 minutes and verify all subdomains are accessible!





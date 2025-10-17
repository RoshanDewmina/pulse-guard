# Add Worker Subdomain DNS Record

## Quick Guide (2 minutes)

### Step 1: Go to Vercel DNS Dashboard
🔗 **Click here:** https://vercel.com/roshandewminas-projects/domains/saturnmonitor.com/dns

### Step 2: Add the DNS Record

1. Click the **"Add Record"** button (top right)

2. Fill in the form:
   ```
   Type:  CNAME
   Name:  worker
   Value: saturn-worker.fly.dev
   TTL:   Auto (or 3600)
   ```

3. Click **"Save"**

### Step 3: Verify (after 5-10 minutes)

Once DNS propagates, verify with:
```bash
curl -I https://worker.saturnmonitor.com/health
```

Expected: HTTP 200 response

---

## Screenshot Guide

### What You'll See:

**Add Record Form:**
```
┌─────────────────────────────────────┐
│ Add DNS Record                      │
├─────────────────────────────────────┤
│ Type: [CNAME ▼]                     │
│ Name: worker                        │
│ Value: saturn-worker.fly.dev        │
│ TTL: [Auto ▼]                       │
│                                     │
│         [Cancel]  [Save]            │
└─────────────────────────────────────┘
```

---

## Why This Works

- **CNAME** record creates an alias
- `worker.saturnmonitor.com` → `saturn-worker.fly.dev`
- SSL is automatically handled by Fly.io
- Health check will be accessible at both URLs

---

## Alternative URLs

Even without the CNAME, your worker is fully functional at:
- ✅ https://saturn-worker.fly.dev
- ✅ https://saturn-worker.fly.dev/health

The CNAME just makes it prettier! 😊






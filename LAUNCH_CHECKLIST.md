# 🚀 Tokiflow - Launch Checklist (Quick Reference)

Print this out and check off each item as you go!

---

## Pre-Launch (1-2 hours setup)

### Services to Sign Up For
- [ ] **Supabase** (https://supabase.com) - Database (FREE)
- [ ] **Resend** (https://resend.com) - Email (FREE: 100/day)
- [ ] **Google Cloud** (console.cloud.google.com) - OAuth (FREE)
- [ ] **Vercel** (https://vercel.com) - Hosting (FREE)
- [ ] **Stripe** (https://stripe.com) - Payments (optional for launch)

### Configuration (30 mins)
- [ ] Create Supabase project → Get DATABASE_URL
- [ ] Run migrations: `DATABASE_URL=... npx prisma migrate deploy`
- [ ] Seed database: `DATABASE_URL=... bun run seed`
- [ ] Create Supabase Storage bucket: `pulseguard-outputs`
- [ ] Get Resend API key
- [ ] Create Google OAuth credentials
- [ ] Generate NEXTAUTH_SECRET: `openssl rand -base64 32`

### Deployment (15 mins)
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Deploy: `cd apps/web && vercel --prod`
- [ ] Configure env vars in Vercel dashboard
- [ ] Deploy worker to Railway/Render
- [ ] Test: Visit your-app.vercel.app

### Verification (10 mins)
- [ ] Sign up for account
- [ ] Create first monitor
- [ ] Send test ping: `curl https://your-app.vercel.app/api/ping/TOKEN`
- [ ] Verify alert received (check email)

---

## Launch Day

### Morning (Prepare)
- [ ] Final smoke test on production
- [ ] Take 5-8 screenshots for Product Hunt
- [ ] Record 2-min demo video (Loom or QuickTime)
- [ ] Write launch tweet
- [ ] Prepare Show HN post

### Afternoon (Launch)
- [ ] **12pm PT**: Submit to Product Hunt
- [ ] Post on Hacker News (Show HN)
- [ ] Tweet announcement
- [ ] Post on Reddit (r/selfhosted, r/devops)
- [ ] Post on LinkedIn
- [ ] Email friends/beta list

### Evening (Monitor)
- [ ] Respond to all comments
- [ ] Fix any critical bugs immediately
- [ ] Monitor error rates (Sentry)
- [ ] Track signups
- [ ] Thank early users

---

## Post-Launch (Week 1)

- [ ] Collect user feedback
- [ ] Fix top 3 bugs
- [ ] Add most-requested feature
- [ ] Write "How I Built This" blog post
- [ ] Submit to more directories (AlternativeTo, Slant, etc)
- [ ] Reach out to tech bloggers

---

## Environment Variables (Copy-Paste Template)

```bash
# === REQUIRED ===
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<openssl rand -base64 32>

# === AUTH ===
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# === STORAGE ===
S3_REGION=us-east-1
S3_ENDPOINT=https://[project].supabase.co/storage/v1/s3
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=pulseguard-outputs

# === EMAIL ===
RESEND_API_KEY=
EMAIL_FROM=noreply@yourdomain.com

# === OPTIONAL ===
SITE_URL=https://your-app.vercel.app
REDIS_URL=redis://...
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PRO=
STRIPE_PRICE_ID_BUSINESS=
```

---

## Quick Commands

### Local Development
```bash
make setup          # Install deps, start Docker, migrate, seed
make dev            # Start dev servers
make docker-up      # Start Docker services only
make migrate        # Run database migrations
make seed           # Seed test data
```

### Testing
```bash
cd apps/web
npm run test:unit                    # Unit tests
npm run test:e2e                     # E2E tests (needs browser deps)
./scripts/run-all-tests.sh           # All tests
bun --bun run scripts/selenium-smoke.ts  # Selenium
```

### Deployment
```bash
cd apps/web
vercel --prod       # Deploy to Vercel
bun run build       # Test production build
```

---

## 📞 Emergency Contacts

- **Vercel Support**: vercel.com/support
- **Supabase Support**: supabase.com/support
- **Stripe Support**: support@stripe.com
- **Resend Support**: support@resend.com

---

## ✅ You're Ready When...

- [x] Next.js build succeeds ✅
- [x] Unit tests pass ✅
- [x] API tests pass ✅
- [x] Smoke test passes ✅
- [ ] All env vars configured
- [ ] Deployed to staging and tested
- [ ] Privacy policy published
- [ ] Support email set up

---

**Time to Production**: ~2 hours from now  
**First Customer**: Could be tomorrow!

**LET'S GO!** 🚀



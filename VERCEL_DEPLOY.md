# 🚀 Deploy Saturn to Vercel (Web Dashboard)

Since the Vercel CLI is having installation issues, let's deploy using the **Vercel Web Dashboard** instead. This is actually easier!

---

## 📋 Pre-Deployment Checklist

✅ Neon PostgreSQL database (you have this!)  
✅ Upstash Redis (you have this!)  
✅ Resend API key (you have this!)  
✅ Code is ready to deploy  

---

## 🎯 Step-by-Step Deployment

### Step 1: Push to GitHub (if not already)

```bash
cd /home/roshan/development/personal/pulse-guard

# Initialize git if not already
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Vercel deployment"

# Create GitHub repo and push
# Go to github.com and create a new repository called "saturn"
# Then:
git remote add origin https://github.com/YOUR_USERNAME/saturn.git
git branch -M main
git push -u origin main
```

**OR** if you prefer to deploy without GitHub, skip to "Alternative: Deploy without GitHub" below.

---

### Step 2: Go to Vercel Dashboard

1. Visit: **https://vercel.com/**
2. Click **"Sign Up"** or **"Login"**
3. Sign in with GitHub (recommended) or email

---

### Step 3: Import Project

1. Click **"Add New..."** → **"Project"**
2. Select **"Import Git Repository"**
3. Find your **saturn** repository
4. Click **"Import"**

---

### Step 4: Configure Build Settings

Vercel should auto-detect Next.js, but verify:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/web` |
| **Build Command** | `bun run build` (or leave default) |
| **Output Directory** | `.next` (default) |
| **Install Command** | `bun install` |

Click **"Advanced Options"** if you need to customize.

---

### Step 5: Add Environment Variables

Click **"Environment Variables"** and add these:

#### Required (Add these now):

```bash
# Database
DATABASE_URL
postgresql://neondb_owner:npg_RBVXn3ewop9c@ep-silent-sun-admrfa2d-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

DATABASE_URL_UNPOOLED
postgresql://neondb_owner:npg_RBVXn3ewop9c@ep-silent-sun-admrfa2d.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Redis
REDIS_URL
rediss://default:AWRQAAIncDI1YmIxN2UxMjk3OGU0YjYzYmVlYjRhMzk1NGMwZDlmMXAyMjU2ODA@mint-giraffe-25680.upstash.io:6379

# Auth (generate new secret!)
NEXTAUTH_SECRET
[Generate with: openssl rand -base64 32]

# Email
RESEND_API_KEY
re_PZYyMBji_LcvWNfV3fWhqwa6Eu8pM3aDG

FROM_EMAIL
noreply@yourdomain.com

# Node
NODE_ENV
production
```

**For each variable:**
- Click **"Add"**
- Enter **Name** (e.g., `DATABASE_URL`)
- Enter **Value**
- Select environments: ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

#### Generate NEXTAUTH_SECRET:

Run this locally:
```bash
openssl rand -base64 32
```

Copy the output and use it as the value for `NEXTAUTH_SECRET`.

---

### Step 6: Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. 🎉 Your app is live!

You'll get a URL like: **https://saturn-abc123.vercel.app**

---

### Step 7: Update NEXTAUTH_URL

After first deployment:

1. Copy your deployment URL (e.g., `https://saturn-abc123.vercel.app`)
2. Go to **Settings** → **Environment Variables**
3. Add a new variable:
   - Name: `NEXTAUTH_URL`
   - Value: `https://saturn-abc123.vercel.app`
   - Environments: Production, Preview, Development
4. Click **"Redeploy"** in the **Deployments** tab

---

### Step 8: Run Database Migrations

Your database needs the schema. Run migrations:

```bash
cd /home/roshan/development/personal/pulse-guard/packages/db

# Set your Neon database URL
export DATABASE_URL="postgresql://neondb_owner:npg_RBVXn3ewop9c@ep-silent-sun-admrfa2d-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_RBVXn3ewop9c@ep-silent-sun-admrfa2d.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Run migrations
npx prisma migrate deploy

# Done! ✅
```

---

### Step 9: Test Your Deployment

```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Should return something like:
# {
#   "status": "healthy",
#   "checks": {
#     "database": {"status": "healthy"},
#     "redis": {"status": "healthy"}
#   }
# }
```

Visit your app: **https://your-app.vercel.app**

---

## ✅ Post-Deployment

### Create Your First Monitor

1. Go to your deployed app
2. Click **"Sign Up"**
3. Create account
4. Create organization
5. Create a monitor
6. Test the ping URL!

### Deploy the Worker (Background Jobs)

The worker handles:
- Missed detection
- Sending alerts
- Processing async tasks

**Option A: Railway (Recommended)**

See `DEPLOYMENT_GUIDE.md` Section "Deploy the BullMQ Worker"

**Option B: Run Locally (Development)**

```bash
cd /home/roshan/development/personal/pulse-guard/apps/worker
bun run dev
```

---

## 🔧 Troubleshooting

### Build Failed: "Module not found"

- Check that `apps/web` is set as the root directory
- Verify all dependencies are in `package.json`

### Database Connection Failed

- Verify `DATABASE_URL` is set correctly
- Check if connection string includes `?sslmode=require`
- Make sure Neon database is not paused

### Redis Connection Failed

- Verify `REDIS_URL` starts with `rediss://` (double 's')
- Check Upstash dashboard for connection issues

### "NEXTAUTH_SECRET is not set"

- Make sure you added `NEXTAUTH_SECRET` in environment variables
- Redeploy after adding it

---

## 🎉 You're Live!

Your Saturn instance is now running in production on Vercel!

**Your Stack:**
- ✅ Vercel (serverless, global CDN)
- ✅ Neon PostgreSQL (serverless database)
- ✅ Upstash Redis (serverless cache)
- ✅ Resend (email delivery)

**Monthly Cost:** $0 - $20 (depending on usage)

---

## 📦 Alternative: Deploy without GitHub

If you don't want to use GitHub, you can deploy directly:

```bash
# Install Vercel CLI manually
curl -fsSL https://vercel.com/install | sh

# Then deploy
cd /home/roshan/development/personal/pulse-guard/apps/web
vercel --prod
```

Or use the **"Deploy from Tarball"** option in Vercel dashboard.

---

## 🚀 Next Steps

1. ✅ Deploy worker to Railway/Render
2. ✅ Set up custom domain
3. ✅ Configure Slack/Discord integrations
4. ✅ Set up monitoring for Saturn itself!
5. ✅ Invite team members

---

**Congratulations! Saturn is now live in production!** 🎊


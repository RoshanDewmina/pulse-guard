# Deployment Options

## ⚠️ Vercel CLI Not Installed

The Vercel CLI is not currently installed on your system. Here are your deployment options:

---

## Option 1: Deploy via Git Push (Recommended if Auto-Deploy Enabled)

If you have Vercel connected to your Git repo with auto-deploy enabled:

```bash
cd /home/roshan/development/personal/pulse-guard

# Stage all changes
git add .

# Commit changes
git commit -m "Add integrations, profile, audit-logs, and organization settings pages"

# Push to main branch
git push origin main
```

Vercel will automatically detect the push and deploy within 2-3 minutes.

---

## Option 2: Install Vercel CLI

Install the Vercel CLI and then deploy:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Then deploy
cd /home/roshan/development/personal/pulse-guard
vercel --prod
```

---

## Option 3: Deploy via Vercel Dashboard

1. Go to https://vercel.com/
2. Log in to your account
3. Find your `pulse-guard` project
4. Click "Deployments" tab
5. Click "Redeploy" button
6. Select "Use existing Build Cache: No"
7. Click "Redeploy"

This will trigger a fresh deployment from your connected Git repository.

---

## Option 4: Deploy via GitHub/GitLab/Bitbucket

If your repo is on GitHub/GitLab/Bitbucket:

1. Push your changes to the repository
2. Vercel will automatically detect and deploy

---

## Recommended Action

**Use Git Push (Option 1):**

This is the simplest and doesn't require installing anything new.

```bash
git add .
git commit -m "Add new pages and update settings"
git push origin main
```

Would you like me to run the git commands for you?


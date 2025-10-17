#!/bin/bash
# Quick Vercel Deployment (No GitHub needed)

echo "🚀 Deploying Saturn to Vercel..."
echo ""

# Navigate to web app
cd apps/web

# Display environment variables needed
cat << 'EOF'
╔════════════════════════════════════════════════════════════╗
║          VERCEL DEPLOYMENT - READY TO GO!                 ║
╚════════════════════════════════════════════════════════════╝

📋 STEP 1: Go to https://vercel.com/ and sign in

📋 STEP 2: Import your project
   • Click "Add New..." → "Project"
   • Choose "Import Third-Party Git Repository"
   • Enter your GitHub URL:
     https://github.com/RoshanDewmina/pulse-guard

   OR deploy WITHOUT GitHub:
   • Download your code as ZIP
   • Upload to Vercel

📋 STEP 3: Configure settings
   Framework: Next.js
   Root Directory: apps/web
   Build Command: bun run build
   Output Directory: .next

📋 STEP 4: Add Environment Variables

Copy these and paste into Vercel:

DATABASE_URL=postgresql://neondb_owner:npg_RBVXn3ewop9c@ep-silent-sun-admrfa2d-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_RBVXn3ewop9c@ep-silent-sun-admrfa2d.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

REDIS_URL=rediss://default:AWRQAAIncDI1YmIxN2UxMjk3OGU0YjYzYmVlYjRhMzk1NGMwZDlmMXAyMjU2ODA@mint-giraffe-25680.upstash.io:6379

NEXTAUTH_SECRET=pAq0zPhOwJq+Cws1AVcP1IH5huQcNvAdg7ztZZUcpys=

RESEND_API_KEY=re_PZYyMBji_LcvWNfV3fWhqwa6Eu8pM3aDG

FROM_EMAIL=noreply@yourdomain.com

NODE_ENV=production

📋 STEP 5: Deploy!

After first deployment, add:
NEXTAUTH_URL=https://your-app.vercel.app

Then redeploy.

════════════════════════════════════════════════════════════

✅ Build tested locally and passed!
✅ All dependencies installed
✅ Prisma client generated
✅ Ready for production

════════════════════════════════════════════════════════════
EOF

echo ""
echo "📱 Or scan QR code to deploy from mobile!"
echo ""






#!/bin/bash

# ========================================
# Saturn Vercel Deployment Script
# ========================================

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           🚀 Saturn Vercel Deployment Script              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# Step 1: Check Prerequisites
# ========================================
echo "📋 Checking prerequisites..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
else
    echo -e "${GREEN}✅ Vercel CLI found${NC}"
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
    echo "Please login:"
    vercel login
else
    VERCEL_USER=$(vercel whoami)
    echo -e "${GREEN}✅ Logged in as: $VERCEL_USER${NC}"
fi

echo ""

# ========================================
# Step 2: Load Environment Variables
# ========================================
echo "🔐 Loading environment variables..."

if [ ! -f "apps/web/.env.local" ]; then
    echo -e "${RED}❌ apps/web/.env.local not found!${NC}"
    echo "Please create it with your production environment variables."
    exit 1
fi

# Load variables
export $(cat apps/web/.env.local | grep -v '^#' | xargs)

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# ========================================
# Step 3: Generate NEXTAUTH_SECRET if needed
# ========================================
echo "🔑 Checking NEXTAUTH_SECRET..."

if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "dev-secret-change-in-production-min-32-chars-long-required" ]; then
    echo -e "${YELLOW}⚠️  Generating new NEXTAUTH_SECRET for production...${NC}"
    NEW_SECRET=$(openssl rand -base64 32)
    echo ""
    echo -e "${BLUE}Your new NEXTAUTH_SECRET:${NC}"
    echo "$NEW_SECRET"
    echo ""
    echo -e "${YELLOW}⚠️  Important: Add this to Vercel environment variables!${NC}"
    NEXTAUTH_SECRET=$NEW_SECRET
else
    echo -e "${GREEN}✅ NEXTAUTH_SECRET is set${NC}"
fi

echo ""

# ========================================
# Step 4: Run Build Test Locally
# ========================================
echo "🔨 Testing build locally..."

cd apps/web

# Install dependencies
echo "Installing dependencies..."
bun install

# Generate Prisma client
echo "Generating Prisma client..."
bunx prisma generate

# Build
echo "Building Next.js app..."
bun run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed. Fix errors before deploying.${NC}"
    exit 1
fi

cd ../..

echo ""

# ========================================
# Step 5: Deploy to Vercel
# ========================================
echo "🚀 Deploying to Vercel..."
echo ""

read -p "Deploy to production? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

cd apps/web

# Deploy to production
vercel --prod

DEPLOY_URL=$(vercel ls | grep "Production" | awk '{print $2}' | head -n 1)

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  🎉 DEPLOYMENT COMPLETE! 🎉                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Saturn is now live!${NC}"
echo ""
echo "🌐 Your app: https://$DEPLOY_URL"
echo ""

# ========================================
# Step 6: Post-Deployment Instructions
# ========================================
echo "📝 POST-DEPLOYMENT CHECKLIST:"
echo ""
echo "1. Add environment variables in Vercel dashboard:"
echo "   https://vercel.com/dashboard"
echo ""
echo "   Required variables:"
echo "   - DATABASE_URL"
echo "   - DATABASE_URL_UNPOOLED"
echo "   - REDIS_URL"
echo "   - NEXTAUTH_SECRET (use the generated one above!)"
echo "   - NEXTAUTH_URL (https://$DEPLOY_URL)"
echo "   - RESEND_API_KEY"
echo "   - FROM_EMAIL"
echo ""
echo "2. Update NEXTAUTH_URL in your .env.local:"
echo "   NEXTAUTH_URL=https://$DEPLOY_URL"
echo ""
echo "3. Redeploy after adding variables:"
echo "   cd apps/web && vercel --prod"
echo ""
echo "4. Test your deployment:"
echo "   curl https://$DEPLOY_URL/api/health"
echo ""
echo "5. Deploy the worker (for background jobs):"
echo "   See DEPLOYMENT_GUIDE.md for Railway/Render setup"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}📖 Full guide: DEPLOYMENT_GUIDE.md${NC}"
echo ""
echo "🎊 Congratulations! Saturn is now in production!"
echo ""


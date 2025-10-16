#!/bin/bash

# Saturn - Vercel Deployment Script
# This script helps you deploy Saturn to Vercel with all required setup

set -e

echo "🚀 Saturn - Vercel Deployment Helper"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo ""
    echo "Installing Vercel CLI..."
    npm install -g vercel
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
fi

echo -e "${GREEN}✅ Vercel CLI found${NC}"
echo ""

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
    echo "Please log in..."
    vercel login
    echo -e "${GREEN}✅ Logged in to Vercel${NC}"
else
    echo -e "${GREEN}✅ Logged in to Vercel as $(vercel whoami)${NC}"
fi
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "next.config.ts" ]; then
    echo -e "${RED}❌ Error: Please run this script from apps/web directory${NC}"
    echo "Current directory: $(pwd)"
    echo ""
    echo "Run: cd apps/web && ../../deploy-to-vercel.sh"
    exit 1
fi

echo -e "${GREEN}✅ In correct directory (apps/web)${NC}"
echo ""

# Prompt for deployment type
echo "Select deployment type:"
echo "  1) Deploy to production"
echo "  2) Deploy to preview"
echo "  3) Setup environment variables only"
echo ""
read -p "Enter choice (1-3): " deployment_type

case $deployment_type in
    1)
        DEPLOY_ENV="production"
        ;;
    2)
        DEPLOY_ENV="preview"
        ;;
    3)
        echo ""
        echo "Environment variable setup:"
        echo ""
        echo "Go to: https://vercel.com/dashboard"
        echo "1. Select your project"
        echo "2. Go to Settings → Environment Variables"
        echo "3. Add the following variables:"
        echo ""
        echo "Required variables:"
        echo "  - DATABASE_URL"
        echo "  - DIRECT_URL"
        echo "  - NEXTAUTH_URL"
        echo "  - NEXTAUTH_SECRET"
        echo "  - GOOGLE_CLIENT_ID"
        echo "  - GOOGLE_CLIENT_SECRET"
        echo "  - RESEND_API_KEY"
        echo "  - S3_* (storage variables)"
        echo "  - REDIS_URL"
        echo "  - SENTRY_DSN"
        echo "  - STRIPE_* (if using billing)"
        echo ""
        echo "See .env.example for all variables"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Check for required environment variables
echo ""
echo "Checking environment variables..."
echo ""

MISSING_VARS=()

# Check for critical variables
if [ -z "$DATABASE_URL" ] && [ -z "$VERCEL" ]; then
    MISSING_VARS+=("DATABASE_URL")
fi

if [ -z "$NEXTAUTH_SECRET" ] && [ -z "$VERCEL" ]; then
    MISSING_VARS+=("NEXTAUTH_SECRET")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo -e "${YELLOW}These should be configured in Vercel dashboard.${NC}"
    echo "The deployment will continue, but may fail without these."
    echo ""
    read -p "Continue anyway? (y/N): " continue_deploy
    if [ "$continue_deploy" != "y" ]; then
        exit 1
    fi
fi

# Run build locally first to catch errors
echo ""
echo -e "${BLUE}Running local build check...${NC}"
echo ""

if npm run build; then
    echo ""
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo ""
    echo -e "${RED}❌ Build failed${NC}"
    echo "Please fix build errors before deploying"
    exit 1
fi

# Deploy
echo ""
echo -e "${BLUE}Deploying to Vercel...${NC}"
echo ""

if [ "$DEPLOY_ENV" = "production" ]; then
    vercel --prod
else
    vercel
fi

DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel inspect --wait | grep -o 'https://[^"]*' | head -1)
    
    echo "📋 Post-deployment checklist:"
    echo ""
    echo "1. ✅ Visit your deployment and test"
    echo "2. ✅ Run database migrations:"
    echo "   cd ../../packages/db"
    echo "   DATABASE_URL='your-production-url' npx prisma migrate deploy"
    echo ""
    echo "3. ✅ Deploy worker service (Railway/Render/Fly.io)"
    echo "   See: ../../docs/VERCEL_DEPLOYMENT.md#step-7-deploy-worker"
    echo ""
    echo "4. ✅ Update OAuth redirect URIs:"
    echo "   - Google: Add ${DEPLOYMENT_URL}/api/auth/callback/google"
    echo "   - Slack: Add ${DEPLOYMENT_URL}/api/slack/callback"
    echo ""
    echo "5. ✅ Configure Stripe webhook:"
    echo "   - Endpoint: ${DEPLOYMENT_URL}/api/stripe/webhook"
    echo ""
    echo "6. ✅ Test end-to-end:"
    echo "   - Sign up for account"
    echo "   - Create a monitor"
    echo "   - Send test ping"
    echo "   - Verify alerts work"
    echo ""
    echo "🎉 Happy monitoring!"
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo ""
    echo "Common issues:"
    echo "  1. Missing environment variables"
    echo "  2. Build errors"
    echo "  3. Database connection issues"
    echo ""
    echo "Check Vercel logs for details:"
    echo "  vercel logs"
    exit 1
fi



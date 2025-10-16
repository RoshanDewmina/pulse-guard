#!/bin/bash

# ============================================
# Saturn Deployment Script
# ============================================

set -e  # Exit on error

echo "🚀 Saturn Deployment Script"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f "apps/web/.env.production" ] && [ ! -f "apps/web/.env.local" ]; then
    echo -e "${RED}❌ Error: No .env file found${NC}"
    echo "Please create apps/web/.env.production or apps/web/.env.local"
    echo "See ENV_SETUP.md for details"
    exit 1
fi

echo -e "${GREEN}✅ Environment file found${NC}"
echo ""

# Step 1: Check Node/Bun version
echo "📦 Checking runtime..."
if command -v bun &> /dev/null; then
    echo -e "${GREEN}✅ Bun installed:$(bun --version)${NC}"
else
    echo -e "${RED}❌ Bun not found. Please install: curl -fsSL https://bun.sh/install | bash${NC}"
    exit 1
fi

# Step 2: Install dependencies
echo ""
echo "📦 Installing dependencies..."
bun install
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 3: Generate Prisma client
echo ""
echo "🗄️  Generating Prisma client..."
cd packages/db
bun run generate
echo -e "${GREEN}✅ Prisma client generated${NC}"
cd ../..

# Step 4: Run database migrations
echo ""
echo "🗄️  Running database migrations..."
read -p "Run database migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd packages/db
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${YELLOW}⚠️  DATABASE_URL not set. Please set it:${NC}"
        echo "export DATABASE_URL='your-database-url'"
        exit 1
    fi
    
    echo "Running migrations on: $DATABASE_URL"
    npx prisma migrate deploy
    echo -e "${GREEN}✅ Migrations complete${NC}"
    cd ../..
else
    echo "⏭️  Skipping migrations"
fi

# Step 5: Build application
echo ""
echo "🏗️  Building application..."
cd apps/web
bun run build
echo -e "${GREEN}✅ Build complete${NC}"

# Step 6: Check if all required services are configured
echo ""
echo "🔍 Checking configuration..."

# Check for required env vars
if [ -f ".env.production" ]; then
    source .env.production
elif [ -f ".env.local" ]; then
    source .env.local
fi

MISSING_VARS=()

if [ -z "$DATABASE_URL" ]; then
    MISSING_VARS+=("DATABASE_URL")
fi

if [ -z "$REDIS_URL" ] && [ -z "$REDIS_HOST" ]; then
    MISSING_VARS+=("REDIS_URL or REDIS_HOST")
fi

if [ -z "$NEXTAUTH_URL" ]; then
    MISSING_VARS+=("NEXTAUTH_URL")
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    MISSING_VARS+=("NEXTAUTH_SECRET")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please set these in your .env file"
    echo "See ENV_SETUP.md for details"
else
    echo -e "${GREEN}✅ All required environment variables set${NC}"
fi

# Optional services check
echo ""
echo "📊 Optional services:"

if [ -n "$RESEND_API_KEY" ]; then
    echo -e "${GREEN}✅ Email (Resend) configured${NC}"
else
    echo -e "${YELLOW}⚠️  Email not configured (alerts will not be sent)${NC}"
fi

if [ -n "$S3_ACCESS_KEY_ID" ]; then
    echo -e "${GREEN}✅ S3 storage configured${NC}"
else
    echo -e "${YELLOW}⚠️  S3 storage not configured (output capture disabled)${NC}"
fi

if [ -n "$SLACK_CLIENT_ID" ]; then
    echo -e "${GREEN}✅ Slack integration configured${NC}"
else
    echo -e "${YELLOW}⚠️  Slack not configured${NC}"
fi

if [ -n "$SENTRY_DSN" ]; then
    echo -e "${GREEN}✅ Sentry error tracking configured${NC}"
else
    echo -e "${YELLOW}⚠️  Sentry not configured${NC}"
fi

# Step 7: Final summary
echo ""
echo "================================"
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review your environment variables"
echo "2. Test locally: bun run start"
echo "3. Deploy to your platform (Vercel, AWS, etc.)"
echo ""
echo "📖 See USER_GUIDE.md for usage instructions"
echo "🧪 See TEST_REPORT.md for testing checklist"
echo ""
echo "🚀 Ready to launch Saturn!"


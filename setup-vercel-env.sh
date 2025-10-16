#!/bin/bash

# ========================================
# Setup Vercel Environment Variables
# ========================================

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        🔐 Vercel Environment Variables Setup              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel:"
    vercel login
fi

echo "This script will add environment variables from your .env.local to Vercel."
echo ""
echo -e "${YELLOW}⚠️  Make sure you're in the correct Vercel project!${NC}"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Load environment variables
if [ ! -f "apps/web/.env.local" ]; then
    echo "❌ apps/web/.env.local not found!"
    exit 1
fi

echo ""
echo "🔐 Setting environment variables..."
echo ""

# Navigate to web app directory
cd apps/web

# Function to add environment variable
add_env_var() {
    local key=$1
    local value=$2
    local envs=$3  # production, preview, development
    
    echo -e "${BLUE}Setting $key...${NC}"
    
    # Use vercel env add
    echo "$value" | vercel env add "$key" "$envs" --force
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $key set${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to set $key (may already exist)${NC}"
    fi
}

# Extract and set critical variables
echo "📦 Setting DATABASE_URL..."
DATABASE_URL=$(grep "^DATABASE_URL=" ../.env.local | cut -d '=' -f2- | tr -d '"')
if [ ! -z "$DATABASE_URL" ]; then
    echo "$DATABASE_URL" | vercel env add DATABASE_URL production preview development --force
fi

echo "📦 Setting DATABASE_URL_UNPOOLED..."
DATABASE_URL_UNPOOLED=$(grep "^DATABASE_URL_UNPOOLED=" ../.env.local | cut -d '=' -f2- | tr -d '"')
if [ ! -z "$DATABASE_URL_UNPOOLED" ]; then
    echo "$DATABASE_URL_UNPOOLED" | vercel env add DATABASE_URL_UNPOOLED production preview development --force
fi

echo "📦 Setting REDIS_URL..."
REDIS_URL=$(grep "^REDIS_URL=" ../.env.local | cut -d '=' -f2- | tr -d '"')
if [ ! -z "$REDIS_URL" ]; then
    echo "$REDIS_URL" | vercel env add REDIS_URL production preview development --force
fi

echo "📦 Setting RESEND_API_KEY..."
RESEND_API_KEY=$(grep "^RESEND_API_KEY=" ../.env.local | cut -d '=' -f2- | tr -d '"')
if [ ! -z "$RESEND_API_KEY" ]; then
    echo "$RESEND_API_KEY" | vercel env add RESEND_API_KEY production preview development --force
fi

echo "📦 Generating NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET production preview development --force
echo ""
echo -e "${BLUE}Generated NEXTAUTH_SECRET: $NEXTAUTH_SECRET${NC}"
echo -e "${YELLOW}⚠️  Save this for your records!${NC}"
echo ""

echo "📦 Setting NODE_ENV..."
echo "production" | vercel env add NODE_ENV production --force

echo "📦 Setting FROM_EMAIL..."
FROM_EMAIL=$(grep "^FROM_EMAIL=" ../.env.local | cut -d '=' -f2- | tr -d '"')
if [ -z "$FROM_EMAIL" ]; then
    FROM_EMAIL="noreply@saturn.app"
fi
echo "$FROM_EMAIL" | vercel env add FROM_EMAIL production preview development --force

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ ENVIRONMENT VARIABLES SET! ✅              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 IMPORTANT: Set these manually in Vercel dashboard:"
echo ""
echo "1. NEXTAUTH_URL"
echo "   Value: https://your-app.vercel.app"
echo "   (Update after first deployment)"
echo ""
echo "2. Review all variables at:"
echo "   https://vercel.com/dashboard/[your-project]/settings/environment-variables"
echo ""
echo -e "${GREEN}✅ Ready to deploy!${NC}"
echo ""
echo "Run: ./deploy-vercel.sh"
echo ""


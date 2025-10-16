#!/bin/bash

# Deploy PulseGuard Web App to Vercel
# Usage: ./deploy-vercel-cli.sh [preview|production]

set -e

ENVIRONMENT=${1:-preview}
PROJECT_DIR="/home/roshan/development/personal/pulse-guard/apps/web"

echo "🚀 Deploying PulseGuard Web App to Vercel..."
echo "   Environment: $ENVIRONMENT"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Change to web app directory
cd "$PROJECT_DIR"

# Check if logged in
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel:"
    vercel login
fi

# Generate secrets if needed
if [ ! -f ".env.production" ]; then
    echo "⚠️  No .env.production found. Generating template..."
    cat > .env.production << 'EOF'
# REQUIRED: Update these values!
DATABASE_URL=your_database_url
DATABASE_URL_UNPOOLED=your_database_url_unpooled
REDIS_URL=your_redis_url
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://your-app.vercel.app
JWT_SECRET=$(openssl rand -base64 32)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
EOF
    echo "⚠️  Please edit .env.production with your actual values"
    exit 1
fi

# Deploy based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    echo "📦 Deploying to PRODUCTION..."
    vercel --prod
else
    echo "📦 Deploying to PREVIEW..."
    vercel
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 View your deployment:"
echo "   vercel inspect"
echo ""
echo "📊 View logs:"
echo "   vercel logs"
echo ""
echo "🌍 Open in browser:"
echo "   vercel open"


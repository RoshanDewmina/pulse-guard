#!/bin/bash

# Deploy PulseGuard Worker to Fly.io
# Usage: ./deploy-flyio.sh

set -e

WORKER_DIR="/home/roshan/development/personal/pulse-guard/apps/worker"
APP_NAME="pulseguard-worker"

echo "🚀 Deploying PulseGuard Worker to Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ Fly.io CLI not found."
    echo "   Install with: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Change to worker directory
cd "$WORKER_DIR"

# Check if logged in
echo "🔐 Checking Fly.io authentication..."
if ! flyctl auth whoami &> /dev/null; then
    echo "Please login to Fly.io:"
    flyctl auth login
fi

# Check if fly.toml exists
if [ ! -f "fly.toml" ]; then
    echo "❌ fly.toml not found in $WORKER_DIR"
    exit 1
fi

# Build the worker first
echo "🔨 Building worker..."
bun run build

if [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed. dist/index.js not found."
    exit 1
fi

# Check if app exists
echo "🔍 Checking if app exists..."
if ! flyctl apps list | grep -q "$APP_NAME"; then
    echo "📦 App doesn't exist. Creating..."
    flyctl launch --no-deploy
    
    echo ""
    echo "⚠️  Please set required secrets:"
    echo "   flyctl secrets set DATABASE_URL='your_database_url'"
    echo "   flyctl secrets set DATABASE_URL_UNPOOLED='your_database_url_unpooled'"
    echo "   flyctl secrets set REDIS_URL='your_redis_url'"
    echo "   flyctl secrets set RESEND_API_KEY='your_resend_key'"
    echo "   flyctl secrets set FROM_EMAIL='noreply@yourdomain.com'"
    echo ""
    read -p "Press enter when secrets are set to continue deployment..."
fi

# Deploy
echo "📦 Deploying to Fly.io..."
flyctl deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 View app status:"
echo "   flyctl status --app $APP_NAME"
echo ""
echo "📊 View logs:"
echo "   flyctl logs --app $APP_NAME"
echo ""
echo "🌍 Open dashboard:"
echo "   flyctl dashboard --app $APP_NAME"
echo ""
echo "🔍 Monitor worker:"
echo "   flyctl logs --app $APP_NAME -f"


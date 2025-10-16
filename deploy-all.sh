#!/bin/bash

# Deploy entire PulseGuard stack
# Usage: ./deploy-all.sh [preview|production]

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔════════════════════════════════════════╗"
echo "║  🚀 PulseGuard Full Stack Deployment  ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Environment: $ENVIRONMENT"
echo ""

# Step 1: Run Database Migrations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Step 1/4: Database Migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Skipping migrations."
    echo "   To run migrations later:"
    echo "   cd packages/db && npx prisma migrate deploy"
else
    cd "$SCRIPT_DIR/packages/db"
    echo "Running Prisma migrations..."
    npx prisma migrate deploy
    npx prisma generate
    echo "✅ Database migrations complete"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Step 2/4: Deploy Web App (Vercel)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

bash "$SCRIPT_DIR/deploy-vercel-cli.sh" "$ENVIRONMENT"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 Step 3/4: Deploy Worker (Fly.io)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

bash "$SCRIPT_DIR/deploy-flyio.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Step 4/4: Verify Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get Vercel URL
cd "$SCRIPT_DIR/apps/web"
VERCEL_URL=$(vercel inspect --wait 2>/dev/null | grep -oP 'https://[^\s]+' | head -1 || echo "")

if [ -n "$VERCEL_URL" ]; then
    echo "Testing web app health..."
    sleep 5
    if curl -sf "$VERCEL_URL/api/health" > /dev/null; then
        echo "✅ Web app is healthy: $VERCEL_URL"
    else
        echo "⚠️  Web app health check failed. Check logs:"
        echo "   vercel logs"
    fi
else
    echo "⚠️  Could not determine Vercel URL"
fi

echo ""
echo "Checking worker status..."
cd "$SCRIPT_DIR/apps/worker"
flyctl status --app pulseguard-worker 2>/dev/null || echo "⚠️  Could not check worker status"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║        🎉 Deployment Complete!         ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Your PulseGuard stack is now live!"
echo ""
echo "📱 Web App:"
echo "   URL: $VERCEL_URL"
echo "   Logs: vercel logs"
echo ""
echo "🔨 Worker:"
echo "   Status: flyctl status --app pulseguard-worker"
echo "   Logs: flyctl logs --app pulseguard-worker -f"
echo ""
echo "📊 Next Steps:"
echo "   1. Visit your web app and create an account"
echo "   2. Create your first monitor"
echo "   3. Test the ping endpoint"
echo "   4. Check worker logs to see job processing"
echo ""
echo "💡 Useful Commands:"
echo "   • Update web: ./deploy-vercel-cli.sh production"
echo "   • Update worker: ./deploy-flyio.sh"
echo "   • View all: ./deploy-all.sh"
echo ""


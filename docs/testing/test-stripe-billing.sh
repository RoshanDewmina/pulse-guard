#!/bin/bash

# Stripe Billing E2E Test Runner
# This script sets up the environment and runs billing tests

set -e

echo "🧪 Stripe Billing E2E Test Runner"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please run ./verify-stripe-setup.sh first"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check Stripe configuration
if [ -z "$STRIPE_SECRET_KEY" ] || [ -z "$STRIPE_PRICE_PRO" ] || [ -z "$STRIPE_PRICE_BUSINESS" ]; then
    echo -e "${RED}❌ Stripe environment variables not configured${NC}"
    echo "Please run ./verify-stripe-setup.sh"
    exit 1
fi

echo -e "${GREEN}✅ Stripe configuration validated${NC}"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${YELLOW}⚠️  Stripe CLI not found${NC}"
    echo "Webhook forwarding will not be available"
    echo "Install with: ./setup-stripe.sh"
    echo ""
    SKIP_WEBHOOK=true
else
    echo -e "${GREEN}✅ Stripe CLI found${NC}"
    SKIP_WEBHOOK=false
fi

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Dev server not running on http://localhost:3000${NC}"
    echo ""
    echo "Starting dev server..."
    cd apps/web
    npm run dev &
    DEV_SERVER_PID=$!
    cd ../..
    
    echo "Waiting for dev server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Dev server started${NC}"
            break
        fi
        sleep 2
        echo -n "."
    done
    echo ""
else
    echo -e "${GREEN}✅ Dev server already running${NC}"
    DEV_SERVER_PID=""
fi

# Start Stripe webhook listener
if [ "$SKIP_WEBHOOK" = false ]; then
    echo ""
    echo "Starting Stripe webhook listener..."
    stripe listen --forward-to localhost:3000/api/stripe/webhook > /tmp/stripe-webhook.log 2>&1 &
    STRIPE_PID=$!
    sleep 3
    
    if ps -p $STRIPE_PID > /dev/null; then
        echo -e "${GREEN}✅ Stripe webhook listener started (PID: $STRIPE_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to start Stripe webhook listener${NC}"
        STRIPE_PID=""
    fi
else
    STRIPE_PID=""
fi

echo ""
echo "=================================="
echo "🚀 Running Stripe billing tests..."
echo "=================================="
echo ""

# Run the tests
cd apps/web

# Choose which tests to run based on argument
if [ "$1" = "full" ]; then
    echo "Running FULL test suite (including actual checkout)..."
    npx playwright test billing-stripe.spec.ts --project=chromium
elif [ "$1" = "headed" ]; then
    echo "Running tests in HEADED mode (you can see the browser)..."
    npx playwright test billing-stripe.spec.ts --project=chromium --headed
elif [ "$1" = "ui" ]; then
    echo "Running tests in UI mode..."
    npx playwright test billing-stripe.spec.ts --ui
else
    echo "Running standard test suite (skipping actual checkout)..."
    npx playwright test billing-stripe.spec.ts --project=chromium --grep-invert "complete checkout flow"
fi

TEST_EXIT_CODE=$?
cd ../..

echo ""
echo "=================================="
echo "🧹 Cleaning up..."
echo "=================================="

# Cleanup
if [ ! -z "$STRIPE_PID" ] && ps -p $STRIPE_PID > /dev/null 2>/dev/null; then
    echo "Stopping Stripe webhook listener..."
    kill $STRIPE_PID
    echo -e "${GREEN}✅ Stripe listener stopped${NC}"
fi

if [ ! -z "$DEV_SERVER_PID" ] && ps -p $DEV_SERVER_PID > /dev/null 2>/dev/null; then
    echo "Stopping dev server..."
    kill $DEV_SERVER_PID
    echo -e "${GREEN}✅ Dev server stopped${NC}"
fi

echo ""
echo "=================================="

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "📊 View the HTML report:"
    echo "   cd apps/web && npx playwright show-report"
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "📊 View the HTML report for details:"
    echo "   cd apps/web && npx playwright show-report"
fi

echo "=================================="
echo ""

exit $TEST_EXIT_CODE




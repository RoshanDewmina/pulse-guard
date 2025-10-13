#!/bin/bash

# Simple API-level Stripe Integration Test
# Tests the billing endpoints without browser automation

set -e

echo "🧪 Stripe API Integration Test"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

export $(cat .env | grep -v '^#' | xargs)

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Dev server not running${NC}"
    echo "Please start it with: make dev"
    exit 1
fi

echo -e "${GREEN}✅ Dev server is running${NC}"
echo ""

# Test 1: Check billing page loads
echo "Test 1: Billing page loads..."
BILLING_PAGE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/app/settings/billing)
if [ "$BILLING_PAGE" = "200" ] || [ "$BILLING_PAGE" = "307" ] || [ "$BILLING_PAGE" = "302" ]; then
    echo -e "${GREEN}✅ Billing page accessible${NC}"
else
    echo -e "${RED}❌ Billing page returned: $BILLING_PAGE${NC}"
fi

# Test 2: Check Stripe webhook endpoint exists
echo "Test 2: Stripe webhook endpoint..."
WEBHOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/stripe/webhook)
if [ "$WEBHOOK_STATUS" = "405" ] || [ "$WEBHOOK_STATUS" = "400" ]; then
    echo -e "${GREEN}✅ Webhook endpoint exists (returns $WEBHOOK_STATUS for GET, expects POST)${NC}"
else
    echo -e "${YELLOW}⚠️  Webhook endpoint returned: $WEBHOOK_STATUS${NC}"
fi

# Test 3: Verify Stripe products via API
echo "Test 3: Verify Stripe products..."
PRO_PRICE=$(stripe prices retrieve $STRIPE_PRICE_PRO --api-key $STRIPE_SECRET_KEY 2>&1)
if echo "$PRO_PRICE" | grep -q "prod_"; then
    echo -e "${GREEN}✅ PRO price exists: $STRIPE_PRICE_PRO${NC}"
else
    echo -e "${RED}❌ PRO price not found${NC}"
fi

BUSINESS_PRICE=$(stripe prices retrieve $STRIPE_PRICE_BUSINESS --api-key $STRIPE_SECRET_KEY 2>&1)
if echo "$BUSINESS_PRICE" | grep -q "prod_"; then
    echo -e "${GREEN}✅ BUSINESS price exists: $STRIPE_PRICE_BUSINESS${NC}"
else
    echo -e "${RED}❌ BUSINESS price not found${NC}"
fi

# Test 4: Check Stripe checkout endpoint
echo "Test 4: Stripe checkout endpoint..."
CHECKOUT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/stripe/checkout)
if [ "$CHECKOUT_STATUS" = "405" ] || [ "$CHECKOUT_STATUS" = "401" ] || [ "$CHECKOUT_STATUS" = "400" ]; then
    echo -e "${GREEN}✅ Checkout endpoint exists (returns $CHECKOUT_STATUS for GET, expects POST)${NC}"
else
    echo -e "${YELLOW}⚠️  Checkout endpoint returned: $CHECKOUT_STATUS${NC}"
fi

# Test 5: Check Stripe portal endpoint
echo "Test 5: Stripe portal endpoint..."
PORTAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/stripe/portal)
if [ "$PORTAL_STATUS" = "405" ] || [ "$PORTAL_STATUS" = "401" ] || [ "$PORTAL_STATUS" = "400" ]; then
    echo -e "${GREEN}✅ Portal endpoint exists (returns $PORTAL_STATUS for GET, expects POST)${NC}"
else
    echo -e "${YELLOW}⚠️  Portal endpoint returned: $PORTAL_STATUS${NC}"
fi

# Test 6: Verify Stripe library configuration
echo "Test 6: Stripe configuration..."
if [ ! -z "$STRIPE_SECRET_KEY" ] && [[ "$STRIPE_SECRET_KEY" =~ ^sk_test_ ]]; then
    echo -e "${GREEN}✅ Stripe API key configured (test mode)${NC}"
elif [ ! -z "$STRIPE_SECRET_KEY" ] && [[ "$STRIPE_SECRET_KEY" =~ ^sk_live_ ]]; then
    echo -e "${GREEN}✅ Stripe API key configured (LIVE mode)${NC}"
    echo -e "${YELLOW}⚠️  You're using LIVE keys!${NC}"
else
    echo -e "${RED}❌ Stripe API key missing or invalid${NC}"
fi

# Test 7: Check if webhook listener is running
echo "Test 7: Webhook listener status..."
if pgrep -f "stripe listen" > /dev/null; then
    echo -e "${GREEN}✅ Stripe webhook listener is running${NC}"
else
    echo -e "${YELLOW}⚠️  Stripe webhook listener not running${NC}"
    echo "   Start with: stripe listen --forward-to localhost:3000/api/stripe/webhook"
fi

echo ""
echo "==============================="
echo -e "${GREEN}🎉 API Integration Tests Complete!${NC}"
echo ""
echo "To test the full checkout flow:"
echo "1. Visit: http://localhost:3000/app/settings/billing"
echo "2. Click 'Upgrade to Pro'"
echo "3. Use test card: 4242 4242 4242 4242"
echo ""
echo "Or run E2E tests with:"
echo "  ./test-stripe-billing.sh"
echo "==============================="




#!/bin/bash

# Script to automatically create Stripe products and prices
# Requires Stripe CLI to be installed and authenticated

set -e

echo "🏗️  Creating Stripe Products for PulseGuard"
echo "==========================================="
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Error: Stripe CLI not installed"
    echo "Run ./setup-stripe.sh first"
    exit 1
fi

# Check if logged in
if ! stripe config --list &> /dev/null; then
    echo "❌ Error: Not logged into Stripe CLI"
    echo "Run: stripe login"
    exit 1
fi

echo "Creating PulseGuard Pro product..."
PRO_PRODUCT=$(stripe products create \
  --name="PulseGuard Pro" \
  --description="Professional plan with up to 100 monitors, 10 team members, and advanced features" \
  --format=json)

PRO_PRODUCT_ID=$(echo $PRO_PRODUCT | grep -o '"id": "[^"]*' | head -1 | grep -o '[^"]*$')
echo "✅ Created product: $PRO_PRODUCT_ID"

echo "Creating Pro price ($19/month)..."
PRO_PRICE=$(stripe prices create \
  --product=$PRO_PRODUCT_ID \
  --currency=usd \
  --unit-amount=1900 \
  --recurring="interval=month" \
  --format=json)

PRO_PRICE_ID=$(echo $PRO_PRICE | grep -o '"id": "[^"]*' | head -1 | grep -o '[^"]*$')
echo "✅ Created price: $PRO_PRICE_ID"

echo ""
echo "Creating PulseGuard Business product..."
BUSINESS_PRODUCT=$(stripe products create \
  --name="PulseGuard Business" \
  --description="Business plan with up to 500 monitors, unlimited team members, and priority support" \
  --format=json)

BUSINESS_PRODUCT_ID=$(echo $BUSINESS_PRODUCT | grep -o '"id": "[^"]*' | head -1 | grep -o '[^"]*$')
echo "✅ Created product: $BUSINESS_PRODUCT_ID"

echo "Creating Business price ($49/month)..."
BUSINESS_PRICE=$(stripe prices create \
  --product=$BUSINESS_PRODUCT_ID \
  --currency=usd \
  --unit-amount=4900 \
  --recurring="interval=month" \
  --format=json)

BUSINESS_PRICE_ID=$(echo $BUSINESS_PRICE | grep -o '"id": "[^"]*' | head -1 | grep -o '[^"]*$')
echo "✅ Created price: $BUSINESS_PRICE_ID"

echo ""
echo "==========================================="
echo "✅ All products created successfully!"
echo "==========================================="
echo ""
echo "📝 Add these to your .env file:"
echo ""
echo "STRIPE_PRICE_PRO=$PRO_PRICE_ID"
echo "STRIPE_PRICE_BUSINESS=$BUSINESS_PRICE_ID"
echo ""
echo "You still need to add:"
echo "STRIPE_SECRET_KEY=sk_test_... (from https://dashboard.stripe.com/test/apikeys)"
echo "STRIPE_WEBHOOK_SECRET=whsec_... (from: stripe listen --forward-to localhost:3000/api/stripe/webhook)"
echo ""
echo "View your products at: https://dashboard.stripe.com/test/products"
echo ""




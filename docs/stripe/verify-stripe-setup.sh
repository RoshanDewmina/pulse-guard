#!/bin/bash

# Script to verify Stripe setup for PulseGuard

set -e

echo "🔍 Verifying Stripe Setup"
echo "=========================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Create a .env file first with your Stripe credentials"
    exit 1
fi

# Load .env file
export $(cat .env | grep -v '^#' | xargs)

# Check each required variable
MISSING=0

echo "Checking required environment variables..."
echo ""

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ STRIPE_SECRET_KEY is missing"
    MISSING=1
elif [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_test_ ]] && [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_live_ ]]; then
    echo "⚠️  STRIPE_SECRET_KEY doesn't look like a valid key (should start with sk_test_ or sk_live_)"
else
    echo "✅ STRIPE_SECRET_KEY is set (${STRIPE_SECRET_KEY:0:15}...)"
fi

if [ -z "$STRIPE_PRICE_PRO" ]; then
    echo "❌ STRIPE_PRICE_PRO is missing"
    MISSING=1
elif [[ ! "$STRIPE_PRICE_PRO" =~ ^price_ ]]; then
    echo "⚠️  STRIPE_PRICE_PRO doesn't look like a price ID (should start with price_)"
else
    echo "✅ STRIPE_PRICE_PRO is set ($STRIPE_PRICE_PRO)"
fi

if [ -z "$STRIPE_PRICE_BUSINESS" ]; then
    echo "❌ STRIPE_PRICE_BUSINESS is missing"
    MISSING=1
elif [[ ! "$STRIPE_PRICE_BUSINESS" =~ ^price_ ]]; then
    echo "⚠️  STRIPE_PRICE_BUSINESS doesn't look like a price ID (should start with price_)"
else
    echo "✅ STRIPE_PRICE_BUSINESS is set ($STRIPE_PRICE_BUSINESS)"
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "⚠️  STRIPE_WEBHOOK_SECRET is missing (needed for webhooks)"
    echo "   Run: stripe listen --forward-to localhost:3000/api/stripe/webhook"
elif [[ ! "$STRIPE_WEBHOOK_SECRET" =~ ^whsec_ ]]; then
    echo "⚠️  STRIPE_WEBHOOK_SECRET doesn't look valid (should start with whsec_)"
else
    echo "✅ STRIPE_WEBHOOK_SECRET is set (${STRIPE_WEBHOOK_SECRET:0:20}...)"
fi

echo ""
echo "=========================="

if [ $MISSING -eq 0 ]; then
    echo "✅ All required Stripe variables are set!"
    echo ""
    
    # Try to verify with Stripe CLI if available
    if command -v stripe &> /dev/null; then
        echo "Verifying with Stripe API..."
        echo ""
        
        if stripe prices retrieve $STRIPE_PRICE_PRO --api-key $STRIPE_SECRET_KEY &> /dev/null; then
            echo "✅ PRO price verified: $STRIPE_PRICE_PRO"
        else
            echo "❌ Could not verify PRO price - check if it exists in your Stripe account"
        fi
        
        if stripe prices retrieve $STRIPE_PRICE_BUSINESS --api-key $STRIPE_SECRET_KEY &> /dev/null; then
            echo "✅ BUSINESS price verified: $STRIPE_PRICE_BUSINESS"
        else
            echo "❌ Could not verify BUSINESS price - check if it exists in your Stripe account"
        fi
    else
        echo "💡 Install Stripe CLI to verify prices exist: ./setup-stripe.sh"
    fi
    
    echo ""
    echo "🎉 Setup looks good! You can now test billing features."
    echo ""
    echo "Next steps:"
    echo "1. Start your dev server: make dev"
    echo "2. In another terminal, forward webhooks: stripe listen --forward-to localhost:3000/api/stripe/webhook"
    echo "3. Visit: http://localhost:3000/app/settings/billing"
    echo "4. Test checkout with card: 4242 4242 4242 4242"
else
    echo "❌ Some variables are missing. Please check your .env file."
    echo ""
    echo "See STRIPE_SETUP.md for detailed instructions."
    exit 1
fi




#!/bin/bash

# Stripe Setup Helper Script
# This script helps you set up Stripe for PulseGuard

set -e

echo "🔧 PulseGuard Stripe Setup Helper"
echo "=================================="
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found!"
    echo ""
    echo "📥 To install Stripe CLI:"
    echo ""
    echo "For Linux (WSL2):"
    echo "  curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg"
    echo "  echo \"deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main\" | sudo tee -a /etc/apt/sources.list.d/stripe.list"
    echo "  sudo apt update"
    echo "  sudo apt install stripe"
    echo ""
    echo "For macOS:"
    echo "  brew install stripe/stripe-cli/stripe"
    echo ""
    echo "For other platforms, visit: https://stripe.com/docs/stripe-cli"
    echo ""
    exit 1
fi

echo "✅ Stripe CLI found!"
echo ""

# Check if already logged in
if ! stripe config --list &> /dev/null; then
    echo "🔐 Logging into Stripe..."
    echo ""
    echo "This will open your browser. Please log in and authorize the CLI."
    stripe login
else
    echo "✅ Already logged into Stripe"
fi

echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Get your API keys from: https://dashboard.stripe.com/test/apikeys"
echo "   Copy your Secret Key (sk_test_...)"
echo ""
echo "2. Create products at: https://dashboard.stripe.com/test/products"
echo ""
echo "   Product 1: PulseGuard Pro"
echo "   - Price: \$19/month recurring"
echo "   - Copy the Price ID (price_...)"
echo ""
echo "   Product 2: PulseGuard Business"
echo "   - Price: \$49/month recurring"
echo "   - Copy the Price ID (price_...)"
echo ""
echo "3. For local development webhooks, run:"
echo "   stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo ""
echo "   This will give you a webhook secret (whsec_...)"
echo ""
echo "4. Add these to your .env file:"
echo "   STRIPE_SECRET_KEY=sk_test_..."
echo "   STRIPE_PRICE_PRO=price_..."
echo "   STRIPE_PRICE_BUSINESS=price_..."
echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
echo "=================================="
echo ""
echo "🚀 Quick Commands:"
echo ""
echo "Test webhook forwarding:"
echo "  stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo ""
echo "Test a checkout:"
echo "  stripe trigger checkout.session.completed"
echo ""
echo "View logs:"
echo "  stripe logs tail"
echo ""
echo "List your products:"
echo "  stripe products list"
echo ""
echo "List your prices:"
echo "  stripe prices list"
echo ""




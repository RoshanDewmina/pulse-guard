#!/bin/bash

# Interactive script to set up environment variables for PulseGuard deployment

set -e

echo "╔════════════════════════════════════════╗"
echo "║   PulseGuard Environment Setup         ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "This script will help you set up environment variables"
echo "for deploying PulseGuard to Vercel and Fly.io."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to read input with default
read_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        value=${value:-$default}
    else
        read -p "$prompt: " value
    fi
    
    eval "$var_name='$value'"
}

# Function to read secret (hidden input)
read_secret() {
    local prompt="$1"
    local var_name="$2"
    
    read -sp "$prompt: " value
    echo ""
    eval "$var_name='$value'"
}

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Install with: npm install -g vercel${NC}"
fi

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${YELLOW}⚠️  Fly.io CLI not found. Install with: curl -L https://fly.io/install.sh | sh${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Database Configuration (PostgreSQL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Get this from your database provider (Neon, Supabase, etc.)"
read_secret "Database URL (pooled connection)" DATABASE_URL
read_secret "Database URL (direct/unpooled connection)" DATABASE_URL_UNPOOLED

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚡ Redis Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Get this from your Redis provider (Upstash, Redis Cloud, etc.)"
echo "Format: rediss://default:password@host:port"
read_secret "Redis URL" REDIS_URL

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Authentication & Security"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Generating secure secrets..."

# Generate secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

echo -e "${GREEN}✅ Generated NEXTAUTH_SECRET${NC}"
echo -e "${GREEN}✅ Generated JWT_SECRET${NC}"

read_with_default "NextAuth URL (your app URL)" "https://your-app.vercel.app" NEXTAUTH_URL

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📧 Email Configuration (Resend)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Get your API key from: https://resend.com/api-keys"
read_secret "Resend API Key" RESEND_API_KEY
read_with_default "From Email Address" "noreply@yourdomain.com" FROM_EMAIL

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💳 Stripe Configuration (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Do you want to configure Stripe billing? (y/N): " configure_stripe

if [[ "$configure_stripe" =~ ^[Yy]$ ]]; then
    echo "Get these from: https://dashboard.stripe.com/apikeys"
    read_secret "Stripe Secret Key" STRIPE_SECRET_KEY
    read_secret "Stripe Webhook Secret" STRIPE_WEBHOOK_SECRET
    read_with_default "Stripe Pro Plan Price ID" "price_xxx" STRIPE_PRICE_PRO
    read_with_default "Stripe Business Plan Price ID" "price_xxx" STRIPE_PRICE_BUSINESS
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Public URLs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read_with_default "Public App URL" "$NEXTAUTH_URL" NEXT_PUBLIC_APP_URL
read_with_default "Public API URL" "$NEXTAUTH_URL" NEXT_PUBLIC_API_URL

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 Saving Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create .env.production file
cat > .env.production << EOF
# Database
DATABASE_URL=$DATABASE_URL
DATABASE_URL_UNPOOLED=$DATABASE_URL_UNPOOLED

# Redis
REDIS_URL=$REDIS_URL

# Auth
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=$NEXTAUTH_URL
JWT_SECRET=$JWT_SECRET

# Email
RESEND_API_KEY=$RESEND_API_KEY
FROM_EMAIL=$FROM_EMAIL

# Stripe
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PRO=$STRIPE_PRICE_PRO
STRIPE_PRICE_BUSINESS=$STRIPE_PRICE_BUSINESS

# Public URLs
NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Environment
NODE_ENV=production
EOF

echo -e "${GREEN}✅ Saved to .env.production${NC}"

# Create Vercel env script
cat > set-vercel-env.sh << 'EOF'
#!/bin/bash
# Auto-generated script to set Vercel environment variables

source .env.production

echo "Setting Vercel environment variables..."

vercel env add DATABASE_URL production <<< "$DATABASE_URL"
vercel env add DATABASE_URL_UNPOOLED production <<< "$DATABASE_URL_UNPOOLED"
vercel env add REDIS_URL production <<< "$REDIS_URL"
vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET"
vercel env add NEXTAUTH_URL production <<< "$NEXTAUTH_URL"
vercel env add JWT_SECRET production <<< "$JWT_SECRET"
vercel env add RESEND_API_KEY production <<< "$RESEND_API_KEY"
vercel env add FROM_EMAIL production <<< "$FROM_EMAIL"
vercel env add NEXT_PUBLIC_APP_URL production <<< "$NEXT_PUBLIC_APP_URL"
vercel env add NEXT_PUBLIC_API_URL production <<< "$NEXT_PUBLIC_API_URL"
vercel env add NODE_ENV production <<< "production"

if [ -n "$STRIPE_SECRET_KEY" ]; then
    vercel env add STRIPE_SECRET_KEY production <<< "$STRIPE_SECRET_KEY"
    vercel env add STRIPE_WEBHOOK_SECRET production <<< "$STRIPE_WEBHOOK_SECRET"
    vercel env add STRIPE_PRICE_PRO production <<< "$STRIPE_PRICE_PRO"
    vercel env add STRIPE_PRICE_BUSINESS production <<< "$STRIPE_PRICE_BUSINESS"
fi

echo "✅ All environment variables set!"
EOF

chmod +x set-vercel-env.sh
echo -e "${GREEN}✅ Created set-vercel-env.sh${NC}"

# Create Fly.io secrets script
cat > set-flyio-secrets.sh << 'EOF'
#!/bin/bash
# Auto-generated script to set Fly.io secrets

source .env.production

echo "Setting Fly.io secrets..."

flyctl secrets set \
  DATABASE_URL="$DATABASE_URL" \
  DATABASE_URL_UNPOOLED="$DATABASE_URL_UNPOOLED" \
  REDIS_URL="$REDIS_URL" \
  RESEND_API_KEY="$RESEND_API_KEY" \
  FROM_EMAIL="$FROM_EMAIL" \
  --app pulseguard-worker

echo "✅ All secrets set!"
EOF

chmod +x set-flyio-secrets.sh
echo -e "${GREEN}✅ Created set-flyio-secrets.sh${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Configuration Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Deploy to Vercel:"
echo "   cd apps/web"
echo "   vercel --prod"
echo ""
echo "2. Set Vercel environment variables:"
echo "   ./set-vercel-env.sh"
echo ""
echo "3. Deploy worker to Fly.io:"
echo "   cd apps/worker"
echo "   flyctl launch --no-deploy"
echo "   ../../set-flyio-secrets.sh"
echo "   flyctl deploy"
echo ""
echo "Or use the automated deployment scripts:"
echo "   ./deploy-all.sh production"
echo ""
echo -e "${YELLOW}⚠️  Security Note:${NC}"
echo "   - Keep .env.production secure and don't commit it to git"
echo "   - The generated secrets are cryptographically secure"
echo "   - Rotate secrets periodically for best security"
echo ""


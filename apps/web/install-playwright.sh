#!/bin/bash

# Workaround script to install Playwright in a Bun workspace
# The workspace: protocol blocks normal npm install

echo "🔧 Installing Playwright for E2E testing..."
echo ""

cd "$(dirname "$0")"

# Temporarily backup package.json
cp package.json package.json.backup

# Replace workspace: protocol temporarily
sed -i 's/"@pulseguard\/db": "workspace:\*"/"@pulseguard\/db": "file:..\/..\/packages\/db"/g' package.json

echo "📦 Installing @playwright/test..."
npm install @playwright/test --legacy-peer-deps --no-save

# Restore original package.json
mv package.json.backup package.json

echo ""
echo "🌐 Installing Playwright browsers..."
npx playwright install chromium

echo ""
echo "✅ Playwright installation complete!"
echo ""
echo "Run tests with:"
echo "  npm run test:e2e"
echo "  npm run test:e2e:ui"
echo "  npm run test:e2e:headed"


#!/bin/bash

# Install missing dependency with workaround for Bun workspace protocol

cd "$(dirname "$0")"

echo "📦 Installing @next-auth/prisma-adapter..."

# Backup package.json
cp package.json package.json.backup

# Temporarily replace workspace: protocol
sed -i 's/"@pulseguard\/db": "workspace:\*"/"@pulseguard\/db": "file:..\/..\/packages\/db"/g' package.json

# Install the missing dependency
npm install @next-auth/prisma-adapter@1.0.7 --legacy-peer-deps

# Restore original package.json
mv package.json.backup package.json

echo "✅ Installation complete!"
echo ""
echo "The dependency is now in node_modules. Restart your dev server:"
echo "  npm run dev"


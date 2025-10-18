#!/bin/bash
set -e

echo "🚀 PulseGuard CLI Publish Script"
echo "================================"
echo ""

# Check if logged in
echo "📋 Checking npm authentication..."
if ! npm whoami &> /dev/null; then
    echo "❌ Not logged in to npm."
    echo ""
    echo "Please run: npm login"
    echo "Then run this script again."
    exit 1
fi

NPM_USER=$(npm whoami)
echo "✅ Logged in as: $NPM_USER"
echo ""

# Check if package exists
echo "📦 Checking if 'pulseguard-cli' package exists on npm..."
if npm view pulseguard-cli version &> /dev/null; then
    CURRENT_VERSION=$(npm view pulseguard-cli version)
    echo "⚠️  Package already exists on npm (version $CURRENT_VERSION)"
    echo ""
    echo "You'll need to bump the version in package.json"
    echo "Current version in package.json: $(node -p "require('./package.json').version")"
    echo ""
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Publish cancelled."
        exit 1
    fi
else
    echo "✅ Package name is available"
fi

echo ""
echo "🔨 Building package..."
bun run build

if [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed - dist/index.js not found"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Show package contents
echo "📋 Package will include:"
ls -lh dist/
echo ""

# Dry run
echo "🧪 Running publish dry-run..."
npm publish --dry-run --access public

echo ""
echo "📦 Ready to publish!"
echo ""
read -p "Publish to npm? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Publishing to npm..."
    npm publish --access public
    
    echo ""
    echo "✅ Published successfully!"
    echo ""
    echo "Users can now install with:"
    echo "  npm install -g pulseguard-cli"
    echo "  or"
    echo "  npx pulseguard-cli --help"
else
    echo "Publish cancelled."
    exit 1
fi

#!/bin/bash

# Setup script to configure git hooks
# This ensures all team members use the same pre-push checks

echo "🔧 Setting up git hooks..."

# Configure git to use the .githooks directory
git config core.hooksPath .githooks

# Make hooks executable
chmod +x .githooks/*

echo "✅ Git hooks configured successfully!"
echo ""
echo "📝 Pre-push hook will now run 'bun run build' before every push."
echo "💡 To skip the hook (not recommended), use: git push --no-verify"


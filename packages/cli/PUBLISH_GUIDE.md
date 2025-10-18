# Saturn CLI - npm Publishing Guide

## Prerequisites

1. **npm Account**: You need an npm account. Create one at https://www.npmjs.com/signup if you don't have one.
2. **Package Name Available**: The package name `saturn-monitor` must be available (it currently is).

## Publishing Steps

### Option 1: Using the Publish Script (Recommended)

```bash
cd /home/roshan/development/personal/pulse-guard/packages/cli

# Step 1: Login to npm
npm login

# Step 2: Run the publish script
./publish.sh
```

The script will:
- ✅ Check if you're logged in
- ✅ Verify package name availability
- ✅ Build the package
- ✅ Run a dry-run to preview
- ✅ Ask for confirmation before publishing

### Option 2: Manual Publishing

```bash
cd /home/roshan/development/personal/pulse-guard/packages/cli

# Step 1: Login to npm
npm login
# Follow the prompts or visit the URL shown

# Step 2: Build the package
bun run build

# Step 3: Test the build
node dist/index.js --help

# Step 4: Dry run (preview what will be published)
npm publish --dry-run --access public

# Step 5: Publish for real
npm publish --access public
```

## npm Login Process

When you run `npm login`, you'll see:

```
npm notice Log in on https://registry.npmjs.org/
Login at:
https://www.npmjs.com/login?next=/login/cli/[unique-id]

Username: 
```

**What to do:**
1. Visit the URL shown in your browser
2. Login with your npm credentials
3. Complete the CLI authentication
4. Return to terminal and continue

Alternatively, you can use:
```bash
npm login --auth-type=web
```

This will open your browser automatically.

## Verification After Publishing

Once published, verify the package:

```bash
# Check package info
npm info saturn-monitor

# Install globally to test
npm install -g saturn-monitor

# Test the CLI
saturn --help
saturn run --help
```

## What Gets Published

The following files will be included in the npm package:

```
saturn-monitor/
├── dist/
│   └── index.js       (bundled CLI - 0.55 MB)
├── package.json
├── README.md
└── LICENSE
```

The following are excluded (via .npmignore):
- src/ (source TypeScript files)
- __tests__/ (test files)
- node_modules/
- *.test.ts
- tsconfig.json
- jest.config.js

## Package Information

- **Name**: `saturn-monitor`
- **Version**: `0.1.0`
- **Binary**: `saturn`
- **Homepage**: https://saturnmonitor.com
- **Repository**: https://github.com/saturnmonitor/saturn

## After Publishing

### 1. Test Installation

```bash
# Install globally
npm install -g saturn-monitor

# Or use with npx
npx saturn-monitor --help
```

### 2. Update Your Documentation

Update any remaining docs that reference the installation:

```bash
npm install -g saturn-monitor
```

### 3. Announce!

Share on:
- Your website
- Twitter/X
- Product Hunt
- Dev.to
- Your blog

### 4. Monitor Usage

Track downloads at: https://www.npmjs.com/package/saturn-monitor

## Updating the Package

When you need to release a new version:

```bash
cd /home/roshan/development/personal/pulse-guard/packages/cli

# Bump version (patch: 0.1.0 -> 0.1.1)
npm version patch

# Or minor: 0.1.0 -> 0.2.0
npm version minor

# Or major: 0.1.0 -> 1.0.0
npm version major

# Build
bun run build

# Publish
npm publish
```

## Troubleshooting

### "Package name already taken"
If `saturn-monitor` is taken by the time you publish, you can:
1. Try `@yourusername/saturn-monitor` (scoped package)
2. Use an alternative name like `saturn-cli` or `saturnmonitor`

### "Need to login"
Run `npm logout` then `npm login` again.

### "Permission denied"
Make sure you're logged in as the account owner or have been added as a collaborator.

### "Build failed"
```bash
# Clean and rebuild
rm -rf dist/
bun run build
```

## Quick Command Reference

```bash
# Check if logged in
npm whoami

# Login
npm login

# Build
bun run build

# Test build
node dist/index.js --help

# Dry run
npm publish --dry-run --access public

# Publish
npm publish --access public

# Check published package
npm info saturn-monitor

# Install globally
npm install -g saturn-monitor

# Test globally installed
saturn --help
```

## Security Best Practices

1. **Enable 2FA on npm**: https://www.npmjs.com/settings/~/profile/two-factor
2. **Use automation tokens for CI/CD**: Don't use your personal credentials
3. **Review publish contents**: Always run `--dry-run` first
4. **Keep dependencies updated**: Regularly update and audit dependencies

## Support

If you encounter issues:
- npm docs: https://docs.npmjs.com/
- npm support: https://www.npmjs.com/support
- Saturn docs: https://saturnmonitor.com/docs



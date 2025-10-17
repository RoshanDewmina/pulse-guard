# Git Hooks

This directory contains git hooks that enforce code quality standards before pushing code.

## Setup

Run this command once to enable the hooks:

```bash
./setup-hooks.sh
```

Or manually:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/*
```

## Hooks

### pre-push

Runs before every `git push` to ensure:
- ✅ All services build successfully (`bun run build`)
- ✅ No TypeScript errors
- ✅ No linting errors

**This prevents broken code from being pushed to the repository and triggering failed deployments.**

### Bypassing Hooks (Not Recommended)

If you need to push despite build failures (e.g., work in progress):

```bash
git push --no-verify
```

⚠️ **Warning**: Only use `--no-verify` for WIP branches. Never skip hooks for main/production branches!

## Why Pre-Push Hooks?

1. **Catch errors early** - Find build issues before they trigger CI/CD failures
2. **Save time** - No waiting for CI to tell you about build errors
3. **Protect production** - Prevent broken code from reaching deployment
4. **Team consistency** - Everyone follows the same quality checks


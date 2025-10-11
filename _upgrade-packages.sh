#!/bin/bash

# Aggressive package upgrade script for skicyclerun.dev
# This script upgrades all packages to their latest versions

set -e  # Exit on error

echo "🚀 Starting aggressive package upgrade..."

# Backup current package.json
cp package.json package.json.backup
echo "✅ Backed up package.json to package.json.backup"

# Check if npm-check-updates is available
if ! command -v ncu &> /dev/null; then
    echo "📦 Installing npm-check-updates..."
    npm install -g npm-check-updates
fi

# Show what will be updated
echo ""
echo "📋 Checking for available updates..."
ncu

# Update all packages to latest versions
echo ""
echo "⬆️  Updating all packages to latest versions..."
ncu -u

# Install the updated packages
echo ""
echo "📥 Installing updated packages..."
npm install

# Run build to check for breaking changes
echo ""
echo "🔨 Running build to verify no breaking changes..."
npm run build

echo ""
echo "✅ Upgrade complete! If everything works:"
echo "   - Review changes: git diff package.json"
echo "   - Test your site thoroughly"
echo "   - Commit: git add package.json package-lock.json && git commit -m 'chore: upgrade all packages to latest'"
echo ""
echo "❌ If something broke:"
echo "   - Restore backup: mv package.json.backup package.json"
echo "   - Reinstall: npm install"

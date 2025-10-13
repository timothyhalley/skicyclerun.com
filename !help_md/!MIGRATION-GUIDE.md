# DEV → PROD Migration Guide

## Overview

This script performs a **clean file migration** (not a git merge) from your DEV repository to your PROD repository.

- **DEV** (`~/Projects/skicyclerun.dev`) - Heavy upgrades, testing, concept changes
- **PROD** (`~/Projects/skicyclerun.com`) - Minor changes, stable production code

## Quick Start

### 1. Preview Changes (Dry Run)

```bash
./migrate-to-prod.sh --diff-only
```

Shows:

- Files that will be added to PROD
- Files that will be updated in PROD
- Files that will be deleted from PROD
- Content differences for modified files

### 2. Perform Migration (Interactive)

```bash
./migrate-to-prod.sh
```

- Shows summary of changes
- Asks for confirmation
- Creates automatic backup
- Copies files from DEV → PROD

### 3. Auto-Migration (No Prompts)

```bash
./migrate-to-prod.sh --force
```

Skips confirmation and migrates immediately.

## What Gets Migrated?

### ✅ Included

- All source code files (`.astro`, `.ts`, `.js`, `.tsx`, etc.)
- Configuration files (`astro.config.mjs`, `tsconfig.json`, `package.json`)
- Content files (`src/content/blog/**`, `src/pages/**`)
- Public assets (`public/**`)
- Styles (`src/styles/**`)
- Documentation (`.md` files)

### ❌ Excluded

- `.git/` - Git history (PROD maintains separate git history)
- `node_modules/` - Dependencies (run `npm install` in PROD after migration)
- `dist/` - Build output (rebuild in PROD)
- `.astro/` - Astro cache
- `.deadCode/` - Archived files
- `package-lock.json` - Lock files (regenerate in PROD)
- `.env` - Environment variables (keep PROD-specific values)
- `*.log` - Log files
- `*.pem`, `*.key` - SSL certificates (keep PROD-specific)

## Usage Examples

### Example 1: Check What Would Change

```bash
./migrate-to-prod.sh --diff-only
```

**Output:**

```
📊 Analyzing differences between DEV and PROD...

DEV Files:  243
PROD Files: 215

🔍 Detailed File Comparison:

📝 New files (will be added):     12
📝 Modified files (will update):  8
📝 Removed files (will be deleted): 3

➕ New files to be added:
src/components/TravelGlobe.tsx
public/favicon.svg
MIGRATION-COMPLETE.md
...

📝 Modified files to be updated:
src/config/cognito.ts
package.json
astro.config.mjs
...

━━━ src/config/cognito.ts ━━━
- userPoolId: "us-west-2_UqZZY2Hbw",
+ userPoolId: import.meta.env.PUBLIC_COGNITO_USER_POOL_ID || "us-west-2_UqZZY2Hbw",
```

### Example 2: Full Migration with Confirmation

```bash
./migrate-to-prod.sh
```

**Interactive Prompts:**

```
⚠️  WARNING: This will modify the PROD repository

This operation will:
  • Copy 12 new files to PROD
  • Update 8 modified files in PROD
  • Delete 3 files from PROD

Source:      /Users/timothyhalley/Projects/skicyclerun.dev
Destination: /Users/timothyhalley/Projects/skicyclerun.com

Continue with migration? [y/N]: y

📦 Creating backup of PROD repository...
✓ Backup created: ~/Projects/backups/skicyclerun.com_backup_20251011_151234.tar.gz

🚀 Migrating files from DEV to PROD...
[Progress bar shows file copying]

✓ File migration complete!
```

### Example 3: Automated Migration (CI/CD)

```bash
./migrate-to-prod.sh --force
```

No prompts, automatic backup, immediate migration.

## Post-Migration Steps

After migration, you **must** run these commands in the PROD repository:

```bash
cd ~/Projects/skicyclerun.com

# 1. Install dependencies
npm install

# 2. Build the site
npm run build

# 3. Test locally
npm run dev

# 4. Commit to PROD git repo
git status
git add .
git commit -m "Migrate from DEV (2025-10-11)"
git push
```

## Backup & Recovery

### Automatic Backups

Every migration automatically creates a backup:

```
~/Projects/backups/skicyclerun.com_backup_YYYYMMDD_HHMMSS.tar.gz
```

### Manual Restore from Backup

If something goes wrong:

```bash
# Stop what you're doing
cd ~/Projects

# Remove the broken PROD repo
rm -rf skicyclerun.com

# Restore from backup
tar -xzf backups/skicyclerun.com_backup_20251011_151234.tar.gz

# Verify
cd skicyclerun.com
npm install
npm run build
```

## Workflow Recommendations

### Option 1: Feature-Based Migration

1. Develop and test feature in DEV
2. Run `./migrate-to-prod.sh --diff-only` to preview
3. Review changes carefully
4. Run `./migrate-to-prod.sh` to migrate
5. Test in PROD, commit, deploy

### Option 2: Scheduled Migration

1. Work in DEV for a sprint/week
2. At end of sprint, run diff preview
3. Document what's changing
4. Migrate to PROD
5. QA in PROD before deploying

### Option 3: Emergency Hotfix

1. Make fix in DEV
2. Test thoroughly
3. Use `--force` for quick migration
4. Deploy immediately

## Troubleshooting

### Problem: "PROD repository not found"

```bash
mkdir -p ~/Projects/skicyclerun.com
cd ~/Projects/skicyclerun.com
git clone <your-prod-repo-url> .
```

### Problem: "Permission denied"

```bash
chmod +x migrate-to-prod.sh
```

### Problem: "rsync not found"

```bash
# macOS
brew install rsync

# Linux
sudo apt-get install rsync
```

### Problem: "Too many changes, want to be selective"

**Solution:** Don't use this script. Manually copy specific files:

```bash
cp ~/Projects/skicyclerun.dev/src/components/NewComponent.astro \
   ~/Projects/skicyclerun.com/src/components/
```

## Advanced Usage

### Custom Source/Destination

Edit the script to change paths:

```bash
# Edit migrate-to-prod.sh
DEV_REPO="$HOME/Projects/my-dev-repo"
PROD_REPO="$HOME/Projects/my-prod-repo"
```

### Add More Exclusions

Edit the `EXCLUDE_PATTERNS` array:

```bash
EXCLUDE_PATTERNS=(
  ".git"
  "node_modules"
  # Add your custom exclusions
  "temp/"
  "*.tmp"
)
```

### Integration with CI/CD

**GitHub Actions example:**

```yaml
name: Migrate to PROD

on:
  workflow_dispatch: # Manual trigger

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout DEV
        uses: actions/checkout@v3
        with:
          repository: timothyhalley/skicyclerun.dev
          path: dev

      - name: Checkout PROD
        uses: actions/checkout@v3
        with:
          repository: timothyhalley/skicyclerun.com
          path: prod

      - name: Run Migration
        run: |
          cd dev
          ./migrate-to-prod.sh --force
```

## Safety Features

✅ **Automatic Backups** - Every migration creates a timestamped backup
✅ **Confirmation Prompts** - Asks before making changes (unless --force)
✅ **Diff Preview** - See exactly what will change before migrating
✅ **Exclusion Patterns** - Protects git history, dependencies, secrets
✅ **File Count Summary** - Know how many files are affected
✅ **Rollback Instructions** - Clear steps to undo if needed

## Important Notes

### This is NOT a Git Merge

The script **copies files**, it does NOT:

- Preserve git commit history
- Merge branches
- Resolve merge conflicts
- Update git remotes

Each repo maintains its own separate git history.

### Environment Variables

The script does NOT copy `.env` files. After migration:

```bash
cd ~/Projects/skicyclerun.com

# Update .env with PROD-specific values
nano .env
```

### SSL Certificates

Certificate files (`*.pem`, `*.key`) are excluded. Keep PROD-specific certificates separate.

## Command Reference

| Command                            | Description                             |
| ---------------------------------- | --------------------------------------- |
| `./migrate-to-prod.sh`             | Interactive migration with confirmation |
| `./migrate-to-prod.sh --diff-only` | Preview changes only (dry-run)          |
| `./migrate-to-prod.sh --force`     | Auto-migrate without confirmation       |
| `./migrate-to-prod.sh --help`      | Show help message                       |

## Files Created/Modified

- **Script:** `migrate-to-prod.sh`
- **Backups:** `~/Projects/backups/skicyclerun.com_backup_*.tar.gz`
- **This Guide:** `MIGRATION-GUIDE.md`

## Support

If you encounter issues:

1. Check the error message
2. Review the Troubleshooting section
3. Run with `--diff-only` to see what would change
4. Check backup exists before proceeding
5. Test in a copy of PROD first if unsure

---

**Last Updated:** October 11, 2025  
**Version:** 1.0.0

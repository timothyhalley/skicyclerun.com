# 🚀 Migration Script Created!

## ✅ What Was Created

### 1. **`migrate-to-prod.sh`** - Clean Migration Script

A comprehensive bash script that performs **clean file migration** (not git merge) from DEV → PROD.

**Location:** `/Users/timothyhalley/Projects/skicyclerun.dev/migrate-to-prod.sh`

**Features:**

- ✅ Preview changes with `--diff-only` (dry-run mode)
- ✅ Interactive confirmation before migration
- ✅ Automatic backup creation
- ✅ Excludes git history, node_modules, build artifacts
- ✅ Detailed file comparison (new, modified, removed)
- ✅ Content diffs for modified files
- ✅ Colored terminal output
- ✅ Progress indicators
- ✅ Rollback instructions

### 2. **`MIGRATION-GUIDE.md`** - Complete Documentation

Full usage guide with examples, troubleshooting, and workflow recommendations.

---

## 🎯 Quick Usage

### Step 1: Preview What Would Change

```bash
cd ~/Projects/skicyclerun.dev
./migrate-to-prod.sh --diff-only
```

**This shows:**

- How many files will be added to PROD
- How many files will be updated in PROD
- How many files will be removed from PROD
- Actual content differences (diffs)

### Step 2: Perform the Migration

```bash
./migrate-to-prod.sh
```

**What happens:**

1. Shows summary of changes
2. Asks for your confirmation (`y/N`)
3. Creates automatic backup of PROD
4. Copies files from DEV → PROD
5. Shows completion message

### Step 3: Build and Test PROD

```bash
cd ~/Projects/skicyclerun.com
npm install
npm run build
npm run dev
```

### Step 4: Commit to PROD Git Repo

```bash
git add .
git commit -m "Migrate from DEV (2025-10-11)"
git push
```

---

## 📊 What Gets Migrated?

### ✅ **Included** (Copied to PROD)

- All source code (`.astro`, `.ts`, `.js`, `.tsx`)
- Components (`src/components/**`)
- Pages (`src/pages/**`)
- Content (`src/content/**`)
- Layouts (`src/layouts/**`)
- Utilities (`src/utils/**`)
- Styles (`src/styles/**`)
- Public assets (`public/**`)
- Config files (`astro.config.mjs`, `tsconfig.json`, `package.json`)
- Documentation (`.md` files)

### ❌ **Excluded** (NOT Copied)

- `.git/` - Git history (PROD has separate history)
- `node_modules/` - Dependencies (run `npm install` in PROD)
- `dist/` - Build output (rebuild in PROD)
- `.astro/` - Astro cache
- `.deadCode/` - Archived files
- `package-lock.json` - Lock files
- `.env`, `.env.production` - Environment variables
- `*.log` - Log files
- `*.pem`, `*.key`, `*.crt` - SSL certificates
- `.vscode/`, `.idea/` - Editor configs

---

## 🎨 Example Output

### Preview Mode (`--diff-only`)

```
═══════════════════════════════════════════════════════════════
  DEV → PROD Migration Tool
═══════════════════════════════════════════════════════════════

✓ DEV repository found: /Users/timothyhalley/Projects/skicyclerun.dev
✓ PROD repository found: /Users/timothyhalley/Projects/skicyclerun.com

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
.env.example
AUTH-BUTTON-DEBUG.md
...

📝 Modified files to be updated:
src/config/cognito.ts
package.json
public/scripts/simple-auth-icon.js
...

═══════════════════════════════════════════════════════════════
  Content Differences (Modified Files)
═══════════════════════════════════════════════════════════════

━━━ src/config/cognito.ts ━━━
--- PROD	2025-10-10 14:23:45.000000000 -0700
+++ DEV	2025-10-11 15:15:30.000000000 -0700
@@ -1,8 +1,15 @@
 // Cognito configuration for direct AWS SDK integration
-export const cognitoConfig = {
-  userPoolId: "us-west-2_UqZZY2Hbw",
-  clientId: "hsrpdhl5sellv9n3dotako1tm",
+export const cognitoConfig: CognitoConfig = {
+  userPoolId: import.meta.env.PUBLIC_COGNITO_USER_POOL_ID || "us-west-2_UqZZY2Hbw",
+  clientId: import.meta.env.PUBLIC_COGNITO_CLIENT_ID || "hsrpdhl5sellv9n3dotako1tm",
   ...
 };

✓ Diff preview complete (no files copied)

To perform the migration, run:
  ./migrate-to-prod.sh
```

---

## 🔧 Command Options

| Command                            | Description  | Use Case                               |
| ---------------------------------- | ------------ | -------------------------------------- |
| `./migrate-to-prod.sh --diff-only` | Preview only | See what would change before migrating |
| `./migrate-to-prod.sh`             | Interactive  | Normal migration with confirmation     |
| `./migrate-to-prod.sh --force`     | Auto-migrate | CI/CD or when you're sure              |
| `./migrate-to-prod.sh --help`      | Show help    | Learn usage options                    |

---

## 🛡️ Safety Features

### 1. **Automatic Backups**

Every migration creates a timestamped backup:

```
~/Projects/backups/skicyclerun.com_backup_20251011_151534.tar.gz
```

### 2. **Confirmation Prompt**

Script asks before making changes:

```
⚠️  WARNING: This will modify the PROD repository

This operation will:
  • Copy 12 new files to PROD
  • Update 8 modified files in PROD
  • Delete 3 files from PROD

Continue with migration? [y/N]:
```

### 3. **Rollback Instructions**

If something goes wrong:

```bash
cd ~/Projects
rm -rf skicyclerun.com
tar -xzf backups/skicyclerun.com_backup_20251011_151534.tar.gz
```

---

## 📝 Workflow Recommendations

### Scenario 1: Regular Feature Migration

1. **Develop in DEV**

   ```bash
   cd ~/Projects/skicyclerun.dev
   # Make changes, test thoroughly
   npm run build
   npm run dev
   ```

2. **Preview migration**

   ```bash
   ./migrate-to-prod.sh --diff-only
   ```

3. **Review changes carefully**
   - Check which files are new
   - Review modified files
   - Understand what will be deleted

4. **Migrate to PROD**

   ```bash
   ./migrate-to-prod.sh
   # Confirm with 'y'
   ```

5. **Test PROD**

   ```bash
   cd ~/Projects/skicyclerun.com
   npm install
   npm run build
   npm run dev
   ```

6. **Commit and deploy**
   ```bash
   git add .
   git commit -m "Migrate: cognito env vars + new favicon"
   git push
   ```

### Scenario 2: Emergency Hotfix

1. Make fix in DEV and test
2. Use `--force` for quick migration:
   ```bash
   ./migrate-to-prod.sh --force
   ```
3. Deploy immediately

### Scenario 3: Major Update Review

1. After big changes (like today's React 19 upgrade)
2. Run diff preview multiple times:
   ```bash
   ./migrate-to-prod.sh --diff-only | tee migration-preview.txt
   ```
3. Review `migration-preview.txt` carefully
4. Migrate when confident

---

## ⚠️ Important Notes

### This is NOT a Git Merge!

The script **copies files** from DEV to PROD. It does NOT:

- ❌ Preserve git commit history
- ❌ Merge branches
- ❌ Resolve merge conflicts
- ❌ Update git remotes

**Each repo maintains separate git history.**

### Environment Variables

`.env` files are **not copied**. After migration:

1. **Check PROD `.env` file:**

   ```bash
   cd ~/Projects/skicyclerun.com
   cat .env
   ```

2. **Update with PROD-specific values:**

   ```bash
   # Use DEV as reference
   cat ~/Projects/skicyclerun.dev/.env.example

   # Update PROD .env
   nano .env
   ```

3. **Key differences:**
   - URLs (localhost vs production domain)
   - API endpoints (dev vs production)
   - AWS credentials (dev vs prod accounts)
   - Cognito redirect URIs

### SSL Certificates

Certificate files are excluded. Keep PROD-specific certificates in place.

---

## 🐛 Troubleshooting

### Problem: Script won't run

**Solution:**

```bash
chmod +x migrate-to-prod.sh
```

### Problem: "PROD repository not found"

**Solution:**

```bash
mkdir -p ~/Projects/skicyclerun.com
cd ~/Projects/skicyclerun.com
# Initialize git repo or clone existing
git clone git@github.com:timothyhalley/skicyclerun.com.git .
```

### Problem: Want to test without affecting real PROD

**Solution:**

```bash
# Create a test copy
cp -r ~/Projects/skicyclerun.com ~/Projects/skicyclerun.com.test

# Update script to use test path
# Edit migrate-to-prod.sh line 31:
PROD_REPO="$HOME/Projects/skicyclerun.com.test"

# Run migration
./migrate-to-prod.sh
```

### Problem: rsync not found (rare on macOS)

**Solution:**

```bash
brew install rsync
```

---

## 📦 Files Created

1. **`migrate-to-prod.sh`** - Migration script (executable)
2. **`MIGRATION-GUIDE.md`** - Full documentation
3. **`MIGRATION-SCRIPT-README.md`** - This quick start guide

---

## 🎉 Benefits Over Manual Copy

### Before (Manual)

```bash
# Copy files one by one
cp src/components/NewComponent.astro ~/Projects/skicyclerun.com/src/components/
cp src/utils/newUtil.ts ~/Projects/skicyclerun.com/src/utils/
# Forget some files
# Copy node_modules by accident
# No backup
# No way to see what changed
```

### After (Automated)

```bash
./migrate-to-prod.sh --diff-only  # Preview
./migrate-to-prod.sh               # Migrate
# ✅ All files copied
# ✅ Automatic backup
# ✅ Detailed change report
# ✅ No accidental copies
# ✅ Clear rollback path
```

---

## 🚀 Ready to Use!

The script is ready to go. Start with a dry-run:

```bash
cd ~/Projects/skicyclerun.dev
./migrate-to-prod.sh --diff-only
```

This will show you exactly what would happen without making any changes!

---

**Created:** October 11, 2025  
**Purpose:** Clean file migration between DEV and PROD repos  
**Documentation:** See `MIGRATION-GUIDE.md` for complete details

# Migration Script - Preview Modes

## Three Ways to Preview Before Migrating

### 1. `--diff-only` - File Comparison + Content Diffs

**What it does:**

- Compares file lists between DEV and PROD
- Shows which files are new, modified, or removed
- Displays actual content differences (like `git diff`)
- Does NOT run rsync

**Use when:**

- You want to see what code changed
- You need to review actual content differences
- You want to understand the impact before migrating

**Command:**

```bash
./migrate-to-prod.sh --diff-only
```

**Output Example:**

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
...

━━━ src/config/cognito.ts ━━━
--- PROD
+++ DEV
@@ -1,8 +1,15 @@
-export const cognitoConfig = {
-  userPoolId: "us-west-2_UqZZY2Hbw",
+export const cognitoConfig: CognitoConfig = {
+  userPoolId: import.meta.env.PUBLIC_COGNITO_USER_POOL_ID || "us-west-2_UqZZY2Hbw",
```

---

### 2. `--dry-run` - Rsync Simulation

**What it does:**

- Runs rsync with `--dry-run` flag
- Shows exactly what rsync would copy/delete
- Shows file sizes and transfer details
- Validates rsync syntax and exclusions

**Use when:**

- You want to verify rsync will work correctly
- You need to check file transfer operations
- You want to see which files rsync considers changed
- You're debugging rsync behavior

**Command:**

```bash
./migrate-to-prod.sh --dry-run
```

**Output Example:**

```
🔍 Running rsync with --dry-run flag...

sending incremental file list
./
.env.example
MIGRATION-COMPLETE.md
AUTH-BUTTON-DEBUG.md
public/favicon.svg
public/scripts/simple-auth-icon.js
src/components/TravelGlobe.tsx
src/config/cognito.ts
deleting .deadCode/
deleting lambda/

sent 45,234 bytes  received 892 bytes  92,252.00 bytes/sec
total size is 2,456,789  speedup is 53.28 (DRY RUN)

✓ Dry-run complete (no files were actually copied)

Explanation of rsync output:
  • Lines starting with '>' show files that would be transferred
  • 'deleting' shows files that would be removed from PROD
  • 'sent X bytes' shows data transfer size (but nothing was sent)
```

---

### 3. Interactive (No Flags) - Full Summary + Confirmation

**What it does:**

- Shows file count summary
- Shows detailed file comparison
- Creates automatic backup
- Asks for confirmation before copying

**Use when:**

- You're ready to migrate but want one final check
- You want the safety of a confirmation prompt
- You want automatic backups

**Command:**

```bash
./migrate-to-prod.sh
```

**Output Example:**

```
📊 Analyzing differences between DEV and PROD...

DEV Files:  243
PROD Files: 215

📝 New files (will be added):     12
📝 Modified files (will update):  8
📝 Removed files (will be deleted): 3

═══════════════════════════════════════════════════════════════
⚠️  WARNING: This will modify the PROD repository
═══════════════════════════════════════════════════════════════

This operation will:
  • Copy 12 new files to PROD
  • Update 8 modified files in PROD
  • Delete 3 files from PROD

Source:      /Users/timothyhalley/Projects/skicyclerun.com
Destination: /Users/timothyhalley/Projects/skicyclerun.com

This is NOT a git merge - it's a clean file copy!

Continue with migration? [y/N]: _
```

---

## Comparison Table

| Feature                   | --diff-only      | --dry-run    | Interactive      | --force          |
| ------------------------- | ---------------- | ------------ | ---------------- | ---------------- |
| **Shows file comparison** | ✅ Yes           | ❌ No        | ✅ Yes           | ✅ Yes           |
| **Shows content diffs**   | ✅ Yes (first 5) | ❌ No        | ❌ No            | ❌ No            |
| **Runs rsync simulation** | ❌ No            | ✅ Yes       | ❌ No            | ❌ No            |
| **Asks for confirmation** | ❌ N/A           | ❌ N/A       | ✅ Yes           | ❌ No            |
| **Creates backup**        | ❌ No            | ❌ No        | ✅ Yes           | ✅ Yes           |
| **Actually copies files** | ❌ No            | ❌ No        | ✅ Yes           | ✅ Yes           |
| **Safe to run**           | ✅ 100% safe     | ✅ 100% safe | ⚠️ Makes changes | ⚠️ Makes changes |

---

## Recommended Workflow

### For Major Changes

```bash
# Step 1: See what files changed and review code
./migrate-to-prod.sh --diff-only

# Step 2: Verify rsync will work correctly
./migrate-to-prod.sh --dry-run

# Step 3: Perform migration with confirmation
./migrate-to-prod.sh
```

### For Minor Changes

```bash
# Quick check and migrate
./migrate-to-prod.sh --dry-run
./migrate-to-prod.sh
```

### For Emergency Fixes

```bash
# Just do it (you tested in DEV, right?)
./migrate-to-prod.sh --force
```

---

## Key Differences

### --diff-only vs --dry-run

**Use `--diff-only` when:**

- ✅ You want to review code changes
- ✅ You need to see what was modified
- ✅ You're doing code review before migration
- ✅ You want to understand the impact

**Use `--dry-run` when:**

- ✅ You want to verify rsync will work
- ✅ You need to debug rsync exclusions
- ✅ You want to see rsync's file size calculations
- ✅ You're testing the migration script

**Use both when:**

- ✅ You're migrating major changes
- ✅ You want maximum confidence
- ✅ You have time for thorough review

---

## Examples

### Example 1: Full Review Process

```bash
# See what changed
./migrate-to-prod.sh --diff-only > changes.txt
cat changes.txt

# Verify rsync operations
./migrate-to-prod.sh --dry-run > rsync-preview.txt
cat rsync-preview.txt

# Review both outputs, then migrate
./migrate-to-prod.sh
```

### Example 2: Quick Verification

```bash
# Just check rsync output
./migrate-to-prod.sh --dry-run | grep -E "^(deleting|>)"

# Looks good? Migrate!
./migrate-to-prod.sh --force
```

### Example 3: Debugging Exclusions

```bash
# Check if .deadCode is properly excluded
./migrate-to-prod.sh --dry-run | grep -i deadcode

# Should see: (nothing, it's excluded)
# If you see files, fix the exclusion pattern
```

---

## Pro Tips

### 1. Combine with git diff

```bash
# See what changed in DEV since last migration
cd ~/Projects/skicyclerun.com
git log --oneline -10

# Then use --diff-only to see file-level changes
./migrate-to-prod.sh --diff-only
```

### 2. Save outputs for records

```bash
# Create migration log
echo "Migration Preview - $(date)" > migration-log.txt
./migrate-to-prod.sh --diff-only >> migration-log.txt
./migrate-to-prod.sh --dry-run >> migration-log.txt

# Review before migrating
cat migration-log.txt
```

### 3. Test with a copy first

```bash
# Create test PROD copy
cp -r ~/Projects/skicyclerun.com ~/Projects/skicyclerun.com.test

# Edit script to use test path temporarily
# Run migration
./migrate-to-prod.sh

# Verify test copy looks good
cd ~/Projects/skicyclerun.com.test
npm run build

# If good, run on real PROD
```

---

**Summary:** Use `--diff-only` for code review, `--dry-run` for rsync verification, and both for maximum confidence! 🎯

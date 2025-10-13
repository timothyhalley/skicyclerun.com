#!/bin/bash

################################################################################
# migrate-to-prod.sh
# 
# Clean migration script to move files from DEV to PROD repository
# 
# Usage:
#   ./migrate-to-prod.sh [--diff-only] [--dry-run] [--force] [--help]
#
# Options:
#   --diff-only    Show file differences and content diffs
#   --dry-run      Show what rsync would do without copying
#   --force        Skip confirmation prompt
#   --help         Show this help message
#
# Purpose:
#   DEV (skicyclerun.dev)  = Heavy upgrades, testing, concept changes
#   PROD (skicyclerun.com) = Minor changes, stable production code
#
# This script performs a CLEAN file copy (not a git merge):
#   - Compares file differences between repos
#   - Optionally shows diff preview
#   - Copies files while preserving structure
#   - Excludes git history, node_modules, build artifacts
#
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default paths
DEV_REPO="$HOME/Projects/skicyclerun.dev"
PROD_REPO="$HOME/Projects/skicyclerun.com"

# Parse command line arguments
DIFF_ONLY=false
DRY_RUN=false
FORCE=false
SHOW_HELP=false

for arg in "$@"; do
  case $arg in
    --diff-only)
      DIFF_ONLY=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --help)
      SHOW_HELP=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $arg${NC}"
      SHOW_HELP=true
      shift
      ;;
  esac
done

# Show help
if [ "$SHOW_HELP" = true ]; then
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  Migration Script: DEV → PROD${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${YELLOW}Usage:${NC}"
  echo "  ./migrate-to-prod.sh [options]"
  echo ""
  echo -e "${YELLOW}Options:${NC}"
  echo "  --diff-only    Show file differences and content diffs (no rsync)"
  echo "  --dry-run      Show what rsync would copy (rsync --dry-run)"
  echo "  --force        Skip confirmation prompt and copy immediately"
  echo "  --help         Show this help message"
  echo ""
  echo -e "${YELLOW}Examples:${NC}"
  echo "  ./migrate-to-prod.sh --diff-only    # Show file comparison & diffs"
  echo "  ./migrate-to-prod.sh --dry-run      # Show rsync operations (safe)"
  echo "  ./migrate-to-prod.sh                # Interactive migration"
  echo "  ./migrate-to-prod.sh --force        # Auto-migrate without prompts"
  echo ""
  echo -e "${YELLOW}Paths:${NC}"
  echo "  DEV:  $DEV_REPO"
  echo "  PROD: $PROD_REPO"
  echo ""
  exit 0
fi

################################################################################
# Validation
################################################################################

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  DEV → PROD Migration Tool${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if DEV repo exists
if [ ! -d "$DEV_REPO" ]; then
  echo -e "${RED}✗ DEV repository not found: $DEV_REPO${NC}"
  exit 1
fi
echo -e "${GREEN}✓ DEV repository found: $DEV_REPO${NC}"

# Check if PROD repo exists
if [ ! -d "$PROD_REPO" ]; then
  echo -e "${RED}✗ PROD repository not found: $PROD_REPO${NC}"
  echo -e "${YELLOW}  Create it first: mkdir -p $PROD_REPO${NC}"
  exit 1
fi
echo -e "${GREEN}✓ PROD repository found: $PROD_REPO${NC}"

echo ""

################################################################################
# Exclusion Patterns
################################################################################

# Files and directories to EXCLUDE from migration
EXCLUDE_PATTERNS=(
  ".git"
  ".github"
  "node_modules"
  "dist"
  ".astro"
  ".deadCode"
  "package-lock.json"
  "pnpm-lock.yaml"
  "yarn.lock"
  ".DS_Store"
  "*.log"
  ".env"
  ".env.production"
  ".vscode"
  ".idea"
  "*.pem"
  "*.key"
  "*.crt"
  "localhost*.pem"
)

# Build rsync exclude arguments
RSYNC_EXCLUDES=()
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
  RSYNC_EXCLUDES+=("--exclude=$pattern")
done

################################################################################
# Show Differences
################################################################################

echo -e "${MAGENTA}📊 Analyzing differences between DEV and PROD...${NC}"
echo ""

# Count files in each repo (excluding patterns)
cd "$DEV_REPO"
DEV_FILE_COUNT=$(find . -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/.astro/*" \
  ! -path "*/.deadCode/*" \
  ! -name "*.log" \
  | wc -l | tr -d ' ')

cd "$PROD_REPO"
PROD_FILE_COUNT=$(find . -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/.astro/*" \
  ! -path "*/.deadCode/*" \
  ! -name "*.log" \
  2>/dev/null | wc -l | tr -d ' ')

echo -e "${BLUE}DEV Files:  $DEV_FILE_COUNT${NC}"
echo -e "${BLUE}PROD Files: $PROD_FILE_COUNT${NC}"
echo ""

# Show detailed file differences
echo -e "${MAGENTA}🔍 Detailed File Comparison:${NC}"
echo ""

# Create temp files to store file lists
DEV_FILES=$(mktemp)
PROD_FILES=$(mktemp)

cd "$DEV_REPO"
find . -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/.astro/*" \
  ! -path "*/.deadCode/*" \
  ! -name "*.log" \
  | sed 's|^\./||' | sort > "$DEV_FILES"

cd "$PROD_REPO"
find . -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/.astro/*" \
  ! -path "*/.deadCode/*" \
  ! -name "*.log" \
  2>/dev/null | sed 's|^\./||' | sort > "$PROD_FILES"

# Files only in DEV (will be added to PROD)
NEW_FILES=$(comm -23 "$DEV_FILES" "$PROD_FILES")
NEW_COUNT=$(echo "$NEW_FILES" | grep -c . || echo "0")

# Files only in PROD (will be deleted from PROD)
REMOVED_FILES=$(comm -13 "$DEV_FILES" "$PROD_FILES")
REMOVED_COUNT=$(echo "$REMOVED_FILES" | grep -c . || echo "0")

# Files in both (may be modified)
COMMON_FILES=$(comm -12 "$DEV_FILES" "$PROD_FILES")

# Check for modified files
MODIFIED_FILES=""
MODIFIED_COUNT=0

while IFS= read -r file; do
  if [ -f "$DEV_REPO/$file" ] && [ -f "$PROD_REPO/$file" ]; then
    if ! cmp -s "$DEV_REPO/$file" "$PROD_REPO/$file"; then
      MODIFIED_FILES="$MODIFIED_FILES$file"$'\n'
      ((MODIFIED_COUNT++))
    fi
  fi
done <<< "$COMMON_FILES"

echo -e "${GREEN}📝 New files (will be added):     $NEW_COUNT${NC}"
echo -e "${YELLOW}📝 Modified files (will update):  $MODIFIED_COUNT${NC}"
echo -e "${RED}📝 Removed files (will be deleted): $REMOVED_COUNT${NC}"
echo ""

# Show detailed lists if requested or if in diff-only mode
if [ "$DIFF_ONLY" = true ] || [ "$NEW_COUNT" -gt 0 ] || [ "$MODIFIED_COUNT" -gt 0 ] || [ "$REMOVED_COUNT" -gt 0 ]; then
  
  if [ "$NEW_COUNT" -gt 0 ]; then
    echo -e "${GREEN}➕ New files to be added:${NC}"
    echo "$NEW_FILES" | head -20
    if [ "$NEW_COUNT" -gt 20 ]; then
      echo -e "${YELLOW}   ... and $((NEW_COUNT - 20)) more${NC}"
    fi
    echo ""
  fi
  
  if [ "$MODIFIED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}📝 Modified files to be updated:${NC}"
    echo "$MODIFIED_FILES" | head -20
    if [ "$MODIFIED_COUNT" -gt 20 ]; then
      echo -e "${YELLOW}   ... and $((MODIFIED_COUNT - 20)) more${NC}"
    fi
    echo ""
  fi
  
  if [ "$REMOVED_COUNT" -gt 0 ]; then
    echo -e "${RED}🗑️  Files to be removed from PROD:${NC}"
    echo "$REMOVED_FILES" | head -20
    if [ "$REMOVED_COUNT" -gt 20 ]; then
      echo -e "${YELLOW}   ... and $((REMOVED_COUNT - 20)) more${NC}"
    fi
    echo ""
  fi
fi

# Show content diffs for modified files (in diff-only mode)
if [ "$DIFF_ONLY" = true ] && [ "$MODIFIED_COUNT" -gt 0 ]; then
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  Content Differences (Modified Files)${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  
  DIFF_COUNT=0
  MAX_DIFFS=5
  
  while IFS= read -r file; do
    if [ -n "$file" ] && [ "$DIFF_COUNT" -lt "$MAX_DIFFS" ]; then
      echo -e "${MAGENTA}━━━ $file ━━━${NC}"
      diff -u "$PROD_REPO/$file" "$DEV_REPO/$file" 2>/dev/null || true
      echo ""
      ((DIFF_COUNT++))
    fi
  done <<< "$MODIFIED_FILES"
  
  if [ "$MODIFIED_COUNT" -gt "$MAX_DIFFS" ]; then
    echo -e "${YELLOW}Showing first $MAX_DIFFS of $MODIFIED_COUNT modified files${NC}"
    echo -e "${YELLOW}Run without --diff-only to see all changes during migration${NC}"
    echo ""
  fi
fi

# Clean up temp files
rm -f "$DEV_FILES" "$PROD_FILES"

################################################################################
# Exit if diff-only mode
################################################################################

if [ "$DIFF_ONLY" = true ]; then
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}✓ Diff preview complete (no files copied)${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo "  ./migrate-to-prod.sh --dry-run    # See what rsync would do"
  echo "  ./migrate-to-prod.sh              # Perform actual migration"
  echo ""
  exit 0
fi

################################################################################
# Handle dry-run mode (rsync --dry-run)
################################################################################

if [ "$DRY_RUN" = true ]; then
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}  Dry-Run Mode: Showing what rsync would do${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${MAGENTA}🔍 Running rsync with --dry-run flag...${NC}"
  echo ""
  
  # Run rsync with --dry-run flag
  rsync -av --delete --dry-run \
    "${RSYNC_EXCLUDES[@]}" \
    "$DEV_REPO/" \
    "$PROD_REPO/"
  
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}✓ Dry-run complete (no files were actually copied)${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${YELLOW}Explanation of rsync output:${NC}"
  echo "  • Lines starting with '>' show files that would be transferred"
  echo "  • 'deleting' shows files that would be removed from PROD"
  echo "  • 'sent X bytes' shows data transfer size (but nothing was sent)"
  echo ""
  echo -e "${YELLOW}To perform the actual migration, run:${NC}"
  echo "  ./migrate-to-prod.sh"
  echo ""
  exit 0
fi

################################################################################
# Confirmation
################################################################################

if [ "$FORCE" = false ]; then
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}⚠️  WARNING: This will modify the PROD repository${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${YELLOW}This operation will:${NC}"
  echo "  • Copy $NEW_COUNT new files to PROD"
  echo "  • Update $MODIFIED_COUNT modified files in PROD"
  echo "  • Delete $REMOVED_COUNT files from PROD"
  echo ""
  echo -e "${YELLOW}Source:      $DEV_REPO${NC}"
  echo -e "${YELLOW}Destination: $PROD_REPO${NC}"
  echo ""
  echo -e "${RED}This is NOT a git merge - it's a clean file copy!${NC}"
  echo ""
  read -p "$(echo -e ${YELLOW}Continue with migration? [y/N]:${NC} )" -n 1 -r
  echo ""
  
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Migration cancelled.${NC}"
    exit 0
  fi
  echo ""
fi

################################################################################
# Backup PROD (optional but recommended)
################################################################################

echo -e "${MAGENTA}📦 Creating backup of PROD repository...${NC}"

BACKUP_DIR="$HOME/Projects/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/skicyclerun.com_backup_$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

# Create tar backup (excluding heavy directories)
cd "$PROD_REPO/.."
tar -czf "$BACKUP_PATH.tar.gz" \
  --exclude="node_modules" \
  --exclude="dist" \
  --exclude=".git" \
  --exclude=".astro" \
  "$(basename $PROD_REPO)" 2>/dev/null || true

if [ -f "$BACKUP_PATH.tar.gz" ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_PATH.tar.gz" | cut -f1)
  echo -e "${GREEN}✓ Backup created: $BACKUP_PATH.tar.gz ($BACKUP_SIZE)${NC}"
else
  echo -e "${YELLOW}⚠ Backup creation failed (continuing anyway)${NC}"
fi
echo ""

################################################################################
# Perform Migration
################################################################################

echo -e "${MAGENTA}🚀 Migrating files from DEV to PROD...${NC}"
echo ""

# Use rsync for efficient file copying
# --archive: preserve permissions, times, etc.
# --verbose: show what's being copied
# --delete: remove files from PROD that don't exist in DEV
# --progress: show transfer progress

rsync -av --delete \
  "${RSYNC_EXCLUDES[@]}" \
  --progress \
  "$DEV_REPO/" \
  "$PROD_REPO/"

echo ""
echo -e "${GREEN}✓ File migration complete!${NC}"
echo ""

################################################################################
# Post-Migration Summary
################################################################################

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Migration Summary${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✓ Files migrated from DEV to PROD${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "1. Verify PROD repository:"
echo "   cd $PROD_REPO"
echo "   npm install"
echo "   npm run build"
echo ""
echo "2. Test locally:"
echo "   npm run dev"
echo ""
echo "3. Commit changes to PROD git repo:"
echo "   git add ."
echo "   git commit -m \"Migrate from DEV ($(date +%Y-%m-%d))\"" 
echo "   git push"
echo ""
echo "4. If something went wrong, restore from backup:"
echo "   cd $(dirname $PROD_REPO)"
echo "   rm -rf $(basename $PROD_REPO)"
echo "   tar -xzf $BACKUP_PATH.tar.gz"
echo ""
echo -e "${BLUE}Backup location: $BACKUP_PATH.tar.gz${NC}"
echo ""
echo -e "${GREEN}Migration complete! 🎉${NC}"
echo ""

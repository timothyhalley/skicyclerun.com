#!/bin/zsh
set -euo pipefail

# --- Script Mode ---
# Determines the script's behavior.
# Usage:
#   ./cleanBuild.sh dev       (default) Cleans workspace and starts the dev server.
#   ./cleanBuild.sh build     Cleans workspace and runs a standard 'npm run build'.
#   ./cleanBuild.sh ci        Cleans workspace and runs a production-like build with post-build checks.
#   ./cleanBuild.sh clean     Cleans workspace without installing or building.
MODE=${1:-dev}

echo "🏃‍♂️ Running in mode: $MODE"
echo "🧰 Node       : $(node -v || echo 'not found')"
echo "📦 npm        : $(npm -v || echo 'not found')"

echo "---"
echo "🧹 Cleaning workspace..."
rm -rf node_modules .astro node_modules/.vite .vite .turbo dist
npm cache clean --force >/dev/null 2>&1 || true
echo "✅ Cleaning complete."

# Exit if only cleaning was requested
if [[ "$MODE" == "clean" ]]; then
  echo "---"
  echo "✅ Workspace cleaned. Exiting as requested."
  exit 0
fi

echo "---"
echo "📦 Installing dependencies (npm ci)..."
if ! npm ci; then
  echo "⚠️  npm ci failed. Regenerating lockfile with npm install..."
  npm install || { echo "❌ npm install failed"; exit 1; }
  echo "🔁 Retrying npm ci..."
  npm ci || { echo "❌ npm ci failed again. Please check for issues."; exit 1; }
fi
echo "✅ Dependencies installed."

echo "---"
echo "🔄 Syncing Astro types..."
npm run sync
echo "✅ Sync complete."
echo "---"

# --- Mode-Specific Actions ---
case "$MODE" in
  dev)
    echo "🚀 Starting dev server..."
    npm run dev
    ;;
  build)
    echo "🏗️  Running standard build..."
    npm run build
    echo "✅ Standard build complete. To preview: npm run preview"
    ;;
  ci)
    echo "🏗️  Running CI production build (local node adapter)..."
    export NODE_ENV=production
    export LOCAL_NODE_ADAPTER=1
    npm run build

    echo "---"
    echo "🧪 Post-build checks..."
    if [ ! -d "dist" ]; then
      echo "❌ FAIL: 'dist' folder not found after build." >&2
      exit 2
    fi
    if [ ! -d "dist/client" ] || [ ! -d "dist/server" ]; then
      echo "❌ FAIL: 'dist/client' or 'dist/server' outputs are missing." >&2
      ls -la dist || true
      exit 3
    fi
    echo "✅ Post-build checks passed."
    echo "---"
    echo "✅ CI build successful. To preview: npm run preview"
    ;;
  *)
    echo "❌ Unknown mode: '$MODE'. Please use 'dev', 'build', 'ci', or 'clean'." >&2
    exit 1
    ;;
esac
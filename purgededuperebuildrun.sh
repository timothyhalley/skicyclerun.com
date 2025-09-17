#!/usr/bin/env zsh
# Reset caches, reinstall deps, dedupe, and optionally rebuild (npm/pnpm/yarn)
# macOS zsh-safe wrappers

set -euo pipefail
# In zsh, unmatched globs error by default (nomatch). Allow them to expand to nothing.
setopt NULL_GLOB

# Colors
autoload -Uz colors && colors
info()    { print -P "%F{cyan}[info]%f $*"; }
warn()    { print -P "%F{yellow}[warn]%f $*"; }
error()   { print -P "%F{red}[error]%f $*"; }
success() { print -P "%F{green}[ok]%f $*"; }

# Go to script directory (repo root if you keep this there)
SCRIPT_DIR=${0:A:h}
cd "$SCRIPT_DIR"

# Defaults
ASSUME_YES=false
RESET_LOCK=false
SKIP_NPM_CACHE=false
SKIP_BUILD=false
PM="npm" # package manager: npm|pnpm|yarn

# Auto-detect PM if not explicitly set
if [[ -f pnpm-lock.yaml ]]; then PM="pnpm"
elif [[ -f yarn.lock ]]; then PM="yarn"
elif [[ -f package-lock.json ]]; then PM="npm"
fi

usage() {
  cat <<EOF
Usage: $0 [options]

Options:
  -y, --yes           run non-interactively (no confirmation)
  --reset-lock        remove lockfile (forces full re-resolution)
  --no-cache          skip package manager cache clean/verify
  --no-build          skip build step
  --manager <pm>      override package manager (npm|pnpm|yarn)
  -h, --help          show this help

Default flow:
  rm caches → (pm cache clean/verify) → install → dedupe → (build)
EOF
}

# Parse args
while (( $# > 0 )); do
  case "$1" in
    -y|--yes) ASSUME_YES=true ;;
    --reset-lock) RESET_LOCK=true ;;
    --no-cache) SKIP_NPM_CACHE=true ;;
    --no-build) SKIP_BUILD=true ;;
    --manager)
      [[ $# -lt 2 ]] && { error "Missing value for --manager"; exit 2; }
      PM="$2"; shift
      ;;
    -h|--help) usage; exit 0 ;;
    *) error "Unknown option: $1"; usage; exit 2 ;;
  esac
  shift
done

info "Using package manager: $PM"

# Confirm
if [[ "$ASSUME_YES" == false ]]; then
  print -n "This will remove caches and node_modules. Continue? [y/N] "
  read -r REPLY
  [[ "$REPLY" == "y" || "$REPLY" == "Y" ]] || { warn "Aborted."; exit 0; }
fi

# Show versions
command -v node >/dev/null 2>&1 && info "Node: $(node -v)" || warn "node not found"
case "$PM" in
  npm)  command -v npm  >/dev/null 2>&1 && info "npm: $(npm -v)"  || warn "npm not found" ;;
  pnpm) command -v pnpm >/dev/null 2>&1 && info "pnpm: $(pnpm -v)" || warn "pnpm not found" ;;
  yarn) command -v yarn >/dev/null 2>&1 && info "yarn: $(yarn -v)" || warn "yarn not found" ;;
esac

# 1) Remove local caches and build artifacts
info "Removing caches and build artifacts…"
# Core
rm -rf node_modules
rm -rf dist
# Vite (sometimes under node_modules/.vite or .vite at root)
rm -rf node_modules/.vite .vite
# Astro generated cache
rm -rf .astro
# Generic caches
rm -rf .cache
# ESLint / TS
rm -f .eslintcache
rm -f *.tsbuildinfo

# 2) Optional: remove lockfile
if [[ "$RESET_LOCK" == true ]]; then
  info "Removing lockfile (full dependency re-resolution)…"
  rm -f package-lock.json pnpm-lock.yaml yarn.lock
fi

# 3) Optional: clean PM cache
if [[ "$SKIP_NPM_CACHE" == false ]]; then
  case "$PM" in
    npm)
      info "Cleaning npm cache…"
      npm cache clean --force
      npm cache verify
      ;;
    pnpm)
      info "Cleaning pnpm store (prune)…"
      pnpm store prune || true
      ;;
    yarn)
      info "Cleaning yarn cache…"
      yarn cache clean || true
      ;;
  esac
else
  warn "Skipping package manager cache clean as requested."
fi

# 4) Install
info "Installing dependencies…"
case "$PM" in
  npm)  npm install ;;
  pnpm) pnpm install ;;
  yarn) yarn install --check-files ;;
  *) error "Unsupported package manager: $PM"; exit 2 ;;
esac

# 5) Dedupe
info "Deduping dependency tree…"
case "$PM" in
  npm)  npm dedupe || true ;;
  pnpm) pnpm dedupe || true ;;
  yarn) warn "yarn has no 'dedupe'—skipping." ;;
esac

# 6) Optional build
if [[ "$SKIP_BUILD" == false ]]; then
  info "Building project…"
  case "$PM" in
    npm)  npm run build ;;
    pnpm) pnpm run build ;;
    yarn) yarn build ;;
  esac
else
  warn "Skipping build as requested."
fi

success "Done. You can now start dev: ${PM} run dev"
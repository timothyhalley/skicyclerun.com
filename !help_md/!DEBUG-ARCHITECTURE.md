# Debug System Architecture

## Overview

Simple, environment-aware debug logging system for skicyclerun.com using **two separate approaches**:

1. **TypeScript/Astro Components** → Use `DebugConsole` utility
2. **Inline Scripts** → Use `debugLog()` helper functions

All controlled by **one environment variable**: `PUBLIC_DEBUG_OUTPUT`

---

## Environment Configuration

### Local Development (.env)

```bash
PUBLIC_DEBUG_OUTPUT=true
```

### GitHub Actions (Secrets)

- **Localhost/Dev**: `DEBUG_OUTPUT=true`
- **Production**: `DEBUG_OUTPUT=false` (or omit)

```yaml
# In .github/workflows/deploy.yml
env:
  PUBLIC_DEBUG_OUTPUT: ${{ secrets.DEBUG_OUTPUT }}
```

---

## Architecture: Two Approaches

### 1️⃣ For TypeScript/Astro Files

**Use:** `src/utils/DebugConsole.ts`

**Files:**

- `.astro` components (server-side code)
- Client `<script>` tags (module scripts)
- TypeScript files (`.ts`)

**Usage:**

```typescript
import { DebugConsole } from "@utils/DebugConsole";

// Standard logging
DebugConsole.log("User data:", userData);
DebugConsole.warn("Warning message");
DebugConsole.error("Error occurred");

// Category-specific (with emoji prefixes)
DebugConsole.auth("🔐 User logged in");
DebugConsole.api("📡 API call made");
DebugConsole.nav("🧭 Route changed");
DebugConsole.ui("🎨 Component rendered");
```

**How it works:**

- Checks `import.meta.env.PUBLIC_DEBUG_OUTPUT === 'true'`
- Only logs when environment variable is enabled
- Automatically tree-shaken in production builds

---

### 2️⃣ For Inline Scripts

**Use:** `public/scripts/debug-helper.js`

**Files:**

- Inline scripts with `is:inline` directive
- Scripts that cannot use ES6 imports
- Plain JavaScript in `<script is:inline>` tags

**Setup in BaseLayout.astro:**

```astro
<!-- Meta tag exposes debug state -->
<meta
  name="debug-enabled"
  content={import.meta.env.PUBLIC_DEBUG_OUTPUT === "true" ? "true" : "false"}
/>

<!-- Load debug helper (synchronous, before inline scripts) -->
<script is:inline src="/scripts/debug-helper.js"></script>
```

**Usage:**

```javascript
// In inline scripts
debugLog("auth", "User logged in");
debugWarn("auth", "Token expiring soon");
debugError("auth", "Login failed:", error);

// Check if debug is enabled
if (window.isDebugEnabled()) {
  // Do something debug-specific
}
```

**How it works:**

- Reads debug state from `<meta name="debug-enabled">` tag
- Creates global `window.debugLog`, `window.debugWarn`, `window.debugError`
- Only outputs to console when meta tag has `content="true"`

---

## Why Two Approaches?

### The Problem

Astro has **two execution contexts**:

1. **Server/Module Context**: TypeScript, ES6 imports work
2. **Inline Script Context**: No imports, plain JavaScript only

### The Solution

- **DebugConsole.ts**: For modern code with imports (TypeScript/ES6)
- **debug-helper.js**: For inline scripts without imports (vanilla JS)

Both read from **same environment variable** (`PUBLIC_DEBUG_OUTPUT`), so they're synchronized.

---

## Implementation Status

### ✅ Completed

- [x] Environment configuration (.env)
- [x] DebugConsole utility (TypeScript)
- [x] debug-helper.js (vanilla JS)
- [x] BaseLayout.astro integration
- [x] Auth bridge inline script migrated
- [x] Documentation (!DEBUG_CONSOLE_GUIDE.md)
- [x] Build passes successfully

### 🚧 Pending

- [ ] Migrate `public/scripts/simple-auth-icon.js` (20+ console.log statements)
- [ ] Migrate `src/pages/profile.astro` (33+ console.log statements)
- [ ] Migrate other components with sensitive logging
- [ ] Configure GitHub Actions secrets
- [ ] Test on production/staging environments

---

## Files Modified

### Created

- `src/utils/DebugConsole.ts` - TypeScript debug utility
- `public/scripts/debug-helper.js` - Vanilla JS debug helper
- `!DEBUG_CONSOLE_GUIDE.md` - Complete usage documentation
- `src/pages/debug-test.astro` - Test page for verification

### Modified

- `.env` - Added `PUBLIC_DEBUG_OUTPUT=true`
- `src/layouts/BaseLayout.astro` - Added meta tag, debug-helper.js, migrated auth logging

---

## Testing

### Local Development

```bash
# Start dev server
npm run dev

# Check browser console - should see debug logs with emoji prefixes:
# 🔐 [AUTH] window.__authBridge setup complete
# 📡 [API] Fetching user profile...
```

### Verify Debug Toggle

```bash
# Disable debug
# In .env: PUBLIC_DEBUG_OUTPUT=false
npm run dev
# Console should be clean (no debug output)

# Enable debug
# In .env: PUBLIC_DEBUG_OUTPUT=true
npm run dev
# Console should show all debug output
```

### Test Page

Visit `/debug-test` to verify:

- Server-side logging works
- Client-side logging works
- Debug state displays correctly
- All log categories work (log, warn, error, auth, api, nav, ui)

---

## Security Best Practices

### ✅ DO

- Use `DebugConsole.auth()` or `debugLog('auth', ...)` for sensitive data
- Set `DEBUG_OUTPUT=false` in production GitHub Actions
- Log user actions without exposing credentials
- Use category-specific loggers for easy filtering

### ❌ DON'T

- Never log passwords or raw credentials
- Avoid logging complete token values (use `token.substring(0, 10) + '...'`)
- Don't commit `.env` file to repository
- Don't use `console.log` directly for sensitive data

---

## Next Steps

1. **Test current implementation**
   - Start dev server
   - Test login flow
   - Verify debug output appears correctly

2. **Migrate more files incrementally**
   - Start with `simple-auth-icon.js` (highest priority)
   - Then `profile.astro`
   - Then other components

3. **Configure GitHub Actions**
   - Add `DEBUG_OUTPUT` secret to repository
   - Update deployment workflow
   - Test staging/production deployments

4. **Clean up**
   - Remove any remaining hard-coded `console.log` for sensitive data
   - Verify production has no debug output
   - Update README with debug configuration

---

## Troubleshooting

### Debug logs not appearing

- Check `.env` has `PUBLIC_DEBUG_OUTPUT=true`
- Restart dev server after changing `.env`
- Check browser console filters (might be filtering out logs)
- Verify `debug-helper.js` loads before inline scripts

### TypeScript errors about window.DebugConsole

- These are non-blocking warnings
- Runtime works correctly
- Can be fixed by adding type declarations to `src/types/global.d.ts`

### Build errors about public/ assets

- Ensure `is:inline` directive on script tags that reference `/scripts/`
- Example: `<script is:inline src="/scripts/debug-helper.js"></script>`

---

## Summary

**Simple. Clean. Pragmatic.**

✅ One environment variable  
✅ Two complementary approaches  
✅ Security-first design  
✅ Easy to test and verify  
✅ Production-safe by default

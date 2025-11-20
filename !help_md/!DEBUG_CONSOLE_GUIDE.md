# Debug Console Configuration Guide

## Overview

The DebugConsole utility provides environment-aware logging that automatically disables in production for security and performance.

## Configuration

### Local Development

Debug output is **enabled by default** for localhost via `.env`:

```env
PUBLIC_DEBUG_OUTPUT=true
```

### GitHub Actions (Production/Staging)

Set the `DEBUG_OUTPUT` secret in your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add a new secret:
   - **Name**: `DEBUG_OUTPUT`
   - **Value**: `true` (for staging) or `false` (for production)

### Workflow Integration

Update your `.github/workflows/deploy.yml`:

```yaml
jobs:
  build:
    env:
      PUBLIC_DEBUG_OUTPUT: ${{ secrets.DEBUG_OUTPUT }}
    steps:
      - name: Build site
        run: npm run build
```

## Usage

### In Astro Components

```astro
---
import { DebugConsole } from "@utils/DebugConsole";

const userData = await fetchUserData();
DebugConsole.log("User data loaded:", userData);
---

<UserCard {userData} />
```

### In TypeScript/JavaScript

```typescript
import { DebugConsole } from "@utils/DebugConsole";

export function processAuth(token: string) {
  DebugConsole.auth("Processing token:", token.substring(0, 10) + "...");

  if (!validateToken(token)) {
    DebugConsole.error("Invalid token received");
    return false;
  }

  return true;
}
```

### Category-Specific Loggers

```typescript
DebugConsole.auth("User authenticated"); // 🔐 [AUTH]
DebugConsole.api("API call to /users"); // 📡 [API]
DebugConsole.nav("Navigating to /home"); // 🧭 [NAV]
DebugConsole.ui("Rendering modal"); // 🎨 [UI]
```

### Conditional Logic

```typescript
if (DebugConsole.isEnabled()) {
  // Expensive debug operations
  const debugInfo = generateDetailedReport();
  DebugConsole.log("Full report:", debugInfo);
}
```

## Browser Scripts (Non-Module)

For scripts in `/public/scripts/`, access the environment variable at runtime:

```javascript
// public/scripts/my-script.js
const isDebug = import.meta.env.PUBLIC_DEBUG_OUTPUT === "true";

if (isDebug) {
  console.log("[DEBUG] Script loaded");
}
```

## Security Best Practices

✅ **DO:**

- Use `DebugConsole` for all debug logging
- Set `PUBLIC_DEBUG_OUTPUT=false` in production
- Log sanitized data (e.g., token prefixes, not full tokens)

❌ **DON'T:**

- Use `console.log()` directly for sensitive data
- Log complete JWT tokens or passwords
- Expose API keys or secrets in debug output

## Environment Matrix

| Environment         | PUBLIC_DEBUG_OUTPUT  | Console Output |
| ------------------- | -------------------- | -------------- |
| localhost           | `true` (default)     | ✅ Enabled     |
| dev.skicyclerun.com | `true` (via secret)  | ✅ Enabled     |
| skicyclerun.com     | `false` (via secret) | ❌ Disabled    |

## Troubleshooting

### Debug output not showing

1. Check `.env` file exists with `PUBLIC_DEBUG_OUTPUT=true`
2. Restart dev server after changing `.env`
3. Verify import path: `@utils/DebugConsole`

### Production shows debug output

1. Verify t `DEBUG_OUTPUT` is set to `false`
2. Check workflow injects `PUBLIC_DEBUG_OUTPUT` correctly
3. Rebuild and redeploy

## Migration

Replace existing console.log statements:

```typescript
// Before
console.log("User logged in:", user);

// After
import { DebugConsole } from "@utils/DebugConsole";
DebugConsole.auth("User logged in:", user);
```

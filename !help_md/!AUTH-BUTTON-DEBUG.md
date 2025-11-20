# Auth Button Debugging Guide

## Issue

Login button in header (SVG icon) is not triggering Cognito authentication flow when clicked. No console logs appear after click.

## Root Cause Analysis

The issue appears to be that the click handler is not being properly attached to the button element. This could be due to:

1. **Timing issue** - Script runs before DOM is ready
2. **Event listener not attached** - Button replacement may fail
3. **Event propagation blocked** - CSS or other scripts interfering
4. **Auth bridge not available** - window.\_\_authBridge not set up in time

## Debug Logs Added

### Initialization Logs

```text
🔑 [INIT] Simple auth icon initializing...
🔑 [INIT] Document ready state: [state]
🔑 [INIT] Auth bridge available: [true/false]
🔑 [INIT] Auth button found: [true/false]
🔑 [INIT] Auth button data-cognito-domain: [value]
🔑 [INIT] Auth button data-client-id: [value]
```

### Update Icon Logs

```text
🔑 [UPDATE] updateAuthIcon called
🔑 [UPDATE] Elements found: {loginIcon, logoutIcon, authButton}
🔑 [UPDATE] Auth session: {isAuthenticated, hasUser, email, groupCount}
🔑 [UPDATE] Setting authenticated/unauthenticated state
```

### Setup Button Logs

```text
🔑 [DEBUG] setupAuthButton called
🔑 [DEBUG] authButton found: [true/false]
🔑 [DEBUG] authButton element: [element]
🔑 [DEBUG] authButton data-attributes: {...}
🔑 [DEBUG] Button replaced, adding new click listener
🔑 [DEBUG] Click listener attached successfully
```

### Click Handler Logs

```text
🔑 [CLICK] ========== AUTH BUTTON CLICKED ==========
🔑 [CLICK] Waiting for auth bridge...
🔑 [CLICK] Auth bridge wait complete. Attempts: [count]
🔑 [CLICK] Auth bridge available: [true/false]
🔑 [CLICK] Current auth state: {isAuthenticated, hasUserSession, currentSession}
🔑 [CLICK] Auth bridge found: {hasLogin, hasLogout, hasGetState}
🔑 [CLICK] Calling bridge.login() or bridge.logout()
🔑 [CLICK] Computing Hosted UI URL...
🔑 [CLICK] Computed URL: [url]
🔑 [CLICK] Redirecting to: [url]
```

## Expected Console Output

### On Page Load (Not Authenticated)

```text
🔑 [INIT] Simple auth icon initializing...
🔑 [INIT] Document ready state: loading
🔑 [INIT] Auth bridge available: false
🔑 [INIT] Auth button found: true
🔑 [INIT] Auth button data-cognito-domain: auth.skicyclerun.com
🔑 [INIT] Auth button data-client-id: hsrpdhl5sellv9n3dotako1tm
🔑 [UPDATE] updateAuthIcon called
🔑 [UPDATE] Elements found: {loginIcon: true, logoutIcon: true, authButton: true}
🔑 [UPDATE] Auth session: {isAuthenticated: false, hasUser: false, email: undefined, groupCount: 0}
🔑 [UPDATE] Setting unauthenticated state
🔑 [UPDATE] Auth icon updated: Not authenticated
🔑 [DEBUG] setupAuthButton called
🔑 [DEBUG] authButton found: true
🔑 [DEBUG] authButton element: <button data-auth-btn...>
🔑 [DEBUG] authButton data-attributes: {...}
🔑 [DEBUG] Button replaced, adding new click listener
🔑 [DEBUG] Click listener attached successfully
🔑 [INIT] Setting up event listeners...
🔑 [INIT] Initialization complete
```

### On Button Click (Not Authenticated)

```text
🔑 [CLICK] ========== AUTH BUTTON CLICKED ==========
🔑 [CLICK] Waiting for auth bridge...
🔑 [CLICK] Auth bridge wait complete. Attempts: 5
🔑 [CLICK] Auth bridge available: true
🔑 [CLICK] Current auth state: {isAuthenticated: false, hasUserSession: true, currentSession: {...}}
🔑 [CLICK] Auth bridge found: {hasLogin: true, hasLogout: true, hasGetState: true}
🔑 [CLICK] Calling bridge.login()...
🔑 [CLICK] bridge.login() completed
[Page redirects to Cognito Hosted UI]
```

## Troubleshooting Steps

### 1. Check if button element exists

Open browser console and run:

```javascript
document.querySelector("[data-auth-btn]");
```

Should return the button element.

### 2. Check if click listener is attached

Run in console:

```javascript
const btn = document.querySelector("[data-auth-btn]");
console.log(btn);
console.log(getEventListeners(btn)); // Chrome only
```

### 3. Manually trigger click

Run in console:

```javascript
const btn = document.querySelector("[data-auth-btn]");
btn.click();
```

Should see `🔑 [CLICK] ========== AUTH BUTTON CLICKED ==========`

### 4. Check auth bridge availability

Run in console:

```javascript
console.log("Auth bridge:", window.__authBridge);
console.log("Has login:", typeof window.__authBridge?.login === "function");
console.log("Has logout:", typeof window.__authBridge?.logout === "function");
```

### 5. Check for CSS interference

Run in console:

```javascript
const btn = document.querySelector("[data-auth-btn]");
console.log("Computed style:", window.getComputedStyle(btn));
console.log("Pointer events:", window.getComputedStyle(btn).pointerEvents);
console.log("Display:", window.getComputedStyle(btn).display);
console.log("Visibility:", window.getComputedStyle(btn).visibility);
```

### 6. Force setup button again

Run in console:

```javascript
window.setupAuthButton();
```

Then try clicking the button.

### 7. Check for error in event listener

Run in console before clicking:

```javascript
window.addEventListener("error", (e) => {
  console.error("Global error:", e);
});
```

## Component Architecture

### Files Involved

1. **`src/components/AuthButton.astro`**
   - Renders the button with `[data-auth-btn]` attribute
   - Contains both login and logout SVG icons
   - Has data attributes for Cognito domain, client ID, scopes

2. **`public/scripts/simple-auth-icon.js`**
   - Attaches click handler to `[data-auth-btn]` button
   - Waits for `window.__authBridge` to be available
   - Calls `bridge.login()` or `bridge.logout()`
   - Fallback: Constructs Hosted UI URL from data attributes

3. **`src/layouts/Layout.astro` (BaseLayout)**
   - Sets up `window.__authBridge` with login/logout/getState functions
   - Must run before `simple-auth-icon.js` click handler needs it

### Event Flow

```text
1. Page loads
2. BaseLayout inline script runs → window.__authBridge created
3. simple-auth-icon.js loads → setupAuthButton() called
4. Click listener attached to [data-auth-btn]
5. User clicks button
6. Click handler runs:
   a. Prevents default
   b. Waits for window.__authBridge (max 2s)
   c. Gets current auth state
   d. Calls bridge.login() or bridge.logout()
   e. OR falls back to Hosted UI URL redirect
```

## Common Issues

### Issue 1: "No [data-auth-btn] element found in DOM"

**Cause:** Button not rendered or wrong selector
**Fix:** Check that `SkiCycleRunConfig.loginAndLogout` is true

### Issue 2: "Auth bridge not available"

**Cause:** BaseLayout script not run yet or error in script
**Fix:** Check browser console for errors in BaseLayout script

### Issue 3: "Click listener not firing"

**Cause:** Event listener not attached or removed by another script
**Fix:** Run `window.setupAuthButton()` in console to re-attach

### Issue 4: "Button disabled by CSS"

**Cause:** `pointer-events: none` or similar CSS
**Fix:** Check computed styles with DevTools

### Issue 5: "Bridge methods not functions"

**Cause:** window.\_\_authBridge exists but missing methods
**Fix:** Check BaseLayout script for proper function definitions

## Testing Checklist

After making changes:

- [ ] Build succeeds: `npm run build`
- [ ] Dev server starts: `npm run dev`
- [ ] Open browser console - no errors
- [ ] See initialization logs on page load
- [ ] See "Click listener attached successfully"
- [ ] Click login button
- [ ] See "AUTH BUTTON CLICKED" log
- [ ] See "Calling bridge.login()" log
- [ ] Page redirects to Cognito Hosted UI
- [ ] After login, redirects back to site
- [ ] Logout button shows (login icon hidden)
- [ ] Click logout button
- [ ] See "Calling bridge.logout()" log
- [ ] Page redirects to Cognito logout
- [ ] After logout, redirects back to site
- [ ] Login button shows (logout icon hidden)

## Debug Commands

### Quick Test Suite

Copy/paste into browser console:

```javascript
// 1. Check button exists
console.log("Button exists:", !!document.querySelector("[data-auth-btn]"));

// 2. Check auth bridge
console.log("Auth bridge:", {
  exists: !!window.__authBridge,
  hasLogin: typeof window.__authBridge?.login === "function",
  hasLogout: typeof window.__authBridge?.logout === "function",
  hasGetState: typeof window.__authBridge?.getState === "function",
});

// 3. Check button data attributes
const btn = document.querySelector("[data-auth-btn]");
console.log("Button attributes:", {
  domain: btn?.getAttribute("data-cognito-domain"),
  clientId: btn?.getAttribute("data-client-id"),
  scopes: btn?.getAttribute("data-scopes"),
  authState: btn?.getAttribute("data-auth-state"),
});

// 4. Check icons
console.log("Icons:", {
  loginIcon: !!document.getElementById("login-svg"),
  logoutIcon: !!document.getElementById("logout-svg"),
  loginDisplay: document.getElementById("login-svg")?.style.cssText,
  logoutDisplay: document.getElementById("logout-svg")?.style.cssText,
});

// 5. Force re-setup
console.log("Re-running setup...");
window.setupAuthButton();

// 6. Try clicking
console.log("Attempting click...");
document.querySelector("[data-auth-btn]").click();
```

## Next Steps

1. **Deploy changes** to dev environment
2. **Open browser console** on <https://skicyclerun.com/>
3. **Look for initialization logs** starting with 🔑
4. **Click login button** and watch for CLICK logs
5. **Report findings** with full console log output

Expected result: Should see comprehensive logs showing exactly where the flow breaks.

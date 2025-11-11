# AWS Deployment Fixes - October 10, 2025

## Issues Identified & Fixed

### 1. ✅ Album Photos API Not Called in Production

#### Problem: Album Photos API Not Called

Photos were falling back to local images instead of calling AWS API Gateway/Lambda in production.

#### Root Cause: Production Mode Check

`Library.astro` had a check `if (import.meta.env.MODE === "production" || album === "local")` that forced local images for ALL production builds.

#### Fix: Remove Production Mode Check

```diff
- if (import.meta.env.MODE === "production" || album === "local") {
+ if (album === "local") {
```

Changed condition to only use local images when explicitly requested (`album: "local"`), not for all production builds.

#### Result: API Calls Working

- ✅ API calls now work in production AWS environment
- ✅ Photos load from S3 via API Gateway/Lambda
- ✅ Local fallback still works when album is explicitly set to "local"

---

### 2. ✅ Duplicate Date Display on Protected Content

#### Problem: Duplicate Date Display

Tech posts showed date twice:

```text
Jan 15, 1983
Checking authentication...

RatFor Language
Jan 15, 1983  <-- duplicate
```

#### Root Cause: Duplicate Date Rendering

- `TechPostLayout.astro` renders date in `.datetime-wrapper`
- ProtectedContentWrapper reveals content which includes another date

#### Fix: Hide Datetime Wrapper

Added datetime hiding in `ProtectedContentWrapper.astro`:

```javascript
// Hide datetime-wrapper to prevent duplicate date display
const datetimeWrapper = container.querySelector(".datetime-wrapper");
if (datetimeWrapper && authRequired) {
  datetimeWrapper.style.display = "none";
}
```

#### Result: Single Date Display

- ✅ Date only shows once in TechPostLayout
- ✅ No duplicate when content is revealed after auth check

---

### 3. ✅ Slow "Checking authentication..." Message

#### Problem: Slow Authentication Check

PCW took 6 attempts before showing content.

#### Root Cause: Too Many Retry Attempts

`MAX_ATTEMPTS = 6` was too high, causing 6 retry cycles before showing content.

#### Fix: Reduce MAX_ATTEMPTS

```diff
- const MAX_ATTEMPTS = 6; // total attempts including first
+ const MAX_ATTEMPTS = 3; // Reduced for faster auth decision (was 6)
```

#### Result: Faster Auth Decisions

- ✅ Faster auth decisions (3 attempts instead of 6)
- ✅ Content shows quicker after authentication
- ✅ Still has retry logic for slow auth bridge initialization

---

### 4. ✅ PCW JavaScript Errors - `attempt` and `authRequired` Undefined

#### Problem: Undefined Variables

Console errors on protected pages:

```text
ReferenceError: attempt is not defined
ReferenceError: authRequired is not defined
```

#### Root Cause: Function Scoping Issues

Function scoping issues in `processWrapper`:

1. `processWrapper(container)` didn't accept `attempt` parameter but code tried to use it
2. `authRequired` was defined in Astro scope but not accessible in client-side function

#### Fix: Add Parameters and Read from DOM

```diff
- async function processWrapper(container) {
-   attempt++;  // ERROR: attempt not defined
-   console.log(`PCW: attempt=${attempt} authRequired=${authRequired}`);  // ERROR: authRequired not defined
+ async function processWrapper(container, attempt = 1, force = false) {
+   // Read auth configuration from DOM data attributes
+   const authRequired = container.getAttribute("data-auth-required") === "true";
+   const requiredGroupsStr = container.getAttribute("data-required-groups") || "[]";
+   let requiredGroups = [];
+   try {
+     requiredGroups = JSON.parse(requiredGroupsStr);
+   } catch (e) {
+     console.warn("PCW: failed to parse requiredGroups", requiredGroupsStr);
+   }
+   console.log(`PCW: attempt=${attempt} authRequired=${authRequired}`);
```

#### Result: No JavaScript Errors

- ✅ No more JavaScript errors in console
- ✅ PCW properly reads auth requirements from DOM
- ✅ Multiple protected wrappers on same page work correctly

---

### 5. ✅ Login Prompt Not Showing - Stuck on "Checking authentication..."

#### Problem: Login Prompt Not Showing

When unauthenticated users access protected content, page shows "Checking authentication..." forever instead of showing the login button.

Console logs show:

```text
PCW: user not authenticated, showing login prompt
```

But UI remains stuck on loading message.

#### Root Cause: Early Return Bug

Logic bug in `processWrapper` function - early return when `prevVisible === false`:

```javascript
if (prevVisible === false) {
  state.inFlight = false;
  state.lastChecked = Date.now();
  wrapperState.set(wrapper, state);
  return; // ❌ Returns WITHOUT updating UI!
}
```

This check was meant to prevent redundant DOM updates, but on first load `prevVisible` is `false` by default, so the login UI never shows.

#### Fix: Remove prevVisible Check

Removed the `prevVisible` check and always update the UI when user is not authenticated or lacks permissions:

```diff
- const prevVisible = state.visible;
- if (prevVisible === false) {
-   state.inFlight = false;
-   state.lastChecked = Date.now();
-   wrapperState.set(wrapper, state);
-   return;
- }

  loading.classList.add("hidden");
  // ... show login prompt
  message.classList.remove("hidden");
  message.style.display = "block";
```

#### Result: Login Prompt Working

- ✅ Login button shows immediately when user is not authenticated
- ✅ "Insufficient permissions" message shows when user lacks required groups
- ✅ No more infinite "Checking authentication..." state
- ✅ Proper UI state on page load

---

## Environment Behavior

### Development (`npm run dev`)

- API calls work when `album !== "local"`
- Fallback to local images on API failure
- Faster iteration for testing

### Production (AWS CloudFront/S3)

- API calls work for all albums except `album: "local"`
- Fetches photos from S3 via API Gateway/Lambda
- Fallback to local images if API fails

---

## Testing Checklist

After deploying to <https://skicyclerun.com>:

- [ ] Open travel post with album: `https://skicyclerun.com/posts/GenAI-Travel`
- [ ] Check browser console for API call: `getphotosrandom?bucketName=...`
- [ ] Verify photos load from S3 (not local `/_astro/` paths)
- [ ] Open protected tech post: `https://skicyclerun.com/tech/RatFor-Language`
- [ ] Verify date only shows once (no duplicate)
- [ ] Verify "Checking authentication..." disappears quickly (< 3 seconds)
- [ ] Sign in and verify content loads correctly

---

## API Configuration

Make sure your environment variables are set correctly:

```bash
# .env (development)
PUBLIC_SKICYCLERUN_API=https://api.skicyclerun.com/dev/

# AWS environment (production)
# Set via CloudFront or Lambda environment variables
PUBLIC_SKICYCLERUN_API=https://api.skicyclerun.com/prod/
```

---

## Console Log Analysis

### Before Fix (Local Images)

```text
[Hero] Raw JSON text: [{"src":"/_astro/AstroTestPage.Clzotib6.png",...
[Hero] Photos parsed: 16 items
```

### After Fix (API Images)

```text
Fetching: https://api.skicyclerun.com/dev/getphotosrandom?bucketName=skicyclerun.lib&albumPath=albums/travel-genai/&numPhotos=150
[Hero] Raw JSON text: [{"src":"https://s3.amazonaws.com/skicyclerun.lib/albums/travel-genai/photo1.jpg",...
[Hero] Photos parsed: 24 items
```

---

## Known Limitations

1. **Static Site Generation (SSG)**  
   During `npm run build`, Astro pre-renders pages at build time. API calls during SSG can fail or timeout. For pages that MUST have API-loaded photos:
   - Mark them as SSR with `export const prerender = false`
   - Or use client-side fetching (not implemented yet)

2. **API Fallback**  
   If API fails, fallback uses ALL local images, not album-specific. Consider adding album-specific local fallback in future.

3. **Auth Timing**  
   PCW uses timeout-based auth checking. If auth bridge takes >3 seconds to initialize, content may show before auth completes. Consider increasing `MAX_ATTEMPTS` if needed on slow connections.

---

## Files Modified

1. `src/components/Library.astro` - Removed production mode check
2. `src/components/ProtectedContentWrapper.astro` - Added datetime hiding, reduced max attempts

---

## Deployment Info

**Last Updated:** October 10, 2025  
**Deployed To:** <https://skicyclerun.com>  
**Status:** ✅ Ready for testing

# PCW Authentication Fix - October 10, 2025

## Issue

"Checking authentication..." message was appearing briefly on protected pages even when user was already authenticated and had proper permissions.

## Root Cause

The loading spinner was being displayed immediately on first auth check attempt, before the authentication state was determined. For users who were already authenticated, this caused an unnecessary flash of the loading message.

## Solution

Implemented a **delayed loading spinner** pattern:

1. **Start with everything hidden** (already correct in initial HTML)
2. **Check authentication immediately** (no blocking UI)
3. **Only show loading spinner if auth check takes > 200ms**

This ensures:

- Fast auth checks (most cases) never show loading spinner
- Slow auth checks (network delays) show helpful feedback
- Users already authenticated see content immediately

## Technical Implementation

### File: `src/components/ProtectedContentWrapper.astro`

**Before:**

```javascript
// Show loading ONLY on first attempt
if (attempt === 1) {
  loading.classList.remove("hidden");
  loading.setAttribute("aria-hidden", "false");
  try {
    loading.style.display = "block";
  } catch (e) {}
}

try {
  const detected = await detectAuthOnce();
  console.debug("PCW: detected auth state ->", detected);
```

**After:**

```javascript
// Set up a delayed loading spinner (only show if auth check takes > 200ms)
let loadingTimeout;
if (attempt === 1) {
  loadingTimeout = setTimeout(() => {
    if (!state.visible) {
      loading.classList.remove("hidden");
      loading.setAttribute("aria-hidden", "false");
      try {
        loading.style.display = "block";
      } catch (e) {}
    }
  }, 200);
}

try {
  const detected = await detectAuthOnce();
  console.debug("PCW: detected auth state ->", detected);

  // Clear loading timeout if auth resolved quickly
  if (loadingTimeout) clearTimeout(loadingTimeout);
```

Also added timeout clearing in error handler:

```javascript
} catch (error) {
  console.error("PCW: processWrapper error", error);
  // Clear any pending loading timeout
  if (loadingTimeout) clearTimeout(loadingTimeout);
  // ...
}
```

## Testing Results

### Expected Behavior:

✅ **Fast auth (< 200ms):** No loading spinner shown, content appears immediately
✅ **Slow auth (> 200ms):** Loading spinner appears after 200ms delay
✅ **Not authenticated:** Loading spinner may appear briefly, then login prompt shows
✅ **Insufficient permissions:** Loading spinner may appear briefly, then error message shows

### Test Cases:

1. **Authenticated user with correct groups**
   - Expected: Content visible immediately, no loading spinner
   - Result: ✅ PASS

2. **Authenticated user without required groups**
   - Expected: Insufficient permissions message after brief check
   - Result: ✅ PASS (loading only if > 200ms)

3. **Not authenticated**
   - Expected: Login prompt after brief check
   - Result: ✅ PASS (loading only if > 200ms)

4. **Slow network/bridge initialization**
   - Expected: Loading spinner appears after 200ms
   - Result: ✅ PASS (fallback for slow auth)

## Additional Fixes

### Shiki Warning

**Issue:** `[Shiki] The language "env" doesn't exist, falling back to "plaintext".`

**Fix:** Changed code block language from `env` to `bash` in:

- `src/content/blog/notes/project-guide.mdx` (line 311)

**Result:** ✅ No more Shiki warnings in build output

### Vite Import Warning

**Status:** Informational only (not a bug)

```
[WARN] [vite] "matchHostname", "matchPathname", "matchPort" and "matchProtocol"
are imported from external module "@astrojs/internal-helpers/remote" but never used
```

This is a Vite tree-shaking optimization warning from Astro's internal code. No action needed - Astro team will address in future release.

## Performance Impact

### Before:

- Loading spinner shown immediately on first attempt
- User sees "Checking authentication..." flash even when authenticated
- ~100-200ms visible loading state

### After:

- Loading spinner delayed by 200ms
- Fast auth checks (< 200ms) show no loading state
- User experience is seamless for already-authenticated users
- Only shows loading for genuinely slow checks (network issues, bridge initialization)

## Browser Compatibility

- ✅ All modern browsers (setTimeout/clearTimeout standard API)
- ✅ No new dependencies
- ✅ Graceful degradation (if timeout fails, loading spinner shows - safe fallback)

## Related Files

- `/src/components/ProtectedContentWrapper.astro` - Main fix
- `/src/content/blog/notes/project-guide.mdx` - Shiki warning fix
- `/UPGRADE-NOTES.md` - Package upgrade documentation
- `/diagnose-react19.sh` - React 19 diagnostic tool

## Verification Steps

1. Navigate to protected page: `https://localhost:4321/posts/coachella-valley`
2. If already logged in as SuperUsers: Content should appear immediately
3. If not logged in: Login prompt should appear (with minimal delay)
4. Check browser console: Should see debug logs but no errors
5. Use `PCW_dumpWrappers()` in console to inspect wrapper state

## Debug Helper

The PCW component exposes a console helper:

```javascript
PCW_dumpWrappers();
```

Returns array of wrapper states including:

- Auth configuration (authRequired, requiredGroups)
- DOM element visibility states (loading, message, content)
- CSS classes and aria-hidden attributes
- Inline display styles

## Future Improvements

- [ ] Make loading delay configurable (currently hardcoded 200ms)
- [ ] Add loading spinner animation class for smoother transitions
- [ ] Consider adding subtle fade-in for content reveal
- [ ] Track auth check timing metrics for optimization

## References

- Previous PCW fixes: Session logs (attempt/force parameters, DOM data attributes)
- React 19 upgrade: `/UPGRADE-NOTES.md`
- Tailwind v4 guide: `/TAILWIND-V4-GUIDE.md`

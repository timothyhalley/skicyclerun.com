# Package Upgrade Notes - October 10, 2025

## Major Version Changes

### React 18.3.1 → 19.2.0 (MAJOR)

**Impact:** HIGH - React 19 introduces breaking changes

#### Key Breaking Changes

1. **Automatic batching improvements** - May affect state update timing
2. **New JSX Transform** - Changed how JSX is compiled
3. **Removed string refs** - Must use callback refs or `React.createRef()`
4. **Concurrent features** - Different rendering behavior
5. **StrictMode changes** - More aggressive development checks

#### React Components Status

Only one React component remains in active use:

- ✅ **TravelGlobe.tsx** - Required for 3D globe (react-globe.gl dependency)
  - Location: `src/components/TravelGlobe.tsx`
  - Usage: `src/pages/travel-globe.astro`
  - Cannot be replaced: Requires React hooks + Three.js library
  - Status: Tested and working with React 19

**Note:** Search.tsx was removed (moved to .deadCode/) as it was no longer used. All other functionality has been migrated to native Astro components.

#### Recommended Actions (React)

- [x] Test all interactive components (TravelGlobe)
- [x] Check browser console for React warnings
- [x] Verify no deprecated APIs are being used
- [x] Test state management and event handlers

**Status:** All React components tested successfully with React 19.2.0

### Three.js 0.169.0 → 0.180.0 (BREAKING)

**Impact:** MEDIUM - Used by react-globe.gl

#### Potential Issues

- Rendering pipeline changes
- Camera behavior updates
- Material/lighting changes

#### Affected Components

- `src/components/TravelGlobe.tsx`

#### Recommended Actions (Three.js)

- [x] Test globe rendering and interactions
- [x] Check for visual glitches or performance issues

**Status:** TravelGlobe component tested and working with Three.js 0.180.0

### @types/node 20.14.10 → 24.7.1 (MAJOR)

**Impact:** LOW - Type definitions only, no runtime changes

### Other Updates

- Astro 5.14.1 → 5.14.4 (patch - safe)
- Tailwind 4.1.13 → 4.1.14 (minor - safe)
- @astrojs/mdx 4.3.6 → 4.3.7 (patch - safe)
- @aws-sdk 3.700.0 → 3.908.0 (major version bump but AWS SDK maintains backward compatibility)

## Responsive Breakpoint Analysis

### Tailwind Breakpoints (UNCHANGED)

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Potential React 19 CSS-in-JS Issues

React 19 may handle inline styles differently. Check:

- Components using `style={{}}` props
- Dynamic className generation
- CSS-in-JS libraries

## Testing Checklist

### Critical Paths

- [x] Build succeeds (`npm run build`)
- [x] Dev server works (`npm run dev`)
- [x] Authentication flow (login/logout)
- [x] Protected content wrapper (PCW) shows/hides correctly
- [x] Search functionality
- [x] Travel globe rendering
- [x] Photo galleries and carousels
- [x] Responsive layouts at all breakpoints
- [x] Dark/light theme switching
- [x] MDX content rendering

**Status:** All critical paths tested and working after package upgrade

### Browser Console Checks

- [x] No React warnings about deprecated APIs
- [x] No Three.js/WebGL errors
- [x] No authentication errors
- [x] No TypeScript errors in developer tools

**Status:** All console checks passed, no errors or warnings

## Rollback Instructions

If issues persist:

```bash
# Restore from backup
cp package.json.backup package.json
npm install
npm run build

# OR use git
git checkout package.json package-lock.json
npm install
npm run build
```

## Known Issues

### Issue 1: PCW "Checking authentication..." Text Visible

**Status:** ✅ FIXED
**Solution:** Modified loading spinner to only show after 200ms delay
**File:** `src/components/ProtectedContentWrapper.astro`

### Issue 2: Responsive Breakpoints Changed

**Status:** ✅ RESOLVED (False Alarm)
**Details:** Browser cache issue, resolved by restarting browser
**Cause:** Edge browser caching old styles

### Issue 3: YouTube Videos Not Showing in Protected Content

**Status:** ✅ FIXED
**Solution:** Added !important CSS overrides to video-container
**File:** `src/layouts/MDXVideo.astro`

### Issue 4: Login Button Not Working

**Status:** ✅ FIXED
**Solution:** Added wait logic for auth bridge initialization (2s timeout)
**File:** `public/scripts/simple-auth-icon.js`

**Result:** All issues resolved, site ready for production

## React 19 Migration Resources

- [React 19 Blog Post](https://react.dev/blog/2024/04/25/react-19)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Breaking Changes List](https://react.dev/blog/2024/04/25/react-19#breaking-changes)

## Production Cleanup

Files moved to `.deadCode/` directory:
- `lambda/` - Migrated to SAM project
- `public/scripts/mdxlayout3-gallery.js` - Deprecated layout experiment
- `public/scripts/auth-bridge.js` - Replaced by PCW system
- `src/components/ArchivePost.astro` - Unused component
- `src/components/Search.tsx` - Unused React component

See `PRODUCTION-CLEANUP.md` for detailed cleanup report.

# Tailwind CSS v4 - Critical Configuration Guide

## ⚠️ IMPORTANT: This Project Uses Tailwind CSS v4

**Version:** `tailwindcss@^4.1.13` (see `package.json`)

---

## 🔥 Critical Rule: Import Syntax

### ✅ CORRECT Import (Tailwind v4)

```css
@import "tailwindcss";
```

This single import includes:

- Base styles (CSS reset)
- All utility classes (flex, text-2xl, etc.)
- All component classes
- Everything you need!

### ❌ WRONG Imports (Tailwind v3 syntax - DO NOT USE)

```css
/* These will BREAK the build in v4! */
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";
@import "tailwindcss/preflight";
```

---

## 📍 Where to Find This

**File:** `src/styles/base.css` (lines 1-20)

This is the **ONLY** place where Tailwind is imported. Do not add Tailwind imports elsewhere!

---

## 🐛 Symptoms of Broken Tailwind Import

If the import is wrong, you'll see:

- ❌ Build errors: "Package path ./base is not exported"
- ❌ Tailwind utility classes don't work (text-2xl, flex, etc.)
- ❌ Browser shows default 16px font, left-aligned text
- ❌ Computed styles show defaults instead of Tailwind values

---

## 🎯 Key Differences: v3 vs v4

| Feature | Tailwind v3                                                         | Tailwind v4                      |
| ------- | ------------------------------------------------------------------- | -------------------------------- |
| Import  | `@tailwind base/components/utilities;` or `@import "tailwindcss/*"` | `@import "tailwindcss";`         |
| Config  | `tailwind.config.js` (required)                                     | `tailwind.config.cjs` (optional) |
| JIT     | Optional                                                            | Always on                        |

---

## 📚 Official Documentation

- [Tailwind v4 Beta Docs](https://tailwindcss.com/docs/v4-beta)
- [v3 to v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)

---

## 🚨 For Future AI Assistants / Developers

**Before making ANY CSS changes:**

1. ✅ Check `package.json` to confirm Tailwind version
2. ✅ Read this file (`TAILWIND-V4-GUIDE.md`)
3. ✅ Verify `src/styles/base.css` has correct import
4. ❌ DO NOT use v3 syntax
5. ❌ DO NOT add scoped `<style>` blocks that override Tailwind utilities
6. ✅ Use Tailwind utility classes directly in templates
7. ✅ Use theme-aware classes like `text-skin-base` for dark mode

---

## 🎨 This Project's CSS Strategy

1. **Tailwind First:** Use utility classes for all styling
2. **Theme Variables:** Use `text-skin-base`, `bg-skin-card`, etc. (defined in `base.css`)
3. **Avoid Scoped Styles:** Scoped Astro `<style>` blocks have higher specificity and will override Tailwind
4. **Component Styles:** Only use scoped styles for truly unique layouts, not for utilities

---

## ✅ Verified Working (as of 2025-10-09)

- ✅ All Tailwind utility classes work globally
- ✅ Responsive breakpoints (sm, md, lg, xl)
- ✅ Dark mode with `dark:` variants
- ✅ Custom theme colors (`text-skin-base`, etc.)
- ✅ Component-level Tailwind classes

---

**Last Updated:** October 9, 2025  
**Issue Fixed:** Switched from `@import "tailwindcss/preflight"` to `@import "tailwindcss"`  
**Impact:** Project-wide - ALL pages now have working Tailwind utilities

# Theme System Best Practices Guide

## Overview

This project uses a **centralized CSS custom properties system** with Tailwind v4 for consistent, maintainable theming across light and dark modes.

## The System Architecture

### 1. CSS Custom Properties (Source of Truth)

Location: `src/styles/base.css`

```css
@layer base {
  :root,
  html[data-theme="light"] {
    --color-fill: 251, 254, 251; /* Background color */
    --color-text-base: 40, 39, 40; /* Text color (dark text for light mode) */
    --color-accent: 0, 108, 172; /* Accent color (blue) */
    --color-card: 230, 230, 230; /* Card backgrounds */
    --color-card-muted: 205, 205, 205; /* Muted card backgrounds */
    --color-border: 236, 233, 233; /* Border colors */
  }

  html[data-theme="dark"] {
    --color-fill: 33, 39, 55; /* Background color (dark blue) */
    --color-text-base:
      234, 237, 243; /* Text color (light text for dark mode) */
    --color-accent: 255, 107, 1; /* Accent color (orange) */
    --color-card: 52, 63, 96; /* Card backgrounds (darker) */
    --color-card-muted: 138, 51, 2; /* Muted card backgrounds */
    --color-border: 171, 75, 8; /* Border colors */
  }
}
```

**Why RGB values without `rgb()`?**

- Allows alpha channel manipulation: `rgb(var(--color-text-base) / 0.5)`
- More flexible for Tailwind's `<alpha-value>` placeholder
- Single source for multiple opacity variants

### 2. Tailwind Utility Classes (Consumption Layer)

Location: `tailwind.config.cjs`

```javascript
theme: {
  extend: {
    textColor: {
      skin: {
        base: withOpacity("--color-text-base"),      // ✅ Use this for ALL text
        accent: withOpacity("--color-accent"),       // ✅ Use for accent text
        inverted: withOpacity("--color-fill"),       // ✅ Use for inverted text
      }
    },
    backgroundColor: {
      skin: {
        fill: withOpacity("--color-fill"),           // ✅ Use for backgrounds
        accent: withOpacity("--color-accent"),       // ✅ Use for accent backgrounds
        card: withOpacity("--color-card"),           // ✅ Use for card backgrounds
        "card-muted": withOpacity("--color-card-muted"),
      }
    },
    // ... other color utilities
  }
}
```

## Usage Patterns

### ✅ CORRECT: Theme-Aware Classes

#### Text Colors

```astro
<!-- Navigation links -->
<a class="text-skin-base">Posts</a>

<!-- Accent text -->
<span class="text-skin-accent">Featured</span>

<!-- With opacity -->
<p class="text-skin-base/50">Subtle text</p>
```

#### Background Colors

```astro
<!-- Card backgrounds -->
<div class="bg-skin-card">Card content</div>

<!-- Page backgrounds -->
<section class="bg-skin-fill">Page section</section>

<!-- Accent buttons -->
<button class="bg-skin-accent text-white">Click me</button>
```

#### SVG Icons

```astro
<!-- Icons inherit from parent text color -->
<a class="text-skin-base">
  <svg fill="currentColor">...</svg>
</a>

<!-- Or use fill-skin-base directly -->
<svg class="fill-skin-base">...</svg>
```

### ❌ WRONG: Hardcoded Colors

```astro
<!-- DON'T DO THIS - hardcoded Tailwind colors -->
<a class="text-slate-900 dark:text-slate-100">Posts</a>
<button class="text-gray-800 dark:text-gray-200">Click</button>
<div class="bg-blue-500 dark:bg-orange-500">Card</div>

<!-- DON'T DO THIS - inline styles -->
<a style="color: #282728;">Posts</a>
<div style="background: #e6e6e6;">Card</div>

<!-- DON'T DO THIS - scoped styles with hardcoded colors -->
<style>
  .my-text {
    color: #282728;
  }
  .dark .my-text {
    color: #eaedf3;
  }
</style>
```

## Why This System is Better

### ✅ Single Source of Truth

- Change colors once in `base.css`
- Automatically updates everywhere
- No hunting through files for hardcoded colors

### ✅ No `dark:` Prefixes Needed

```astro
<!-- OLD WAY (hardcoded) -->
<a class="text-gray-900 dark:text-gray-100">Link</a>

<!-- NEW WAY (theme-aware) -->
<a class="text-skin-base">Link</a>
```

### ✅ Consistent Across Components

- All text uses same base color
- All accents match
- All cards have consistent styling
- Theme switching is instantaneous

### ✅ Easy Theme Customization

Want to change the dark mode accent from orange to purple?

```css
html[data-theme="dark"] {
  --color-accent: 168, 85, 247; /* purple-500 */
}
```

Done! Every accent color in the app updates automatically.

## Common Scenarios

### Adding New Colors to Theme

1. Add CSS variable in `base.css`:

```css
:root {
  --color-warning: 245, 158, 11; /* amber-500 */
}
html[data-theme="dark"] {
  --color-warning: 251, 191, 36; /* amber-400 */
}
```

2. Add Tailwind utility in `tailwind.config.cjs`:

```javascript
textColor: {
  skin: {
    warning: withOpacity("--color-warning"),
  }
}
```

3. Use in components:

```astro
<div class="text-skin-warning">Warning message</div>
```

### Component-Level Styling

**Prefer Tailwind utilities:**

```astro
<nav class="text-skin-base">
  <a class="hover:text-skin-accent">Link</a>
</nav>
```

**If you need scoped styles, use CSS variables:**

```astro
<style>
  nav {
    color: rgb(var(--color-text-base));
  }
  nav:hover {
    color: rgb(var(--color-accent));
  }
</style>
```

### SVG Icon Colors

Icons should always inherit or use theme colors:

```astro
<!-- Inherit from parent -->
<a class="text-skin-base">
  <svg fill="currentColor" stroke="currentColor">...</svg>
</a>

<!-- Or use fill utilities -->
<svg class="fill-skin-base stroke-skin-accent">...</svg>
```

## Migration Checklist

When you find hardcoded colors in components:

1. ✅ Replace `text-slate-*`, `text-gray-*` → `text-skin-base`
2. ✅ Replace `bg-slate-*`, `bg-gray-*` → `bg-skin-card` or `bg-skin-fill`
3. ✅ Remove all `dark:text-*` prefixes (theme system handles it)
4. ✅ Replace `color: #hexcode` → `color: rgb(var(--color-text-base))`
5. ✅ Replace `fill="currentColor"` with parent `text-skin-base`

## Testing Your Changes

### Light Mode

1. Switch to light theme (sun icon)
2. Text should be dark (`#282728`)
3. Backgrounds should be light (`#fbfefb`)
4. Icons should be visible and dark

### Dark Mode

1. Switch to dark theme (moon icon)
2. Text should be light (`#eaedf3`)
3. Backgrounds should be dark (`#212737`)
4. Icons should be visible and light

### Verification

- Navigation links: clearly visible in both themes
- Icons: match text color, never invisible
- Cards: proper contrast against background
- Hover states: accent color works in both themes

## Related Documentation

- [TAILWIND-V4-GUIDE.md](./TAILWIND-V4-GUIDE.md) - Tailwind v4 import syntax
- [tailwind.config.cjs](./tailwind.config.cjs) - Tailwind configuration
- [src/styles/base.css](./src/styles/base.css) - CSS custom properties

## Summary

**The Golden Rule:**

> Never hardcode colors in components. Always use `text-skin-base`, `bg-skin-card`, `fill-skin-base`, etc.

This gives you:

- ✅ Automatic theme switching
- ✅ Consistent colors project-wide
- ✅ Easy global customization
- ✅ Maintainable codebase
- ✅ Future-proof architecture

# LLM Directives

/\*

- CRITICAL: Tailwind CSS v4 Import
- ===================================
- This project uses Tailwind CSS v4.x (see package.json: "tailwindcss": "^4.1.13")
-
- TAILWIND V4 IMPORT SYNTAX:
- @import "tailwindcss"; ✅ CORRECT - imports all utilities, components, and base styles
-
- DO NOT USE V3 SYNTAX (will break):
- @import "tailwindcss/base"; ❌ WRONG for v4
- @import "tailwindcss/components"; ❌ WRONG for v4
- @import "tailwindcss/utilities"; ❌ WRONG for v4
- @import "tailwindcss/preflight"; ❌ WRONG for v4
-
- Without the correct import, NO Tailwind utility classes (text-2xl, flex, etc.) will work!
-
- See: <https://tailwindcss.com/docs/v4-beta>
  \*/

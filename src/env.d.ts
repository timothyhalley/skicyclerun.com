/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// If your editor still reports missing modules for astro:* virtual imports,
// ensure you've run `npm run sync` (or `astro sync`) and are using the
// workspace TypeScript version in VS Code.

// Aaugment to allow JSON import if not already declared
declare module "*.json" {
  const value: any;
  export default value;
}

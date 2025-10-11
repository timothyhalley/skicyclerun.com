// Ambient module declarations to improve editor/TS experience for non-TS assets
declare module "*.css";
declare module "*.svg" {
  const src: string;
  export default src;
}

// In case some tools can't resolve astro:assets types at design-time
declare module "astro:assets" {
  export const Image: any;
}

// Fallback for editor diagnostics that don't load Astro's ambient types early enough
declare const Astro: any;

// Third-party modules without types
declare module "react-globe.gl" {
  const Globe: any;
  export default Globe;
}

// React types are provided via @types/react and tsconfig jsxImportSource.

// Relaxed JSX intrinsic elements to quiet JSX typing in isolated files
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

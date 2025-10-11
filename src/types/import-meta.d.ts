// Ensure Vite's import.meta helpers are typed
/// <reference types="vite/client" />

interface ImportMeta {
  glob: (
    pattern: string,
    options?: { eager?: boolean; import?: string }
  ) => Record<string, unknown>;
}

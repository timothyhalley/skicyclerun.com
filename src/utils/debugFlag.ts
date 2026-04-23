export function isDebugEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.PUBLIC_DEBUG_OUTPUT === "true";
}

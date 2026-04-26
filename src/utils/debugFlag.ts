export function isDebugEnabled(): boolean {
  return import.meta.env.PUBLIC_DEBUG_OUTPUT === "true";
}

export function siteOrigin() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:4321";
  }
  return import.meta.env.SITE || "http://localhost:4321";
}
/**
 * Debug Helper for Inline Scripts
 *
 * Simple vanilla JavaScript debug wrapper for inline scripts that cannot use ES6 imports.
 * Reads debug state from meta tag set by Astro.
 *
 * Usage in inline scripts:
 *   debugLog('auth', 'User logged in');
 *   debugError('auth', 'Login failed:', error);
 */

(function () {
  "use strict";

  // Read debug flag from meta tag
  function isDebugEnabled() {
    const meta = document.querySelector('meta[name="debug-enabled"]');
    return meta && meta.content === "true";
  }

  const PREFIXES = {
    auth: "[DEBUG][AUTH]",
    api: "[DEBUG][API]",
    nav: "[DEBUG][NAV]",
    ui: "[DEBUG][UI]",
  };

  function prefix(category) {
    return PREFIXES[category] || "[DEBUG]";
  }

  // Create global debug helpers
  window.debugLog = function (category, ...args) {
    if (!isDebugEnabled()) return;
    console.log(prefix(category), ...args);
  };

  window.debugWarn = function (category, ...args) {
    if (!isDebugEnabled()) return;
    console.warn(prefix(category), ...args);
  };

  window.debugError = function (category, ...args) {
    if (!isDebugEnabled()) return;
    console.error(prefix(category), ...args);
  };

  // Helper to check if debug is enabled
  window.isDebugEnabled = isDebugEnabled;

  // Startup banner — one line so you instantly know the gate state
  const state = isDebugEnabled() ? "ON" : "OFF";
  const style = isDebugEnabled()
    ? "background:#16a34a;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold"
    : "background:#6b7280;color:#fff;padding:2px 6px;border-radius:3px";
  console.log("%c[DEBUG] %s", style, `Debug output: ${state}`);
})();

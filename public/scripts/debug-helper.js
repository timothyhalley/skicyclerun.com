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

  // Create global debug helpers
  window.debugLog = function (category, ...args) {
    if (!isDebugEnabled()) return;

    const prefix =
      {
        auth: "🔐 [AUTH]",
        api: "📡 [API]",
        nav: "🧭 [NAV]",
        ui: "🎨 [UI]",
      }[category] || "[DEBUG]";

    console.log(prefix, ...args);
  };

  window.debugWarn = function (category, ...args) {
    if (!isDebugEnabled()) return;

    const prefix =
      {
        auth: "🔐 [AUTH]",
        api: "📡 [API]",
        nav: "🧭 [NAV]",
        ui: "🎨 [UI]",
      }[category] || "[DEBUG]";

    console.warn(prefix, ...args);
  };

  window.debugError = function (category, ...args) {
    if (!isDebugEnabled()) return;

    const prefix =
      {
        auth: "🔐 [AUTH]",
        api: "📡 [API]",
        nav: "🧭 [NAV]",
        ui: "🎨 [UI]",
      }[category] || "[DEBUG]";

    console.error(prefix, ...args);
  };

  // Helper to check if debug is enabled
  window.isDebugEnabled = isDebugEnabled;
})();

/**
 * DebugConsole - Environment-aware debug logging utility
 *
 * Uses Astro's PUBLIC_DEBUG_OUTPUT environment variable to control logging.
 * - Localhost: Always enabled (via .env)
 * - Staging: Controlled via GitHub Actions secret
 * - Production: Disabled for security
 *
 * Usage:
 *   import { DebugConsole } from '@utils/DebugConsole';
 *   DebugConsole.log('User data:', userData);
 *   DebugConsole.auth('Token received:', token);
 */

const isDebugEnabled = import.meta.env.PUBLIC_DEBUG_OUTPUT === "true";

export const DebugConsole = {
  /**
   * Standard log output
   */
  log: (...args: unknown[]) => {
    if (isDebugEnabled) console.log("[DEBUG]", ...args);
  },

  /**
   * Warning messages
   */
  warn: (...args: unknown[]) => {
    if (isDebugEnabled) console.warn("[DEBUG]", ...args);
  },

  /**
   * Error messages
   */
  error: (...args: unknown[]) => {
    if (isDebugEnabled) console.error("[DEBUG]", ...args);
  },

  /**
   * Stack trace debugging
   */
  trace: (...args: unknown[]) => {
    if (isDebugEnabled) console.trace("[DEBUG]", ...args);
  },

  /**
   * Info messages
   */
  info: (...args: unknown[]) => {
    if (isDebugEnabled) console.info("[DEBUG]", ...args);
  },

  // Category-specific loggers with emojis for easy filtering

  /**
   * Authentication & authorization logs
   */
  auth: (...args: unknown[]) => {
    if (isDebugEnabled) console.log("🔐 [AUTH]", ...args);
  },

  /**
   * API call logs
   */
  api: (...args: unknown[]) => {
    if (isDebugEnabled) console.log("📡 [API]", ...args);
  },

  /**
   * Navigation & routing logs
   */
  nav: (...args: unknown[]) => {
    if (isDebugEnabled) console.log("🧭 [NAV]", ...args);
  },

  /**
   * UI component logs
   */
  ui: (...args: unknown[]) => {
    if (isDebugEnabled) console.log("🎨 [UI]", ...args);
  },

  /**
   * Check if debug mode is currently enabled
   */
  isEnabled: () => isDebugEnabled,
};

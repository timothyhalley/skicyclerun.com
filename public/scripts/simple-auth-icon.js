/**
 * simple-auth-icon.js (clean version)
 * Minimal script to drive the header SVG auth button without bundler deps.
 * Prefers a window.__authBridge provided by the app (login/logout/getState).
 * Falls back to constructing Hosted UI URLs from data- attributes on #auth-btn.
 */

(function () {
  if (typeof window === "undefined") return;
  if (window.__authIconInitialized) return;
  window.__authIconInitialized = true;

  // Try to read auth state via bridge; fallback to cookie sniffing
  async function getAuthSession() {
    try {
      if (
        window.__authBridge &&
        typeof window.__authBridge.getState === "function"
      ) {
        const state = await window.__authBridge.getState();
        const session = {
          signedIn: !!state?.signedIn,
          user: state?.email ? { email: state.email } : null,
          groups: Array.isArray(state?.groups) ? state.groups : [],
        };
        window.__userSession = session;
        return session;
      }
    } catch {}
    try {
      const cookies = (document.cookie || "").split(";");
      const names = [
        "cognito_id_token",
        "cognito_access_token",
        "CognitoIdentityServiceProvider",
      ];
      const hasAny = cookies.some((c) => {
        const t = c.trim();
        return names.some((n) => t.startsWith(n + "="));
      });
      const sess = { signedIn: hasAny, user: null, groups: [] };
      window.__userSession = sess;
      return sess;
    } catch {
      return { signedIn: false, user: null, groups: [] };
    }
  }

  function computeHostedUiUrl(isLogout) {
    const btn = document.querySelector("[data-auth-btn]");
    const domain = btn?.getAttribute("data-cognito-domain");
    const clientId = btn?.getAttribute("data-client-id");
    const origin = window.location.origin + "/";
    if (!domain || !clientId) return null;
    const url = new URL(
      `https://${domain}${isLogout ? "/logout" : "/oauth2/authorize"}`,
    );
    url.searchParams.set("client_id", clientId);
    if (isLogout) {
      url.searchParams.set("logout_uri", origin);
    } else {
      url.searchParams.set("response_type", "code");
      url.searchParams.set("redirect_uri", origin);
      const scopes = btn?.getAttribute("data-scopes") || "openid email profile";
      url.searchParams.set("scope", scopes);
    }
    return url.toString();
  }

  async function updateAuthIcon() {
    debugLog("auth", "🔑 [UPDATE] updateAuthIcon called");

    const loginIcon = document.getElementById("login-svg");
    const logoutIcon = document.getElementById("logout-svg");
    const authButton = document.querySelector("[data-auth-btn]");

    debugLog("auth", "🔑 [UPDATE] Elements found:", {
      loginIcon: !!loginIcon,
      logoutIcon: !!logoutIcon,
      authButton: !!authButton,
    });

    if (!authButton || !loginIcon || !logoutIcon) {
      debugWarn("auth", "🔑 [UPDATE] Missing required elements, aborting");
      return;
    }

    const session = await getAuthSession();
    const isAuthenticated = !!session?.signedIn;

    debugLog("auth", "🔑 [UPDATE] Auth session:", {
      isAuthenticated,
      hasUser: !!session?.user,
      email: session?.user?.email,
      groupCount: session?.groups?.length || 0,
    });

    if (isAuthenticated) {
      debugLog("auth", "🔑 [UPDATE] Setting authenticated state");
      loginIcon.style.cssText = "display: none !important;";
      logoutIcon.style.cssText = "display: inline !important;";
      authButton.setAttribute("data-auth-state", "authenticated");
      authButton.title = "Logout";
      authButton.setAttribute("aria-label", "Logout");
      document.documentElement.classList.add("auth-logged-in");
      document.documentElement.classList.remove("auth-logged-out");
      // Notify other components (footer) of auth state change
      try {
        document.dispatchEvent(
          new CustomEvent("auth-changed", { detail: { authenticated: true } }),
        );
      } catch {}
    } else {
      debugLog("auth", "🔑 [UPDATE] Setting unauthenticated state");
      loginIcon.style.cssText = "display: inline !important;";
      logoutIcon.style.cssText = "display: none !important;";
      authButton.setAttribute("data-auth-state", "unauthenticated");
      authButton.title = "Login";
      authButton.setAttribute("aria-label", "Login");
      document.documentElement.classList.add("auth-logged-out");
      document.documentElement.classList.remove("auth-logged-in");
      try {
        document.dispatchEvent(
          new CustomEvent("auth-changed", { detail: { authenticated: false } }),
        );
      } catch {}
    }

    debugLog(
      "auth",
      "🔑 [UPDATE] Auth icon updated:",
      isAuthenticated ? "Authenticated" : "Not authenticated",
    );
  }

  function setupAuthButton() {
    const authButton = document.querySelector("[data-auth-btn]");

    debugLog("auth", "🔑 [DEBUG] setupAuthButton called");
    debugLog("auth", "🔑 [DEBUG] authButton found:", !!authButton);

    if (!authButton) {
      debugWarn("auth", "🔑 [DEBUG] No [data-auth-btn] element found in DOM");
      return;
    }

    debugLog("auth", "🔑 [DEBUG] authButton element:", authButton);
    debugLog("auth", "🔑 [DEBUG] authButton data-attributes:", {
      "data-cognito-domain": authButton.getAttribute("data-cognito-domain"),
      "data-client-id": authButton.getAttribute("data-client-id"),
      "data-scopes": authButton.getAttribute("data-scopes"),
      "data-auth-state": authButton.getAttribute("data-auth-state"),
    });

    // Remove existing listeners by replacing node
    const replacement = authButton.cloneNode(true);
    authButton.parentNode.replaceChild(replacement, authButton);

    debugLog("auth", "🔑 [DEBUG] Button replaced, adding new click listener");

    replacement.addEventListener("click", async (e) => {
      debugLog("auth", "🔑 [CLICK] ========== AUTH BUTTON CLICKED ==========");
      e.preventDefault();
      e.stopPropagation();

      // Wait for auth bridge to be ready (max 2 seconds)
      debugLog("auth", "🔑 [CLICK] Waiting for auth bridge...");
      let attempts = 0;
      while (!window.__authBridge && attempts < 20) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      debugLog(
        "auth",
        "🔑 [CLICK] Auth bridge wait complete. Attempts:",
        attempts,
      );
      debugLog(
        "auth",
        "🔑 [CLICK] Auth bridge available:",
        !!window.__authBridge,
      );

      const current = window.__userSession || (await getAuthSession());
      const isAuthenticated = !!current?.signedIn;

      debugLog("auth", "🔑 [CLICK] Current auth state:", {
        isAuthenticated,
        hasUserSession: !!window.__userSession,
        currentSession: current,
      });

      // Prefer bridge callbacks
      try {
        const bridge = window.__authBridge;
        if (bridge) {
          debugLog("auth", "🔑 [CLICK] Auth bridge found:", {
            hasLogin: typeof bridge.login === "function",
            hasLogout: typeof bridge.logout === "function",
            hasGetState: typeof bridge.getState === "function",
          });

          if (isAuthenticated && typeof bridge.logout === "function") {
            debugLog("auth", "🔑 [CLICK] Calling bridge.logout()...");
            await bridge.logout();
            debugLog("auth", "🔑 [CLICK] bridge.logout() completed");
            return;
          }
          if (!isAuthenticated && typeof bridge.login === "function") {
            debugLog("auth", "🔑 [CLICK] Calling bridge.login()...");
            await bridge.login();
            debugLog("auth", "🔑 [CLICK] bridge.login() completed");
            return;
          }

          debugWarn(
            "auth",
            "🔑 [CLICK] Bridge exists but missing required method",
          );
        } else {
          debugWarn(
            "auth",
            "🔑 [CLICK] No auth bridge available, falling back to Hosted UI URL",
          );
        }
      } catch (err) {
        debugError("auth", "🔑 [CLICK] Bridge error:", err);
      }

      // Fallback: compute Hosted UI URL directly
      debugLog("auth", "🔑 [CLICK] Computing Hosted UI URL...");
      const url = computeHostedUiUrl(isAuthenticated /* logout? */);
      debugLog("auth", "🔑 [CLICK] Computed URL:", url);

      if (url) {
        debugLog("auth", "🔑 [CLICK] Redirecting to:", url);
        window.location.assign(url);
        return;
      }

      debugError(
        "auth",
        "🔑 [CLICK] FAILED: Unable to compute Hosted UI URL (missing data attributes)",
      );
      debugError("auth", "🔑 [CLICK] Button data attributes:", {
        domain: replacement.getAttribute("data-cognito-domain"),
        clientId: replacement.getAttribute("data-client-id"),
        scopes: replacement.getAttribute("data-scopes"),
      });
    });

    debugLog("auth", "🔑 [DEBUG] Click listener attached successfully");
  }

  function init() {
    debugLog("auth", "🔑 [INIT] Simple auth icon initializing...");
    debugLog("auth", "🔑 [INIT] Document ready state:", document.readyState);
    debugLog("auth", "🔑 [INIT] Auth bridge available:", !!window.__authBridge);

    const authButton = document.querySelector("[data-auth-btn]");
    debugLog("auth", "🔑 [INIT] Auth button found:", !!authButton);

    if (authButton) {
      debugLog(
        "auth",
        "🔑 [INIT] Auth button data-cognito-domain:",
        authButton.getAttribute("data-cognito-domain"),
      );
      debugLog(
        "auth",
        "🔑 [INIT] Auth button data-client-id:",
        authButton.getAttribute("data-client-id"),
      );
    }

    updateAuthIcon();
    setupAuthButton();

    debugLog("auth", "🔑 [INIT] Setting up event listeners...");

    document.addEventListener("DOMContentLoaded", () => {
      debugLog("auth", "🔑 [EVENT] DOMContentLoaded fired");
      updateAuthIcon();
      setupAuthButton();
    });
    document.addEventListener("astro:page-load", () => {
      debugLog("auth", "🔑 [EVENT] astro:page-load fired");
      setTimeout(updateAuthIcon, 10);
      setTimeout(setupAuthButton, 20);
    });
    document.addEventListener("astro:after-swap", () => {
      debugLog("auth", "🔑 [EVENT] astro:after-swap fired");
      setTimeout(updateAuthIcon, 10);
      setTimeout(setupAuthButton, 20);
    });
    window.addEventListener("focus", () => {
      debugLog("auth", "🔑 [EVENT] window focus");
      updateAuthIcon();
    });
    document.addEventListener("visibilitychange", () => {
      debugLog(
        "auth",
        "🔑 [EVENT] visibilitychange, state:",
        document.visibilityState,
      );
      if (document.visibilityState === "visible") updateAuthIcon();
    });

    debugLog("auth", "🔑 [INIT] Initialization complete");
  }

  init();
  window.updateAuthIcon = updateAuthIcon;
  window.setupAuthButton = setupAuthButton;
})();

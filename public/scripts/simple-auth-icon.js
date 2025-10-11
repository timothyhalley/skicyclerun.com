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
    console.log("🔑 [UPDATE] updateAuthIcon called");

    const loginIcon = document.getElementById("login-svg");
    const logoutIcon = document.getElementById("logout-svg");
    const authButton = document.querySelector("[data-auth-btn]");

    console.log("🔑 [UPDATE] Elements found:", {
      loginIcon: !!loginIcon,
      logoutIcon: !!logoutIcon,
      authButton: !!authButton,
    });

    if (!authButton || !loginIcon || !logoutIcon) {
      console.warn("🔑 [UPDATE] Missing required elements, aborting");
      return;
    }

    const session = await getAuthSession();
    const isAuthenticated = !!session?.signedIn;

    console.log("🔑 [UPDATE] Auth session:", {
      isAuthenticated,
      hasUser: !!session?.user,
      email: session?.user?.email,
      groupCount: session?.groups?.length || 0,
    });

    if (isAuthenticated) {
      console.log("🔑 [UPDATE] Setting authenticated state");
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
      console.log("🔑 [UPDATE] Setting unauthenticated state");
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

    console.log(
      "🔑 [UPDATE] Auth icon updated:",
      isAuthenticated ? "Authenticated" : "Not authenticated",
    );
  }

  function setupAuthButton() {
    const authButton = document.querySelector("[data-auth-btn]");

    console.log("🔑 [DEBUG] setupAuthButton called");
    console.log("🔑 [DEBUG] authButton found:", !!authButton);

    if (!authButton) {
      console.warn("🔑 [DEBUG] No [data-auth-btn] element found in DOM");
      return;
    }

    console.log("🔑 [DEBUG] authButton element:", authButton);
    console.log("🔑 [DEBUG] authButton data-attributes:", {
      "data-cognito-domain": authButton.getAttribute("data-cognito-domain"),
      "data-client-id": authButton.getAttribute("data-client-id"),
      "data-scopes": authButton.getAttribute("data-scopes"),
      "data-auth-state": authButton.getAttribute("data-auth-state"),
    });

    // Remove existing listeners by replacing node
    const replacement = authButton.cloneNode(true);
    authButton.parentNode.replaceChild(replacement, authButton);

    console.log("🔑 [DEBUG] Button replaced, adding new click listener");

    replacement.addEventListener("click", async (e) => {
      console.log("🔑 [CLICK] ========== AUTH BUTTON CLICKED ==========");
      e.preventDefault();
      e.stopPropagation();

      // Wait for auth bridge to be ready (max 2 seconds)
      console.log("🔑 [CLICK] Waiting for auth bridge...");
      let attempts = 0;
      while (!window.__authBridge && attempts < 20) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      console.log("🔑 [CLICK] Auth bridge wait complete. Attempts:", attempts);
      console.log("🔑 [CLICK] Auth bridge available:", !!window.__authBridge);

      const current = window.__userSession || (await getAuthSession());
      const isAuthenticated = !!current?.signedIn;

      console.log("🔑 [CLICK] Current auth state:", {
        isAuthenticated,
        hasUserSession: !!window.__userSession,
        currentSession: current,
      });

      // Prefer bridge callbacks
      try {
        const bridge = window.__authBridge;
        if (bridge) {
          console.log("🔑 [CLICK] Auth bridge found:", {
            hasLogin: typeof bridge.login === "function",
            hasLogout: typeof bridge.logout === "function",
            hasGetState: typeof bridge.getState === "function",
          });

          if (isAuthenticated && typeof bridge.logout === "function") {
            console.log("🔑 [CLICK] Calling bridge.logout()...");
            await bridge.logout();
            console.log("🔑 [CLICK] bridge.logout() completed");
            return;
          }
          if (!isAuthenticated && typeof bridge.login === "function") {
            console.log("🔑 [CLICK] Calling bridge.login()...");
            await bridge.login();
            console.log("🔑 [CLICK] bridge.login() completed");
            return;
          }

          console.warn("🔑 [CLICK] Bridge exists but missing required method");
        } else {
          console.warn(
            "🔑 [CLICK] No auth bridge available, falling back to Hosted UI URL",
          );
        }
      } catch (err) {
        console.error("🔑 [CLICK] Bridge error:", err);
      }

      // Fallback: compute Hosted UI URL directly
      console.log("🔑 [CLICK] Computing Hosted UI URL...");
      const url = computeHostedUiUrl(isAuthenticated /* logout? */);
      console.log("🔑 [CLICK] Computed URL:", url);

      if (url) {
        console.log("🔑 [CLICK] Redirecting to:", url);
        window.location.assign(url);
        return;
      }

      console.error(
        "🔑 [CLICK] FAILED: Unable to compute Hosted UI URL (missing data attributes)",
      );
      console.error("🔑 [CLICK] Button data attributes:", {
        domain: replacement.getAttribute("data-cognito-domain"),
        clientId: replacement.getAttribute("data-client-id"),
        scopes: replacement.getAttribute("data-scopes"),
      });
    });

    console.log("🔑 [DEBUG] Click listener attached successfully");
  }

  function init() {
    console.log("🔑 [INIT] Simple auth icon initializing...");
    console.log("🔑 [INIT] Document ready state:", document.readyState);
    console.log("🔑 [INIT] Auth bridge available:", !!window.__authBridge);

    const authButton = document.querySelector("[data-auth-btn]");
    console.log("🔑 [INIT] Auth button found:", !!authButton);

    if (authButton) {
      console.log(
        "🔑 [INIT] Auth button data-cognito-domain:",
        authButton.getAttribute("data-cognito-domain"),
      );
      console.log(
        "🔑 [INIT] Auth button data-client-id:",
        authButton.getAttribute("data-client-id"),
      );
    }

    updateAuthIcon();
    setupAuthButton();

    console.log("🔑 [INIT] Setting up event listeners...");

    document.addEventListener("DOMContentLoaded", () => {
      console.log("🔑 [EVENT] DOMContentLoaded fired");
      updateAuthIcon();
      setupAuthButton();
    });
    document.addEventListener("astro:page-load", () => {
      console.log("🔑 [EVENT] astro:page-load fired");
      setTimeout(updateAuthIcon, 10);
      setTimeout(setupAuthButton, 20);
    });
    document.addEventListener("astro:after-swap", () => {
      console.log("🔑 [EVENT] astro:after-swap fired");
      setTimeout(updateAuthIcon, 10);
      setTimeout(setupAuthButton, 20);
    });
    window.addEventListener("focus", () => {
      console.log("🔑 [EVENT] window focus");
      updateAuthIcon();
    });
    document.addEventListener("visibilitychange", () => {
      console.log(
        "🔑 [EVENT] visibilitychange, state:",
        document.visibilityState,
      );
      if (document.visibilityState === "visible") updateAuthIcon();
    });

    console.log("🔑 [INIT] Initialization complete");
  }

  init();
  window.updateAuthIcon = updateAuthIcon;
  window.setupAuthButton = setupAuthButton;
})();

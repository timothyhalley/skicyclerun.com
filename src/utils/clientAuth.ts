// Client-side auth helpers using AWS SDK for Cognito directly
import { cognitoConfig, getRedirectUri, getLogoutUri } from "@config/cognito";
import { DebugConsole } from "@utils/DebugConsole";

export type AuthState = {
  signedIn: boolean;
  email?: string | null;
  groups?: string[];
};

// JWT token storage keys
const TOKEN_KEYS = {
  idToken: "cognito_id_token",
  accessToken: "cognito_access_token",
  refreshToken: "cognito_refresh_token",
};

// Parse JWT payload without verification (client-side only)
function parseJWT(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Get tokens from localStorage
function getStoredTokens(): {
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
} {
  if (typeof window === "undefined") {
    DebugConsole.auth("[ClientAuth] getStoredTokens: window undefined");
    return {};
  }
  try {
    const tokens = {
      idToken: localStorage.getItem(TOKEN_KEYS.idToken) || undefined,
      accessToken: localStorage.getItem(TOKEN_KEYS.accessToken) || undefined,
      refreshToken: localStorage.getItem(TOKEN_KEYS.refreshToken) || undefined,
    };
    DebugConsole.auth("[ClientAuth] getStoredTokens result:", {
      hasIdToken: !!tokens.idToken,
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
    });
    return tokens;
  } catch (e) {
    DebugConsole.error("[ClientAuth] getStoredTokens error:", e);
    return {};
  }
}

// Store tokens in localStorage
export function storeTokens(tokens: {
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
}) {
  if (typeof window === "undefined") return;
  try {
    if (tokens.idToken)
      localStorage.setItem(TOKEN_KEYS.idToken, tokens.idToken);
    if (tokens.accessToken)
      localStorage.setItem(TOKEN_KEYS.accessToken, tokens.accessToken);
    if (tokens.refreshToken)
      localStorage.setItem(TOKEN_KEYS.refreshToken, tokens.refreshToken);
  } catch {}
}

// Clear all stored tokens
export function clearTokens() {
  if (typeof window === "undefined") return;
  try {
    Object.values(TOKEN_KEYS).forEach((key) => localStorage.removeItem(key));
  } catch {}
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export async function getAuthState(): Promise<AuthState> {
  DebugConsole.auth("[ClientAuth] getAuthState called");
  try {
    const tokens = getStoredTokens();
    DebugConsole.auth("[ClientAuth] Stored tokens:", {
      hasIdToken: !!tokens.idToken,
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      idTokenLength: tokens.idToken?.length || 0,
    });

    const { idToken } = tokens;
    if (!idToken) {
      DebugConsole.auth("[ClientAuth] No idToken found");
      clearTokens();
      return { signedIn: false };
    }

    if (isTokenExpired(idToken)) {
      DebugConsole.auth("[ClientAuth] idToken is expired");
      clearTokens();
      return { signedIn: false };
    }

    const payload = parseJWT(idToken);
    DebugConsole.auth("[ClientAuth] JWT payload:", payload);
    if (!payload) {
      DebugConsole.auth("[ClientAuth] Failed to parse JWT payload");
      clearTokens();
      return { signedIn: false };
    }

    const groups = (payload["cognito:groups"] as string[]) || [];
    const authState = {
      signedIn: true,
      email: payload.email || null,
      groups,
      idToken,
      accessToken: tokens.accessToken,
    };
    DebugConsole.auth("[ClientAuth] Final auth state:", {
      ...authState,
      idToken: authState.idToken
        ? `${authState.idToken.substring(0, 20)}...`
        : null,
      accessToken: authState.accessToken
        ? `${authState.accessToken.substring(0, 20)}...`
        : null,
    });
    return authState;
  } catch (e) {
    DebugConsole.error("[ClientAuth] getAuthState error:", e);
    return { signedIn: false };
  }
}

export function getHostedUiAuthorizeUrl(redirectUri?: string): string {
  const ru = redirectUri || getRedirectUri();
  const url = new URL(`https://${cognitoConfig.domain}/oauth2/authorize`);
  url.searchParams.set("client_id", cognitoConfig.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", cognitoConfig.scopes.join(" "));
  url.searchParams.set("redirect_uri", ru);
  return url.toString();
}

export function getHostedUiLogoutUrl(redirectUri?: string): string {
  const ru = redirectUri || getLogoutUri();
  const url = new URL(`https://${cognitoConfig.domain}/logout`);
  url.searchParams.set("client_id", cognitoConfig.clientId);
  url.searchParams.set("logout_uri", ru);
  return url.toString();
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<any> {
  const tokenUrl = `https://${cognitoConfig.domain}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: cognitoConfig.clientId,
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for tokens");
  }

  return response.json();
}

/**
 * Handle Hosted UI redirect by exchanging the authorization code for tokens.
 */
export async function handleHostedUiRedirect() {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) return;

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(code, getRedirectUri());

    if (tokenResponse.id_token) {
      storeTokens({
        idToken: tokenResponse.id_token,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
      });
    }

    // Clean the URL
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    window.history.replaceState({}, document.title, url.toString());
  } catch (error) {
    DebugConsole.error("Error handling auth redirect:", error);
    clearTokens();
  }
}

/**
 * Sign out by clearing local tokens and redirecting to Cognito logout
 */
export async function signOutHosted(redirectUri?: string) {
  clearTokens();
  const url = getHostedUiLogoutUrl(redirectUri);
  if (typeof window !== "undefined") {
    window.location.assign(url);
  }
  return url;
}

/**
 * Initiate login via Cognito Hosted UI
 */
export async function loginHosted(redirectUri?: string) {
  const url = getHostedUiAuthorizeUrl(redirectUri);
  if (typeof window !== "undefined") {
    window.location.assign(url);
  }
  return url;
}

/**
 * Get the current JWT token for API calls
 */
export function getAccessToken(): string | null {
  const { accessToken } = getStoredTokens();
  if (!accessToken || isTokenExpired(accessToken)) {
    return null;
  }
  return accessToken;
}

/**
 * Get the ID token for user info
 */
export function getIdToken(): string | null {
  const { idToken } = getStoredTokens();
  if (!idToken || isTokenExpired(idToken)) {
    return null;
  }
  return idToken;
}

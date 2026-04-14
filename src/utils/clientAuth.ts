import { DebugConsole } from "@utils/DebugConsole";

export type AuthState = {
  signedIn: boolean;
  email?: string | null;
  phone?: string | null;
  method?: "EMAIL_OTP" | "SMS_OTP";
  groups?: string[];
  idToken?: string | null;
  accessToken?: string | null;
};

const OTP_SESSION_KEY = "passwordless_auth_session";

type StoredOtpSession = {
  email?: string | null;
  phone?: string | null;
  method?: "EMAIL_OTP" | "SMS_OTP";
  verifiedAt: string;
};

function extractEmailFromJwt(token?: string): string | null {
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    const parsed = JSON.parse(decoded) as { email?: unknown };
    return typeof parsed.email === "string" ? parsed.email : null;
  } catch {
    return null;
  }
}

function readOtpSession(): StoredOtpSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(OTP_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredOtpSession;
  } catch (error) {
    DebugConsole.error("[ClientAuth] Failed to read OTP session:", error);
    return null;
  }
}

export function storePasswordlessSession(session: {
  email?: string | null;
  phone?: string | null;
  method?: "EMAIL_OTP" | "SMS_OTP";
}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const storedSession: StoredOtpSession = {
      email: session.email || null,
      phone: session.phone || null,
      method: session.method,
      verifiedAt: new Date().toISOString(),
    };
    localStorage.setItem(OTP_SESSION_KEY, JSON.stringify(storedSession));
    DebugConsole.auth("[ClientAuth] Stored OTP session:", storedSession);
  } catch (error) {
    DebugConsole.error("[ClientAuth] Failed to store OTP session:", error);
  }
}

// Backward-compatibility shim for legacy components that still import storeTokens.
// In OTP-only mode we persist an auth session instead of Cognito token triplets.
export function storeTokens(tokens: {
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
}) {
  const email = extractEmailFromJwt(tokens.idToken);
  storePasswordlessSession({
    email,
    method: "EMAIL_OTP",
  });
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(OTP_SESSION_KEY);
  } catch {}
}

export async function getAuthState(): Promise<AuthState> {
  DebugConsole.auth("[ClientAuth] getAuthState called");
  try {
    const session = readOtpSession();
    if (!session) {
      DebugConsole.auth("[ClientAuth] No OTP session found");
      return { signedIn: false };
    }

    const authState = {
      signedIn: true,
      email: session.email || null,
      phone: session.phone || null,
      method: session.method,
      groups: [],
      idToken: null,
      accessToken: null,
    };
    DebugConsole.auth("[ClientAuth] Final auth state:", authState);
    return authState;
  } catch (e) {
    DebugConsole.error("[ClientAuth] getAuthState error:", e);
    return { signedIn: false };
  }
}

/**
 * Deprecated compatibility helper for the old Cognito flow.
 */
export function getAccessToken(): string | null {
  return null;
}

/**
 * Deprecated compatibility helper for the old Cognito flow.
 */
export function getIdToken(): string | null {
  return null;
}

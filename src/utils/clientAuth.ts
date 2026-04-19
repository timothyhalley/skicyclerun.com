import { DebugConsole } from "@utils/DebugConsole";

export type AuthState = {
  signedIn: boolean;
  email?: string | null;
  emailVerified?: boolean;
  phone?: string | null;
  phoneVerified?: boolean;
  method?: "EMAIL_OTP" | "SMS_OTP";
  groups?: string[];
  sub?: string | null;
  username?: string | null;
  name?: string | null;
  location?: string | null;
  zoneinfo?: string | null;
  memberSince?: string | null;
  lastLogin?: string | null;
  userStatus?: string | null;
  enabled?: boolean;
  idToken?: string | null;
  accessToken?: string | null;
};

const OTP_SESSION_KEY = "passwordless_auth_session";
const PROFILE_CACHE_KEY = "passwordless_profile_cache";
const PROFILE_CACHE_TTL_MS = 10 * 60 * 1000;

type StoredOtpSession = {
  email?: string | null;
  emailVerified?: boolean;
  phone?: string | null;
  phoneVerified?: boolean;
  method?: "EMAIL_OTP" | "SMS_OTP";
  groups?: string[];
  sub?: string | null;
  username?: string | null;
  name?: string | null;
  location?: string | null;
  zoneinfo?: string | null;
  memberSince?: string | null;
  lastLogin?: string | null;
  userStatus?: string | null;
  enabled?: boolean;
  idToken?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenType?: string | null;
  expiresIn?: number | null;
  verifiedAt: string;
};

type StoredProfileCache = {
  key: string; // email or phone used as cache identity
  groups: string[];
  updatedAt: string;
};

type JwtPayload = {
  email?: unknown;
  "cognito:groups"?: unknown;
  groups?: unknown;
};

function decodeJwtPayload(token?: string): JwtPayload | null {
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
    const decoded = atob(normalized + padding);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function extractEmailFromJwt(token?: string): string | null {
  const parsed = decodeJwtPayload(token);
  return typeof parsed?.email === "string" ? parsed.email : null;
}

function extractGroupsFromJwt(token?: string): string[] {
  const parsed = decodeJwtPayload(token);
  const rawGroups = parsed?.["cognito:groups"] ?? parsed?.groups;

  if (Array.isArray(rawGroups)) {
    return rawGroups.filter(
      (group): group is string => typeof group === "string" && group.length > 0,
    );
  }

  if (typeof rawGroups === "string" && rawGroups.length > 0) {
    return rawGroups
      .split(/[\s,]+/)
      .map((group) => group.trim())
      .filter(Boolean);
  }

  return [];
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

function writeOtpSession(session: StoredOtpSession) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(OTP_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    DebugConsole.error("[ClientAuth] Failed to write OTP session:", error);
  }
}

function normalizeGroups(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (typeof input === "string") {
    return input
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return [];
}

function readProfileCache(): StoredProfileCache | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredProfileCache;
  } catch (error) {
    DebugConsole.error("[ClientAuth] Failed to read profile cache:", error);
    return null;
  }
}

function writeProfileCache(cache: StoredProfileCache) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    DebugConsole.error("[ClientAuth] Failed to write profile cache:", error);
  }
}

function getCachedGroups(
  identifier: string | null | undefined,
): string[] | null {
  if (!identifier) return null;
  const cache = readProfileCache();
  if (!cache) return null;
  if (cache.key.toLowerCase() !== identifier.toLowerCase()) return null;

  const updatedAt = Date.parse(cache.updatedAt);
  if (!Number.isFinite(updatedAt)) return null;
  if (Date.now() - updatedAt > PROFILE_CACHE_TTL_MS) return null;

  const groups = normalizeGroups(cache.groups);
  return groups.length > 0 ? groups : null;
}

async function fetchGroupsFromProfile(
  email: string | null | undefined,
  phone?: string | null,
  token?: string | null,
): Promise<string[] | null> {
  const identifier = email || phone;
  if (!identifier) return null;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Prefer email lookup; fall back to phone for SMS-only users
    const queryParam = email
      ? `email=${encodeURIComponent(email)}`
      : `phone=${encodeURIComponent(phone!)}`;
    const url = `https://api.skicyclerun.com/v2/profile?${queryParam}`;
    const response = await fetch(url, {
      method: "GET",
      headers,
      mode: "cors",
      credentials: "omit",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      groups?: unknown;
      userGroups?: unknown;
    };

    const groups = normalizeGroups(data.groups ?? data.userGroups);
    if (groups.length === 0) {
      return null;
    }

    writeProfileCache({
      key: identifier,
      groups,
      updatedAt: new Date().toISOString(),
    });

    return groups;
  } catch (error) {
    DebugConsole.warn("[ClientAuth] Profile group lookup failed:", error);
    return null;
  }
}

export function storePasswordlessSession(session: {
  email?: string | null;
  emailVerified?: boolean;
  phone?: string | null;
  phoneVerified?: boolean;
  method?: "EMAIL_OTP" | "SMS_OTP";
  groups?: string[];
  sub?: string | null;
  username?: string | null;
  name?: string | null;
  location?: string | null;
  zoneinfo?: string | null;
  memberSince?: string | null;
  lastLogin?: string | null;
  userStatus?: string | null;
  enabled?: boolean;
  idToken?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenType?: string | null;
  expiresIn?: number | null;
}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const groups =
      session.groups && session.groups.length > 0
        ? session.groups
        : extractGroupsFromJwt(session.idToken || undefined);
    const storedSession: StoredOtpSession = {
      email: session.email || extractEmailFromJwt(session.idToken || undefined),
      emailVerified: session.emailVerified,
      phone: session.phone || null,
      phoneVerified: session.phoneVerified,
      method: session.method,
      groups,
      sub: session.sub || null,
      username: session.username || null,
      name: session.name || null,
      location: session.location || null,
      zoneinfo: session.zoneinfo || null,
      memberSince: session.memberSince || null,
      lastLogin: session.lastLogin || null,
      userStatus: session.userStatus || null,
      enabled: session.enabled,
      idToken: session.idToken || null,
      accessToken: session.accessToken || null,
      refreshToken: session.refreshToken || null,
      tokenType: session.tokenType || null,
      expiresIn: session.expiresIn ?? null,
      verifiedAt: new Date().toISOString(),
    };
    localStorage.setItem(OTP_SESSION_KEY, JSON.stringify(storedSession));

    const cacheKey = storedSession.email || storedSession.phone;
    if (
      cacheKey &&
      Array.isArray(storedSession.groups) &&
      storedSession.groups.length > 0
    ) {
      writeProfileCache({
        key: cacheKey,
        groups: storedSession.groups,
        updatedAt: new Date().toISOString(),
      });
    }

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
  storePasswordlessSession({
    email: extractEmailFromJwt(tokens.idToken),
    method: "EMAIL_OTP",
    groups: extractGroupsFromJwt(tokens.idToken),
    idToken: tokens.idToken,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(OTP_SESSION_KEY);
    localStorage.removeItem(PROFILE_CACHE_KEY);
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
      emailVerified: session.emailVerified,
      phone: session.phone || null,
      phoneVerified: session.phoneVerified,
      method: session.method,
      groups: Array.isArray(session.groups) ? session.groups : [],
      sub: session.sub || null,
      username: session.username || null,
      name: session.name || null,
      location: session.location || null,
      zoneinfo: session.zoneinfo || null,
      memberSince: session.memberSince || null,
      lastLogin: session.lastLogin || null,
      userStatus: session.userStatus || null,
      enabled: session.enabled,
      idToken: session.idToken || null,
      accessToken: session.accessToken || null,
    };

    if (
      authState.groups.length === 0 &&
      (authState.email || authState.phone) &&
      (authState.idToken || authState.accessToken)
    ) {
      const identifier = authState.email || authState.phone;
      const cachedGroups = getCachedGroups(identifier);
      if (cachedGroups && cachedGroups.length > 0) {
        authState.groups = cachedGroups;
      } else {
        const fetchedGroups = await fetchGroupsFromProfile(
          authState.email,
          authState.phone,
          authState.idToken || authState.accessToken,
        );

        if (fetchedGroups && fetchedGroups.length > 0) {
          authState.groups = fetchedGroups;
          writeOtpSession({
            ...session,
            groups: fetchedGroups,
          });
        }
      }
    }

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
  return readOtpSession()?.accessToken || null;
}

/**
 * Deprecated compatibility helper for the old Cognito flow.
 */
export function getIdToken(): string | null {
  return readOtpSession()?.idToken || null;
}

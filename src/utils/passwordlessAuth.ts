/**
 * Passwordless authentication via API Gateway OTP endpoints.
 *
 * The frontend still expects JWTs after OTP verification, so this adapter keeps
 * the existing session-based UI while also supporting the newer stateless OTP
 * request payloads.
 */

import { DebugConsole } from "@utils/DebugConsole";
import {
  samAuthClient,
  PasswordlessAuthError,
  type SendOtpRequest,
  type VerifyOtpRequest,
  type VerifyOtpResponse,
} from "@utils/samAuthClient";

export interface PasswordlessAuthSession {
  username: string;
  email?: string;
  phoneNumber?: string;
  session: string;
  challengeName: string;
  challengeParameters?: Record<string, string>;
  preferredChallenge?: "EMAIL_OTP" | "SMS_OTP";
  isNewUser?: boolean; // NEW: track if this is a new user signup
  tokens?: {
    idToken?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType?: string;
  };
}

export interface PasswordlessAuthResult {
  authenticated?: boolean;
  tokens?: PasswordlessAuthSession["tokens"];
  profile?: PasswordlessAuthProfile;
  nextSession?: PasswordlessAuthSession;
  needsProfileCompletion?: boolean; // NEW: indicate profile completion step needed
}

export interface PasswordlessAuthProfile {
  sub?: string;
  username?: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string;
  phoneVerified?: boolean;
  zoneinfo?: string;
  location?: string | null;
  groups?: string[];
  memberSince?: string | null;
  lastLogin?: string | null;
  userStatus?: string;
  enabled?: boolean;
}

export interface UserProfileAttributes {
  phone?: string;
  location?: string;
  [key: string]: string | undefined;
}

function getChallengeDeliveryMedium(challenge: "EMAIL_OTP" | "SMS_OTP") {
  return challenge === "SMS_OTP" ? "SMS" : "EMAIL";
}

function isEmailIdentifier(value: string): boolean {
  return value.includes("@");
}

function extractTokensFromVerifyResponse(
  response: VerifyOtpResponse,
): PasswordlessAuthSession["tokens"] | undefined {
  const candidate =
    response.tokens ||
    response.authenticationResult ||
    response.AuthenticationResult ||
    response;

  const readString = (...values: Array<unknown>) => {
    for (const value of values) {
      if (typeof value === "string" && value.length > 0) {
        return value;
      }
    }
    return undefined;
  };

  const readNumber = (...values: Array<unknown>) => {
    for (const value of values) {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
    }
    return undefined;
  };

  const idToken = readString(
    (candidate as { idToken?: unknown }).idToken,
    (candidate as { IdToken?: unknown }).IdToken,
  );
  const accessToken = readString(
    (candidate as { accessToken?: unknown }).accessToken,
    (candidate as { AccessToken?: unknown }).AccessToken,
  );
  const refreshToken = readString(
    (candidate as { refreshToken?: unknown }).refreshToken,
    (candidate as { RefreshToken?: unknown }).RefreshToken,
  );
  const tokenType = readString(
    (candidate as { tokenType?: unknown }).tokenType,
    (candidate as { TokenType?: unknown }).TokenType,
  );
  const expiresIn = readNumber(
    (candidate as { expiresIn?: unknown }).expiresIn,
    (candidate as { ExpiresIn?: unknown }).ExpiresIn,
  );

  if (!idToken && !accessToken && !refreshToken) {
    return undefined;
  }

  return {
    idToken,
    accessToken,
    refreshToken,
    tokenType,
    expiresIn,
  };
}

function extractProfileFromVerifyResponse(
  response: VerifyOtpResponse,
): PasswordlessAuthProfile | undefined {
  const normalizeBoolean = (value: unknown): boolean | undefined => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (value.toLowerCase() === "true") return true;
      if (value.toLowerCase() === "false") return false;
    }
    return undefined;
  };

  const normalizeString = (value: unknown): string | undefined =>
    typeof value === "string" && value.trim().length > 0 ? value : undefined;

  const groups = Array.isArray(response.groups)
    ? response.groups.filter((g): g is string => typeof g === "string" && g.length > 0)
    : undefined;

  const profile: PasswordlessAuthProfile = {
    sub: normalizeString(response.sub),
    username: normalizeString(response.username),
    name: normalizeString(response.name),
    email: normalizeString(response.email),
    emailVerified: normalizeBoolean(response.emailVerified ?? response.emailPopulated),
    phone: normalizeString(response.phone),
    phoneVerified: normalizeBoolean(response.phoneVerified),
    zoneinfo: normalizeString(response.zoneinfo),
    location: response.location ?? null,
    groups,
    memberSince: normalizeString(response.createdTime) ?? null,
    lastLogin: normalizeString(response.lastUpdatedTime) ?? null,
    userStatus: normalizeString(response.userStatus),
    enabled: normalizeBoolean(response.enabled),
  };

  const hasProfileData =
    !!profile.sub ||
    !!profile.email ||
    !!profile.phone ||
    (Array.isArray(profile.groups) && profile.groups.length > 0);

  return hasProfileData ? profile : undefined;
}

/**
 * Initiate passwordless authentication via the OTP API.
 */
export async function startPasswordlessAuth(
  identifier: string,
  options: {
    preferredChallenge?: "EMAIL_OTP" | "SMS_OTP";
    phoneNumber?: string;
  } = {},
): Promise<PasswordlessAuthSession> {
  const trimmedIdentifier = identifier.trim();
  const normalizedIdentifier = isEmailIdentifier(trimmedIdentifier)
    ? trimmedIdentifier.toLowerCase()
    : trimmedIdentifier;
  const normalizedEmail = isEmailIdentifier(normalizedIdentifier)
    ? normalizedIdentifier
    : undefined;

  const challenge = options.preferredChallenge || "EMAIL_OTP";
  const normalizedPhone =
    challenge === "SMS_OTP" ? options.phoneNumber?.trim() || normalizedIdentifier : undefined;

  DebugConsole.auth(
    "[PasswordlessAuth] Starting OTP auth for:",
    normalizedIdentifier,
    "challenge:",
    challenge,
  );

  try {
    const request: SendOtpRequest = {
      preferredChallenge: challenge,
      email: challenge === "EMAIL_OTP" ? normalizedEmail || normalizedIdentifier : normalizedEmail,
      phoneNumber: normalizedPhone,
    };

    DebugConsole.auth(
      "[PasswordlessAuth] Calling /v2/auth/send-otp with:",
      request,
    );

    const response = await samAuthClient.sendOtp(request);

    DebugConsole.auth("[PasswordlessAuth] send-otp response:", response);

    const session: PasswordlessAuthSession = {
      username: normalizedIdentifier,
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      session: "",
      challengeName: challenge,
      challengeParameters: {
        CODE_DELIVERY_DELIVERY_MEDIUM: getChallengeDeliveryMedium(challenge),
        CODE_DELIVERY_DESTINATION:
          normalizedPhone || normalizedEmail || normalizedIdentifier,
      },
      preferredChallenge: challenge,
    };

    DebugConsole.auth("[PasswordlessAuth] Session created:", session);

    return session;
  } catch (error: any) {
    if (error instanceof PasswordlessAuthError) {
      DebugConsole.error(
        "[PasswordlessAuth] OTP API error:",
        error.status,
        error.message,
      );
      DebugConsole.error("[PasswordlessAuth] Error body:", error.body);
      throw error;
    }

    DebugConsole.error("[PasswordlessAuth] Unexpected auth error:", error);
    DebugConsole.error("[PasswordlessAuth] Error name:", error?.name);
    DebugConsole.error("[PasswordlessAuth] Error message:", error?.message);
    throw error;
  }
}

/**
 * Confirm an OTP code and return JWTs when the backend provides them.
 */
export async function confirmPasswordlessAuth(
  session: PasswordlessAuthSession,
  code: string,
): Promise<PasswordlessAuthResult> {
  const trimmedCode = code.trim();

  DebugConsole.auth(
    "[PasswordlessAuth] Confirming code for:",
    session.username,
    "challenge:",
    session.challengeName,
  );

  try {
    const request: VerifyOtpRequest = {
      code: trimmedCode,
      email: session.email,
      phoneNumber: session.phoneNumber,
    };

    DebugConsole.auth(
      "[PasswordlessAuth] Calling /v2/auth/verify-otp with:",
      { ...request, code: "***" },
    );

    const response = await samAuthClient.verifyOtp(request);

    DebugConsole.auth("[PasswordlessAuth] verify-otp response:", {
      success: response.success,
      message: response.message,
    });

    if (!response.success) {
      throw new PasswordlessAuthError(
        response.message ||
          "OTP verification failed.",
        502,
        response,
      );
    }

    const tokens = extractTokensFromVerifyResponse(response);
    const profile = extractProfileFromVerifyResponse(response);

    return {
      authenticated: true,
      tokens,
      profile,
    };
  } catch (error: any) {
    if (error instanceof PasswordlessAuthError) {
      DebugConsole.error(
        "[PasswordlessAuth] OTP API error:",
        error.status,
        error.message,
      );
      DebugConsole.error("[PasswordlessAuth] Error body:", error.body);
      throw error;
    }

    DebugConsole.error("[PasswordlessAuth] Unexpected confirm error:", error);
    DebugConsole.error("[PasswordlessAuth] Error name:", error?.name);
    DebugConsole.error("[PasswordlessAuth] Error message:", error?.message);
    throw error;
  }
}

/**
 * Resend the OTP by re-calling the send endpoint.
 */
export async function resendPasswordlessCode(
  session: PasswordlessAuthSession,
): Promise<PasswordlessAuthSession> {
  DebugConsole.auth(
    "[PasswordlessAuth] Resending code for:",
    session.username,
    "challenge:",
    session.challengeName,
  );

  try {
    const request: SendOtpRequest = {
      preferredChallenge: (session.challengeName || "EMAIL_OTP") as
        | "EMAIL_OTP"
        | "SMS_OTP",
      email: session.email,
      phoneNumber: session.phoneNumber,
    };

    await samAuthClient.sendOtp(request);

    const newSession: PasswordlessAuthSession = {
      ...session,
      challengeParameters: session.challengeParameters,
    };

    DebugConsole.auth(
      "[PasswordlessAuth] Code resent, new session:",
      newSession,
    );

    return newSession;
  } catch (error: any) {
    if (error instanceof PasswordlessAuthError) {
      DebugConsole.error(
        "[PasswordlessAuth] OTP resend error:",
        error.status,
        error.message,
      );
      throw error;
    }

    DebugConsole.error("[PasswordlessAuth] Unexpected resend error:", error);
    throw error;
  }
}

/**
 * Update user profile attributes
 * Call this after account confirmation to set phone, location, etc.
 */
export async function updateUserAttributes(
  _accessToken: string,
  attributes: UserProfileAttributes,
): Promise<void> {
  DebugConsole.warn(
    "[PasswordlessAuth] updateUserAttributes is not available in OTP-only mode.",
    attributes,
  );
  throw new Error(
    "Profile attribute updates are not supported by the OTP-only API yet.",
  );
}

/**
 * Request verification code for a user attribute (email or phone)
 * This is used when updating email or phone number to verify the new value
 */
export async function getUserAttributeVerificationCode(
  _accessToken: string,
  _attributeName: "email" | "phone_number",
): Promise<{
  deliveryMedium: string;
  destination: string;
}> {
  throw new Error(
    "Attribute verification is not supported by the OTP-only API yet.",
  );
}

/**
 * Verify a user attribute with the code sent via getUserAttributeVerificationCode
 */
export async function verifyUserAttribute(
  _accessToken: string,
  _attributeName: "email" | "phone_number",
  _code: string,
): Promise<void> {
  throw new Error(
    "Attribute verification is not supported by the OTP-only API yet.",
  );
}

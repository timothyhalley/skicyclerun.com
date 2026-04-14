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
  nextSession?: PasswordlessAuthSession;
  needsProfileCompletion?: boolean; // NEW: indicate profile completion step needed
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

    return {
      authenticated: true,
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

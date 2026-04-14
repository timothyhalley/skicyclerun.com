/**
 * Clean Passwordless Authentication Implementation
 * Uses SAM (Serverless Application Model) API Gateway endpoints
 *
 * Flow via SAM:
 * 1. User enters email/phone
 * 2. Call SAM /v2/auth/send-otp (handles user creation internally)
 * 3. User enters OTP code
 * 4. Call SAM /v2/auth/verify-otp → receive JWT tokens
 */

import {
  AttributeType,
  CognitoIdentityProviderClient,
  GetUserAttributeVerificationCodeCommand,
  UpdateUserAttributesCommand,
  VerifyUserAttributeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { cognitoConfig } from "@config/cognito";
import { DebugConsole } from "@utils/DebugConsole";
import {
  samAuthClient,
  PasswordlessAuthError,
  type SendOtpRequest,
  type VerifyOtpRequest,
} from "@utils/samAuthClient";

const client = new CognitoIdentityProviderClient({
  region: cognitoConfig.region,
});

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
  tokens?: {
    idToken?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType?: string;
  };
  nextSession?: PasswordlessAuthSession;
  needsProfileCompletion?: boolean; // NEW: indicate profile completion step needed
}

export interface UserProfileAttributes {
  phone?: string;
  location?: string;
  [key: string]: string | undefined;
}

function isEmailIdentifier(value: string): boolean {
  return value.includes("@");
}

/**
 * Initiate passwordless authentication via SAM API
 *
 * SAM endpoint handles:
 * - User creation (if new user)
 * - User confirmation (if new user)
 * - OTP code delivery (EMAIL_OTP or SMS_OTP)
 *
 * Returns session with challenge name and delivery details
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

  DebugConsole.auth(
    "[PasswordlessAuth] Starting SAM auth for:",
    normalizedIdentifier,
    "challenge:",
    challenge,
  );

  try {
    // Call SAM endpoint
    const request: SendOtpRequest = {
      username: normalizedIdentifier,
      preferredChallenge: challenge,
    };

    DebugConsole.auth(
      "[PasswordlessAuth] Calling SAM /v2/auth/send-otp with:",
      request,
    );

    const response = await samAuthClient.sendOtp(request);

    DebugConsole.auth("[PasswordlessAuth] SAM response:", response);

    // Map SAM response to PasswordlessAuthSession
    const session: PasswordlessAuthSession = {
      username: normalizedIdentifier,
      email: normalizedEmail,
      phoneNumber: options.phoneNumber,
      session: response.session || "",
      challengeName: response.challengeName || challenge,
      challengeParameters: response.challengeParameters,
      preferredChallenge: challenge,
    };

    DebugConsole.auth("[PasswordlessAuth] Session created:", session);

    return session;
  } catch (error: any) {
    // Handle SAM errors (HTTP status + error message)
    if (error instanceof PasswordlessAuthError) {
      DebugConsole.error(
        "[PasswordlessAuth] SAM error:",
        error.status,
        error.message,
      );
      DebugConsole.error("[PasswordlessAuth] Error body:", error.body);

      // Map common SAM errors to user-friendly messages
      const errorMessage = error.message || "Authentication failed";

      // Re-throw with same error so handlers.ts can use the message format
      throw error;
    }

    // Unexpected error
    DebugConsole.error("[PasswordlessAuth] Unexpected auth error:", error);
    DebugConsole.error("[PasswordlessAuth] Error name:", error?.name);
    DebugConsole.error("[PasswordlessAuth] Error message:", error?.message);
    throw error;
  }
}

/**
 * Confirm OTP code via SAM API
 *
 * SAM endpoint verifies the OTP and returns JWT tokens
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
    // Call SAM endpoint
    const request: VerifyOtpRequest = {
      username: session.username,
      session: session.session,
      challengeName: (session.challengeName || "EMAIL_OTP") as
        | "EMAIL_OTP"
        | "SMS_OTP",
      code: trimmedCode,
    };

    DebugConsole.auth(
      "[PasswordlessAuth] Calling SAM /v2/auth/verify-otp with:",
      { ...request, code: "***" },
    );

    const response = await samAuthClient.verifyOtp(request);

    DebugConsole.auth("[PasswordlessAuth] SAM verify-otp response:", {
      idToken: response.idToken
        ? response.idToken.substring(0, 20) + "..."
        : undefined,
      accessToken: response.accessToken
        ? response.accessToken.substring(0, 20) + "..."
        : undefined,
      challengeName: response.challengeName,
    });

    // Return tokens
    return {
      tokens: {
        idToken: response.idToken,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresIn: response.expiresIn,
        tokenType: response.tokenType,
      },
    };
  } catch (error: any) {
    // Handle SAM errors
    if (error instanceof PasswordlessAuthError) {
      DebugConsole.error(
        "[PasswordlessAuth] SAM error:",
        error.status,
        error.message,
      );
      DebugConsole.error("[PasswordlessAuth] Error body:", error.body);

      // Re-throw so handlers.ts can use the message
      throw error;
    }

    // Unexpected error
    DebugConsole.error("[PasswordlessAuth] Unexpected confirm error:", error);
    DebugConsole.error("[PasswordlessAuth] Error name:", error?.name);
    DebugConsole.error("[PasswordlessAuth] Error message:", error?.message);
    throw error;
  }
}

/**
 * Resend OTP code via SAM API
 *
 * Simply re-calls send-otp with the same username and challenge
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
    // Re-call send-otp to get a new code
    const request: SendOtpRequest = {
      username: session.username,
      preferredChallenge: (session.challengeName || "EMAIL_OTP") as
        | "EMAIL_OTP"
        | "SMS_OTP",
    };

    const response = await samAuthClient.sendOtp(request);

    const newSession: PasswordlessAuthSession = {
      ...session,
      session: response.session || session.session,
      challengeParameters:
        response.challengeParameters || session.challengeParameters,
    };

    DebugConsole.auth(
      "[PasswordlessAuth] Code resent, new session:",
      newSession,
    );

    return newSession;
  } catch (error: any) {
    // Handle SAM errors
    if (error instanceof PasswordlessAuthError) {
      DebugConsole.error(
        "[PasswordlessAuth] SAM resend error:",
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
  accessToken: string,
  attributes: UserProfileAttributes,
): Promise<void> {
  DebugConsole.auth(
    "[PasswordlessAuth] updateUserAttributes called with:",
    attributes,
  );

  const userAttributes: AttributeType[] = [];

  if (attributes.phone) {
    const phoneValue = attributes.phone.startsWith("+")
      ? attributes.phone
      : `+1${attributes.phone}`;
    DebugConsole.auth(
      "[PasswordlessAuth] Adding phone_number attribute:",
      phoneValue,
    );
    userAttributes.push({
      Name: "phone_number",
      Value: phoneValue,
    });
  }

  if (attributes.location) {
    DebugConsole.auth(
      "[PasswordlessAuth] Adding custom:location attribute:",
      attributes.location,
    );
    userAttributes.push({
      Name: "custom:location",
      Value: attributes.location,
    });
  }

  // Add any additional custom attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key !== "phone" && key !== "location" && value) {
      const attrName = key.startsWith("custom:") ? key : `custom:${key}`;
      DebugConsole.auth(
        `[PasswordlessAuth] Adding ${attrName} attribute:`,
        value,
      );
      userAttributes.push({
        Name: attrName,
        Value: value,
      });
    }
  });

  if (userAttributes.length === 0) {
    DebugConsole.auth("[PasswordlessAuth] No attributes to update");
    return;
  }

  DebugConsole.auth(
    "[PasswordlessAuth] Sending UpdateUserAttributesCommand with:",
    userAttributes,
  );

  try {
    const result = await client.send(
      new UpdateUserAttributesCommand({
        AccessToken: accessToken,
        UserAttributes: userAttributes,
      }),
    );

    DebugConsole.auth(
      "[PasswordlessAuth] ✅ Successfully updated user attributes:",
      userAttributes.map((attr) => `${attr.Name}=${attr.Value}`),
    );
    DebugConsole.auth(
      "[PasswordlessAuth] UpdateUserAttributes response:",
      result,
    );
  } catch (error: any) {
    DebugConsole.error(
      "[PasswordlessAuth] ❌ UpdateUserAttributes failed:",
      error,
    );
    DebugConsole.error("[PasswordlessAuth] Error name:", error.name);
    DebugConsole.error("[PasswordlessAuth] Error message:", error.message);
    throw error;
  }
}

/**
 * Request verification code for a user attribute (email or phone)
 * This is used when updating email or phone number to verify the new value
 */
export async function getUserAttributeVerificationCode(
  accessToken: string,
  attributeName: "email" | "phone_number",
): Promise<{
  deliveryMedium: string;
  destination: string;
}> {
  DebugConsole.auth(
    "[PasswordlessAuth] Requesting verification code for:",
    attributeName,
  );

  try {
    const result = await client.send(
      new GetUserAttributeVerificationCodeCommand({
        AccessToken: accessToken,
        AttributeName: attributeName,
      }),
    );

    DebugConsole.auth(
      "[PasswordlessAuth] ✅ Verification code sent via:",
      result.CodeDeliveryDetails?.DeliveryMedium,
      "to",
      result.CodeDeliveryDetails?.Destination,
    );

    return {
      deliveryMedium: result.CodeDeliveryDetails?.DeliveryMedium || "UNKNOWN",
      destination: result.CodeDeliveryDetails?.Destination || "UNKNOWN",
    };
  } catch (error: any) {
    DebugConsole.error(
      "[PasswordlessAuth] ❌ GetUserAttributeVerificationCode failed:",
      error,
    );
    DebugConsole.error("[PasswordlessAuth] Error name:", error.name);
    DebugConsole.error("[PasswordlessAuth] Error message:", error.message);
    throw error;
  }
}

/**
 * Verify a user attribute with the code sent via getUserAttributeVerificationCode
 */
export async function verifyUserAttribute(
  accessToken: string,
  attributeName: "email" | "phone_number",
  code: string,
): Promise<void> {
  DebugConsole.auth(
    "[PasswordlessAuth] Verifying attribute:",
    attributeName,
    "with code:",
    code.substring(0, 3) + "***",
  );

  try {
    await client.send(
      new VerifyUserAttributeCommand({
        AccessToken: accessToken,
        AttributeName: attributeName,
        Code: code,
      }),
    );

    DebugConsole.auth(
      "[PasswordlessAuth] ✅ Attribute verified successfully:",
      attributeName,
    );
  } catch (error: any) {
    DebugConsole.error(
      "[PasswordlessAuth] ❌ VerifyUserAttribute failed:",
      error,
    );
    DebugConsole.error("[PasswordlessAuth] Error name:", error.name);
    DebugConsole.error("[PasswordlessAuth] Error message:", error.message);
    throw error;
  }
}

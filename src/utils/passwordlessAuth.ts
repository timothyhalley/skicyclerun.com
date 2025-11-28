/**
 * Clean Passwordless Authentication Implementation
 * Based on AWS Cognito USER_AUTH flow with EMAIL_OTP/SMS_OTP
 *
 * Flow:
 * 1. User enters email/phone
 * 2. System creates user if needed (SignUp) → sends verification code
 * 3. User enters verification code → account confirmed
 * 4. User automatically gets login code (EMAIL_OTP/SMS_OTP)
 * 5. User enters login code → receives JWT tokens
 */

import {
  AttributeType,
  AuthFlowType,
  ChallengeNameType,
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  GetUserAttributeVerificationCodeCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
  UpdateUserAttributesCommand,
  VerifyUserAttributeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { cognitoConfig } from "@config/cognito";
import { DebugConsole } from "@utils/DebugConsole";

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
  preferredChallenge?: ChallengeNameType;
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

/**
 * Generate a temporary password for user creation
 * (Required by Cognito SignUp, but not used for passwordless auth)
 */
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Temp${password}!1`;
}

/**
 * Create a new user in Cognito
 * Only called when we've confirmed the user doesn't exist
 */
async function createNewUser(
  email: string,
  phoneNumber?: string,
): Promise<void> {
  const attributes: AttributeType[] = [{ Name: "email", Value: email }];

  if (phoneNumber) {
    attributes.push({ Name: "phone_number", Value: phoneNumber });
  }

  // Add timezone if configured
  const timezone = import.meta.env.PUBLIC_COGNITO_TIMEZONE_VALUE || "UTC";
  const timezoneAttr =
    import.meta.env.PUBLIC_COGNITO_TIMEZONE_ATTRIBUTE || "zoneinfo";
  if (timezoneAttr) {
    attributes.push({ Name: timezoneAttr, Value: timezone });
  }

  const signUpResult = await client.send(
    new SignUpCommand({
      ClientId: cognitoConfig.clientId,
      Username: email,
      Password: generateTempPassword(),
      UserAttributes: attributes,
    }),
  );

  DebugConsole.auth("[PasswordlessAuth] New user created:", email);
  DebugConsole.auth(
    "[PasswordlessAuth] SignUp result:",
    signUpResult.CodeDeliveryDetails,
  );

  // If Cognito didn't automatically send verification code, send it manually
  if (!signUpResult.CodeDeliveryDetails) {
    DebugConsole.auth(
      "[PasswordlessAuth] No code delivery details, resending confirmation code",
    );
    await client.send(
      new ResendConfirmationCodeCommand({
        ClientId: cognitoConfig.clientId,
        Username: email,
      }),
    );
  }
}

/**
 * Initiate passwordless authentication
 *
 * For new users: sends verification code to confirm account
 * For existing users: sends login code (EMAIL_OTP/SMS_OTP)
 */
export async function startPasswordlessAuth(
  email: string,
  options: {
    preferredChallenge?: "EMAIL_OTP" | "SMS_OTP";
    phoneNumber?: string;
  } = {},
): Promise<PasswordlessAuthSession> {
  const normalizedEmail = email.trim().toLowerCase();

  DebugConsole.auth("[PasswordlessAuth] Starting auth for:", normalizedEmail);

  // CRITICAL FIX: USER_AUTH flow returns EMAIL_OTP for non-existent users WITHOUT sending email!
  // We must try SignUp first to handle new users properly.
  // Strategy: Try SignUp first, if user exists (UsernameExistsException), then InitiateAuth

  // First, try creating new user (this sends verification email)
  try {
    DebugConsole.auth(
      "[PasswordlessAuth] Attempting SignUp for potential new user",
    );

    await createNewUser(normalizedEmail, options.phoneNumber);

    // New user created successfully - they need to verify their account first
    DebugConsole.auth(
      "[PasswordlessAuth] New user created, verification email sent",
    );

    return {
      username: normalizedEmail,
      email: normalizedEmail,
      phoneNumber: options.phoneNumber,
      session: "PENDING_CONFIRMATION",
      challengeName: "CONFIRM_SIGN_UP",
      preferredChallenge: options.preferredChallenge,
      isNewUser: true,
    };
  } catch (signUpError: any) {
    // User already exists - proceed with normal auth flow
    if (signUpError.name === "UsernameExistsException") {
      DebugConsole.auth(
        "[PasswordlessAuth] User exists, proceeding with InitiateAuth",
      );
    } else {
      // Unexpected error during SignUp
      DebugConsole.auth(
        "[PasswordlessAuth] SignUp error:",
        signUpError.name,
        signUpError.message,
      );
      throw signUpError;
    }
  }

  // User exists, try to authenticate (existing user flow)
  try {
    const response = await client.send(
      new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_AUTH,
        ClientId: cognitoConfig.clientId,
        AuthParameters: {
          USERNAME: normalizedEmail,
        },
      }),
    );

    DebugConsole.auth(
      "[PasswordlessAuth] InitiateAuth succeeded, challenge:",
      response.ChallengeName,
    );

    // Handle SELECT_CHALLENGE
    if (response.ChallengeName === "SELECT_CHALLENGE") {
      const preferredChallenge = options.preferredChallenge || "EMAIL_OTP";

      DebugConsole.auth(
        "[PasswordlessAuth] Responding to SELECT_CHALLENGE with:",
        preferredChallenge,
      );

      const selectResponse = await client.send(
        new RespondToAuthChallengeCommand({
          ClientId: cognitoConfig.clientId,
          ChallengeName: "SELECT_CHALLENGE",
          Session: response.Session,
          ChallengeResponses: {
            USERNAME: normalizedEmail,
            ANSWER: preferredChallenge,
          },
        }),
      );

      DebugConsole.auth(
        "[PasswordlessAuth] SELECT_CHALLENGE response:",
        selectResponse.ChallengeName,
      );
      DebugConsole.auth(
        "[PasswordlessAuth] Code delivery:",
        selectResponse.ChallengeParameters?.CODE_DELIVERY_DELIVERY_MEDIUM,
        selectResponse.ChallengeParameters?.CODE_DELIVERY_DESTINATION,
      );

      return {
        username: normalizedEmail,
        email: normalizedEmail,
        phoneNumber: options.phoneNumber,
        session: selectResponse.Session || "",
        challengeName: selectResponse.ChallengeName || preferredChallenge,
        challengeParameters: selectResponse.ChallengeParameters,
        preferredChallenge,
      };
    }

    // Direct challenge (EMAIL_OTP/SMS_OTP) - no SELECT_CHALLENGE step
    DebugConsole.auth(
      "[PasswordlessAuth] Direct challenge:",
      response.ChallengeName,
    );
    DebugConsole.auth(
      "[PasswordlessAuth] Code delivery:",
      response.ChallengeParameters?.CODE_DELIVERY_DELIVERY_MEDIUM,
      response.ChallengeParameters?.CODE_DELIVERY_DESTINATION,
    );

    return {
      username: normalizedEmail,
      email: normalizedEmail,
      phoneNumber: options.phoneNumber,
      session: response.Session || "",
      challengeName: response.ChallengeName || "EMAIL_OTP",
      challengeParameters: response.ChallengeParameters,
      preferredChallenge: options.preferredChallenge,
    };
  } catch (error: any) {
    DebugConsole.auth("[PasswordlessAuth] InitiateAuth failed:", error.name);

    // User exists but not confirmed - resend verification code
    if (error.name === "UserNotConfirmedException") {
      DebugConsole.auth(
        "[PasswordlessAuth] User exists but not confirmed, resending verification code",
      );

      // Resend confirmation code
      try {
        await client.send(
          new ResendConfirmationCodeCommand({
            ClientId: cognitoConfig.clientId,
            Username: normalizedEmail,
          }),
        );

        DebugConsole.auth("[PasswordlessAuth] Verification code resent");
      } catch (resendError: any) {
        DebugConsole.error(
          "[PasswordlessAuth] Failed to resend code:",
          resendError,
        );
      }

      return {
        username: normalizedEmail,
        email: normalizedEmail,
        phoneNumber: options.phoneNumber,
        session: "PENDING_CONFIRMATION",
        challengeName: "CONFIRM_SIGN_UP",
        preferredChallenge: options.preferredChallenge,
      };
    }

    // Note: UserNotFoundException should never happen here because we tried SignUp first
    // If it does, it's an unexpected state - log and throw

    // Unexpected error
    DebugConsole.error("[PasswordlessAuth] Unexpected auth error:", error);
    DebugConsole.error("[PasswordlessAuth] Error name:", error.name);
    DebugConsole.error("[PasswordlessAuth] Error message:", error.message);
    throw error;
  }
}

/**
 * Confirm a verification or login code
 *
 * For CONFIRM_SIGN_UP: verifies the account and initiates login
 * For EMAIL_OTP/SMS_OTP: completes login and returns tokens
 */
export async function confirmPasswordlessAuth(
  session: PasswordlessAuthSession,
  code: string,
): Promise<PasswordlessAuthResult> {
  const trimmedCode = code.trim();

  // Handle account confirmation
  if (session.challengeName === "CONFIRM_SIGN_UP") {
    await client.send(
      new ConfirmSignUpCommand({
        ClientId: cognitoConfig.clientId,
        Username: session.username,
        ConfirmationCode: trimmedCode,
      }),
    );

    DebugConsole.auth(
      "[PasswordlessAuth] Account confirmed:",
      session.username,
    );

    // NEW: Signal that profile completion is available for new users
    if (session.isNewUser) {
      return {
        needsProfileCompletion: true,
        nextSession: {
          ...session,
          challengeName: "PROFILE_COMPLETION", // Custom step
          session: "PROFILE_COMPLETION",
        },
      };
    }

    // After confirmation, initiate auth to get login code
    const authSession = await startPasswordlessAuth(
      session.email || session.username,
      {
        preferredChallenge: session.preferredChallenge as
          | "EMAIL_OTP"
          | "SMS_OTP",
        phoneNumber: session.phoneNumber,
      },
    );

    return { nextSession: authSession };
  }

  // Handle EMAIL_OTP/SMS_OTP
  const challengeResponses: Record<string, string> = {
    USERNAME: session.username,
  };

  if (session.challengeName === "EMAIL_OTP") {
    challengeResponses.EMAIL_OTP_CODE = trimmedCode;
  } else if (session.challengeName === "SMS_OTP") {
    challengeResponses.SMS_OTP_CODE = trimmedCode;
  }
  challengeResponses.ANSWER = trimmedCode;

  const response = await client.send(
    new RespondToAuthChallengeCommand({
      ClientId: cognitoConfig.clientId,
      ChallengeName: session.challengeName as ChallengeNameType,
      Session: session.session,
      ChallengeResponses: challengeResponses,
    }),
  );

  if (!response.AuthenticationResult) {
    throw new Error("Authentication failed - no tokens returned");
  }

  return {
    tokens: {
      idToken: response.AuthenticationResult.IdToken,
      accessToken: response.AuthenticationResult.AccessToken,
      refreshToken: response.AuthenticationResult.RefreshToken,
      expiresIn: response.AuthenticationResult.ExpiresIn,
      tokenType: response.AuthenticationResult.TokenType,
    },
  };
}

/**
 * Resend verification or login code
 */
export async function resendPasswordlessCode(
  session: PasswordlessAuthSession,
): Promise<PasswordlessAuthSession> {
  // Handle CONFIRM_SIGN_UP - resend confirmation code
  if (session.challengeName === "CONFIRM_SIGN_UP") {
    await client.send(
      new ResendConfirmationCodeCommand({
        ClientId: cognitoConfig.clientId,
        Username: session.username,
      }),
    );
    DebugConsole.auth(
      "[PasswordlessAuth] Resent confirmation code:",
      session.username,
    );
    return session; // Return same session
  }

  // For EMAIL_OTP/SMS_OTP - re-initiate auth to get a new code
  return await startPasswordlessAuth(session.email || session.username, {
    preferredChallenge: session.preferredChallenge as "EMAIL_OTP" | "SMS_OTP",
    phoneNumber: session.phoneNumber || undefined,
  });
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

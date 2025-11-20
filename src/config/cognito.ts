// Cognito configuration for direct AWS SDK integration
// Values are read from environment variables (see .env file)
export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  domain: string;
  region: string;
  scopes: string[];
  redirectUri: string;
  logoutUri: string;
}

export const cognitoConfig: CognitoConfig = {
  userPoolId:
    import.meta.env.PUBLIC_COGNITO_USER_POOL_ID || "us-west-2_UqZZY2Hbw",
  clientId:
    import.meta.env.PUBLIC_COGNITO_CLIENT_ID || "hsrpdhl5sellv9n3dotako1tm",
  domain: import.meta.env.PUBLIC_COGNITO_DOMAIN || "auth.skicyclerun.com",
  region: import.meta.env.PUBLIC_COGNITO_REGION || "us-west-2",
  scopes: import.meta.env.PUBLIC_COGNITO_SCOPES?.split(",") || [
    "openid",
    "email",
    "profile",
    "phone",
  ],
  redirectUri: import.meta.env.PUBLIC_COGNITO_REDIRECT_URI || "/", // Relative path, will be combined with origin
  logoutUri: import.meta.env.PUBLIC_COGNITO_LOGOUT_URI || "/", // Relative path, will be combined with origin
};

// Validation - warn if environment variables are missing
if (typeof window === "undefined") {
  // Server-side validation only
  if (!import.meta.env.PUBLIC_COGNITO_USER_POOL_ID) {
    console.warn(
      "[Cognito] PUBLIC_COGNITO_USER_POOL_ID not set, using fallback",
    );
  }
  if (!import.meta.env.PUBLIC_COGNITO_CLIENT_ID) {
    console.warn("[Cognito] PUBLIC_COGNITO_CLIENT_ID not set, using fallback");
  }
}

// Helper to get full URLs
export function getRedirectUri(): string {
  if (typeof window !== "undefined") {
    return window.location.origin + cognitoConfig.redirectUri;
  }
  return cognitoConfig.redirectUri;
}

export function getLogoutUri(): string {
  if (typeof window !== "undefined") {
    return window.location.origin + cognitoConfig.logoutUri;
  }
  return cognitoConfig.logoutUri;
}

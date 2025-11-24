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

function requireEnv(name: string, value?: string): string {
  if (!value) {
    throw new Error(
      `CRITICAL CONFIG ERROR: Missing environment variable ${name}. Check your .env file.`,
    );
  }
  return value;
}

export const cognitoConfig: CognitoConfig = {
  userPoolId: requireEnv(
    "PUBLIC_COGNITO_USER_POOL_ID",
    import.meta.env.PUBLIC_COGNITO_USER_POOL_ID,
  ),
  clientId: requireEnv(
    "PUBLIC_COGNITO_CLIENT_ID",
    import.meta.env.PUBLIC_COGNITO_CLIENT_ID,
  ),
  domain: requireEnv(
    "PUBLIC_COGNITO_DOMAIN",
    import.meta.env.PUBLIC_COGNITO_DOMAIN,
  ),
  region: requireEnv(
    "PUBLIC_COGNITO_REGION",
    import.meta.env.PUBLIC_COGNITO_REGION,
  ),
  scopes: (
    import.meta.env.PUBLIC_COGNITO_SCOPES || "openid,email,profile,phone"
  ).split(","),
  redirectUri: import.meta.env.PUBLIC_COGNITO_REDIRECT_URI || "/", // Relative path, will be combined with origin
  logoutUri: import.meta.env.PUBLIC_COGNITO_LOGOUT_URI || "/", // Relative path, will be combined with origin
};

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

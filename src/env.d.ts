/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// If your editor still reports missing modules for astro:* virtual imports,
// ensure you've run `npm run sync` (or `astro sync`) and are using the
// workspace TypeScript version in VS Code.

interface ImportMetaEnv {
  readonly PUBLIC_COGNITO_USER_POOL_ID: string;
  readonly PUBLIC_COGNITO_CLIENT_ID: string;
  readonly PUBLIC_COGNITO_DOMAIN: string;
  readonly PUBLIC_COGNITO_REGION: string;
  readonly PUBLIC_COGNITO_SCOPES: string;
  readonly PUBLIC_COGNITO_REDIRECT_URI: string;
  readonly PUBLIC_COGNITO_LOGOUT_URI: string;
  readonly PUBLIC_COGNITO_TIMEZONE_ATTRIBUTE?: string;
  readonly PUBLIC_COGNITO_TIMEZONE_VALUE?: string;
  readonly PUBLIC_COGNITO_TIMEZONE_REQUIRED?: string;
  readonly PUBLIC_COGNITO_DEFAULT_OTP_LENGTH?: string;
  readonly PUBLIC_COGNITO_OTP_LENGTH?: string;
  readonly PUBLIC_AUTH_METHODS?: string;
  readonly PUBLIC_DEFAULT_TIMEZONE?: string;
  readonly PUBLIC_DEBUG_OUTPUT?: string;
  // Add other PUBLIC_ variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Augment to allow JSON import if not already declared
declare module "*.json" {
  const value: any;
  export default value;
}

// Augment Window interface for auth APIs
interface Window {
  __passwordlessAuth?: {
    getState: () => Promise<{
      signedIn: boolean;
      email?: string;
      idToken?: string;
      accessToken?: string;
      groups?: string[];
    }>;
    open: () => void;
    clearSession: () => void;
  };
  __authBridge?: {
    login: (redirectUri?: string) => Promise<string>;
    logout: (redirectUri?: string) => Promise<string>;
    getState: () => Promise<{
      signedIn: boolean;
      email?: string;
      idToken?: string;
      accessToken?: string;
      groups?: string[];
    }>;
  };
  updateAuthIcon?: () => void;
  debugLog?: (category: string, ...args: any[]) => void;
  debugError?: (category: string, ...args: any[]) => void;
  debugWarn?: (category: string, ...args: any[]) => void;
}

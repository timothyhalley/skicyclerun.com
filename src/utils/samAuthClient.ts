/**
 * Passwordless Auth Client
 * Thin HTTP wrapper over the API Gateway OTP endpoints.
 */

export type OtpChallenge = "EMAIL_OTP" | "SMS_OTP";

export type SendOtpRequest = {
  email?: string;
  phoneNumber?: string;
  preferredChallenge: OtpChallenge;
};

export type SendOtpResponse = {
  success?: boolean;
  message?: string;
  challengeName?: string;
  session?: string;
  availableChallenges?: string[];
  challengeParameters?: Record<string, string>;
  metadata?: {
    httpStatusCode?: number;
    requestId?: string;
    attempts?: number;
    totalRetryDelay?: number;
  };
};

export type VerifyOtpRequest = {
  email?: string;
  phoneNumber?: string;
  code: string;
};

export type VerifyOtpResponse = {
  success?: boolean;
  verified?: boolean;
  message?: string;
  sub?: string;
  username?: string;
  name?: string;
  email?: string;
  emailPopulated?: boolean;
  emailVerified?: boolean;
  phone?: string;
  phoneVerified?: boolean;
  zoneinfo?: string;
  location?: string | null;
  groups?: string[];
  createdTime?: string;
  lastUpdatedTime?: string;
  userStatus?: string;
  enabled?: boolean;
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  tokens?: {
    idToken?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
  };
  authenticationResult?: {
    IdToken?: string;
    AccessToken?: string;
    RefreshToken?: string;
    TokenType?: string;
    ExpiresIn?: number;
  };
  AuthenticationResult?: {
    IdToken?: string;
    AccessToken?: string;
    RefreshToken?: string;
    TokenType?: string;
    ExpiresIn?: number;
  };
  metadata?: {
    httpStatusCode?: number;
    requestId?: string;
    attempts?: number;
    totalRetryDelay?: number;
  };
};

export type PasswordlessClientOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

export class PasswordlessAuthError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "PasswordlessAuthError";
    this.status = status;
    this.body = body;
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function normalizeAuthApiBaseUrl(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl.trim());
  if (normalized.endsWith("/v2")) {
    return normalized.slice(0, -3);
  }
  return normalized;
}

function buildIdentifierPayload(input: SendOtpRequest | VerifyOtpRequest) {
  const email = input.email?.trim() || undefined;
  const phoneNumber = input.phoneNumber?.trim() || undefined;

  return {
    ...(email ? { email } : {}),
    ...(phoneNumber ? { phoneNumber } : {}),
  };
}

function toErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === "object" && body && "error" in body) {
    const err = (body as { error?: unknown }).error;
    if (typeof err === "string" && err.length > 0) {
      return err;
    }
  }

  if (typeof body === "object" && body && "message" in body) {
    const msg = (body as { message?: unknown }).message;
    if (typeof msg === "string" && msg.length > 0) {
      return msg;
    }
  }

  return fallback;
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export function createPasswordlessAuthClient(
  options: PasswordlessClientOptions,
) {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchImpl = options.fetchImpl ?? fetch;

  async function post<T>(path: string, payload: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetchImpl(baseUrl + path, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new PasswordlessAuthError(
        "Network request failed. Check API URL, HTTPS certificate, and CORS configuration.",
        0,
        { error: String(error) },
      );
    }

    const body = await parseJsonSafe(response);

    if (!response.ok) {
      const statusPrefix = `Request failed (${response.status})`;
      throw new PasswordlessAuthError(
        toErrorMessage(body, statusPrefix),
        response.status,
        body,
      );
    }

    return body as T;
  }

  return {
    sendOtp(input: SendOtpRequest): Promise<SendOtpResponse> {
      const identifierPayload = buildIdentifierPayload(input);

      return post<SendOtpResponse>("/v2/auth/send-otp", {
        action: "send",
        ...identifierPayload,
      });
    },

    verifyOtp(input: VerifyOtpRequest): Promise<VerifyOtpResponse> {
      const identifierPayload = buildIdentifierPayload(input);

      return post<VerifyOtpResponse>("/v2/auth/verify-otp", {
        otp: input.code,
        ...identifierPayload,
      });
    },
  };
}

// Create default client with base URL from environment
function initializeClient() {
  const configuredBaseUrl =
    import.meta.env.PUBLIC_AUTH_API_URL ||
    import.meta.env.PUBLIC_SKICYCLERUN_API ||
    "https://api.skicyclerun.com";

  const baseUrl = normalizeAuthApiBaseUrl(configuredBaseUrl);

  return createPasswordlessAuthClient({ baseUrl });
}

export const samAuthClient = initializeClient();

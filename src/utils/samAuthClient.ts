/**
 * SAM (Serverless Application Model) Passwordless Auth Client
 * Thin HTTP wrapper over AWS Cognito via API Gateway + Lambda
 *
 * Endpoints:
 * - POST /v2/auth/send-otp       → initiate passwordless challenge
 * - POST /v2/auth/verify-otp     → verify OTP and return tokens
 */

export type OtpChallenge = "EMAIL_OTP" | "SMS_OTP";

export type SendOtpRequest = {
  username: string;
  preferredChallenge: OtpChallenge;
};

export type SendOtpResponse = {
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
  username: string;
  session: string;
  challengeName: OtpChallenge;
  code: string;
};

export type VerifyOtpResponse = {
  challengeName?: string;
  session?: string;
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
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
    const response = await fetchImpl(baseUrl + path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = await parseJsonSafe(response);

    if (!response.ok) {
      throw new PasswordlessAuthError(
        toErrorMessage(body, "Passwordless auth request failed"),
        response.status,
        body,
      );
    }

    return body as T;
  }

  return {
    sendOtp(input: SendOtpRequest): Promise<SendOtpResponse> {
      return post<SendOtpResponse>("/v2/auth/send-otp", {
        username: input.username,
        preferredChallenge: input.preferredChallenge,
      });
    },

    verifyOtp(input: VerifyOtpRequest): Promise<VerifyOtpResponse> {
      return post<VerifyOtpResponse>("/v2/auth/verify-otp", {
        username: input.username,
        session: input.session,
        challengeName: input.challengeName,
        code: input.code,
      });
    },
  };
}

// Create default client with base URL from environment
function initializeClient() {
  const baseUrl =
    import.meta.env.PUBLIC_AUTH_API_URL ||
    "https://ltohdaduj0.execute-api.us-west-2.amazonaws.com/Prod";

  return createPasswordlessAuthClient({ baseUrl });
}

export const samAuthClient = initializeClient();

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
  message?: string;
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
  const baseUrl =
    import.meta.env.PUBLIC_AUTH_API_URL ||
    "https://ltohdaduj0.execute-api.us-west-2.amazonaws.com/Prod";

  return createPasswordlessAuthClient({ baseUrl });
}

export const samAuthClient = initializeClient();

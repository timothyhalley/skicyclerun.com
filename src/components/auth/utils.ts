import type { PasswordlessMethod } from "./types";
import {
  PASSWORDLESS_METHOD_ALIASES,
  PASSWORDLESS_METHOD_DEFAULT_ORDER,
  STATIC_ALLOWED_CODE_LENGTHS,
  fallbackOtpLength,
} from "./constants";
import type { PasswordlessAuthSession } from "@utils/passwordlessAuth";

export function resolvePasswordlessMethods(): PasswordlessMethod[] {
  const raw = import.meta.env.PUBLIC_AUTH_METHODS?.trim();
  const values: PasswordlessMethod[] = [];
  const seen = new Set<PasswordlessMethod>();

  const append = (method?: PasswordlessMethod) => {
    if (!method) return;
    if (seen.has(method)) return;
    seen.add(method);
    values.push(method);
  };

  if (raw) {
    raw
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        const key = item.toUpperCase();
        const mapped = PASSWORDLESS_METHOD_ALIASES[key];
        append(mapped);
      });
  }

  PASSWORDLESS_METHOD_DEFAULT_ORDER.forEach((method) => append(method));

  if (values.length === 0) {
    values.push("EMAIL_OTP");
  }

  return values;
}

export const PASSWORDLESS_METHOD_ORDER = resolvePasswordlessMethods();
export const INITIAL_PASSWORDLESS_METHOD = PASSWORDLESS_METHOD_ORDER[0];

export const isPasswordlessMethod = (
  value: string | null | undefined,
): value is PasswordlessMethod => value === "EMAIL_OTP" || value === "SMS_OTP";

export const normalizeMethod = (value?: string | null): PasswordlessMethod => {
  if (
    isPasswordlessMethod(value) &&
    PASSWORDLESS_METHOD_ORDER.includes(value)
  ) {
    return value;
  }
  return INITIAL_PASSWORDLESS_METHOD;
};

export const clampOtpLength = (
  value: number | undefined | null,
): number | null => {
  if (value == null) return null;
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded <= 0) return null;
  const min = 4;
  const max = 8;
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
};

export const normalizePhoneNumber = (value: string): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) {
    const digits = "+" + trimmed.slice(1).replace(/\D/g, "");
    return digits.length > 1 ? digits : null;
  }
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }
  if (digitsOnly.length > 0) {
    return `+${digitsOnly}`;
  }
  return null;
};

export function calculateExpectedCodeLength(
  session: PasswordlessAuthSession | null,
): number {
  const candidates = [
    session?.challengeParameters?.CODE_LENGTH,
    session?.challengeParameters?.OTP_LENGTH,
    session?.challengeParameters?.OTPCodeLength,
    session?.challengeParameters?.otpLength,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = Number(candidate);
    const clamped = clampOtpLength(parsed);
    if (clamped) {
      return clamped;
    }
  }

  return fallbackOtpLength;
}

export function calculateAllowedCodeLengths(expectedLength: number): number[] {
  const values = new Set<number>();
  const candidates = [
    expectedLength,
    fallbackOtpLength,
    ...STATIC_ALLOWED_CODE_LENGTHS,
  ];

  for (const candidate of candidates) {
    const clamped = clampOtpLength(candidate);
    if (clamped) {
      values.add(clamped);
    }
  }

  return Array.from(values).sort((a, b) => a - b);
}

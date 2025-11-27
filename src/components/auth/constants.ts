import type { PasswordlessMethod, MethodConfig } from "./types";

export const RESEND_COOLDOWN_SECONDS = 45;
export const DIALOG_STATE_KEY = "passwordless_dialog_state";
export const STATIC_ALLOWED_CODE_LENGTHS = [4, 6, 8] as const;

export const PASSWORDLESS_METHOD_ALIASES: Record<string, PasswordlessMethod> = {
  EMAIL: "EMAIL_OTP",
  EMAIL_OTP: "EMAIL_OTP",
  SMS: "SMS_OTP",
  SMS_OTP: "SMS_OTP",
};

export const PASSWORDLESS_METHOD_DEFAULT_ORDER: PasswordlessMethod[] = [
  "EMAIL_OTP",
  "SMS_OTP",
];

export const METHOD_COPY: Record<PasswordlessMethod, MethodConfig> = {
  EMAIL_OTP: {
    label: "Email code",
    sending: "Sending email code...",
    sendSuccess: "Code sent! Check your inbox and enter the digits below.",
    resendSuccess: "A fresh email code is on the way.",
    prompt: (email?: string | null) =>
      email && email.length > 0
        ? `Enter the code we sent to ${email}.`
        : "Enter the code we sent to your email.",
  },
  SMS_OTP: {
    label: "Text message",
    sending: "Sending text message...",
    sendSuccess: "Text sent! Check your phone and enter the digits below.",
    resendSuccess: "We just texted you a fresh code.",
    prompt: () => "Enter the code we sent via text message.",
  },
};

// Calculate fallback OTP length from environment
const otpLengthEnvCandidates = [
  import.meta.env.PUBLIC_COGNITO_DEFAULT_OTP_LENGTH,
  import.meta.env.PUBLIC_COGNITO_OTP_LENGTH,
];

export const fallbackOtpLength = (() => {
  const clampOtpLength = (value: number | undefined | null): number | null => {
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

  for (const candidate of otpLengthEnvCandidates) {
    if (!candidate) continue;
    const parsed = Number(candidate);
    const clamped = clampOtpLength(parsed);
    if (clamped) return clamped;
  }
  return 8;
})();

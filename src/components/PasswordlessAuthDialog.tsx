import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ChallengeNameType } from "@aws-sdk/client-cognito-identity-provider";
import { DebugConsole } from "@utils/DebugConsole";
import {
  PasswordlessAuthSession,
  confirmPasswordlessAuth,
  resendPasswordlessCode,
  startPasswordlessAuth,
  updateUserAttributes,
} from "@utils/passwordlessAuth";
import { storeTokens, clearTokens, getAuthState } from "@utils/clientAuth";
import {
  detectGeolocation,
  formatLocationForDisplay,
  parseLocationFromDisplay,
  validateLocation,
  requestGeolocationPermission,
} from "@utils/geolocation";
import {
  formatPhoneToE164,
  isValidE164,
  formatPhoneForDisplay,
} from "@utils/phoneFormat";

interface StatusMessage {
  tone: "info" | "error" | "success";
  text: string;
}

type Step = "email" | "code" | "profile" | "success";

const RESEND_COOLDOWN_SECONDS = 45;

type PasswordlessMethod = "EMAIL_OTP" | "SMS_OTP";

const PASSWORDLESS_METHOD_ALIASES: Record<string, PasswordlessMethod> = {
  EMAIL: "EMAIL_OTP",
  EMAIL_OTP: "EMAIL_OTP",
  SMS: "SMS_OTP",
  SMS_OTP: "SMS_OTP",
};

const PASSWORDLESS_METHOD_DEFAULT_ORDER: PasswordlessMethod[] = [
  "EMAIL_OTP",
  "SMS_OTP",
];

function resolvePasswordlessMethods(): PasswordlessMethod[] {
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

const PASSWORDLESS_METHOD_ORDER = resolvePasswordlessMethods();
const INITIAL_PASSWORDLESS_METHOD = PASSWORDLESS_METHOD_ORDER[0];

const METHOD_COPY: Record<
  PasswordlessMethod,
  {
    label: string;
    sending: string;
    sendSuccess: string;
    resendSuccess: string;
    prompt: (email?: string | null) => string;
  }
> = {
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

const isPasswordlessMethod = (
  value: string | null | undefined,
): value is PasswordlessMethod => value === "EMAIL_OTP" || value === "SMS_OTP";

const normalizeMethod = (value?: string | null): PasswordlessMethod => {
  if (
    isPasswordlessMethod(value) &&
    PASSWORDLESS_METHOD_ORDER.includes(value)
  ) {
    return value;
  }
  return INITIAL_PASSWORDLESS_METHOD;
};

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

const otpLengthEnvCandidates = [
  import.meta.env.PUBLIC_COGNITO_DEFAULT_OTP_LENGTH,
  import.meta.env.PUBLIC_COGNITO_OTP_LENGTH,
];

let fallbackOtpLength = 8;
for (const candidate of otpLengthEnvCandidates) {
  if (!candidate) continue;
  const parsed = Number(candidate);
  const clamped = clampOtpLength(parsed);
  if (clamped) {
    fallbackOtpLength = clamped;
    break;
  }
}

const STATIC_ALLOWED_CODE_LENGTHS = [4, 6, 8] as const;

const normalizePhoneNumber = (value: string): string | null => {
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

// Session persistence key
const DIALOG_STATE_KEY = "passwordless_dialog_state";

interface DialogState {
  isOpen: boolean;
  step: Step;
  email: string;
  code: string;
  phone: string;
  session: PasswordlessAuthSession | null;
  selectedMethod: PasswordlessMethod;
  profilePhone: string;
  profileLocation: string;
}

function saveDialogState(state: Partial<DialogState>) {
  try {
    const current = sessionStorage.getItem(DIALOG_STATE_KEY);
    const existing = current ? JSON.parse(current) : {};
    sessionStorage.setItem(
      DIALOG_STATE_KEY,
      JSON.stringify({ ...existing, ...state }),
    );
    DebugConsole.auth("[DialogState] Saved:", state);
  } catch (e) {
    DebugConsole.error("[DialogState] Failed to save:", e);
  }
}

function loadDialogState(): Partial<DialogState> | null {
  try {
    const stored = sessionStorage.getItem(DIALOG_STATE_KEY);
    if (!stored) return null;
    const state = JSON.parse(stored);
    DebugConsole.auth("[DialogState] Loaded:", state);
    return state;
  } catch (e) {
    DebugConsole.error("[DialogState] Failed to load:", e);
    return null;
  }
}

function clearDialogState() {
  try {
    sessionStorage.removeItem(DIALOG_STATE_KEY);
    DebugConsole.auth("[DialogState] Cleared");
  } catch (e) {
    DebugConsole.error("[DialogState] Failed to clear:", e);
  }
}

export default function PasswordlessAuthDialog() {
  // Try to restore state from sessionStorage on mount
  const savedState = loadDialogState();

  const [isOpen, setIsOpen] = useState(savedState?.isOpen ?? false);
  const [step, setStep] = useState<Step>(savedState?.step ?? "email");
  const [email, setEmail] = useState(savedState?.email ?? "");
  const [code, setCode] = useState(savedState?.code ?? "");
  const [phone, setPhone] = useState(savedState?.phone ?? "");
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<PasswordlessAuthSession | null>(
    savedState?.session ?? null,
  );
  const [resendTimer, setResendTimer] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<PasswordlessMethod>(
    savedState?.selectedMethod ?? INITIAL_PASSWORDLESS_METHOD,
  );
  const intervalRef = useRef<number | null>(null);

  // Profile completion state
  const [profilePhone, setProfilePhone] = useState(
    savedState?.profilePhone ?? "",
  );
  const [profileLocation, setProfileLocation] = useState(
    savedState?.profileLocation ?? "",
  );
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [tempAccessToken, setTempAccessToken] = useState<string | null>(null);

  const expectedCodeLength = useMemo(() => {
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
  }, [session]);

  const allowedCodeLengths = useMemo(() => {
    const values = new Set<number>();
    const candidates = [
      expectedCodeLength,
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
  }, [expectedCodeLength]);

  const maxInputLength = useMemo(() => {
    if (allowedCodeLengths.length === 0) return fallbackOtpLength;
    return allowedCodeLengths[allowedCodeLengths.length - 1];
  }, [allowedCodeLengths]);

  const isCodeLengthValid = useMemo(() => {
    if (code.length === 0) return false;
    return allowedCodeLengths.includes(code.length);
  }, [allowedCodeLengths, code.length]);

  useEffect(() => {
    if (resendTimer <= 0 && intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [resendTimer]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    const resolved = normalizeMethod(
      session.preferredChallenge ?? session.challengeName,
    );
    if (resolved !== selectedMethod) {
      setSelectedMethod(resolved);
    }
  }, [session, selectedMethod]);

  // Show helpful message when dialog state is restored (mobile app switching)
  useEffect(() => {
    if (savedState?.isOpen && savedState?.step === "code" && session) {
      DebugConsole.auth("[DialogState] Restored code step from saved state");
      setStatus({
        tone: "info",
        text: "👋 Welcome back! Enter your code to continue.",
      });
    }
  }, []); // Run once on mount

  const closeDialog = () => {
    setIsOpen(false);
    setStep("email");
    setEmail("");
    setCode("");
    setPhone("");
    setSession(null);
    setStatus(null);
    setLoading(false);
    clearResendCountdown();
    setSelectedMethod(INITIAL_PASSWORDLESS_METHOD);
    clearDialogState(); // Clear persisted state when closing
  };

  const clearResendCountdown = () => {
    setResendTimer(0);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startResendCountdown = () => {
    setResendTimer(RESEND_COOLDOWN_SECONDS);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      setResendTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);
  };

  const openDialog = () => {
    DebugConsole.auth("[PasswordlessAuthDialog] Opening dialog");
    setIsOpen(true);
    setStep("email");
    setStatus(null);
    setLoading(false);
    setCode("");
    setPhone("");
    clearResendCountdown();
    setSelectedMethod(INITIAL_PASSWORDLESS_METHOD);
    saveDialogState({ isOpen: true, step: "email" }); // Persist initial open state
  };

  const handleCodeChange = (value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(0, maxInputLength);
    setCode(sanitized);
    // Persist code as user types (in case they switch apps mid-typing)
    if (sanitized) {
      saveDialogState({ code: sanitized });
    }
  };

  const handleMethodSelect = (method: PasswordlessMethod) => {
    if (method === selectedMethod) return;
    if (loading) return;
    setSelectedMethod(method);
    setStatus(null);
    setCode("");
    setPhone("");
    setSession(null);
    if (step !== "email") {
      setStep("email");
      clearResendCountdown();
    }
  };

  const statusClass = useMemo(() => {
    if (!status) return "";
    if (status.tone === "error") return "pl-auth__status --error";
    if (status.tone === "success") return "pl-auth__status --success";
    return "pl-auth__status";
  }, [status]);

  const methodOptions = PASSWORDLESS_METHOD_ORDER;
  const isSmsSelected = selectedMethod === "SMS_OTP";
  const codePromptMethod =
    step === "code"
      ? normalizeMethod(
          session?.preferredChallenge ??
            session?.challengeName ??
            selectedMethod,
        )
      : selectedMethod;
  const codePromptCopy = METHOD_COPY[codePromptMethod];
  const promptEmail = session?.phoneNumber ?? session?.email ?? email;
  const emailStepMessage =
    selectedMethod === "SMS_OTP"
      ? "Enter your email and the phone number where you want the text sent."
      : "Enter your email and we'll send a one-time code to your inbox.";
  const sendButtonText =
    selectedMethod === "SMS_OTP" ? "Text me a code" : "Email me a code";

  // Determine if we're in verification (new account) or login (existing account) flow
  const isVerificationStep = session?.challengeName === "CONFIRM_SIGN_UP";
  const isLoginStep =
    session?.challengeName === "EMAIL_OTP" ||
    session?.challengeName === "SMS_OTP";

  const handleSendCode = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!email || loading) return;

    let normalizedPhone: string | null = null;
    if (selectedMethod === "SMS_OTP") {
      normalizedPhone = normalizePhoneNumber(phone);
      if (!normalizedPhone) {
        setStatus({
          tone: "error",
          text: "Enter a phone number with country code, e.g. +1 5551234567.",
        });
        return;
      }
    }

    try {
      setLoading(true);
      const copy = METHOD_COPY[selectedMethod];
      setStatus({ tone: "info", text: copy.sending });
      const authSession = await startPasswordlessAuth(email, {
        preferredChallenge: selectedMethod,
        phoneNumber: normalizedPhone || undefined,
      });
      if (authSession.tokens) {
        setSelectedMethod(
          normalizeMethod(
            authSession.preferredChallenge ?? authSession.challengeName,
          ),
        );
        storeTokens({
          idToken: authSession.tokens.idToken,
          accessToken: authSession.tokens.accessToken,
          refreshToken: authSession.tokens.refreshToken,
        });
        setSession(authSession);
        setStatus({
          tone: "success",
          text: "You're signed in!",
        });
        setStep("success");
        document.dispatchEvent(
          new CustomEvent("auth:state-change", {
            detail: { isAuthenticated: true },
          }),
        );
        setTimeout(() => {
          closeDialog();
          document.dispatchEvent(
            new CustomEvent("auth-changed", {
              detail: { authenticated: true },
            }),
          );
          if (window.updateAuthIcon) {
            window.updateAuthIcon();
          }
        }, 900);
        return;
      }

      // Handle new user confirmation flow
      if (authSession.challengeName === "CONFIRM_SIGN_UP") {
        setSession(authSession);
        setStep("code");
        setStatus({
          tone: "success",
          text: "Account created! Check your email for the verification code.",
        });
        startResendCountdown();
        // Persist state so dialog survives app switching on mobile
        saveDialogState({
          isOpen: true,
          step: "code",
          email,
          phone,
          session: authSession,
          selectedMethod,
        });
        return;
      }

      setSession(authSession);
      const resolvedMethod = normalizeMethod(
        authSession.preferredChallenge ?? authSession.challengeName,
      );
      setSelectedMethod(resolvedMethod);
      setStep("code");
      setStatus({
        tone: "success",
        text: METHOD_COPY[resolvedMethod].sendSuccess,
      });
      startResendCountdown();
      // Persist state so dialog survives app switching on mobile
      saveDialogState({
        isOpen: true,
        step: "code",
        email,
        phone,
        session: authSession,
        selectedMethod: resolvedMethod,
      });
    } catch (error: any) {
      DebugConsole.error(
        "[PasswordlessAuthDialog] Failed to start auth",
        error,
      );
      DebugConsole.error("[PasswordlessAuthDialog] Error name:", error?.name);
      DebugConsole.error(
        "[PasswordlessAuthDialog] Error code:",
        error?.$metadata?.httpStatusCode,
      );

      let message = "We couldn't send the code. Please try again.";

      // Handle specific error types
      if (error?.name === "InvalidParameterException") {
        message = `Invalid parameters: ${error.message}`;
      } else if (error?.name === "NotAuthorizedException") {
        message = "Authentication failed. Please check your credentials.";
      } else if (error?.name === "UserNotFoundException") {
        message = "User not found. Creating new account...";
      } else if (error?.name === "TooManyRequestsException") {
        message = "Too many attempts. Please wait a moment and try again.";
      } else if (error?.message) {
        message = error.message;
      }

      setStatus({ tone: "error", text: message });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!session || !code || loading) return;

    try {
      setLoading(true);
      setStatus({ tone: "info", text: "Verifying code..." });
      const result = await confirmPasswordlessAuth(session, code);

      // If we got tokens, we are done
      if (result.tokens) {
        storeTokens({
          idToken: result.tokens.idToken,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        });

        // Check if we have pending profile data to save
        const pendingProfile = sessionStorage.getItem("pending_profile");
        DebugConsole.auth(
          "[ProfileCompletion] Checking for pending profile data:",
          pendingProfile,
        );

        if (pendingProfile && result.tokens.accessToken) {
          try {
            const profileData = JSON.parse(pendingProfile);
            DebugConsole.auth(
              "[ProfileCompletion] Parsed profile data:",
              profileData,
            );
            DebugConsole.auth(
              "[ProfileCompletion] Access token present:",
              !!result.tokens.accessToken,
            );

            await updateUserAttributes(result.tokens.accessToken, profileData);
            sessionStorage.removeItem("pending_profile");

            DebugConsole.auth(
              "[ProfileCompletion] ✅ Profile data saved successfully!",
            );
            setStatus({
              tone: "success",
              text: "✅ Profile saved! You're signed in.",
            });
          } catch (error) {
            DebugConsole.error(
              "[ProfileCompletion] ❌ Failed to save profile data:",
              error,
            );
            // Don't block authentication if profile save fails
          }
        } else {
          DebugConsole.auth(
            "[ProfileCompletion] No pending profile data to save",
          );
        }

        setStatus({
          tone: "success",
          text: "Success! You're signed in.",
        });
        setStep("success");
        document.dispatchEvent(
          new CustomEvent("auth:state-change", {
            detail: { isAuthenticated: true },
          }),
        );
        setTimeout(() => {
          closeDialog();
          document.dispatchEvent(
            new CustomEvent("auth-changed", {
              detail: { authenticated: true },
            }),
          );
          if (window.updateAuthIcon) {
            window.updateAuthIcon();
          }
        }, 1200);
      } else if (result.needsProfileCompletion && result.nextSession) {
        // NEW: Account confirmed, offer profile completion
        setSession(result.nextSession);
        setCode("");
        setStatus({
          tone: "success",
          text: "✅ Account verified! Let's complete your profile (optional).",
        });
        setStep("profile");
        // Auto-detect location
        handleDetectLocation();
      } else if (result.nextSession) {
        // Account confirmed, now need login code
        setSession(result.nextSession);
        setCode("");
        const nextMethod = normalizeMethod(
          result.nextSession.preferredChallenge ??
            result.nextSession.challengeName,
        );
        setSelectedMethod(nextMethod);
        setStatus({
          tone: "success",
          text:
            nextMethod === "SMS_OTP"
              ? "✅ Account verified! Check your phone for a login code."
              : "✅ Account verified! Check your email for a login code.",
        });
        startResendCountdown();
      }
    } catch (error: any) {
      DebugConsole.error(
        "[PasswordlessAuthDialog] Failed to confirm code",
        error,
      );
      const message =
        error?.message || "That code didn't work. Double-check and try again.";
      setStatus({ tone: "error", text: message });
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = async () => {
    try {
      setLocationDetecting(true);
      setStatus({
        tone: "info",
        text: "🌍 We'll use your location to personalize content. Click 'Allow' when prompted.",
      });

      // Check permission first
      const hasPermission = await requestGeolocationPermission();
      if (!hasPermission) {
        setStatus({
          tone: "error",
          text: "Location access denied. You can enter it manually below.",
        });
        setLocationDetecting(false);
        return;
      }

      const result = await detectGeolocation();
      if (result?.location && result.location !== "unknown") {
        setProfileLocation(result.location);
        setStatus({
          tone: "success",
          text: `📍 Location detected: ${formatLocationForDisplay(result.location)}`,
        });
      } else {
        setStatus({
          tone: "error",
          text: "Couldn't detect location. Please enter manually.",
        });
      }
    } catch (error) {
      DebugConsole.warn("[ProfileCompletion] Failed to detect location", error);
      setStatus({
        tone: "error",
        text: "Location detection failed. Please enter manually.",
      });
    } finally {
      setLocationDetecting(false);
    }
  };

  const handleSkipProfile = async () => {
    if (!session || loading) return;
    // Skip profile, go straight to login code
    try {
      setLoading(true);
      const authSession = await startPasswordlessAuth(
        session.email || session.username,
        {
          preferredChallenge: session.preferredChallenge as
            | "EMAIL_OTP"
            | "SMS_OTP",
          phoneNumber: session.phoneNumber,
        },
      );
      setSession(authSession);
      setCode("");
      setStep("code");
      const nextMethod = normalizeMethod(
        authSession.preferredChallenge ?? authSession.challengeName,
      );
      setSelectedMethod(nextMethod);
      setStatus({
        tone: "success",
        text:
          nextMethod === "SMS_OTP"
            ? "Check your phone for a login code."
            : "Check your email for a login code.",
      });
      startResendCountdown();
    } catch (error: any) {
      DebugConsole.error("[ProfileCompletion] Failed to skip profile", error);
      setStatus({
        tone: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!session || loading) return;

    try {
      setLoading(true);
      setStatus({ tone: "info", text: "Validating your profile..." });

      // Validate and format phone number
      let formattedPhone: string | null = null;
      if (profilePhone) {
        formattedPhone = formatPhoneToE164(profilePhone);
        if (!formattedPhone || !isValidE164(formattedPhone)) {
          setStatus({
            tone: "error",
            text: "Invalid phone number. Please use format: +1 555 123 4567 or (555) 123-4567",
          });
          setLoading(false);
          return;
        }
        DebugConsole.auth(
          "[ProfileCompletion] Formatted phone:",
          formattedPhone,
        );
      }

      // Validate and normalize location
      let validLocation: string | null = null;
      if (profileLocation) {
        validLocation = validateLocation(profileLocation);
        if (!validLocation) {
          setStatus({
            tone: "error",
            text: "Invalid location format. Please use: country/state (e.g., usa/wa, canada/bc)",
          });
          setLoading(false);
          return;
        }
        DebugConsole.auth(
          "[ProfileCompletion] Validated location:",
          validLocation,
        );
      }

      setStatus({ tone: "info", text: "Completing your profile..." });

      // If we have profile data to save, store it temporarily
      if (formattedPhone || validLocation) {
        const profileData: any = {};
        if (formattedPhone) profileData.phone = formattedPhone;
        if (validLocation) profileData.location = validLocation;

        sessionStorage.setItem("pending_profile", JSON.stringify(profileData));
        DebugConsole.auth(
          "[ProfileCompletion] Stored pending profile:",
          profileData,
        );
      }

      // Get login code
      const authSession = await startPasswordlessAuth(
        session.email || session.username,
        {
          preferredChallenge: session.preferredChallenge as
            | "EMAIL_OTP"
            | "SMS_OTP",
          phoneNumber: formattedPhone || session.phoneNumber,
        },
      );

      setSession(authSession);
      setCode("");
      setStep("code");
      const nextMethod = normalizeMethod(
        authSession.preferredChallenge ?? authSession.challengeName,
      );
      setSelectedMethod(nextMethod);
      setStatus({
        tone: "success",
        text:
          nextMethod === "SMS_OTP"
            ? "Profile saved! Check your phone for a login code."
            : "Profile saved! Check your email for a login code.",
      });
      startResendCountdown();
    } catch (error: any) {
      DebugConsole.error(
        "[ProfileCompletion] Failed to complete profile",
        error,
      );
      setStatus({
        tone: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!session || loading || resendTimer > 0) return;
    try {
      setLoading(true);
      setStatus({
        tone: "info",
        text: METHOD_COPY[selectedMethod].sending,
      });
      const newSession = await resendPasswordlessCode(session);
      setSession(newSession);
      const resolvedMethod = normalizeMethod(
        newSession.preferredChallenge ?? newSession.challengeName,
      );
      setSelectedMethod(resolvedMethod);
      setStatus({
        tone: "success",
        text: METHOD_COPY[resolvedMethod].resendSuccess,
      });
      startResendCountdown();
      // Persist updated session after resend
      saveDialogState({
        session: newSession,
        selectedMethod: resolvedMethod,
      });
    } catch (error: any) {
      DebugConsole.error(
        "[PasswordlessAuthDialog] Failed to resend code",
        error,
      );
      setStatus({
        tone: "error",
        text: "We couldn't resend the code. Try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const globalAPI = {
      open: () => {
        if (!isOpen) {
          openDialog();
        }
      },
      close: () => {
        closeDialog();
      },
      clearSession: () => {
        clearTokens();
        document.dispatchEvent(
          new CustomEvent("auth-changed", {
            detail: { authenticated: false },
          }),
        );
        document.dispatchEvent(
          new CustomEvent("auth:state-change", {
            detail: { isAuthenticated: false },
          }),
        );
        if (window.updateAuthIcon) {
          window.updateAuthIcon();
        }
      },
      getState: () => getAuthState(),
    };

    (window as any).__passwordlessAuth = globalAPI;

    return () => {
      const stored = (window as any).__passwordlessAuth;
      if (stored === globalAPI) {
        delete (window as any).__passwordlessAuth;
      }
    };
  }, [isOpen]);

  return (
    <div className={`pl-auth__backdrop ${isOpen ? "--open" : ""}`}>
      <div className="pl-auth__dialog" role="dialog" aria-modal="true">
        <button
          type="button"
          className="pl-auth__close"
          onClick={closeDialog}
          aria-label="Close passwordless login"
          disabled={loading}
        >
          ×
        </button>

        <h2 className="pl-auth__title">
          {step === "email" && "Sign in or Create Account"}
          {step === "code" &&
            (codePromptMethod === "SMS_OTP"
              ? "Check your phone"
              : "Check your email")}
          {step === "profile" && "Complete Your Profile"}
          {step === "success" && "You're signed in"}
        </h2>

        <p className="pl-auth__subtitle">
          {step === "email" && emailStepMessage}
          {step === "code" && codePromptCopy.prompt(promptEmail)}
          {step === "profile" &&
            "Help us personalize your experience (optional)"}
          {step === "success" && "Hang tight—closing this window."}
        </p>

        {step === "code" && isVerificationStep && (
          <div className="pl-auth__step-indicator --verification">
            <svg
              className="pl-auth__step-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <div className="pl-auth__step-text">
              <strong>Step 1 of 2:</strong> Verify your account
            </div>
          </div>
        )}

        {step === "code" && isLoginStep && (
          <div className="pl-auth__step-indicator --login">
            <svg
              className="pl-auth__step-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <div className="pl-auth__step-text">
              <strong>Step 2 of 2:</strong> Sign in to your account
            </div>
          </div>
        )}

        {status && <div className={statusClass}>{status.text}</div>}

        {step === "email" && (
          <form className="pl-auth__form" onSubmit={handleSendCode}>
            {methodOptions.length > 1 && (
              <div
                className="pl-auth__method-toggle"
                role="group"
                aria-label="Choose how to receive your sign-in code"
              >
                {methodOptions.map((method) => {
                  const copy = METHOD_COPY[method];
                  const isActive = selectedMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      className={`pl-auth__method-button ${isActive ? "--active" : ""}`}
                      onClick={() => handleMethodSelect(method)}
                      disabled={loading}
                    >
                      {copy.label}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedMethod === "SMS_OTP" && (
              <>
                <p className="pl-auth__hint">
                  We’ll text the code to your verified phone number. Include the
                  country code (e.g. +1).
                </p>
                <label className="pl-auth__label" htmlFor="passwordless-phone">
                  Phone number
                </label>
                <input
                  id="passwordless-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+1 555 123 4567"
                  className="pl-auth__input"
                  autoComplete="tel"
                  disabled={loading}
                />
              </>
            )}
            <label className="pl-auth__label" htmlFor="passwordless-email">
              Account email
            </label>
            <input
              id="passwordless-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
              className="pl-auth__input"
              autoComplete="email"
              disabled={loading}
            />
            <button
              type="submit"
              className="pl-auth__button --primary"
              disabled={
                loading ||
                !email ||
                (isSmsSelected && phone.trim().length === 0)
              }
            >
              {loading ? "Sending..." : sendButtonText}
            </button>
          </form>
        )}

        {step === "code" && (
          <form className="pl-auth__form" onSubmit={handleConfirmCode}>
            <label className="pl-auth__label" htmlFor="passwordless-code">
              One-time code
            </label>
            <input
              id="passwordless-code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={maxInputLength}
              value={code}
              onChange={(event) => handleCodeChange(event.target.value)}
              required
              placeholder={
                expectedCodeLength === 4
                  ? "1234"
                  : expectedCodeLength === 6
                    ? "123456"
                    : expectedCodeLength === 8
                      ? "12345678"
                      : "Enter code"
              }
              className="pl-auth__input --code"
              autoComplete="one-time-code"
              disabled={loading}
            />
            <button
              type="submit"
              className="pl-auth__button --primary"
              disabled={loading || !isCodeLengthValid}
            >
              {loading ? "Verifying..." : "Sign in"}
            </button>
            <button
              type="button"
              className="pl-auth__button --ghost"
              onClick={handleResendCode}
              disabled={loading || resendTimer > 0}
            >
              {resendTimer > 0
                ? `Resend code in ${resendTimer}s`
                : "Send a new code"}
            </button>
          </form>
        )}

        {step === "profile" && (
          <form className="pl-auth__form" onSubmit={handleCompleteProfile}>
            <div className="pl-auth__hint" style={{ marginBottom: "1rem" }}>
              These fields are optional. You can skip this step or fill them in
              later.
            </div>

            <label className="pl-auth__label" htmlFor="profile-phone">
              Phone number (optional)
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={profilePhone}
              onChange={(event) => setProfilePhone(event.target.value)}
              placeholder="+1 555 123 4567 or (555) 123-4567"
              className="pl-auth__input"
              autoComplete="tel"
              disabled={loading}
            />
            <div
              className="pl-auth__hint"
              style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}
            >
              Include country code (e.g., +1 for US/Canada)
            </div>

            <label className="pl-auth__label" htmlFor="profile-location">
              Location (optional)
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="profile-location"
                type="text"
                value={
                  profileLocation
                    ? formatLocationForDisplay(profileLocation)
                    : ""
                }
                onChange={(event) => {
                  const parsed = parseLocationFromDisplay(event.target.value);
                  setProfileLocation(parsed);
                }}
                placeholder="USA / WA or Canada / BC"
                className="pl-auth__input"
                disabled={loading || locationDetecting}
              />
              <div
                className="pl-auth__hint"
                style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}
              >
                Format: Country / State (e.g., USA / WA, Canada / BC, Japan)
              </div>
              {!profileLocation && (
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={loading || locationDetecting}
                  className="pl-auth__button --ghost"
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.875rem",
                    padding: "0.5rem 0.75rem",
                  }}
                >
                  {locationDetecting
                    ? "Detecting..."
                    : "📍 Auto-detect location"}
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                marginTop: "1.5rem",
              }}
            >
              <button
                type="button"
                onClick={handleSkipProfile}
                className="pl-auth__button --ghost"
                disabled={loading}
                style={{ flex: 1 }}
              >
                Skip
              </button>
              <button
                type="submit"
                className="pl-auth__button --primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? "Saving..." : "Continue"}
              </button>
            </div>
          </form>
        )}
      </div>
      <style>{`
        .pl-auth__backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1.5rem;
          backdrop-filter: blur(6px);
        }
        .pl-auth__backdrop.--open {
          display: flex;
        }
        .pl-auth__dialog {
          position: relative;
          background: var(--color-surface, #0f172a);
          color: var(--color-text, #f8fafc);
          width: min(420px, 100%);
          border-radius: 18px;
          padding: 1.75rem 1.75rem 2rem;
          box-shadow: 0 25px 70px rgba(15, 23, 42, 0.45);
          border: 1px solid rgba(248, 250, 252, 0.12);
          font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }
        .pl-auth__close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          border: none;
          background: transparent;
          color: inherit;
          font-size: 1.75rem;
          line-height: 1;
          cursor: pointer;
        }
        .pl-auth__title {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .pl-auth__subtitle {
          margin: 0 0 1.25rem 0;
          font-size: 0.95rem;
          color: rgba(248, 250, 252, 0.75);
        }
        .pl-auth__status {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          background: rgba(14, 165, 233, 0.1);
          color: rgba(125, 211, 252, 0.95);
          border: 1px solid rgba(125, 211, 252, 0.4);
        }
        .pl-auth__status.--error {
          background: rgba(248, 113, 113, 0.1);
          color: rgba(252, 165, 165, 0.95);
          border: 1px solid rgba(252, 165, 165, 0.35);
        }
        .pl-auth__status.--success {
          background: rgba(134, 239, 172, 0.08);
          color: rgba(187, 247, 208, 0.95);
          border: 1px solid rgba(34, 197, 94, 0.35);
        }
        .pl-auth__step-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          border: 2px solid;
          animation: slideIn 0.3s ease-out;
        }
        .pl-auth__step-indicator.--verification {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05));
          border-color: rgba(251, 191, 36, 0.4);
          color: rgba(253, 224, 71, 0.95);
        }
        .pl-auth__step-indicator.--login {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05));
          border-color: rgba(34, 197, 94, 0.4);
          color: rgba(187, 247, 208, 0.95);
        }
        .pl-auth__step-icon {
          width: 2rem;
          height: 2rem;
          flex-shrink: 0;
        }
        .pl-auth__step-text {
          font-size: 0.9rem;
          line-height: 1.4;
        }
        .pl-auth__step-text strong {
          display: block;
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: 0.15rem;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .pl-auth__form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .pl-auth__method-toggle {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.35rem;
        }
        .pl-auth__method-button {
          flex: 1;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.35);
          color: rgba(248, 250, 252, 0.85);
          border: 1px solid rgba(148, 163, 184, 0.35);
          padding: 0.6rem 0.85rem;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease,
            border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .pl-auth__method-button.--active {
          background: rgba(99, 102, 241, 0.9);
          border-color: rgba(99, 102, 241, 0.9);
          color: #0f172a;
          box-shadow: 0 12px 28px rgba(99, 102, 241, 0.3);
        }
        .pl-auth__method-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }
        .pl-auth__hint {
          margin: -0.1rem 0 0.35rem;
          font-size: 0.82rem;
          color: rgba(248, 250, 252, 0.6);
        }
        .pl-auth__label {
          font-size: 0.85rem;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: rgba(248, 250, 252, 0.6);
        }
        .pl-auth__input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          background: rgba(15, 23, 42, 0.65);
          color: inherit;
          padding: 0.85rem 1rem;
          font-size: 1rem;
        }
        .pl-auth__input.--code {
          letter-spacing: 0.6em;
          text-align: center;
          font-weight: 600;
        }
        .pl-auth__input:focus {
          outline: 2px solid rgba(59, 130, 246, 0.5);
          outline-offset: 2px;
        }
        .pl-auth__button {
          border-radius: 999px;
          padding: 0.85rem 1rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .pl-auth__button.--primary {
          background: linear-gradient(135deg, #38bdf8, #6366f1);
          color: #0f172a;
          box-shadow: 0 15px 30px rgba(99, 102, 241, 0.35);
        }
        .pl-auth__button.--primary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          box-shadow: none;
        }
        .pl-auth__button.--ghost {
          background: transparent;
          color: rgba(248, 250, 252, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.35);
        }
        .pl-auth__button.--ghost:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .pl-auth__dialog {
            padding: 1.5rem 1.25rem 1.75rem;
          }
        }
      `}</style>
    </div>
  );
}

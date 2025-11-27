import type { FormEvent } from "react";
import { DebugConsole } from "@utils/DebugConsole";
import {
  startPasswordlessAuth,
  confirmPasswordlessAuth,
  resendPasswordlessCode,
  updateUserAttributes,
} from "@utils/passwordlessAuth";
import { storeTokens } from "@utils/clientAuth";
import {
  detectGeolocation,
  formatLocationForDisplay,
  requestGeolocationPermission,
  validateLocation,
} from "@utils/geolocation";
import { formatPhoneToE164, isValidE164 } from "@utils/phoneFormat";
import type { PasswordlessMethod, Step, StatusMessage } from "./types";
import type { PasswordlessAuthSession } from "@utils/passwordlessAuth";
import { METHOD_COPY } from "./constants";
import { normalizeMethod, normalizePhoneNumber } from "./utils";
import { saveDialogState } from "./sessionStorage";

interface AuthHandlersContext {
  email: string;
  phone: string;
  code: string;
  session: PasswordlessAuthSession | null;
  selectedMethod: PasswordlessMethod;
  profilePhone: string;
  profileLocation: string;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setStatus: (status: StatusMessage | null) => void;
  setSession: (session: PasswordlessAuthSession | null) => void;
  setSelectedMethod: (method: PasswordlessMethod) => void;
  setStep: (step: Step) => void;
  setCode: (code: string) => void;
  setLocationDetecting: (detecting: boolean) => void;
  setProfileLocation: (location: string) => void;
  startResendCountdown: () => void;
  closeDialog: () => void;
}

export function createAuthHandlers(ctx: AuthHandlersContext) {
  const handleSendCode = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!ctx.email || ctx.loading) return;

    let normalizedPhone: string | null = null;
    if (ctx.selectedMethod === "SMS_OTP") {
      normalizedPhone = normalizePhoneNumber(ctx.phone);
      if (!normalizedPhone) {
        ctx.setStatus({
          tone: "error",
          text: "Enter a phone number with country code, e.g. +1 5551234567.",
        });
        return;
      }
    }

    try {
      ctx.setLoading(true);
      const copy = METHOD_COPY[ctx.selectedMethod];
      ctx.setStatus({ tone: "info", text: copy.sending });
      const authSession = await startPasswordlessAuth(ctx.email, {
        preferredChallenge: ctx.selectedMethod,
        phoneNumber: normalizedPhone || undefined,
      });

      if (authSession.tokens) {
        ctx.setSelectedMethod(
          normalizeMethod(
            authSession.preferredChallenge ?? authSession.challengeName,
          ),
        );
        storeTokens({
          idToken: authSession.tokens.idToken,
          accessToken: authSession.tokens.accessToken,
          refreshToken: authSession.tokens.refreshToken,
        });
        ctx.setSession(authSession);
        ctx.setStatus({
          tone: "success",
          text: "You're signed in!",
        });
        ctx.setStep("success");
        document.dispatchEvent(
          new CustomEvent("auth:state-change", {
            detail: { isAuthenticated: true },
          }),
        );
        setTimeout(() => {
          ctx.closeDialog();
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
        ctx.setSession(authSession);
        ctx.setStep("code");
        ctx.setStatus({
          tone: "success",
          text: "Account created! Check your email for the verification code.",
        });
        ctx.startResendCountdown();
        saveDialogState({
          isOpen: true,
          step: "code",
          email: ctx.email,
          phone: ctx.phone,
          session: authSession,
          selectedMethod: ctx.selectedMethod,
        });
        return;
      }

      ctx.setSession(authSession);
      const resolvedMethod = normalizeMethod(
        authSession.preferredChallenge ?? authSession.challengeName,
      );
      ctx.setSelectedMethod(resolvedMethod);
      ctx.setStep("code");
      ctx.setStatus({
        tone: "success",
        text: METHOD_COPY[resolvedMethod].sendSuccess,
      });
      ctx.startResendCountdown();
      saveDialogState({
        isOpen: true,
        step: "code",
        email: ctx.email,
        phone: ctx.phone,
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

      ctx.setStatus({ tone: "error", text: message });
    } finally {
      ctx.setLoading(false);
    }
  };

  const handleConfirmCode = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!ctx.session || !ctx.code || ctx.loading) return;

    try {
      ctx.setLoading(true);
      ctx.setStatus({ tone: "info", text: "Verifying code..." });
      const result = await confirmPasswordlessAuth(ctx.session, ctx.code);

      if (result.tokens) {
        storeTokens({
          idToken: result.tokens.idToken,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        });

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
            ctx.setStatus({
              tone: "success",
              text: "✅ Profile saved! You're signed in.",
            });
          } catch (error) {
            DebugConsole.error(
              "[ProfileCompletion] ❌ Failed to save profile data:",
              error,
            );
          }
        } else {
          DebugConsole.auth(
            "[ProfileCompletion] No pending profile data to save",
          );
        }

        ctx.setStatus({
          tone: "success",
          text: "Success! You're signed in.",
        });
        ctx.setStep("success");
        document.dispatchEvent(
          new CustomEvent("auth:state-change", {
            detail: { isAuthenticated: true },
          }),
        );
        setTimeout(() => {
          ctx.closeDialog();
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
        ctx.setSession(result.nextSession);
        ctx.setCode("");
        ctx.setStatus({
          tone: "success",
          text: "✅ Account verified! Let's complete your profile (optional).",
        });
        ctx.setStep("profile");
        handleDetectLocation();
      } else if (result.nextSession) {
        ctx.setSession(result.nextSession);
        ctx.setCode("");
        const nextMethod = normalizeMethod(
          result.nextSession.preferredChallenge ??
            result.nextSession.challengeName,
        );
        ctx.setSelectedMethod(nextMethod);
        ctx.setStatus({
          tone: "success",
          text:
            nextMethod === "SMS_OTP"
              ? "✅ Account verified! Check your phone for a login code."
              : "✅ Account verified! Check your email for a login code.",
        });
        ctx.startResendCountdown();
      }
    } catch (error: any) {
      DebugConsole.error(
        "[PasswordlessAuthDialog] Failed to confirm code",
        error,
      );
      const message =
        error?.message || "That code didn't work. Double-check and try again.";
      ctx.setStatus({ tone: "error", text: message });
    } finally {
      ctx.setLoading(false);
    }
  };

  const handleDetectLocation = async () => {
    try {
      ctx.setLocationDetecting(true);
      ctx.setStatus({
        tone: "info",
        text: "🌍 We'll use your location to personalize content. Click 'Allow' when prompted.",
      });

      const hasPermission = await requestGeolocationPermission();
      if (!hasPermission) {
        ctx.setStatus({
          tone: "error",
          text: "Location access denied. You can enter it manually below.",
        });
        ctx.setLocationDetecting(false);
        return;
      }

      const result = await detectGeolocation();
      if (result?.location && result.location !== "unknown") {
        ctx.setProfileLocation(result.location);
        ctx.setStatus({
          tone: "success",
          text: `📍 Location detected: ${formatLocationForDisplay(result.location)}`,
        });
      } else {
        ctx.setStatus({
          tone: "error",
          text: "Couldn't detect location. Please enter manually.",
        });
      }
    } catch (error) {
      DebugConsole.warn("[ProfileCompletion] Failed to detect location", error);
      ctx.setStatus({
        tone: "error",
        text: "Location detection failed. Please enter manually.",
      });
    } finally {
      ctx.setLocationDetecting(false);
    }
  };

  const handleSkipProfile = async () => {
    if (!ctx.session || ctx.loading) return;
    try {
      ctx.setLoading(true);
      const authSession = await startPasswordlessAuth(
        ctx.session.email || ctx.session.username,
        {
          preferredChallenge: ctx.session.preferredChallenge as
            | "EMAIL_OTP"
            | "SMS_OTP",
          phoneNumber: ctx.session.phoneNumber,
        },
      );
      ctx.setSession(authSession);
      ctx.setCode("");
      ctx.setStep("code");
      const nextMethod = normalizeMethod(
        authSession.preferredChallenge ?? authSession.challengeName,
      );
      ctx.setSelectedMethod(nextMethod);
      ctx.setStatus({
        tone: "success",
        text:
          nextMethod === "SMS_OTP"
            ? "Check your phone for a login code."
            : "Check your email for a login code.",
      });
      ctx.startResendCountdown();
    } catch (error: any) {
      DebugConsole.error("[ProfileCompletion] Failed to skip profile", error);
      ctx.setStatus({
        tone: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      ctx.setLoading(false);
    }
  };

  const handleCompleteProfile = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!ctx.session || ctx.loading) return;

    try {
      ctx.setLoading(true);
      ctx.setStatus({ tone: "info", text: "Validating your profile..." });

      let formattedPhone: string | null = null;
      if (ctx.profilePhone) {
        formattedPhone = formatPhoneToE164(ctx.profilePhone);
        if (!formattedPhone || !isValidE164(formattedPhone)) {
          ctx.setStatus({
            tone: "error",
            text: "Invalid phone number. Please use format: +1 555 123 4567 or (555) 123-4567",
          });
          ctx.setLoading(false);
          return;
        }
        DebugConsole.auth(
          "[ProfileCompletion] Formatted phone:",
          formattedPhone,
        );
      }

      let validLocation: string | null = null;
      if (ctx.profileLocation) {
        validLocation = validateLocation(ctx.profileLocation);
        if (!validLocation) {
          ctx.setStatus({
            tone: "error",
            text: "Invalid location format. Please use: country/state (e.g., usa/wa, canada/bc)",
          });
          ctx.setLoading(false);
          return;
        }
        DebugConsole.auth(
          "[ProfileCompletion] Validated location:",
          validLocation,
        );
      }

      ctx.setStatus({ tone: "info", text: "Completing your profile..." });

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

      const authSession = await startPasswordlessAuth(
        ctx.session.email || ctx.session.username,
        {
          preferredChallenge: ctx.session.preferredChallenge as
            | "EMAIL_OTP"
            | "SMS_OTP",
          phoneNumber: formattedPhone || ctx.session.phoneNumber,
        },
      );

      ctx.setSession(authSession);
      ctx.setCode("");
      ctx.setStep("code");
      const nextMethod = normalizeMethod(
        authSession.preferredChallenge ?? authSession.challengeName,
      );
      ctx.setSelectedMethod(nextMethod);
      ctx.setStatus({
        tone: "success",
        text:
          nextMethod === "SMS_OTP"
            ? "Profile saved! Check your phone for a login code."
            : "Profile saved! Check your email for a login code.",
      });
      ctx.startResendCountdown();
    } catch (error: any) {
      DebugConsole.error(
        "[ProfileCompletion] Failed to complete profile",
        error,
      );
      ctx.setStatus({
        tone: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      ctx.setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!ctx.session || ctx.loading) return;
    try {
      ctx.setLoading(true);
      ctx.setStatus({
        tone: "info",
        text: METHOD_COPY[ctx.selectedMethod].sending,
      });
      const newSession = await resendPasswordlessCode(ctx.session);
      ctx.setSession(newSession);
      const resolvedMethod = normalizeMethod(
        newSession.preferredChallenge ?? newSession.challengeName,
      );
      ctx.setSelectedMethod(resolvedMethod);
      ctx.setStatus({
        tone: "success",
        text: METHOD_COPY[resolvedMethod].resendSuccess,
      });
      ctx.startResendCountdown();
      saveDialogState({
        session: newSession,
        selectedMethod: resolvedMethod,
      });
    } catch (error: any) {
      DebugConsole.error(
        "[PasswordlessAuthDialog] Failed to resend code",
        error,
      );
      ctx.setStatus({
        tone: "error",
        text: "We couldn't resend the code. Try again in a moment.",
      });
    } finally {
      ctx.setLoading(false);
    }
  };

  return {
    handleSendCode,
    handleConfirmCode,
    handleDetectLocation,
    handleSkipProfile,
    handleCompleteProfile,
    handleResendCode,
  };
}

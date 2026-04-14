import type { FormEvent } from "react";
import { DebugConsole } from "@utils/DebugConsole";
import {
  startPasswordlessAuth,
  confirmPasswordlessAuth,
  resendPasswordlessCode,
  updateUserAttributes,
} from "@utils/passwordlessAuth";
import { PasswordlessAuthError } from "@utils/samAuthClient";
import { storePasswordlessSession } from "@utils/clientAuth";
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
  const getDeliveryDetails = (session: PasswordlessAuthSession | null) => {
    const medium =
      session?.challengeParameters?.CODE_DELIVERY_DELIVERY_MEDIUM || "";
    const destination =
      session?.challengeParameters?.CODE_DELIVERY_DESTINATION || "";
    return { medium, destination };
  };

  const buildDeliveryFailureMessage = (error: any): string | null => {
    // Handle SAM/HTTP errors (PasswordlessAuthError)
    if (error instanceof PasswordlessAuthError) {
      // SAM error message is already user-friendly
      return error.message;
    }

    // Legacy Cognito SDK error handling (kept for backwards compatibility)
    const name = String(error?.name || "");
    const rawMessage = String(error?.message || "");

    if (
      name === "CodeDeliveryFailureException" ||
      rawMessage.toLowerCase().includes("delivery")
    ) {
      return "Cognito could not deliver the code. Check Cognito email settings (or SES if configured), then try again.";
    }

    if (name === "InvalidEmailRoleAccessPolicyException") {
      return "Email delivery is not configured correctly in Cognito. Check SES identity/policy for this user pool.";
    }

    if (
      name === "InvalidSmsRoleAccessPolicyException" ||
      name === "InvalidSmsRoleTrustRelationshipException"
    ) {
      return "SMS delivery is not configured correctly in Cognito/SNS IAM role.";
    }

    if (
      name === "LimitExceededException" ||
      name === "TooManyRequestsException"
    ) {
      return "Too many code requests. Wait a minute, then request a new code.";
    }

    return null;
  };

  const handleSendCode = async (event?: FormEvent) => {
    event?.preventDefault();
    if (ctx.loading) return;

    const normalizedEmail = ctx.email.trim().toLowerCase();

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

      if (!normalizedEmail && !normalizedPhone) {
        ctx.setStatus({
          tone: "error",
          text: "Enter either an email or a phone number.",
        });
        return;
      }
    }

    if (ctx.selectedMethod !== "SMS_OTP" && !normalizedEmail) {
      return;
    }

    const authIdentifier =
      ctx.selectedMethod === "SMS_OTP"
        ? normalizedPhone || normalizedEmail || ""
        : normalizedEmail;

    try {
      ctx.setLoading(true);
      const copy = METHOD_COPY[ctx.selectedMethod];
      ctx.setStatus({ tone: "info", text: copy.sending });
      DebugConsole.api("[PasswordlessAuthDialog] POST /v2/auth/send-otp");
      const authSession = await startPasswordlessAuth(authIdentifier, {
        preferredChallenge: ctx.selectedMethod,
        phoneNumber: normalizedPhone || undefined,
      });

      ctx.setSession(authSession);
      const resolvedMethod = normalizeMethod(
        authSession.preferredChallenge ?? authSession.challengeName,
      );
      const { medium, destination } = getDeliveryDetails(authSession);

      ctx.setSelectedMethod(resolvedMethod);
      ctx.setStep("code");
      ctx.setStatus({
        tone: "success",
        text:
          destination && medium
            ? `Code sent via ${medium.toLowerCase()} to ${destination}.`
            : METHOD_COPY[resolvedMethod].sendSuccess,
      });
      ctx.startResendCountdown();
      saveDialogState({
        isOpen: true,
        step: "code",
        email: normalizedEmail,
        phone: ctx.phone,
        session: authSession,
        selectedMethod: resolvedMethod,
      });
    } catch (error: any) {
      DebugConsole.error(
        "[PasswordlessAuthDialog] Failed to start auth",
        error,
      );
      DebugConsole.error(
        "[PasswordlessAuthDialog] Error status:",
        error?.status,
      );
      DebugConsole.error(
        "[PasswordlessAuthDialog] Error message:",
        error?.message,
      );

      let message = "We couldn't send the code. Please try again.";

      // SAM returns PasswordlessAuthError with friendly messages
      if (error instanceof PasswordlessAuthError) {
        message = error.message || message;

        if (error.status === 500 && ctx.selectedMethod === "EMAIL_OTP") {
          message =
            "OTP API returned 500. If SES is in sandbox, use a verified recipient email (for example skicyclerun@gmail.com).";
        }
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
      DebugConsole.api("[PasswordlessAuthDialog] POST /v2/auth/verify-otp");
      const result = await confirmPasswordlessAuth(ctx.session, ctx.code);

      if (result.authenticated) {
        const pendingProfile = sessionStorage.getItem("pending_profile");
        if (pendingProfile) {
          DebugConsole.warn(
            "[ProfileCompletion] Pending profile data not sent because the new OTP backend is stateless and no access token is available.",
          );
        }

        storePasswordlessSession({
          email: ctx.session.email || null,
          phone: ctx.session.phoneNumber || null,
          method: ctx.session.preferredChallenge || ctx.selectedMethod,
        });

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
      DebugConsole.api("[PasswordlessAuthDialog] POST /v2/auth/send-otp (resend)");
      const newSession = await resendPasswordlessCode(ctx.session);
      ctx.setSession(newSession);
      const resolvedMethod = normalizeMethod(
        newSession.preferredChallenge ?? newSession.challengeName,
      );
      ctx.setSelectedMethod(resolvedMethod);
      const { medium, destination } = getDeliveryDetails(newSession);
      ctx.setStatus({
        tone: "success",
        text:
          destination && medium
            ? `New code sent via ${medium.toLowerCase()} to ${destination}.`
            : METHOD_COPY[resolvedMethod].resendSuccess,
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
      const deliveryMessage = buildDeliveryFailureMessage(error);
      ctx.setStatus({
        tone: "error",
        text:
          deliveryMessage ||
          "We couldn't resend the code. Try again in a moment.",
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

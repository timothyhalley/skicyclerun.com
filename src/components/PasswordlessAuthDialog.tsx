import { useEffect, useMemo, useState } from "react";
import { DebugConsole } from "@utils/DebugConsole";
import type { PasswordlessAuthSession } from "@utils/passwordlessAuth";
import type { Step, StatusMessage, PasswordlessMethod } from "./auth/types";
import { INITIAL_PASSWORDLESS_METHOD, normalizeMethod } from "./auth/utils";
import { METHOD_COPY } from "./auth/constants";
import { saveDialogState, clearDialogState } from "./auth/sessionStorage";
import { useResendTimer } from "./auth/hooks/useResendTimer";
import { useStateRestoration } from "./auth/hooks/useStateRestoration";
import { useGlobalAPI } from "./auth/hooks/useGlobalAPI";
import { useCodeValidation } from "./auth/hooks/useCodeValidation";
import { createAuthHandlers } from "./auth/handlers";
import { EmailStep } from "./auth/steps/EmailStep";
import { CodeStep } from "./auth/steps/CodeStep";
import { ProfileStep } from "./auth/steps/ProfileStep";
import { StepIndicator } from "./auth/steps/StepIndicator";
import { dialogStyles } from "./auth/styles";

export default function PasswordlessAuthDialog() {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<PasswordlessAuthSession | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PasswordlessMethod>(
    INITIAL_PASSWORDLESS_METHOD,
  );
  const [stateRestored, setStateRestored] = useState(false);
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLocation, setProfileLocation] = useState("");
  const [locationDetecting, setLocationDetecting] = useState(false);

  // Custom hooks
  const { resendTimer, startResendCountdown, clearResendCountdown } =
    useResendTimer();

  const { expectedCodeLength, maxInputLength, isCodeLengthValid } =
    useCodeValidation(session, code);

  // Dialog control functions
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
    setStateRestored(false);
    clearDialogState();
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
    saveDialogState({ isOpen: true, step: "email" });
  };

  // Create auth handlers
  const handlers = useMemo(
    () =>
      createAuthHandlers({
        email,
        phone,
        code,
        session,
        selectedMethod,
        profilePhone,
        profileLocation,
        loading,
        setLoading,
        setStatus,
        setSession,
        setSelectedMethod,
        setStep,
        setCode,
        setLocationDetecting,
        setProfileLocation,
        startResendCountdown,
        closeDialog,
      }),
    [
      email,
      phone,
      code,
      session,
      selectedMethod,
      profilePhone,
      profileLocation,
      loading,
      startResendCountdown,
    ],
  );

  // Input handlers
  const handleCodeChange = (value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(0, maxInputLength);
    setCode(sanitized);
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

  // Computed values
  const statusClass = useMemo(() => {
    if (!status) return "";
    if (status.tone === "error") return "pl-auth__status --error";
    if (status.tone === "success") return "pl-auth__status --success";
    return "pl-auth__status";
  }, [status]);

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

  const isVerificationStep = session?.challengeName === "CONFIRM_SIGN_UP";
  const isLoginStep =
    session?.challengeName === "EMAIL_OTP" ||
    session?.challengeName === "SMS_OTP";

  // Dialog title and subtitle
  const dialogTitle =
    step === "email"
      ? "Sign in or Create Account"
      : step === "code"
        ? codePromptMethod === "SMS_OTP"
          ? "Check your phone"
          : "Check your email"
        : step === "profile"
          ? "Complete Your Profile"
          : "You're signed in";

  const dialogSubtitle =
    step === "email"
      ? emailStepMessage
      : step === "code"
        ? codePromptCopy.prompt(promptEmail)
        : step === "profile"
          ? "Help us personalize your experience (optional)"
          : "Hang tight—closing this window.";

  // Custom hooks for side effects
  useStateRestoration({
    stateRestored,
    setStateRestored,
    setIsOpen,
    setStep,
    setEmail,
    setCode,
    setPhone,
    setSession,
    setSelectedMethod,
    setProfilePhone,
    setProfileLocation,
    setStatus,
  });

  useGlobalAPI({ isOpen, openDialog, closeDialog });

  // Sync selected method with session
  useEffect(() => {
    if (!session) return;
    const resolved = normalizeMethod(
      session.preferredChallenge ?? session.challengeName,
    );
    if (resolved !== selectedMethod) {
      setSelectedMethod(resolved);
    }
  }, [session, selectedMethod]);

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

        <h2 className="pl-auth__title">{dialogTitle}</h2>
        <p className="pl-auth__subtitle">{dialogSubtitle}</p>

        {step === "code" && (
          <StepIndicator
            isVerificationStep={isVerificationStep}
            isLoginStep={isLoginStep}
          />
        )}

        {status && <div className={statusClass}>{status.text}</div>}

        {step === "email" && (
          <EmailStep
            email={email}
            phone={phone}
            selectedMethod={selectedMethod}
            loading={loading}
            onEmailChange={setEmail}
            onPhoneChange={setPhone}
            onMethodSelect={handleMethodSelect}
            onSubmit={handlers.handleSendCode}
          />
        )}

        {step === "code" && (
          <CodeStep
            code={code}
            expectedCodeLength={expectedCodeLength}
            maxInputLength={maxInputLength}
            isCodeLengthValid={isCodeLengthValid}
            loading={loading}
            resendTimer={resendTimer}
            onCodeChange={handleCodeChange}
            onConfirm={handlers.handleConfirmCode}
            onResend={handlers.handleResendCode}
          />
        )}

        {step === "profile" && (
          <ProfileStep
            profilePhone={profilePhone}
            profileLocation={profileLocation}
            locationDetecting={locationDetecting}
            loading={loading}
            onPhoneChange={setProfilePhone}
            onLocationChange={setProfileLocation}
            onDetectLocation={handlers.handleDetectLocation}
            onSkip={handlers.handleSkipProfile}
            onComplete={handlers.handleCompleteProfile}
          />
        )}
      </div>
      <style>{dialogStyles}</style>
    </div>
  );
}

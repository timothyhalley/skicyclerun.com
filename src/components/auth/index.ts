export type {
  StatusMessage,
  Step,
  PasswordlessMethod,
  DialogState,
  MethodConfig,
} from "./types";

export {
  RESEND_COOLDOWN_SECONDS,
  DIALOG_STATE_KEY,
  STATIC_ALLOWED_CODE_LENGTHS,
  PASSWORDLESS_METHOD_ALIASES,
  PASSWORDLESS_METHOD_DEFAULT_ORDER,
  METHOD_COPY,
  fallbackOtpLength,
} from "./constants";

export {
  resolvePasswordlessMethods,
  PASSWORDLESS_METHOD_ORDER,
  INITIAL_PASSWORDLESS_METHOD,
  isPasswordlessMethod,
  normalizeMethod,
  clampOtpLength,
  normalizePhoneNumber,
  calculateExpectedCodeLength,
  calculateAllowedCodeLengths,
} from "./utils";

export {
  saveDialogState,
  loadDialogState,
  clearDialogState,
} from "./sessionStorage";

export { useResendTimer } from "./hooks/useResendTimer";
export { useStateRestoration } from "./hooks/useStateRestoration";
export { useGlobalAPI } from "./hooks/useGlobalAPI";
export { useCodeValidation } from "./hooks/useCodeValidation";

export { createAuthHandlers } from "./handlers";

export { EmailStep } from "./steps/EmailStep";
export { CodeStep } from "./steps/CodeStep";
export { ProfileStep } from "./steps/ProfileStep";
export { StepIndicator } from "./steps/StepIndicator";

export { dialogStyles } from "./styles";

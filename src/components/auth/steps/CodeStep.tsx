import type { FormEvent } from "react";

interface CodeStepProps {
  code: string;
  expectedCodeLength: number;
  maxInputLength: number;
  isCodeLengthValid: boolean;
  loading: boolean;
  resendTimer: number;
  onCodeChange: (value: string) => void;
  onConfirm: (event?: FormEvent) => Promise<void>;
  onResend: () => Promise<void>;
}

export function CodeStep({
  code,
  expectedCodeLength,
  maxInputLength,
  isCodeLengthValid,
  loading,
  resendTimer,
  onCodeChange,
  onConfirm,
  onResend,
}: CodeStepProps) {
  const placeholder =
    expectedCodeLength === 4
      ? "1234"
      : expectedCodeLength === 6
        ? "123456"
        : expectedCodeLength === 8
          ? "12345678"
          : "Enter code";

  return (
    <form className="pl-auth__form" onSubmit={onConfirm}>
      <label className="pl-auth__label" htmlFor="passwordless-code">
        One-time code
      </label>
      <input
        id="passwordless-code"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={maxInputLength}
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
        required
        placeholder={placeholder}
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
        onClick={onResend}
        disabled={loading || resendTimer > 0}
      >
        {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Send a new code"}
      </button>
    </form>
  );
}

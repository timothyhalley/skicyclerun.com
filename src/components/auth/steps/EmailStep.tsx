import type { FormEvent } from "react";
import type { PasswordlessMethod } from "../types";
import { METHOD_COPY } from "../constants";
import { PASSWORDLESS_METHOD_ORDER } from "../utils";

interface EmailStepProps {
  email: string;
  phone: string;
  selectedMethod: PasswordlessMethod;
  loading: boolean;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
  onMethodSelect: (method: PasswordlessMethod) => void;
  onSubmit: (event?: FormEvent) => Promise<void>;
}

export function EmailStep({
  email,
  phone,
  selectedMethod,
  loading,
  onEmailChange,
  onPhoneChange,
  onMethodSelect,
  onSubmit,
}: EmailStepProps) {
  const methodOptions = PASSWORDLESS_METHOD_ORDER;
  const isSmsSelected = selectedMethod === "SMS_OTP";
  const sendButtonText =
    selectedMethod === "SMS_OTP" ? "Text me a code" : "Email me a code";

  return (
    <form className="pl-auth__form" onSubmit={onSubmit}>
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
                onClick={() => onMethodSelect(method)}
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
            We'll text the code to your verified phone number. Include the
            country code (e.g. +1).
          </p>
          <label className="pl-auth__label" htmlFor="passwordless-phone">
            Phone number
          </label>
          <input
            id="passwordless-phone"
            type="tel"
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
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
        onChange={(event) => onEmailChange(event.target.value)}
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
          loading || !email || (isSmsSelected && phone.trim().length === 0)
        }
      >
        {loading ? "Sending..." : sendButtonText}
      </button>
    </form>
  );
}

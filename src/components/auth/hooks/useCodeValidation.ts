import { useMemo } from "react";
import {
  calculateExpectedCodeLength,
  calculateAllowedCodeLengths,
} from "../utils";
import { fallbackOtpLength } from "../constants";
import type { PasswordlessAuthSession } from "@utils/passwordlessAuth";

export function useCodeValidation(
  session: PasswordlessAuthSession | null,
  code: string,
) {
  const expectedCodeLength = useMemo(
    () => calculateExpectedCodeLength(session),
    [session],
  );

  const allowedCodeLengths = useMemo(
    () => calculateAllowedCodeLengths(expectedCodeLength),
    [expectedCodeLength],
  );

  const maxInputLength = useMemo(() => {
    if (allowedCodeLengths.length === 0) return fallbackOtpLength;
    return allowedCodeLengths[allowedCodeLengths.length - 1];
  }, [allowedCodeLengths]);

  const isCodeLengthValid = useMemo(() => {
    if (code.length === 0) return false;
    return allowedCodeLengths.includes(code.length);
  }, [allowedCodeLengths, code.length]);

  return {
    expectedCodeLength,
    allowedCodeLengths,
    maxInputLength,
    isCodeLengthValid,
  };
}

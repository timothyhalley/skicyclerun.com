import type { PasswordlessAuthSession } from "@utils/passwordlessAuth";

export interface StatusMessage {
  tone: "info" | "error" | "success";
  text: string;
}

export type Step = "email" | "code" | "profile" | "success";

export type PasswordlessMethod = "EMAIL_OTP" | "SMS_OTP";

export interface DialogState {
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

export interface MethodConfig {
  label: string;
  sending: string;
  sendSuccess: string;
  resendSuccess: string;
  prompt: (email?: string | null) => string;
}

// Profile attribute update types
export interface ProfileUpdateState {
  field: "email" | "phone" | null;
  newValue: string;
  verificationCode: string;
  step: "edit" | "verify" | "complete";
  deliveryMedium?: string;
  deliveryDestination?: string;
}

export interface UserProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  geo?: string;
  groups?: string[];
  memberSince?: string;
  lastLogin?: string;
  userStatus?: string;
}

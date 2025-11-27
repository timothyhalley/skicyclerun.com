import { useEffect } from "react";
import { DebugConsole } from "@utils/DebugConsole";
import { loadDialogState, saveDialogState } from "../sessionStorage";
import type { Step, StatusMessage, PasswordlessMethod } from "../types";
import type { PasswordlessAuthSession } from "@utils/passwordlessAuth";

interface UseStateRestorationProps {
  stateRestored: boolean;
  setStateRestored: (restored: boolean) => void;
  setIsOpen: (open: boolean) => void;
  setStep: (step: Step) => void;
  setEmail: (email: string) => void;
  setCode: (code: string) => void;
  setPhone: (phone: string) => void;
  setSession: (session: PasswordlessAuthSession | null) => void;
  setSelectedMethod: (method: PasswordlessMethod) => void;
  setProfilePhone: (phone: string) => void;
  setProfileLocation: (location: string) => void;
  setStatus: (status: StatusMessage | null) => void;
}

export function useStateRestoration(props: UseStateRestorationProps) {
  const {
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
  } = props;

  useEffect(() => {
    const restoreState = () => {
      if (stateRestored) return; // Only restore once per mount

      const savedState = loadDialogState();
      if (!savedState) return;

      DebugConsole.auth("[DialogState] Restoring saved state:", savedState);

      if (savedState.isOpen !== undefined) setIsOpen(savedState.isOpen);
      if (savedState.step) setStep(savedState.step);
      if (savedState.email) setEmail(savedState.email);
      if (savedState.code) setCode(savedState.code);
      if (savedState.phone) setPhone(savedState.phone);
      if (savedState.session) setSession(savedState.session);
      if (savedState.selectedMethod)
        setSelectedMethod(savedState.selectedMethod);
      if (savedState.profilePhone) setProfilePhone(savedState.profilePhone);
      if (savedState.profileLocation)
        setProfileLocation(savedState.profileLocation);

      setStateRestored(true);

      // Show welcome back message if on code step
      if (
        savedState.isOpen &&
        savedState.step === "code" &&
        savedState.session
      ) {
        setStatus({
          tone: "info",
          text: "👋 Welcome back! Enter your code to continue.",
        });
      }
    };

    // Restore immediately on mount
    restoreState();

    // Also restore when page becomes visible (user returns from Mail app)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        DebugConsole.auth(
          "[DialogState] Page visible again, checking for saved state",
        );
        restoreState();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []); // Run once on mount, listen for visibility changes
}

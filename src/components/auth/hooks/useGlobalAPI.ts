import { useEffect } from "react";
import { clearTokens, getAuthState } from "@utils/clientAuth";

interface UseGlobalAPIProps {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

export function useGlobalAPI({
  isOpen,
  openDialog,
  closeDialog,
}: UseGlobalAPIProps) {
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
  }, [isOpen, openDialog, closeDialog]);
}

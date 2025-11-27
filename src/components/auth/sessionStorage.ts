import { DebugConsole } from "@utils/DebugConsole";
import { DIALOG_STATE_KEY } from "./constants";
import type { DialogState } from "./types";

export function saveDialogState(state: Partial<DialogState>) {
  // Guard against SSR - sessionStorage only exists in browser
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return;
  }
  try {
    const current = sessionStorage.getItem(DIALOG_STATE_KEY);
    const existing = current ? JSON.parse(current) : {};
    sessionStorage.setItem(
      DIALOG_STATE_KEY,
      JSON.stringify({ ...existing, ...state }),
    );
    DebugConsole.auth("[DialogState] Saved:", state);
  } catch (e) {
    DebugConsole.error("[DialogState] Failed to save:", e);
  }
}

export function loadDialogState(): Partial<DialogState> | null {
  // Guard against SSR - sessionStorage only exists in browser
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return null;
  }
  try {
    const stored = sessionStorage.getItem(DIALOG_STATE_KEY);
    if (!stored) return null;
    const state = JSON.parse(stored);
    DebugConsole.auth("[DialogState] Loaded:", state);
    return state;
  } catch (e) {
    DebugConsole.error("[DialogState] Failed to load:", e);
    return null;
  }
}

export function clearDialogState() {
  // Guard against SSR - sessionStorage only exists in browser
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(DIALOG_STATE_KEY);
    DebugConsole.auth("[DialogState] Cleared");
  } catch (e) {
    DebugConsole.error("[DialogState] Failed to clear:", e);
  }
}

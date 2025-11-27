import { useEffect, useRef, useState } from "react";
import { RESEND_COOLDOWN_SECONDS } from "./constants";

export function useResendTimer() {
  const [resendTimer, setResendTimer] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const clearResendCountdown = () => {
    setResendTimer(0);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startResendCountdown = () => {
    setResendTimer(RESEND_COOLDOWN_SECONDS);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      setResendTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);
  };

  useEffect(() => {
    if (resendTimer <= 0 && intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [resendTimer]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    resendTimer,
    startResendCountdown,
    clearResendCountdown,
  };
}

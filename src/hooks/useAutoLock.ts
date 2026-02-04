import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "@/stores/settings-store";
import { useAuthStore } from "@/stores/auth-store";

export function useAutoLock() {
  const navigate = useNavigate();
  const autoLockMinutes = useSettingsStore((s) => s.autoLockMinutes);
  const lock = useAuthStore((s) => s.lock);
  const isUnlocked = useAuthStore((s) => s.isUnlocked);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (autoLockMinutes === "never" || !isUnlocked) return;

    const ms = parseInt(autoLockMinutes, 10) * 60 * 1000;
    timeoutRef.current = setTimeout(() => {
      lock();
      navigate("/lock", { replace: true });
    }, ms);
  };

  useEffect(() => {
    if (!isUnlocked) return;

    const events = ["mousedown", "keydown", "touchstart", "scroll"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoLockMinutes, isUnlocked]);

  return { resetTimer };
}

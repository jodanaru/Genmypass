import { useCallback, useRef } from "react";
import { useSettingsStore } from "@/stores/settings-store";

export function useClipboard() {
  const clearClipboard = useSettingsStore((s) => s.clearClipboard);
  const clearClipboardSeconds = useSettingsStore((s) => s.clearClipboardSeconds);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        if (clearClipboard) {
          timeoutRef.current = setTimeout(async () => {
            try {
              await navigator.clipboard.writeText("");
            } catch {
              // Ignorar errores al limpiar
            }
          }, clearClipboardSeconds * 1000);
        }

        return true;
      } catch {
        return false;
      }
    },
    [clearClipboard, clearClipboardSeconds]
  );

  return { copy };
}

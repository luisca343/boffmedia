"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Tone = "ok" | "warn";
type Toast = { id: number; message: string; tone: Tone };

// A module-level bus, so `toast()` can be called from an event handler without
// threading a context through every editor component.
let nextId = 1;
const listeners = new Set<(t: Toast) => void>();

export function toast(message: string, tone: Tone = "ok") {
  const t = { id: nextId++, message, tone };
  listeners.forEach((l) => l(t));
}

/**
 * Portalled, so it re-applies `ft-app` to keep the `--ft-*` vars resolving
 * outside the app root (§2).
 */
export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      window.setTimeout(
        () => setToasts((prev) => prev.filter((x) => x.id !== t.id)),
        2400,
      );
    };
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
    };
  }, []);

  if (typeof document === "undefined" || toasts.length === 0) return null;

  return createPortal(
    <div className="ft-app font-ft pointer-events-none fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={[
            "font-ft-ui border-ft rounded-ft-pill border-ft-ink px-5 py-3",
            "text-sm font-bold shadow-ft-pop",
            "animate-ft-burst motion-reduce:animate-none",
            t.tone === "warn"
              ? "bg-ft-orange text-ft-ink"
              : "bg-ft-ink text-ft-yellow",
          ].join(" ")}
        >
          {t.message}
        </div>
      ))}
    </div>,
    document.body,
  );
}

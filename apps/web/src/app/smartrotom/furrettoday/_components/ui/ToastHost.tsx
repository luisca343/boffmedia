"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast, useToasts, type ToastKind } from "@/components/smartrotom/behavior/toast";
import { FT_SCOPE } from "./Modal";

export { toast };

/**
 * The app only ever fired two visual tones (the default "ok" ink pill and a "warn"
 * orange one for failures) — every explicit second argument used to be `"warn"`, so
 * `kind: "error"` reuses that same look and no call site needed to change.
 */
const STYLE: Record<ToastKind, string> = {
  success: "bg-ft-ink text-ft-yellow",
  info: "bg-ft-ink text-ft-yellow",
  warn: "bg-ft-orange text-ft-ink",
  error: "bg-ft-orange text-ft-ink",
};

/**
 * Portalled, so it re-applies `ft-app` to keep the `--ft-*` vars resolving outside the
 * app root (§2).
 */
export function ToastHost() {
  const toasts = useToasts();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div className={`${FT_SCOPE} pointer-events-none fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2`}>
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={[
            "font-ft-ui border-ft rounded-ft-pill border-ft-ink px-5 py-3",
            "text-sm font-bold shadow-ft-pop",
            "animate-ft-burst motion-reduce:animate-none",
            STYLE[t.kind],
          ].join(" ")}
        >
          {t.msg}
        </div>
      ))}
    </div>,
    document.body,
  );
}

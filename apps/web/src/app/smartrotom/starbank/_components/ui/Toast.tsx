"use client";

import { toast, useToasts } from "@/components/smartrotom/behavior/toast";
import { Ico } from "./icons";

export { toast };

/**
 * Only one message was ever shown at once (a later `show()` replaced the current one
 * rather than queuing beside it), so this renders just the tail of the shared queue.
 */
export function ToastHost() {
  const toasts = useToasts();
  const t = toasts[toasts.length - 1];
  if (!t) return null;
  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 animate-in items-center gap-2.5 rounded-sb-md bg-sb-fg px-4 py-2.5 text-[0.8125rem] text-white shadow-sb-3 slide-in-from-bottom-2 fade-in animate-duration-200"
    >
      <Ico name="check" size={14} /> {t.msg}
    </div>
  );
}

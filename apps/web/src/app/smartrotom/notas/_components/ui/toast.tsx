"use client";

import { toast, useToasts, type ToastKind } from "@/components/smartrotom/behavior/toast";

export { toast };
export type { ToastKind };

const DOT: Record<ToastKind, string> = {
  success: "bg-nt-c-success",
  info: "bg-nt-c-secondary",
  warn: "bg-nt-c-warning",
  error: "bg-nt-c-error",
};

export function ToastHost() {
  const list = useToasts();
  return (
    <div className="fixed bottom-[1.125rem] right-[1.125rem] z-[200] flex flex-col items-end gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className="flex animate-in fade-in slide-in-from-bottom-2 items-center gap-2.5 rounded-nt-md border border-nt-border-2 bg-nt-elevated px-[0.9375rem] py-[0.6875rem] text-[0.8125rem] text-nt-fg shadow-[0_18px_50px_-12px_rgba(0,0,0,.7)]"
        >
          <span className={`h-2 w-2 rounded-full ${DOT[t.kind]}`} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

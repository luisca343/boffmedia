import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[5px] border border-nt-border bg-nt-hover-strong px-1.5 py-px font-nt-mono text-[11px] text-nt-fg-subtle">
      {children}
    </span>
  );
}

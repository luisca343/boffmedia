import * as React from "react";

export function PageHeader({ title, sub, actions }: { title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="m-0 font-sb-display text-[28px] font-semibold tracking-[-0.02em] text-sb-fg">{title}</h1>
        {sub ? <div className="mt-1 text-[13.5px] text-sb-fg-muted">{sub}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

import * as React from "react";

export interface SegOption {
  id: string;
  label: React.ReactNode;
}

export function Seg({ options, value, onChange, className }: { options: SegOption[]; value: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div className={"inline-flex rounded-[10px] border border-sb-border bg-sb-surface-2 p-[3px] " + (className ?? "")} role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={
            "whitespace-nowrap rounded-[7px] px-3 py-[0.3125rem] text-[0.75rem] font-medium transition-colors " +
            (value === o.id ? "bg-sb-surface text-sb-fg shadow-sb-1" : "text-sb-fg-muted hover:text-sb-fg")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

"use client";
import * as React from "react";
import { Ico } from "./icons";

/** Right-hand slide-over over a scrim. Rendered as a fixed viewport overlay. */
export function Sheet({ title, eyebrow, onClose, width = 720, children }: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] grid animate-in place-items-end bg-[rgba(7,17,42,0.45)] backdrop-blur-[4px] fade-in animate-duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{ width: `min(${width}px, 96vw)` }}
        className="flex h-full animate-in flex-col border-l border-sb-border bg-sb-surface slide-in-from-right animate-duration-300"
      >
        <div className="flex items-center justify-between border-b border-sb-border px-[22px] py-[18px]">
          <div>
            {eyebrow ? <div className="mb-0.5 text-[11px] uppercase tracking-[0.1em] text-sb-fg-subtle">{eyebrow}</div> : null}
            <h2 className="m-0 font-sb-display text-[20px] font-semibold tracking-[-0.01em] text-sb-fg">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-9 place-items-center rounded-sb-md border border-sb-border bg-sb-surface text-sb-fg-2 transition-colors hover:bg-sb-surface-2"
          >
            <Ico name="x" size={16} />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-5 overflow-auto px-[22px] py-5">{children}</div>
      </div>
    </div>
  );
}

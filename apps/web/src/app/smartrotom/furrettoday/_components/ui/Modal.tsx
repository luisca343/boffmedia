"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Portalled to `document.body`, so it escapes the `.ft-app` scope root and
 * would lose every `--ft-*` var. The wrapper re-applies `ft-app` (the Notas
 * `ThemedLayer` trick, SMARTROTOM_V3.md §2) — without it the modal renders
 * with unresolved colours.
 */
export function Modal({
  open,
  onClose,
  label,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // The page behind must not scroll while a dialog owns the screen.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="ft-app font-ft">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-ft-ink/55 p-6 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={[
            "border-ft rounded-ft-lg relative w-full max-w-[520px] border-ft-ink bg-white shadow-ft-pop",
            "animate-ft-burst motion-reduce:animate-none",
            className ?? "",
          ].join(" ")}
        >
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="border-ft absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border-ft-ink bg-ft-yellow font-extrabold text-ft-ink"
          >
            ✕
          </button>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

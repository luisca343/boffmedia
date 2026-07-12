"use client";

import { useEffect, type ReactNode } from "react";
import { Portal } from "./Portal";
import { ThemedLayer } from "./ThemedLayer";

// Scrim + optional Escape/backdrop close. Children supply their own panel
// (rounded-nt-xl bg-nt-panel border shadow-pop).
export function Overlay({
  onClose,
  align = "start",
  children,
}: {
  onClose: () => void;
  align?: "start" | "center";
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <Portal>
      <ThemedLayer>
        <div
          className={`fixed inset-0 z-[100] flex justify-center bg-[rgb(2_4_8/.72)] animate-in fade-in ${
            align === "center" ? "items-center" : "items-start"
          }`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {children}
        </div>
      </ThemedLayer>
    </Portal>
  );
}

export const MODAL_PANEL =
  "animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-nt-xl border border-nt-border-2 bg-nt-panel shadow-[0_18px_50px_-12px_rgba(0,0,0,.7)]";

"use client";

import { useEffect } from "react";
import { Portal } from "./Portal";
import { ThemedLayer } from "./ThemedLayer";
import { Icon, type IconName } from "./Icon";

export interface MenuItem {
  icon?: IconName;
  label?: string;
  onClick?: () => void;
  danger?: boolean;
  sep?: boolean;
}

export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  useEffect(() => {
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <Portal>
      <ThemedLayer>
      <div
        className="fixed z-[300] min-w-[190px] animate-in fade-in zoom-in-95 overflow-hidden rounded-nt-md border border-nt-border-2 bg-nt-panel p-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,.7)]"
        style={{ left: Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 9999) - 210), top: y }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((it, i) =>
          it.sep ? (
            <div key={i} className="my-1.5 h-px bg-nt-border" />
          ) : (
            <button
              key={i}
              onClick={() => {
                it.onClick?.();
                onClose();
              }}
              className={`flex w-full items-center gap-2.5 rounded-nt-sm px-2.5 py-2 text-[13px] transition-colors ${
                it.danger
                  ? "text-nt-c-error hover:bg-nt-c-error/10"
                  : "text-nt-fg-muted hover:bg-nt-hover hover:text-nt-fg"
              }`}
            >
              {it.icon && <Icon name={it.icon} size={15} />}
              {it.label}
            </button>
          ),
        )}
      </div>
      </ThemedLayer>
    </Portal>
  );
}

// Menu invocation coordinates raised by row context-menus.
export interface MenuState {
  x: number;
  y: number;
  items: MenuItem[];
}

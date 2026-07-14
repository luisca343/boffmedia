"use client";

import { useEffect, type ReactNode } from "react";
import { Icon, Portal, type IconName } from "../ui";
import { ThemedLayer } from "../ui/ThemedLayer";

// Toolbar dropdown surface. Portaled (the toolbar scrolls horizontally, so it
// would clip an absolutely-positioned child) and mousedown-inert, so the
// editor's selection survives every click inside it.

export function Popover({
  x,
  y,
  width = 230,
  onClose,
  children,
}: {
  x: number;
  y: number;
  width?: number;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const close = () => onClose();
    const key = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", key);
    };
  }, [onClose]);

  return (
    <Portal>
      <ThemedLayer>
        <div
          className="fixed z-[300] animate-in fade-in zoom-in-95 rounded-nt-md border border-nt-border-2 bg-nt-panel p-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,.7)]"
          style={{
            left: Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 9999) - width - 12),
            top: y,
            minWidth: width,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {children}
        </div>
      </ThemedLayer>
    </Portal>
  );
}

export function PopRow({
  icon,
  label,
  kbd,
  onRun,
  disabled,
  danger,
  active,
  iconClass,
}: {
  icon: IconName;
  label: string;
  kbd?: string;
  onRun: () => void;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
  iconClass?: string;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onRun}
      className={`flex w-full items-center gap-2.5 rounded-nt-sm px-2.5 py-1.5 text-[12.5px] transition-colors disabled:cursor-default disabled:opacity-35 ${
        danger
          ? "text-nt-c-error hover:enabled:bg-nt-c-error/10"
          : active
            ? "bg-nt-accent/15 text-nt-accent-fg"
            : "text-nt-fg-muted hover:enabled:bg-nt-hover hover:enabled:text-nt-fg"
      }`}
    >
      <Icon name={icon} size={15} className={iconClass} />
      {label}
      {kbd && <span className="ml-auto text-[10.5px] text-nt-fg-subtle">{kbd}</span>}
    </button>
  );
}

export function PopSep() {
  return <div className="my-1.5 h-px bg-nt-border" />;
}

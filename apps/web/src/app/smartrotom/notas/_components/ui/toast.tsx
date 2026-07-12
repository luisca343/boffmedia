"use client";

import { useState, useEffect } from "react";

export type ToastKind = "success" | "info" | "warn" | "error";
interface ToastItem {
  id: string;
  msg: string;
  kind: ToastKind;
}

type Listener = (items: ToastItem[]) => void;
let items: ToastItem[] = [];
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l([...items]));

// Module-level bus so any component can raise a toast without prop drilling.
export function toast(msg: string, kind: ToastKind = "success") {
  const id = Math.random().toString(36).slice(2);
  items = [...items, { id, msg, kind }];
  emit();
  setTimeout(() => {
    items = items.filter((i) => i.id !== id);
    emit();
  }, 2600);
}

const DOT: Record<ToastKind, string> = {
  success: "bg-nt-c-success",
  info: "bg-nt-c-secondary",
  warn: "bg-nt-c-warning",
  error: "bg-nt-c-error",
};

export function ToastHost() {
  const [list, setList] = useState<ToastItem[]>([]);
  useEffect(() => {
    listeners.add(setList);
    return () => {
      listeners.delete(setList);
    };
  }, []);
  return (
    <div className="fixed bottom-[18px] right-[18px] z-[200] flex flex-col items-end gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className="flex animate-in fade-in slide-in-from-bottom-2 items-center gap-2.5 rounded-nt-md border border-nt-border-2 bg-nt-elevated px-[15px] py-[11px] text-[13px] text-nt-fg shadow-[0_18px_50px_-12px_rgba(0,0,0,.7)]"
        >
          <span className={`h-2 w-2 rounded-full ${DOT[t.kind]}`} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

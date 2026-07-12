"use client";
import * as React from "react";
import { create } from "zustand";
import { Ico } from "./icons";

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  clear: () => void;
}

let timer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    set({ message });
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => set({ message: null }), 2200);
  },
  clear: () => set({ message: null }),
}));

export function ToastHost() {
  const message = useToast((s) => s.message);
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 animate-in items-center gap-2.5 rounded-sb-md bg-sb-fg px-4 py-2.5 text-[13px] text-white shadow-sb-3 slide-in-from-bottom-2 fade-in duration-200"
    >
      <Ico name="check" size={14} /> {message}
    </div>
  );
}

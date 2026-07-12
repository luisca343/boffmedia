"use client";
import type { CSSProperties, ReactNode } from "react";
import { useResolvedTheme } from "./_hooks/useResolvedTheme";

/**
 * ChatApp shell. Owns the `.ca-app` scope so the WhatsApp-style token layer
 * (real light/dark + runtime accent) never leaks into the rest of SmartRotom.
 * Sized to the content area below the Rotom navbar (3rem) and scrolls internally.
 */
export default function ChatAppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { theme, accentTriplet } = useResolvedTheme();
  return (
    <div
      className="ca-app relative flex h-[calc(100dvh-3rem)] w-full min-w-0 overflow-hidden bg-ca-panel font-ca text-ca-50 antialiased"
      data-theme={theme}
      style={{ "--ca-accent": accentTriplet } as CSSProperties}
    >
      {children}
    </div>
  );
}

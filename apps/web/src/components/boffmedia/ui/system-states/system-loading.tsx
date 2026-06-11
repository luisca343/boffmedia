"use client"

import { SystemStateShell } from "./system-state-shell"

interface SystemLoadingProps {
  title?: string
  sub?: string
}

export function SystemLoading({ title = "Cargando", sub = "Preparando tu sesión" }: SystemLoadingProps) {
  return (
    <SystemStateShell bg="accent" role="status" aria-live="polite">
      <div className="w-[92px] h-[92px] grid place-items-center relative mb-[1.6rem]">
        <span
          className="absolute inset-0 rounded-full"
          style={{
            border: "2.5px solid var(--border)",
            borderTopColor: "var(--accent-bright)",
            animation: "sysload-spin 0.9s linear infinite",
          }}
        />
        <img
          src="/img/boff-logo.webp"
          alt="BoffMedia"
          className="w-16 h-16"
          style={{
            filter: "drop-shadow(0 0 26px color-mix(in srgb, var(--accent) 55%, transparent))",
            animation: "sysload-pulse 1.4s var(--ease) infinite",
          }}
        />
      </div>
      <div className="font-display text-[length:var(--t-xl)] tracking-[var(--display-spacing)] mb-2">
        {title}
      </div>
      <div
        className="font-[var(--label-font)] text-[length:var(--t-sm)] tracking-[var(--label-spacing)] uppercase text-[var(--text-muted)] inline-flex gap-[0.35rem] items-center"
      >
        <span>{sub}</span>
        <span className="inline-flex gap-[0.2rem]">
          <span className="inline-block w-[5px] h-[5px] rounded-full bg-[var(--accent-bright)]" style={{ animation: "sysload-bounce 1.2s var(--ease) infinite" }} />
          <span className="inline-block w-[5px] h-[5px] rounded-full bg-[var(--accent-bright)]" style={{ animation: "sysload-bounce 1.2s var(--ease) infinite", animationDelay: "0.15s" }} />
          <span className="inline-block w-[5px] h-[5px] rounded-full bg-[var(--accent-bright)]" style={{ animation: "sysload-bounce 1.2s var(--ease) infinite", animationDelay: "0.3s" }} />
        </span>
      </div>
      <div className="mt-[1.8rem] w-[220px] max-w-[60vw] h-[3px] rounded-[999px] bg-[var(--surface-3)] overflow-hidden">
        <i
          className="block h-full w-[40%] rounded-[999px]"
          style={{
            background: "linear-gradient(90deg, transparent, var(--accent-bright), transparent)",
            animation: "sysload-slide 1.4s var(--ease) infinite",
          }}
        />
      </div>
    </SystemStateShell>
  )
}

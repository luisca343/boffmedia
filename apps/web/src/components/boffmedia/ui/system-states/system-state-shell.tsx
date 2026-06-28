"use client"

import { SystemFloatBg } from "./system-float-bg"

interface SystemStateShellProps {
  bg?: "warm" | "accent" | "cool"
  role?: string
  "aria-live"?: "polite" | "assertive"
  children: React.ReactNode
}

export function SystemStateShell({ bg = "accent", role, "aria-live": live, children }: SystemStateShellProps) {
  return (
    <section
      className="sysstate relative grid place-items-center overflow-hidden bg-base"
      style={{
        isolation: "isolate",
        minHeight: "var(--sysstate-minh, 100vh)",
        padding: "var(--sysstate-pad, clamp(2rem, 6vw, 5rem) var(--gutter))",
      }}
      role={role}
      aria-live={live}
    >
      <SystemFloatBg variant={bg} />
      <div className="sysstate__inner relative z-[2] w-full max-w-[30rem] text-center flex flex-col items-center">
        {children}
      </div>
    </section>
  )
}

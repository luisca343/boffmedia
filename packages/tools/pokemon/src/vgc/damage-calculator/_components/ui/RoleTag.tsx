import * as React from "react"
import { cssVars } from "./theme"

// role seal (attacker / defender), tinted with --cxc.
export function RoleTag({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="cut cut-edge-slant [--cut:4px] inline-flex items-center gap-[7px] border border-solid px-[9px] py-[5px] font-mono text-[10px]/none font-bold uppercase tracking-[0.14em]"
      style={cssVars({
        "--cxc": color,
        color: "var(--cxc, var(--accent))",
        borderColor: "color-mix(in srgb, var(--cxc, var(--accent)) 40%, transparent)",
        // The slants are painted geometry, so they need the border colour by name.
        "--cut-line": "color-mix(in srgb, var(--cxc, var(--accent)) 40%, transparent)",
        background: "color-mix(in srgb, var(--cxc, var(--accent)) 9%, transparent)",
      })}
    >
      <i className="cut [--cut:2px] h-1.5 w-1.5" style={{ background: "var(--cxc, var(--accent))" }} aria-hidden="true" />
      {children}
    </span>
  )
}

"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { TV3_EVENT_TS } from "./landing-data"

/* Class fragments below are constants so Tailwind scans them literally. */

/* fx2 primary-button glow, applied per-instance on the landing's pri buttons */
export const PRI_GLOW = "shadow-[0_6px_26px_rgba(255,92,10,0.32)] hover:shadow-[0_10px_38px_rgba(255,92,10,0.5)]"

/* pointer glare — --gx/--gy set by useSignalFX on [data-glare] */
export const GLARE =
  "before:pointer-events-none before:absolute before:inset-0 before:z-[1] before:opacity-0 before:transition-opacity before:duration-[220ms] before:content-[''] before:[background:radial-gradient(240px_circle_at_var(--gx,50%)_var(--gy,50%),rgba(255,255,255,0.07),transparent_65%)] hover:before:opacity-100 [[data-theme=light]_&]:before:[background:radial-gradient(240px_circle_at_var(--gx,50%)_var(--gy,50%),rgba(255,92,10,0.07),transparent_65%)]"

/* HUD identity frame for the route's hero panels: zone-tinted border on .near.
   No corner brackets — in the handoff these panels are `.sn-glare`, whose
   ::before (higher specificity) overrides the bracket background, so brackets
   never actually render.

   The scanner sweep is the CHILD `<HudSweep/>` below, not a pseudo. An element
   has exactly two, and these panels already spend both: ::before on `GLARE`,
   ::after on their chamfer stroke (`cut-edge-bl` / `cut-corner-edge`). While the
   sweep also lived on ::after it won — Tailwind's utilities layer outranks the
   components layer the `cut-*-edge` strokes are registered in — and silently
   erased the stroke, so both panels rendered their cut corner unbordered. Keep
   any future decoration on this frame a child element for the same reason. */
export const HUD_FRAME = "group-[.near]:border-[rgba(var(--zr),var(--zg),var(--zb),0.4)]"

/* Top scanner sweep: scales in when the parent stop gains `.near`. Lives inside
   the panel it decorates, which must be `relative` (every HUD_FRAME panel is). */
export function HudSweep() {
  return (
    <i
      aria-hidden="true"
      className="pointer-events-none absolute left-0 right-0 top-0 z-[6] h-[2px] origin-left scale-x-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] [background:linear-gradient(90deg,transparent,rgba(var(--zr),var(--zg),var(--zb),0.9),transparent)] group-[.near]:scale-x-100"
    />
  )
}

/* hero headline masked-line reveal */
export const LINE_MASK = "block overflow-hidden pb-[0.10em] pr-[0.12em] -mb-[0.10em]"
export const LINE_INNER =
  "inline-block translate-y-[115%] [transition:transform_720ms_cubic-bezier(0.16,1,0.3,1)] [transition-delay:calc(var(--l,0)*95ms)] group-[.in]:translate-y-0 [.reveal-all_&]:translate-y-0 [.no-motion_&]:translate-y-0 motion-reduce:translate-y-0 motion-reduce:transition-none"

/* rotating light beams (lv4-beams) */
export const BEAMS =
  "absolute rounded-full blur-[8px] will-change-transform animate-[lv4-spin_70s_linear_infinite] [.no-motion_&]:animate-none [[data-theme=light]_&]:opacity-50 [background:conic-gradient(from_210deg_at_50%_50%,transparent,rgba(255,122,51,0.15),transparent_30%,transparent_60%,rgba(255,178,36,0.11),transparent_80%)]"

export const CTA_ROW = "mt-[22px] flex flex-wrap items-center gap-3.5"
export const CTA_MONO = "font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.1em] text-txt-dim"

/* SVG-noise grain — data-URI kept as inline style (quotes/spaces break arbitrary values) */
const GRAIN_STYLE: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/%3E%3C/svg%3E")`,
}

export function Grain() {
  return (
    <i
      aria-hidden="true"
      style={GRAIN_STYLE}
      className="absolute inset-0 opacity-[0.06] mix-blend-overlay [[data-theme=light]_&]:opacity-[0.04] [[data-theme=light]_&]:mix-blend-multiply"
    />
  )
}

export const tvGoTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" })
}

export function TvCountdown({ to = TV3_EVENT_TS, compact }: { to?: number; compact?: boolean }) {
  const t = useTranslations("boffmedia.landing.countdown")
  const [left, setLeft] = React.useState(() => Math.max(0, to - Date.now()))
  React.useEffect(() => {
    const iv = setInterval(() => setLeft(Math.max(0, to - Date.now())), 1000)
    return () => clearInterval(iv)
  }, [to])
  const s = Math.floor(left / 1000)
  const parts = [
    { n: Math.floor(s / 86400), l: t("days") },
    { n: Math.floor((s % 86400) / 3600), l: t("hours") },
    { n: Math.floor((s % 3600) / 60), l: t("min") },
    { n: s % 60, l: t("sec") },
  ]
  return (
    <div className={cn("flex", compact ? "gap-2" : "gap-3.5")} role="timer" aria-label={t("ariaLabel")}>
      {parts.map((p) => (
        <span
          key={p.l}
          className={cn(
            "relative border border-solid border-line text-center before:absolute before:left-0 before:right-0 before:top-0 before:h-[var(--bar,0px)] before:bg-accent before:content-['']",
            compact ? "min-w-[48px] bg-[#0d1015] px-1.5 pb-1.5 pt-2" : "min-w-[66px] bg-panel px-2.5 pb-2.5 pt-3",
          )}
        >
          <span
            className={cn("block font-display font-bold leading-none text-txt tabular-nums", compact ? "text-[22px]" : "text-[34px]")}
            suppressHydrationWarning
          >
            {String(p.n).padStart(2, "0")}
          </span>
          <span className="mt-[5px] block font-mono text-[10px] font-medium uppercase leading-none tracking-[0.14em] text-txt-dim">{p.l}</span>
        </span>
      ))}
    </div>
  )
}

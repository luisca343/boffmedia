import * as React from "react"
import { cn } from "@/lib/utils"
import { Kicker } from "@/components/boffmedia/primitives/kicker"

// Shared class fragments + specimen wrappers for the Sistema showcase.
// Split out of the old monolithic page.tsx (convention §10).

export const MONO_LABEL = "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-txt-muted"

// Display headings — «voz de la señal»: heavy italic uppercase, matching base.css.
export const DISPLAY = "font-display font-extrabold italic uppercase leading-[0.92] tracking-[-0.005em]"
export const DISPLAY_EM = "[&_em]:italic [&_em]:text-transparent [&_em]:[-webkit-text-stroke:1.6px_var(--accent)]"
export const HEAD4 = "font-display font-bold uppercase tracking-[0.02em] leading-[1.05]"

export const GRP_KEY = "bm-sc3-chapter"
export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
export const sideLink = "block font-mono text-[12px] font-semibold leading-none uppercase tracking-[0.1em] no-underline py-[10px] px-[14px] border-l-[3px] border-solid transition-[color,border-color,background] duration-[140ms] cursor-pointer"

// ── specimen wrapper ────────────────────────────────────────────────────────
export function Sample({
  title,
  code,
  note,
  col,
  grid,
  children,
}: {
  title: React.ReactNode
  code?: React.ReactNode
  note?: React.ReactNode
  col?: boolean
  grid?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="border border-solid border-line bg-panel mb-[22px]">
      <div className="flex items-center gap-3 py-[10px] px-4 border-b border-solid border-line bg-panel-2">
        <h4 className={cn(HEAD4, "text-[14px]/[1.05] tracking-[0.08em]")}>{title}</h4>
        {code && <code className="ml-auto font-mono text-[11px] font-medium leading-none text-txt-dim">{code}</code>}
      </div>
      <div
        className={cn(
          "p-[26px] flex flex-wrap gap-4 items-center",
          col && "flex-col items-stretch flex-nowrap",
          grid && "grid grid-cols-1 sm:grid-cols-2",
        )}
      >
        {children}
      </div>
      {note && (
        <div className="font-body text-[13px] leading-[1.6] text-txt-muted py-3 px-4 border-t border-dashed border-line [&_code]:font-mono [&_code]:text-[12px] [&_code]:font-medium [&_code]:text-accent">
          {note}
        </div>
      )}
    </div>
  )
}

export function Section({ id, kicker, title, lead, children }: { id: string; kicker: string; title: string; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-[74px] scroll-mt-[120px]">
      <Kicker>{kicker}</Kicker>
      <h2 className={cn(DISPLAY, "text-[clamp(30px,8vw,42px)]/[0.92] mt-[10px] mb-2")}>{title}</h2>
      {lead && <p className="text-txt-muted max-w-[66ch] mb-7 text-[15px] [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-accent">{lead}</p>}
      {children}
    </section>
  )
}

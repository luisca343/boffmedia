"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, type IconName, Spinner } from "@boffmedia/ui"
import { AvLiveDot } from "./av-kit"

export interface AvNavItem {
  id: string
  label: string
  icon: IconName
  badge?: React.ReactNode
}

export interface AvNavGroup {
  label: string
  items: AvNavItem[]
}

interface AvShellProps {
  nav: AvNavGroup[]
  section: string
  onNavigate: (id: string) => void
  children: React.ReactNode
  loading?: boolean
  /** Drops the reading-measure cap and hands the section the full viewport
   *  height, for app-like sections (Packs) rather than document-like ones. */
  fluid?: boolean
}

export function AvShell({ nav, section, onNavigate, children, loading, fluid }: AvShellProps) {
  const t = useTranslations("admin.shell")
  const allItems = nav.flatMap((g) => g.items)
  const active = allItems.find((i) => i.id === section)

  return (
    <div className="grid h-full [grid-template-columns:1fr] md:[grid-template-columns:244px_minmax(0,1fr)] bg-base">
      {/* Desktop rail */}
      <aside className="hidden md:flex sticky top-0 self-start h-full overflow-y-auto flex-col border-r border-solid border-line bg-base-2 pb-6 bm-scroll">
        <div className="sticky top-0 z-[2] flex items-center gap-[11px] pt-[18px] pb-[20px] px-5 border-b border-solid border-line bg-base-2">
          <span className="grid place-items-center w-[30px] h-[30px] bg-accent text-accent-ink shrink-0">
            <Icon name="bolt" size={17} />
          </span>
          <span className="font-display text-[20px] font-extrabold italic leading-none uppercase tracking-[0.01em]">
            {t("brand")}
          </span>
        </div>

        <nav className="pt-[14px]">
          {nav.map((group) => (
            <div key={group.label} className="pt-[14px] px-3 first:pt-0">
              <span className="block px-2 pb-2 font-mono text-[9px] font-semibold leading-none uppercase tracking-[0.18em] text-txt-dim">
                {group.label}
              </span>
              {group.items.map(({ id, label, icon, badge }) => {
                const on = id === section
                return (
                  <button
                    key={id}
                    onClick={() => onNavigate(id)}
                    className={cn(
                      "flex items-center gap-[11px] w-full py-[9px] px-2.5 mb-px text-left font-body text-[13.5px] font-semibold leading-none",
                      "border-l-[3px] border-solid transition-[color,background,border-color] duration-[140ms]",
                      on
                        ? "text-txt bg-panel border-l-accent"
                        : "text-txt-muted border-l-transparent hover:text-txt hover:bg-panel",
                    )}
                  >
                    <Icon name={icon} size={17} className={cn("shrink-0", on ? "text-accent" : "text-txt-dim")} />
                    <span className="flex-1 min-w-0 truncate">{label}</span>
                    {badge && <span className="font-mono text-[9px] font-bold text-accent">{badge}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* h-full, not h-screen: the parent layout already sizes the section
          to fill the viewport minus the Navbar. h-screen would overflow. */}
      <div className={cn("min-w-0", fluid && "flex h-full min-h-0 flex-col overflow-hidden")}>
        {/* Mobile section tabs */}
        <div className="md:hidden flex gap-1 overflow-x-auto py-2.5 px-4 border-b border-solid border-line bg-base-2 sticky top-0 z-[4] [scrollbar-width:none]">
          {allItems.map(({ id, label, icon }) => {
            const on = id === section
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 py-2 px-3 whitespace-nowrap font-mono text-[12px] font-semibold leading-none uppercase tracking-[0.05em] border border-solid shrink-0",
                  on ? "text-accent border-accent-line bg-accent-soft" : "text-txt-muted border-line",
                )}
              >
                <Icon name={icon} size={13} />
                {label}
              </button>
            )
          })}
        </div>

        {/* Top bar (desktop) */}
        <div className="hidden md:flex sticky top-0 z-[5] items-center gap-4 py-[15px] px-[26px] border-b border-solid border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-[8px]">
          <span className="inline-flex items-center gap-2.5 font-display text-[24px] font-extrabold italic uppercase leading-none">
            {active && <Icon name={active.icon} size={20} className="text-accent" />}
            {active?.label ?? t("brand")}
          </span>
          <span className="ml-auto inline-flex items-center gap-2 font-mono text-[10px] font-bold leading-none uppercase tracking-[0.14em] text-ok">
            <AvLiveDot />
            {t("live")}
          </span>
        </div>

        <div
          className={cn(
            "p-[26px] max-md:p-[18px_16px]",
            // min-h-0 is what lets a fluid child actually scroll inside the
            // column instead of stretching it past the viewport. Every section
            // spans the full column width now — no reading-measure cap.
            fluid && "flex min-h-0 flex-1 flex-col",
          )}
        >
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <Spinner size={30} className="text-accent" />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  )
}

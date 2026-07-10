"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"
import type { NavSection, NavItem } from "./nav-data"

function DropItems({ items }: { items: NavItem[] }) {
  return (
    <div className="flex flex-col">
      {items.map((it, i) => (
        <Link
          key={it.href}
          href={it.href}
          role="menuitem"
          style={{ animationDelay: `${i * 22}ms` }}
          className="group/item flex items-center gap-[11px] px-4 py-2 font-body text-[14px] font-medium leading-[1.2] text-txt-muted no-underline transition-colors duration-[140ms] animate-[bm-nd-item_0.16s_both] hover:bg-accent-soft hover:text-txt focus-visible:bg-accent-soft focus-visible:text-txt focus-visible:outline-none"
        >
          <Icon
            name={it.icon || "wrench"}
            size={15}
            className="shrink-0 text-txt-dim transition-colors duration-[140ms] group-hover/item:text-accent"
          />
          <span className="flex-1">{it.label}</span>
          <Icon
            name="chevronRight"
            size={12}
            className="shrink-0 opacity-0 transition-all duration-[140ms] group-hover/item:translate-x-0.5 group-hover/item:text-accent group-hover/item:opacity-100"
          />
        </Link>
      ))}
    </div>
  )
}

function DropSheet({ sec }: { sec: NavSection }) {
  const style = sec.hue != null ? ({ ["--ghue" as string]: String(sec.hue) } as React.CSSProperties) : undefined
  return (
    <div
      className="max-h-[min(72vh,560px)] w-[252px] overflow-y-auto px-1.5 pb-3.5 pt-2.5"
      style={style}
    >
      {sec.groups ? (
        <div>
          {sec.groups.map((gr, gi) => (
            <div key={gr.name || gi} className="mt-1 first:mt-0">
              {gr.name &&
                (gr.href ? (
                  <Link
                    href={gr.href}
                    className="group/cat flex items-center gap-1.5 px-4 pb-1 pt-2 font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.16em] text-txt-muted no-underline transition-colors duration-[140ms] hover:text-accent"
                  >
                    <span className="flex-1">{gr.name}</span>
                    <Icon
                      name="chevronRight"
                      size={11}
                      className="opacity-0 transition-all duration-[140ms] group-hover/cat:translate-x-0.5 group-hover/cat:opacity-100"
                    />
                  </Link>
                ) : (
                  <h5 className="flex items-center gap-1.5 px-4 pb-1 pt-2 font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.16em] text-txt-muted">
                    <span className="flex-1">{gr.name}</span>
                  </h5>
                ))}
              <DropItems items={gr.items} />
            </div>
          ))}
        </div>
      ) : (
        <DropItems items={sec.items} />
      )}
    </div>
  )
}

export interface NavDropdownProps {
  label: string
  href: string
  active?: boolean
  sections: NavSection[]
  onNavigate?: () => void
  /** Force the panel open and keep it open — for the design-system showcase. */
  demoOpen?: boolean
}

export function NavDropdown({ label, href, active, sections, demoOpen }: NavDropdownProps) {
  const tNav = useTranslations("nav.v3")
  const [open, setOpen] = React.useState(!!demoOpen)
  const [hovSec, setHovSec] = React.useState(0)
  const closeTm = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => () => { if (closeTm.current) clearTimeout(closeTm.current) }, [])
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !demoOpen) setOpen(false) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, demoOpen])

  const enter = () => { if (closeTm.current) clearTimeout(closeTm.current); setOpen(true) }
  const leave = () => { if (demoOpen) return; closeTm.current = setTimeout(() => setOpen(false), 150) }

  const sec = sections[Math.min(hovSec, sections.length - 1)] || sections[0]

  return (
    <span className={cn("flex items-stretch", demoOpen ? "w-fit" : "relative")} onMouseEnter={enter} onMouseLeave={leave}>
      {!demoOpen && (
        <Link
          href={href}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(false)}
          onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true) } }}
          className={cn(
            "flex items-center gap-[7px] border-y-[3px] border-transparent font-display text-[16px] font-bold uppercase leading-none tracking-[0.09em] no-underline transition-colors duration-[140ms]",
            active || open ? "text-txt" : "text-txt-muted hover:text-txt",
            active && "border-b-accent",
          )}
        >
          {label}
          <Icon
            name="chevronDown"
            size={13}
            className={cn("transition-all duration-[140ms]", open ? "rotate-180 text-accent opacity-100" : "opacity-50")}
          />
        </Link>
      )}

      {open && (
        <div
          role="menu"
          aria-label={tNav("menuOf", { label })}
          className={cn(
            "cut-tag [--cut-tag:10px] z-[70] flex w-fit border border-solid border-line-2 border-t-accent bg-panel shadow-[0_24px_54px_-22px_rgba(0,0,0,0.75)] animate-[bm-nd-pop_0.14s_ease-out] motion-reduce:animate-none",
            demoOpen ? "relative" : "absolute left-[-18px] top-full",
          )}
        >
          <div className="flex w-[176px] flex-col gap-0.5 border-r border-line bg-panel-2 py-2.5 px-2" role="none">
            {sections.map((s, i) => {
              const hueStyle = s.hue != null ? ({ ["--ghue" as string]: String(s.hue) } as React.CSSProperties) : undefined
              return (
                <Link
                  key={s.title || i}
                  href={s.href}
                  role="menuitem"
                  style={hueStyle}
                  onMouseEnter={() => setHovSec(i)}
                  onFocus={() => setHovSec(i)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group/game flex items-center gap-[9px] px-2.5 py-[9px] font-display text-[13px] font-bold uppercase leading-none tracking-[0.08em] no-underline transition-colors duration-[140ms]",
                    i === hovSec ? "bg-panel text-txt" : "text-txt-muted",
                  )}
                >
                  <i aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rotate-45 bg-[hsl(var(--ghue,22)_72%_56%)]" />
                  <span className="flex-1">{s.title}</span>
                  <Icon
                    name="chevronRight"
                    size={13}
                    className={cn("transition-opacity duration-[140ms]", i === hovSec ? "text-accent opacity-100" : "opacity-0")}
                  />
                </Link>
              )
            })}
          </div>
          <DropSheet sec={sec} />
        </div>
      )}
    </span>
  )
}

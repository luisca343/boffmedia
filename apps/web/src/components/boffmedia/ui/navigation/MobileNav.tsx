"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { IconButton } from "@/components/boffmedia/primitives/icon-button"
import { LangSwitcher } from "./LangSwitcher"
import { MobileAccount } from "./AccountNav"
import { PRIMARY_NAV, buildToolsSections, buildComunidadSections, type NavSection } from "./nav-data"

function sectionItems(sections: NavSection[]) {
  return sections.map((s) => ({
    title: s.title,
    href: s.href,
    hue: s.hue,
    items: s.groups ? s.groups.flatMap((g) => g.items) : s.items,
  }))
}

function NavAccordion({ label, sections, onNavigate }: { label: string; sections: NavSection[]; onNavigate: () => void }) {
  const [open, setOpen] = React.useState(false)
  const groups = sectionItems(sections)

  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-3.5 font-display text-[17px] font-bold uppercase leading-none tracking-[0.06em] text-txt"
      >
        {label}
        <Icon
          name="chevronDown"
          size={16}
          className={cn("shrink-0 text-txt-dim transition-transform duration-[140ms]", open && "rotate-180 text-accent")}
        />
      </button>
      {open && (
        <div className="pb-3">
          {groups.map((g) => (
            <div key={g.title} className="mb-1.5">
              <Link
                href={g.href}
                onClick={onNavigate}
                className="flex items-center gap-2 px-1 py-1.5 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.16em] text-txt-muted no-underline"
              >
                <i aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rotate-45 bg-[hsl(var(--ghue,22)_72%_56%)]" style={{ ["--ghue"]: g.hue ?? 22 } as React.CSSProperties} />
                {g.title}
              </Link>
              {g.items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={onNavigate}
                  className="flex items-center gap-2.5 px-1 py-2 font-body text-[14px] font-medium leading-none text-txt-muted no-underline transition-colors duration-[140ms] hover:text-txt"
                >
                  <Icon name={it.icon || "wrench"} size={15} className="shrink-0 text-txt-dim" />
                  {it.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function MobileNav({ pathname }: { pathname: string }) {
  const t = useTranslations()
  const tNav = useTranslations("nav.v3")
  const toolsSections = React.useMemo(() => buildToolsSections(t), [t])
  const comunidadSections = React.useMemo(() => buildComunidadSections(t), [t])
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  const close = React.useCallback(() => setOpen(false), [])

  return (
    <>
      <IconButton
        name={open ? "x" : "menu"}
        label={open ? tNav("closeMenu") : tNav("openMenu")}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="min-[1120px]:hidden"
      />

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[var(--nav-h)] z-[80] min-[1120px]:hidden">
          <button type="button" aria-label={tNav("closeMenu")} tabIndex={-1} onClick={close} className="absolute inset-0 bg-black/60" />
          <nav
            aria-label={tNav("mobileNavAria")}
            className="absolute inset-x-0 top-0 max-h-full overflow-y-auto border-b-2 border-accent bg-base px-5 pb-6 pt-1 shadow-[0_24px_54px_-22px_rgba(0,0,0,0.75)]"
          >
            <div className="flex flex-col">
              {PRIMARY_NAV.map((n) =>
                n.menu ? (
                  <NavAccordion
                    key={n.route}
                    label={tNav(n.labelKey)}
                    sections={n.menu === "tools" ? toolsSections : comunidadSections}
                    onNavigate={close}
                  />
                ) : (
                  <Link
                    key={n.route}
                    href={n.route}
                    onClick={close}
                    className="border-b border-line py-3.5 font-display text-[17px] font-bold uppercase leading-none tracking-[0.06em] text-txt no-underline"
                  >
                    {tNav(n.labelKey)}
                  </Link>
                ),
              )}
            </div>

            <div className="mt-5 flex items-center gap-2.5">
              <LangSwitcher />
              <IconButton name="search" label={tNav("search")} />
            </div>

            <MobileAccount onNavigate={close} />
          </nav>
        </div>
      )}
    </>
  )
}

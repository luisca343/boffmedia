"use client"

import { ASSET, staticAsset } from '@/lib/assets';
import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { IconButton } from "@boffmedia/ui"
import { NavDropdown } from "./NavDropdown"
import { LangSwitcher } from "./LangSwitcher"
import { NotifBell } from "./NotifBell"
import { MobileNav } from "./MobileNav"
import { AccountNav } from "./AccountNav"
import { PRIMARY_NAV, buildToolsSections, buildComunidadSections } from "./nav-data"
import { useViewerRoles } from "@/services/useBoffSession"

function useTheme() {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark")
  React.useEffect(() => {
    const current = (document.documentElement.dataset.theme as "dark" | "light") || "dark"
    setTheme(current)
  }, [])
  const toggle = React.useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      const root = document.documentElement
      root.classList.add("theme-switching")
      root.dataset.theme = next
      try { localStorage.setItem("theme", next) } catch { /* noop */ }
      window.setTimeout(() => root.classList.remove("theme-switching"), 260)
      return next
    })
  }, [])
  return { theme, toggle }
}

export function Navbar() {
  const pathname = usePathname() || "/"
  const seg = "/" + (pathname.split("/").filter(Boolean)[0] || "")
  const { theme, toggle } = useTheme()
  const t = useTranslations()
  const tNav = useTranslations("nav.v3")
  const roles = useViewerRoles()
  const toolsSections = React.useMemo(() => buildToolsSections(t, roles), [t, roles])
  const comunidadSections = React.useMemo(() => buildComunidadSections(t), [t])

  return (
    <nav className="sticky top-0 z-50 flex h-[var(--nav-h)] items-center gap-4 border-b border-line bg-base px-5 transition-[background,border-color] duration-[260ms] min-[640px]:px-10 min-[1120px]:gap-7">
      <Link
        href="/"
        className="mr-0 flex shrink-0 items-center gap-[0.6875rem] font-display text-[1.375rem] font-extrabold italic uppercase leading-none text-txt no-underline min-[1120px]:mr-[0.875rem]"
      >
        <Image src={staticAsset(ASSET.boffmedia.brand, 'boff-logo.webp')} alt="" width={27} height={27} className="h-[1.6875rem] w-[1.6875rem] object-contain" />
        <span>Boff<b className="text-accent">media</b></span>
      </Link>

      <div className="hidden h-full items-stretch gap-[1.625rem] min-[1120px]:flex">
        {PRIMARY_NAV.map((n) => {
          const on = n.route === "/" ? pathname === "/" : seg === n.route
          if (n.menu) {
            return (
              <NavDropdown
                key={n.route}
                label={tNav(n.labelKey)}
                href={n.route}
                active={on}
                sections={n.menu === "tools" ? toolsSections : comunidadSections}
              />
            )
          }
          return (
            <Link
              key={n.route}
              href={n.route}
              className={cn(
                "flex items-center border-y-[3px] border-transparent font-display text-[1rem] font-bold uppercase leading-none tracking-[0.09em] no-underline transition-colors duration-[140ms]",
                on ? "border-b-accent text-txt" : "text-txt-muted hover:text-txt",
              )}
            >
              {tNav(n.labelKey)}
            </Link>
          )
        })}
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <div className="hidden items-center gap-2.5 min-[1120px]:flex">
          <IconButton name="search" label={tNav("search")} />
          <LangSwitcher />
          <span aria-hidden="true" className="h-[1.375rem] w-px shrink-0 bg-line-2" />
          <NotifBell />
        </div>
        <IconButton name={theme === "dark" ? "sun" : "moon"} label={tNav("theme")} onClick={toggle} />
        <div className="hidden items-center gap-2 min-[1120px]:inline-flex">
          <AccountNav />
        </div>
        <MobileNav pathname={pathname} />
      </div>
    </nav>
  )
}

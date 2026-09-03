"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { href: "/smartrotom/misiones", key: "board", glyph: "❦" },
  { href: "/smartrotom/misiones/trama", key: "story", glyph: "✶" },
  { href: "/smartrotom/misiones/mapa", key: "map", glyph: "✦" },
  { href: "/smartrotom/misiones/mochila", key: "backpack", glyph: "◆" },
  { href: "/smartrotom/misiones/bitacora", key: "log", glyph: "✥" },
  { href: "/smartrotom/misiones/mazmorra", key: "mazmorra", glyph: "⚔" },
] as const

const useIsCurrent = () => {
  const pathname = usePathname()
  return (href: string) => (href.endsWith("misiones") ? pathname === href : pathname.startsWith(href))
}

/** The tavern sign and the leather tabs nailed down the left of the board. */
export function SideRail() {
  const t = useTranslations("misiones.sideRail")
  const isCurrent = useIsCurrent()

  return (
    <aside
      data-tabstyle="sello"
      className="ms-wood ms-side-rail hidden w-60 shrink-0 flex-col border-r-[3px] border-[#050201] md:flex"
    >
      <div className="bg-gradient-to-b from-black/40 to-transparent px-4 pb-[1.125rem] pt-[1.375rem] text-center">
        <div className="inline-flex items-center gap-1.5 font-ms-uppercase text-[0.6875rem] uppercase tracking-[.2em] text-ms-gold-2">
          {t("eyebrow")}
        </div>
        <h1 className="mt-2 font-ms-display text-[1.625rem] leading-none text-ms-gold-1 [text-shadow:0_2px_4px_rgba(0,0,0,.7)]">
          {t("brand")}
        </h1>
        <div className="mt-2 font-ms-uppercase text-[0.625rem] italic tracking-[.16em] text-ms-gold-3 opacity-80">
          {t("tagline")}
        </div>
      </div>

      <div className="mx-3.5 h-0.5 bg-gradient-to-r from-transparent via-ms-gold-3 to-transparent opacity-50" />

      <nav className="flex flex-1 flex-col gap-0.5 py-3.5" aria-label={t("ariaLabel")}>
        {SECTIONS.map((section) => {
          const current = isCurrent(section.href)
          return (
            <Link
              key={section.href}
              href={section.href}
              aria-current={current ? "page" : undefined}
              className={cn("ms-tab relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ms-gold-2")}
            >
              <span className="text-base opacity-70">{section.glyph}</span>
              <span className="flex-1">{t(`tabs.${section.key}.label`)}</span>
              {current && <span className="absolute right-2.5 text-[0.5625rem] text-ms-gold-2">▶</span>}
            </Link>
          )
        })}
      </nav>

      <div className="px-3.5 pb-3.5 pt-2 text-center font-ms-uppercase text-[0.5625rem] uppercase tracking-[.16em] text-ms-gold-1/50">
        {t("footer")}
      </div>
    </aside>
  )
}

/** The same six tabs, as a scrolling plank across the top on a phone. */
export function MobileRail() {
  const t = useTranslations("misiones.sideRail")
  const isCurrent = useIsCurrent()

  return (
    <div className="ms-wood flex items-center gap-1.5 overflow-x-auto p-2.5 px-3 md:hidden">
      <span className="mr-2 shrink-0 font-ms-display text-base text-ms-gold-1">✦ {t("brand")}</span>
      {SECTIONS.map((section) => {
        const current = isCurrent(section.href)
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-[3px] border px-2.5 py-1.5 font-ms-uppercase text-[0.6875rem] uppercase tracking-[.1em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ms-gold-2",
              current
                ? "border-ms-gold-4 bg-gradient-to-b from-ms-gold-2 to-ms-gold-3 text-[#1e120a]"
                : "border-ms-gold-1/30 text-ms-gold-1",
            )}
          >
            {t(`tabs.${section.key}.short`)}
          </Link>
        )
      })}
    </div>
  )
}

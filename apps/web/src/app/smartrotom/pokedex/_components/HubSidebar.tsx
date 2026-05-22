"use client"

import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { InternalLink } from "@/components/ui/navigation/Link"
import { PokeballIcon } from "./PokeballIcon"
import { HomeIcon, BookOpenIcon, MapIcon, BoltIcon, SparklesIcon, Cog6ToothIcon } from "@heroicons/react/24/outline"
import { useBoffSession } from "@/services/useBoffSession"

const NAV_DATA = [
  { href: "/smartrotom/pokedex", labelKey: "hub_nav_home", icon: HomeIcon },
  { href: "/smartrotom/pokedex/entrada", labelKey: "hub_nav_pokemon", icon: BookOpenIcon, tail: "905" },
  { href: "/smartrotom/pokedex/spawns", labelKey: "hub_nav_spawns", icon: MapIcon, tail: "21" },
  { href: "/smartrotom/pokedex/localizacion", labelKey: "hub_nav_biomes", icon: MapIcon, tail: "48" },
]

const NAV_REF = [
  { href: "/smartrotom/pokedex/movimientos", labelKey: "hub_nav_moves", icon: BoltIcon, tail: "924" },
  { href: "/smartrotom/pokedex/habilidades", labelKey: "hub_nav_abilities", icon: SparklesIcon, tail: "298" },
  { href: "/smartrotom/pokedex/tipos", labelKey: "hub_nav_types", icon: BookOpenIcon },
]

export function HubSidebar() {
  const t = useTranslations("pokedex")
  const pathname = usePathname()
  const { session } = useBoffSession()

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 bg-white/[0.015] border-r border-white/[0.05] p-[18px_14px] gap-[22px]">
      <div className="flex items-center gap-[10px] pb-[14px] px-2 border-b border-white/[0.05]">
        <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-primary-400 to-primary-700 grid place-items-center shadow-[0_4px_12px_rgba(249,115,22,0.3)]">
          <PokeballIcon size={18} color="white" />
        </div>
        <div className="flex flex-col gap-px">
          <b className="font-orbitron text-sm font-bold text-surface-50 tracking-tight">{t("hub_brand_title")}</b>
          <span className="font-jetbrains text-[10px] text-surface-500 tracking-widest uppercase">{t("hub_brand_subtitle")}</span>
        </div>
      </div>

      <NavSection items={NAV_DATA} label={t("hub_nav_data")} pathname={pathname} t={t} />
      <NavSection items={NAV_REF} label={t("hub_nav_reference")} pathname={pathname} t={t} />

      <div className="mt-auto flex flex-col gap-[10px] p-3 bg-white/[0.02] border border-white/[0.05] rounded-[10px]">
        <div className="flex items-center gap-[10px] text-xs">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#84cc16] to-[#16a34a] grid place-items-center font-orbitron font-bold text-[13px] text-white">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex flex-col gap-px min-w-0">
            <b className="text-[12.5px] text-surface-100">{session?.user?.name || "Usuario"}</b>
            <span className="text-[10.5px] text-surface-500 font-jetbrains">{t("hub_connected")} · server-01</span>
          </div>
        </div>
        <button className="flex items-center gap-[11px] px-2 py-1.5 rounded-md text-xs text-surface-300 hover:text-surface-100 hover:bg-white/[0.04] transition-colors">
          <Cog6ToothIcon className="w-3.5 h-3.5" />
          {t("hub_settings")}
        </button>
      </div>
    </aside>
  )
}

function NavSection({
  items,
  label,
  pathname,
  t,
}: {
  items: { href: string; labelKey: string; icon: any; tail?: string }[]
  label: string
  pathname: string
  t: any
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      <div className="font-jetbrains text-[10px] tracking-[0.12em] uppercase text-surface-500 px-[10px] pb-1.5">
        {label}
      </div>
      {items.map((item) => {
        const isActive =
          item.href === "/smartrotom/pokedex"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/")
        const Icon = item.icon
        return (
          <InternalLink
            key={item.href}
            href={item.href}
            className={`flex items-center gap-[11px] py-[9px] px-[10px] rounded-lg text-[13.5px] font-medium transition-colors ${
              isActive
                ? "bg-primary-400/[0.12] text-primary-200 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.25)]"
                : "text-surface-300 hover:text-surface-100 hover:bg-white/[0.04]"
            }`}
          >
            <Icon className={`w-[18px] h-[18px] ${isActive ? "text-primary-300" : "text-surface-400"}`} />
            {t(item.labelKey as any)}
            {item.tail && (
              <span className="ml-auto font-jetbrains text-[10px] text-surface-500 bg-white/[0.04] px-1.5 py-0.5 rounded">
                {item.tail}
              </span>
            )}
          </InternalLink>
        )
      })}
    </nav>
  )
}

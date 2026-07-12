"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { PokeballIcon } from "./ui"
import { HomeIcon, BookOpenIcon, MapIcon, BoltIcon, SparklesIcon, Cog6ToothIcon } from "@heroicons/react/24/outline"
import { useBoffSession } from "@/services/useBoffSession"

type NavItem = { href: string; label: string; icon: typeof HomeIcon; tail?: string }

// Nav badge counts are static design placeholders — wire to real totals later. [deferred]
const NAV_DATA: NavItem[] = [
  { href: "/smartrotom/pokedex", label: "Inicio", icon: HomeIcon },
  { href: "/smartrotom/pokedex/entrada", label: "Pokémon", icon: BookOpenIcon, tail: "905" },
  { href: "/smartrotom/pokedex/spawns", label: "Apariciones", icon: MapIcon, tail: "21" },
  { href: "/smartrotom/pokedex/localizacion", label: "Biomas", icon: MapIcon, tail: "48" },
]

const NAV_REF: NavItem[] = [
  { href: "/smartrotom/pokedex/movimientos", label: "Movimientos", icon: BoltIcon, tail: "924" },
  { href: "/smartrotom/pokedex/habilidades", label: "Habilidades", icon: SparklesIcon, tail: "298" },
  { href: "/smartrotom/pokedex/tipos", label: "Tipos", icon: BookOpenIcon },
]

export function HubSidebar() {
  const pathname = usePathname()
  const { session } = useBoffSession()

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 bg-white/[0.015] border-r border-white/[0.05] p-[18px_14px] gap-[22px]">
      <div className="flex items-center gap-[10px] pb-[14px] px-2 border-b border-white/[0.05]">
        <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-pk-primary-400 to-pk-primary-700 grid place-items-center shadow-[0_4px_12px_rgba(249,115,22,0.3)]">
          <PokeballIcon size={18} color="white" />
        </div>
        <div className="flex flex-col gap-px">
          <b className="font-pk-display text-sm font-bold text-pk-surface-50 tracking-tight">Pokédex</b>
          <span className="font-pk-mono text-[10px] text-pk-surface-500 tracking-widest uppercase">SmartRotom</span>
        </div>
      </div>

      <NavSection items={NAV_DATA} label="Datos" pathname={pathname} />
      <NavSection items={NAV_REF} label="Referencia" pathname={pathname} />

      <div className="mt-auto flex flex-col gap-[10px] p-3 bg-white/[0.02] border border-white/[0.05] rounded-[10px]">
        <div className="flex items-center gap-[10px] text-xs">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#84cc16] to-[#16a34a] grid place-items-center font-pk-display font-bold text-[13px] text-white">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex flex-col gap-px min-w-0">
            <b className="text-[12.5px] text-pk-surface-100">{session?.user?.name || "Usuario"}</b>
            <span className="text-[10.5px] text-pk-surface-500 font-pk-mono">Conectado · server-01</span>
          </div>
        </div>
        <button className="flex items-center gap-[11px] px-2 py-1.5 rounded-md text-xs text-pk-surface-300 hover:text-pk-surface-100 hover:bg-white/[0.04] transition-colors">
          <Cog6ToothIcon className="w-3.5 h-3.5" />
          Ajustes
        </button>
      </div>
    </aside>
  )
}

function NavSection({ items, label, pathname }: { items: NavItem[]; label: string; pathname: string }) {
  return (
    <nav className="flex flex-col gap-0.5">
      <div className="font-pk-mono text-[10px] tracking-[0.12em] uppercase text-pk-surface-500 px-[10px] pb-1.5">
        {label}
      </div>
      {items.map((item) => {
        const isActive =
          item.href === "/smartrotom/pokedex"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/")
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-[11px] py-[9px] px-[10px] rounded-lg text-[13.5px] font-medium transition-colors ${
              isActive
                ? "bg-pk-primary-400/[0.12] text-pk-primary-200 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.25)]"
                : "text-pk-surface-300 hover:text-pk-surface-100 hover:bg-white/[0.04]"
            }`}
          >
            <Icon className={`w-[18px] h-[18px] ${isActive ? "text-pk-primary-300" : "text-pk-surface-400"}`} />
            {item.label}
            {item.tail && (
              <span className="ml-auto font-pk-mono text-[10px] text-pk-surface-500 bg-white/[0.04] px-1.5 py-0.5 rounded">
                {item.tail}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

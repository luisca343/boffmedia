"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "./ui"

interface NavItem {
  href: string
  label: string
  hint: string
  icon: IconName
  badge?: number
}

interface NavGroup {
  group: string
  items: NavItem[]
}

export interface ArcadeSidebarProps {
  /** Unopened boxes — the only badge the API can actually answer. */
  boxesOwned: number
  /** Whether today's streak reward is still unclaimed. */
  rewardReady: boolean
}

/**
 * The arcade's own nav. The handoff also lists Misiones and Temporada; neither
 * has any backing data (no missions table, no season/XP anywhere), so neither is
 * routed — see docs/smartrotom/deferred/arcade.md.
 */
function navigation({ boxesOwned, rewardReady }: ArcadeSidebarProps): NavGroup[] {
  return [
    {
      group: "Arcade",
      items: [
        { href: "/smartrotom/arcade", label: "Jugar", hint: "Inicio · biblioteca", icon: "Joystick" },
        {
          href: "/smartrotom/arcade/racha",
          label: "Racha diaria",
          hint: "Recompensa de hoy",
          icon: "Calendar",
          badge: rewardReady ? 1 : undefined,
        },
      ],
    },
    {
      group: "Cajas",
      items: [
        {
          href: "/smartrotom/arcade/loot",
          label: "Cajas",
          hint: "Abrir botín",
          icon: "Box",
          badge: boxesOwned || undefined,
        },
        {
          href: "/smartrotom/arcade/coleccion",
          label: "Colección",
          hint: "Tus objetos",
          icon: "Grid",
        },
      ],
    },
    {
      group: "Cuenta",
      items: [
        { href: "/smartrotom/arcade/ajustes", label: "Ajustes", hint: "Cabina · accesibilidad", icon: "Gear" },
      ],
    },
  ]
}

function NavButton({ item, active }: { item: NavItem; active: boolean }) {
  const Glyph = Icon[item.icon]
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "ar-lift mb-0.5 flex w-full items-center gap-3 rounded-[9px] border border-l-[3px] px-[11px] py-2.5 text-left",
        active
          ? "border-ar-cyan/40 border-l-ar-cyan bg-[linear-gradient(90deg,rgb(var(--ar-cyan)/.16),rgb(var(--ar-cyan)/.02))] text-ar-ink"
          : "border-transparent text-ar-ink-dim hover:bg-white/[.03] hover:text-ar-ink",
      )}
    >
      <span className={cn("inline-flex shrink-0", active ? "text-ar-cyan" : "text-ar-ink-muted")}>
        <Glyph s={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block font-ar text-[13.5px] leading-tight", active ? "font-bold" : "font-semibold")}>
          {item.label}
        </span>
        <span className="mt-0.5 block truncate font-ar-mono text-[10px] text-ar-ink-muted">
          {item.hint}
        </span>
      </span>
      {item.badge ? (
        <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ar-magenta px-1.5 font-ar-mono text-[10px] font-bold text-white shadow-[0_0_10px_rgb(var(--ar-magenta)/.5)]">
          {item.badge}
        </span>
      ) : active ? (
        <span aria-hidden className="text-[9px] text-ar-cyan motion-reduce:animate-none animate-ar-blink">
          ●
        </span>
      ) : null}
    </Link>
  )
}

export function ArcadeSidebar(props: ArcadeSidebarProps) {
  const pathname = usePathname()
  const groups = navigation(props)

  return (
    <aside className="ar-scroll sticky top-[18px] hidden max-h-[calc(100vh_-_36px)] w-[236px] shrink-0 self-start overflow-y-auto rounded-2xl border border-ar-violet/[.18] bg-[linear-gradient(180deg,rgb(12_6_38/.75),rgb(6_3_20/.75))] p-3.5 lg:block">
      <div className="flex items-center gap-2.5 px-1 pb-3.5 pt-0.5">
        <div className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-[linear-gradient(135deg,rgb(var(--ar-magenta)),rgb(var(--ar-violet)))] shadow-[0_0_16px_rgb(var(--ar-magenta)/.4)]">
          <Icon.Joystick s={17} className="text-white" />
        </div>
        <div>
          <div className="font-ar-display text-[11px] text-ar-ink">ARCADE</div>
          <div className="mt-0.5 font-ar-mono text-[10px] text-ar-ink-muted">SmartRotom</div>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.group} className="mb-3">
          <div className="px-1.5 py-1 font-ar-mono text-[10px] uppercase tracking-[0.18em] text-ar-ink-muted">
            {g.group}
          </div>
          {g.items.map((item) => (
            <NavButton
              key={item.href}
              item={item}
              active={pathname === item.href}
            />
          ))}
        </div>
      ))}

      <div className="mt-1.5 rounded-[10px] border border-dashed border-ar-magenta/30 bg-[linear-gradient(180deg,rgb(var(--ar-magenta)/.08),rgb(var(--ar-violet)/.04))] p-3">
        <div className="mb-1.5 font-ar-mono text-[10px] font-bold uppercase tracking-wider text-ar-magenta-2">
          Free to play
        </div>
        <div className="font-ar-mono text-[11px] leading-relaxed text-ar-ink-dim">
          Arcade individual con datos en vivo del servidor. Sin compras: todo se gana jugando.
        </div>
      </div>
    </aside>
  )
}

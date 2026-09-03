"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "./ui"

interface NavItem {
  href: string
  labelKey: string
  hintKey: string
  icon: IconName
  badge?: number
}

interface NavGroup {
  groupKey: string
  items: NavItem[]
}

export interface ArcadeSidebarProps {
  /** Unopened boxes — the only badge the API can actually answer. */
  boxesOwned: number
  /** Whether today's streak reward is still unclaimed. */
  rewardReady: boolean
}

/**
 * The arcade's own nav. Misiones and Temporada have no backing data (no
 * missions table, no season/XP anywhere), so neither is routed — see
 * docs/smartrotom/deferred/arcade.md.
 */
function navigation({ boxesOwned, rewardReady }: ArcadeSidebarProps): NavGroup[] {
  return [
    {
      groupKey: "sidebar.arcade",
      items: [
        { href: "/smartrotom/arcade", labelKey: "sidebar.play", hintKey: "sidebar.playHint", icon: "Joystick" },
        {
          href: "/smartrotom/arcade/racha",
          labelKey: "sidebar.streak",
          hintKey: "sidebar.streakHint",
          icon: "Calendar",
          badge: rewardReady ? 1 : undefined,
        },
      ],
    },
    {
      groupKey: "sidebar.boxes",
      items: [
        {
          href: "/smartrotom/arcade/loot",
          labelKey: "sidebar.boxes",
          hintKey: "sidebar.boxesHint",
          icon: "Box",
          badge: boxesOwned || undefined,
        },
        {
          href: "/smartrotom/arcade/coleccion",
          labelKey: "sidebar.collection",
          hintKey: "sidebar.collectionHint",
          icon: "Grid",
        },
      ],
    },
    {
      groupKey: "sidebar.account",
      items: [
        { href: "/smartrotom/arcade/ajustes", labelKey: "sidebar.settings", hintKey: "sidebar.settingsHint", icon: "Gear" },
      ],
    },
  ]
}

function NavButton({ item, active }: { item: NavItem; active: boolean }) {
  const t = useTranslations("arcade")
  const Glyph = Icon[item.icon]
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "ar-lift mb-0.5 flex w-full items-center gap-3 rounded-[9px] border border-l-[3px] px-[0.6875rem] py-2.5 text-left",
        active
          ? "border-ar-cyan/40 border-l-ar-cyan bg-[linear-gradient(90deg,rgb(var(--ar-cyan)/.16),rgb(var(--ar-cyan)/.02))] text-ar-ink"
          : "border-transparent text-ar-ink-dim hover:bg-white/[.03] hover:text-ar-ink",
      )}
    >
      <span className={cn("inline-flex shrink-0", active ? "text-ar-cyan" : "text-ar-ink-muted")}>
        <Glyph s={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block font-ar text-[0.84375rem] leading-tight", active ? "font-bold" : "font-semibold")}>
          {t(item.labelKey)}
        </span>
        <span className="mt-0.5 block truncate font-ar-mono text-[0.625rem] text-ar-ink-muted">
          {t(item.hintKey)}
        </span>
      </span>
      {item.badge ? (
        <span className="grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-ar-magenta px-1.5 font-ar-mono text-[0.625rem] font-bold text-white shadow-[0_0_10px_rgb(var(--ar-magenta)/.5)]">
          {item.badge}
        </span>
      ) : active ? (
        <span aria-hidden className="text-[0.5625rem] text-ar-cyan motion-reduce:animate-none animate-ar-blink">
          ●
        </span>
      ) : null}
    </Link>
  )
}

export function ArcadeSidebar(props: ArcadeSidebarProps) {
  const t = useTranslations("arcade")
  const pathname = usePathname()
  const groups = navigation(props)

  return (
    <aside className="ar-scroll sticky top-[1.125rem] hidden max-h-[calc(100vh_-_2.25rem)] w-[14.75rem] shrink-0 self-start overflow-y-auto rounded-2xl border border-ar-violet/[.18] bg-[linear-gradient(180deg,rgb(12_6_38/.75),rgb(6_3_20/.75))] p-3.5 lg:block">
      <div className="flex items-center gap-2.5 px-1 pb-3.5 pt-0.5">
        <div className="grid h-[2.125rem] w-[2.125rem] place-items-center rounded-[9px] bg-[linear-gradient(135deg,rgb(var(--ar-magenta)),rgb(var(--ar-violet)))] shadow-[0_0_16px_rgb(var(--ar-magenta)/.4)]">
          <Icon.Joystick s={17} className="text-white" />
        </div>
        <div>
          <div className="font-ar-display text-[0.6875rem] text-ar-ink">ARCADE</div>
          <div className="mt-0.5 font-ar-mono text-[0.625rem] text-ar-ink-muted">SmartRotom</div>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.groupKey} className="mb-3">
          <div className="px-1.5 py-1 font-ar-mono text-[0.625rem] uppercase tracking-[0.18em] text-ar-ink-muted">
            {t(g.groupKey)}
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
        <div className="mb-1.5 font-ar-mono text-[0.625rem] font-bold uppercase tracking-wider text-ar-magenta-2">
          {t("common.freeToPlay")}
        </div>
        <div className="font-ar-mono text-[0.6875rem] leading-relaxed text-ar-ink-dim">
          {t("common.freeToPlayDesc")}
        </div>
      </div>
    </aside>
  )
}

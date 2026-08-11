"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@boffmedia/ui"
import { useDismiss } from "@boffmedia/ui/hooks/use-dismiss"
import { getGameEntry, type GameEntry } from "@/data/games"
import { hubConfig } from "@/data/hub"
import { HUB_SLUGS, hueColorOf, hueStyle } from "./tools-data"
import { GameLogo } from "./GameLogo"
import { ArtImage } from "./ArtImage"

interface SideItem {
  href: string
  label: string
  icon: IconName
  isNew?: boolean
}
interface SideGroup {
  name: string
  items: SideItem[]
}

// ── game switcher (rail header) ──────────────────────────────────────────────
function GameSwitch({ slug }: { slug: string }) {
  const t = useTranslations()
  const tShell = useTranslations("toolsUi.shell")
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const hub = hubConfig[slug]
  const game = getGameEntry(slug)

  useDismiss(ref, () => setOpen(false), open)

  if (!hub || !game) return null

  return (
    <div ref={ref} className="relative p-3">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        title={tShell("switchGame", { game: t(game.nameKey) })}
        onClick={() => setOpen((v) => !v)}
        className="group/sw cut-tag cut-tag-edge flex w-full items-center gap-3 overflow-hidden whitespace-nowrap border border-solid border-line bg-panel py-[7px] pl-[6px] pr-[10px] transition-[border-color,background] duration-[140ms] hover:border-accent-line hover:bg-panel-2"
      >
        <GameLogo label={hub.logoLabel} hueColor={hueColorOf(hub.hue)} size="sm" imageSrc={game.icon} bare />
        <span className="min-w-0 flex-1 text-left font-display text-[15px] font-bold uppercase leading-none tracking-[0.02em]">{hub.short}</span>
        <Icon name="chevronDown" size={16} className={cn("flex-none text-txt-muted transition-transform duration-[140ms]", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-3 top-[calc(100%_-_6px)] z-[130] min-w-[228px] border border-solid border-line-2 bg-panel shadow-[0_24px_54px_-22px_rgba(0,0,0,0.6)] animate-[bm-menu-in_0.16s_ease-out] motion-reduce:animate-none">
          {HUB_SLUGS.map((s) => {
            const g = getGameEntry(s)
            if (!g) return null
            return (
              <Link
                key={s}
                href={`/${s}`}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex w-full items-center gap-[10px] whitespace-nowrap border-b border-solid border-line px-3 py-[10px] font-mono text-[12px] font-semibold uppercase leading-none tracking-[0.06em] no-underline transition-[background,color] duration-[140ms] last:border-b-0 hover:bg-panel-2 hover:text-txt",
                  s === slug ? "text-accent" : "text-txt-muted",
                )}
              >
                <span className="relative grid h-5 w-5 flex-none place-items-center overflow-hidden">
                  <ArtImage src={g.icon} sizes="20px" fit="contain" fallback={<Icon name="gamepad" size={14} />} />
                </span>
                {t(g.nameKey)}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── the collapsible rail ─────────────────────────────────────────────────────
function SideRail({
  slug,
  groups,
  activeHref,
  onNavigate,
  pinned,
  onTogglePin,
}: {
  slug: string
  groups: SideGroup[]
  activeHref: string
  onNavigate?: () => void
  pinned: boolean
  onTogglePin: () => void
}) {
  const tShell = useTranslations("toolsUi.shell")
  const hub = hubConfig[slug]
  const hue = hub ? hueColorOf(hub.hue) : "var(--accent)"
  const min = !pinned

  const labelFade = min
    ? "opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100"
    : "opacity-100"

  return (
    <nav
      aria-label={tShell("railAria")}
      style={hueStyle(hue)}
      className={cn(
        "group/rail relative h-full [--ro:264px] [--rw:72px]",
        "transition-[width] duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        min ? "w-[var(--rw)] hover:w-[var(--ro)] focus-within:w-[var(--ro)] max-lg:w-full" : "w-[var(--ro)]",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 z-[30] flex flex-col overflow-hidden border-r border-solid border-line bg-[color-mix(in_srgb,var(--panel)_55%,var(--bg))]",
          "transition-[width,box-shadow] duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)] max-lg:!w-full",
          min
            ? "w-[var(--rw)] group-hover/rail:z-[60] group-hover/rail:w-[var(--ro)] group-hover/rail:shadow-[28px_0_80px_-34px_rgba(0,0,0,0.8)] group-focus-within/rail:z-[60] group-focus-within/rail:w-[var(--ro)]"
            : "w-[var(--ro)]",
        )}
      >
        <div className="flex-none border-b border-solid border-line">
          <GameSwitch slug={slug} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-[10px] pb-4">
          {groups.map((g) => (
            <div key={g.name} className="mt-1.5 first:mt-0">
              <div className={cn("whitespace-nowrap px-[26px] pb-[7px] pt-3.5 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.16em] text-txt-dim", labelFade)}>
                {g.name}
              </div>
              {g.items.map((it) => {
                const on = it.href === activeHref
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={onNavigate}
                    title={it.label}
                    className={cn(
                      "group/link relative flex h-11 w-full items-center gap-3 overflow-hidden whitespace-nowrap pl-6 pr-3 no-underline transition-[color,background] duration-[140ms]",
                      "before:absolute before:left-0 before:top-1/2 before:w-[3px] before:-translate-y-1/2 before:bg-[var(--ghue)] before:transition-[height] before:duration-[260ms] before:content-['']",
                      on
                        ? "text-txt before:h-[62%] [background:linear-gradient(90deg,color-mix(in_srgb,var(--ghue)_14%,transparent),color-mix(in_srgb,var(--ghue)_3%,transparent)_62%,transparent)]"
                        : "text-txt-muted before:h-0 hover:bg-[color-mix(in_srgb,var(--panel-2)_75%,transparent)] hover:text-txt hover:before:h-[34%]",
                    )}
                  >
                    <span className={cn("relative grid w-6 flex-none place-items-center transition-colors duration-[140ms]", on ? "text-[var(--ghue)]" : "text-txt-dim group-hover/link:text-txt-muted")}>
                      <Icon name={it.icon} size={18} />
                    </span>
                    <span className={cn("min-w-0 flex-1 overflow-hidden text-ellipsis font-body text-[14px] leading-[1.1]", labelFade)}>{it.label}</span>
                    {it.isNew && (
                      <span className={cn("flex-none font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-accent", labelFade)}>{tShell("new")}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex-none border-t border-solid border-line max-lg:hidden">
          <button
            type="button"
            onClick={onTogglePin}
            aria-pressed={pinned}
            title={pinned ? tShell("collapseTitle") : tShell("pin")}
            className="group/pin flex h-11 w-full items-center gap-3 overflow-hidden whitespace-nowrap pl-6 pr-3 text-txt-dim transition-colors duration-[140ms] hover:text-txt"
          >
            <span className="grid w-6 flex-none place-items-center">
              <Icon name={pinned ? "collapse" : "chevronRight"} size={18} />
            </span>
            <span className={cn("min-w-0 flex-1 text-left font-mono text-[11px] uppercase tracking-[0.1em]", labelFade)}>
              {pinned ? tShell("collapse") : tShell("pin")}
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}

/**
 * Escape the shell's content padding (full-bleed sections such as banners).
 * The padding tokens (`--pad-x`/`--pad-y`) are owned by ToolShell below;
 * outside the shell the fallbacks make this a no-op.
 */
export function Bleed({ top = false, className, children }: { top?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("mx-[calc(-1*var(--pad-x,0px))]", top && "mt-[calc(-1*var(--pad-y,0px))]", className)}>
      {children}
    </div>
  )
}

/** True when `pathname` matches a tool marked `bleed` in the game data. */
function isBleedRoute(game: GameEntry | undefined, pathname: string): boolean {
  if (!game) return false
  for (const category of game.categories) {
    for (const tool of category.tools) {
      if (!tool.bleed) continue
      if (pathname !== tool.href && !pathname.startsWith(`${tool.href}/`)) continue
      if (tool.bleed === true) return true
      const extraDepth = pathname.slice(tool.href.length).split("/").filter(Boolean).length
      if (extraDepth >= tool.bleed) return true
    }
  }
  return false
}

// ── the shell: sticky rail + main; off-canvas on mobile ──────────────────────
export interface ToolShellProps {
  slug: string
  children: React.ReactNode
}

const RAIL_STORE = "bm-rail-herramientas"

export function ToolShell({ slug, children }: ToolShellProps) {
  const t = useTranslations()
  const tShell = useTranslations("toolsUi.shell")
  const pathname = usePathname() || ""
  const game = getGameEntry(slug)
  const hub = hubConfig[slug]
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [pinned, setPinned] = React.useState(false)

  React.useEffect(() => {
    try {
      setPinned(localStorage.getItem(RAIL_STORE) === "1")
    } catch {
      /* noop */
    }
  }, [])

  React.useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [mobileOpen])

  const togglePin = () =>
    setPinned((v) => {
      const n = !v
      try {
        localStorage.setItem(RAIL_STORE, n ? "1" : "0")
      } catch {
        /* noop */
      }
      return n
    })

  const groups: SideGroup[] = React.useMemo(() => {
    if (!game) return []
    return game.categories
      .map((c) => ({
        name: t(c.nameKey),
        items: c.tools
          .filter((tool) => tool.showInSidebar !== false)
          .map((tool) => ({
            href: tool.href,
            label: t(tool.nameKey),
            icon: tool.sidebarIcon,
            isNew: tool.landing?.isNew ?? false,
          })),
      }))
      .filter((g) => g.items.length > 0)
  }, [game, t])

  const bleed = React.useMemo(() => isBleedRoute(game, pathname), [game, pathname])

  if (!game || !hub) return <>{children}</>

  return (
    <div data-footer-flush="" className="flex min-h-[calc(100dvh_-_var(--nav-h))] items-stretch">
      <aside
        className={cn(
          "z-30 flex-none self-start max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-[80] max-lg:h-screen max-lg:w-[288px] max-lg:shadow-[var(--shadow)]",
          "max-lg:transition-[transform,visibility] max-lg:duration-300",
          "lg:sticky lg:top-[var(--nav-h)] lg:h-[calc(100dvh_-_var(--nav-h))]",
          mobileOpen ? "max-lg:translate-x-0 max-lg:visible" : "max-lg:-translate-x-full max-lg:invisible",
        )}
      >
        <SideRail
          slug={slug}
          groups={groups}
          activeHref={pathname}
          pinned={pinned}
          onTogglePin={togglePin}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-[79] bg-[var(--scrim)] lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="min-w-0 flex-1">
        <div className="sticky top-[var(--nav-h)] z-40 flex items-center gap-3 border-b border-solid border-line bg-base-2 px-[22px] py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={tShell("openToolsMenu")}
            className="cut-tag cut-tag-edge flex items-center gap-3 border border-solid border-line bg-panel py-[7px] pl-[6px] pr-[10px]"
          >
            <GameLogo label={hub.logoLabel} hueColor={hueColorOf(hub.hue)} size="sm" imageSrc={game.icon} bare />
            <span className="font-display text-[15px] font-bold uppercase leading-none tracking-[0.02em]">{hub.short}</span>
            <Icon name="list" size={18} className="text-txt-muted" />
          </button>
        </div>
        <div className={cn("min-w-0", !bleed && "[--pad-x:clamp(22px,3.2vw,60px)] [--pad-y:30px] px-[var(--pad-x)] pb-[90px] pt-[var(--pad-y)]")}>
          {children}
        </div>
      </div>
    </div>
  )
}

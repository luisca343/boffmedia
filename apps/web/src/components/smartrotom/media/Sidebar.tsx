"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { useMediaTheme } from "./_theme"
import { navFor, type NavItem } from "./_nav"
import { I } from "./ui/icons"

function Item({ item, collapsed, active, comingSoonLabel, label }: { item: NavItem; collapsed: boolean; active: boolean; comingSoonLabel: string; label: string }) {
  const Glyph = I[item.icon]
  const inner = (
    <>
      <span className="inline-flex flex-none">
        <Glyph />
      </span>
      {!collapsed && (
        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
      )}
    </>
  )
  const base = cn(
    "relative flex w-full items-center gap-3.5 rounded-mw-lg border border-transparent px-3 py-2.5 text-left text-sm transition-colors duration-150",
    collapsed && "justify-center px-3",
    active
      ? "text-white bg-[color-mix(in_srgb,rgb(var(--mw-accent))_24%,rgb(var(--mw-800)))] !border-[color-mix(in_srgb,rgb(var(--mw-accent))_50%,transparent)] before:absolute before:-left-px before:top-2 before:bottom-2 before:w-[3px] before:rounded-r before:bg-mw-accent before:shadow-[0_0_12px_rgb(var(--mw-accent)/.35)] before:content-['']"
      : "text-mw-fg-mute hover:text-mw-fg hover:bg-[color-mix(in_srgb,rgb(var(--mw-accent))_12%,rgb(var(--mw-800)))]",
  )

  if (item.href && !item.deferred) {
    return (
      <Link href={item.href} className={base} title={collapsed ? label : undefined} aria-current={active ? "page" : undefined}>
        {inner}
      </Link>
    )
  }
  // deferred: present but gated, so it is never a dead link
  return (
    <button
      type="button"
      aria-disabled="true"
      className={cn(base, "cursor-default opacity-45")}
      title={collapsed ? `${label} · ${comingSoonLabel}` : comingSoonLabel}
    >
      {inner}
    </button>
  )
}

export function Sidebar({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  const theme = useMediaTheme()
  const pathname = usePathname()
  const t = useTranslations("common.media.sidebar")
  const nav = navFor(theme.id, theme.basePath)

  const isActive = (item: NavItem) =>
    item.href != null &&
    (item.href === theme.basePath ? pathname === theme.basePath : pathname.startsWith(item.href))

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col border-r bg-[color-mix(in_srgb,rgb(var(--mw-accent))_12%,rgb(var(--mw-bg)))] border-[color-mix(in_srgb,rgb(var(--mw-accent))_30%,var(--mw-hairline))] transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-64",
        className,
      )}
    >
      <div className="mw-scroll flex-1 overflow-y-auto px-3 pb-6 pt-3.5">
        <div className="flex flex-col gap-0.5">
          {nav.main.map((item) => (
            <Item key={item.key} item={item} collapsed={collapsed} active={isActive(item)} comingSoonLabel={t("comingSoon")} label={t(item.labelKey)} />
          ))}
        </div>

        {!collapsed && (
          <div className="mx-1.5 my-3.5 h-px bg-[color-mix(in_srgb,rgb(var(--mw-accent))_25%,var(--mw-hairline))]" />
        )}

        <div className="flex flex-col gap-0.5">
          {!collapsed && (
            <div className="px-3 pb-2 pt-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[color-mix(in_srgb,rgb(var(--mw-accent))_60%,rgb(var(--mw-fg-faint)))]">
              {t("you")}
            </div>
          )}
          {nav.library.map((item) => (
            <Item key={item.key} item={item} collapsed={collapsed} active={isActive(item)} comingSoonLabel={t("comingSoon")} label={t(item.labelKey)} />
          ))}
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-1.5 border-t border-mw-line px-4 py-3.5 text-[11px] text-mw-fg-faint">
          <div className="flex items-center justify-between text-mw-fg-mute">
            <span>{t("partOf")}</span>
            <strong className="font-mw-display text-xs font-bold tracking-[0.02em] text-mw-fg">SmartRotom</strong>
          </div>
        </div>
      )}
    </aside>
  )
}

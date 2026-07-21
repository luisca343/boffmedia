"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { MEDIA_THEMES, useMediaTheme, type MediaAppId } from "./_theme"
import { I } from "./ui/icons"

const BRAND_GRADIENT: Record<MediaAppId, string> = {
  mewtube: "linear-gradient(135deg,#ec4899,#be185d 70%,#831843)",
  mewtwitch: "linear-gradient(135deg,#a855f7,#6b21a8 70%,#4c1d95)",
}
const SWITCH_DOT: Record<MediaAppId, string> = { mewtube: "#ec4899", mewtwitch: "#a855f7" }
const SWITCH_ON: Record<MediaAppId, string> = {
  mewtube: "linear-gradient(135deg,#ec4899,#be185d)",
  mewtwitch: "linear-gradient(135deg,#a855f7,#6b21a8)",
}

function AppSwitchBtn({ id, active }: { id: MediaAppId; active: boolean }) {
  return (
    <Link
      href={MEDIA_THEMES[id].basePath}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-mw-pill px-2.5 py-1.5 text-[13px] font-semibold transition-colors",
        active ? "text-white" : "text-mw-fg-mute hover:text-mw-fg",
      )}
      style={active ? { background: SWITCH_ON[id] } : undefined}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={
          active
            ? { background: "#fff", boxShadow: "0 0 6px rgba(255,255,255,.8)" }
            : { background: SWITCH_DOT[id], boxShadow: `0 0 8px ${SWITCH_DOT[id]}` }
        }
      />
      {MEDIA_THEMES[id].label}
    </Link>
  )
}

export function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const theme = useMediaTheme()
  const router = useRouter()
  const t = useTranslations("common.media")
  const [q, setQ] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    router.push(term ? `${theme.basePath}?q=${encodeURIComponent(term)}` : theme.basePath)
  }

  return (
    <header className="relative z-30 grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b px-4 bg-[color-mix(in_srgb,rgb(var(--mw-accent))_14%,rgb(var(--mw-bg)))] border-[color-mix(in_srgb,rgb(var(--mw-accent))_40%,var(--mw-hairline))] md:grid-cols-[280px_minmax(0,1fr)_280px] md:gap-4 md:px-6">
      {/* left: menu + brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={t("menu")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-mw-md border border-transparent text-mw-fg-mute transition-colors hover:border-mw-line-strong hover:bg-mw-800 hover:text-mw-fg"
        >
          <I.menu />
        </button>
        <Link href={theme.basePath} className="flex items-center gap-2.5 px-1 text-mw-fg">
          <span
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-white shadow-[0_0_0_1px_var(--mw-hairline-strong),0_8px_24px_-10px_rgb(var(--mw-accent)/.35)]"
            style={{ background: BRAND_GRADIENT[theme.id] }}
          >
            <I.rotom size={20} />
          </span>
          <span className="inline-flex items-baseline font-mw-display text-[18px] font-extrabold tracking-[0.01em]">
            <span className="text-mw-fg">Mew</span>
            <span className="bg-[linear-gradient(120deg,rgb(var(--mw-accent)),color-mix(in_srgb,rgb(var(--mw-accent))_40%,#fff))] bg-clip-text text-transparent">
              {theme.id === "mewtube" ? "tube" : "twitch"}
            </span>
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-mw-fg-faint sm:inline">
            SmartRotom
          </span>
        </Link>
      </div>

      {/* center: search */}
      <div className="flex min-w-0 justify-center">
        <form onSubmit={submit} className="flex h-10 w-full max-w-[600px] items-center rounded-mw-pill bg-mw-900 pl-3.5 transition-[border-color,background,box-shadow] border border-[color-mix(in_srgb,rgb(var(--mw-accent))_18%,var(--mw-hairline))] focus-within:bg-mw-bg focus-within:border-[color-mix(in_srgb,rgb(var(--mw-accent))_60%,transparent)] focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,rgb(var(--mw-accent))_12%,transparent)]">
          <span className="inline-flex text-mw-fg-subtle">
            <I.search size={18} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={theme.searchPlaceholder}
            aria-label={t("search")}
            className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-mw-fg outline-none placeholder:text-mw-fg-faint"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} className="px-2 text-lg text-mw-fg-subtle" aria-label={t("clear")}>
              ×
            </button>
          )}
          <button
            type="submit"
            aria-label={t("search")}
            className="inline-flex h-10 w-14 items-center justify-center rounded-r-mw-pill border-l border-mw-line bg-mw-800 text-mw-fg-mute transition-colors hover:text-mw-fg hover:bg-[color-mix(in_srgb,rgb(var(--mw-accent))_14%,rgb(var(--mw-800)))]"
          >
            <I.search size={18} />
          </button>
        </form>
      </div>

      {/* right: app-switch + actions */}
      <div className="flex items-center justify-end gap-2">
        <div className="mr-1 hidden items-center rounded-mw-pill p-[3px] bg-[color-mix(in_srgb,rgb(var(--mw-accent))_16%,rgb(var(--mw-900)))] border border-[color-mix(in_srgb,rgb(var(--mw-accent))_40%,var(--mw-hairline))] sm:inline-flex">
          <AppSwitchBtn id="mewtube" active={theme.id === "mewtube"} />
          <AppSwitchBtn id="mewtwitch" active={theme.id === "mewtwitch"} />
        </div>

        {/* notifications — decorative until wired */}
        <button
          type="button"
          aria-label={t("notifications")}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-mw-md border border-transparent text-mw-fg-mute transition-colors hover:border-mw-line-strong hover:bg-mw-800 hover:text-mw-fg"
        >
          <I.bell />
        </button>
        {/* upload / go-live CTA — deferred (§13) */}
        <button
          type="button"
          aria-disabled="true"
          title={t("comingSoon")}
          className="hidden h-10 cursor-default items-center gap-1.5 rounded-mw-md px-3 text-xs font-semibold text-mw-accent-on opacity-90 md:inline-flex bg-[linear-gradient(135deg,rgb(var(--mw-accent)),var(--mw-accent-dark))]"
        >
          {theme.id === "mewtube" ? <I.plus size={16} /> : <I.live size={16} />}
          {theme.id === "mewtube" ? t("upload") : t("goLive")}
        </button>
      </div>
    </header>
  )
}

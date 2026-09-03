"use client"

import * as React from "react"
import { MewScreenLink } from "../nav"
import { useToolT, useLocale, MEWGENICS_NS } from "../i18n"
import { Icon } from "@boffmedia/ui"
import { MewData } from "../mew-store"
import { MEW_CATS, mewCatKey } from "../mew-util"
import { MEW_SOUND_ENABLED } from "./useMewSounds"
import type { MewCodexModel } from "./useMewCodex"

// Presentational chrome strips driven by the codex model: brand/actions bar, the
// category tabs, and the visited-entity trail.

export function MewTopBar({ codex }: { codex: MewCodexModel }) {
  const t = useToolT(MEWGENICS_NS)
  const locale = useLocale()
  const { ready, total, randomPick, cursorEnabled, soundEnabled, setCursorEnabled, setSoundEnabled, playSound } = codex
  const [wobble, setWobble] = React.useState(false)

  const handleRandomClick = () => {
    setWobble(true)
    playSound("select")
    randomPick()
    setTimeout(() => setWobble(false), 300)
  }

  return (
    <>
      <div className="flex min-w-0 items-center gap-[0.8125rem]">
        <span className="grid h-[2.625rem] w-[2.625rem] flex-none place-items-center border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [border-radius:55%_45%_50%_50%/50%_55%_45%_50%] [box-shadow:0_4px_0_var(--mwp-shadow-md)] [transform:rotate(-5deg)]">
          <Icon name="paw" size={22} />
        </span>
        <div className="flex min-w-0 flex-col gap-[3px]">
          <div className="text-[1.5625rem]/[0.9] tracking-[0.02em] text-[color:var(--mwp-cream)] [font-family:var(--mwf-disp)] [text-shadow:2.5px_2.5px_0_var(--mwp-red-deep)]">
            {t("codex")} <span className="not-italic text-[color:var(--mwp-pink)]">Mewgenics</span>
          </div>
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.75rem]/[1.2] font-medium text-[color:var(--mwp-cream-dim)]">
            {ready ? t("chrome.entries", { total: total.toLocaleString(locale), lang: locale === "en" ? "EN" : "ES" }) : t("chrome.entriesLoading")}
          </div>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCursorEnabled(!cursorEnabled)}
          title={t("chrome.cursorToggleTitle")}
          aria-label={t("chrome.cursorToggleTitle")}
          aria-pressed={cursorEnabled}
          className={`grid h-[2.5rem] w-[2.5rem] place-items-center border-2 border-solid [border-radius:var(--wob-sm)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0 active:translate-y-0.5 ${cursorEnabled ? "border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [box-shadow:0_3px_0_var(--mwp-shadow-sm)]" : "border-dashed border-[color:var(--mwp-nline)] bg-transparent text-[color:var(--mwp-cream-dim)] hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-paper)] hover:text-[color:var(--mwp-ink)] active:[box-shadow:0_1px_0_var(--mwp-shadow-xs)]"}`}
        >
          <Icon name="search" size={16} />
        </button>
        {MEW_SOUND_ENABLED && (
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={t("chrome.soundToggleTitle")}
            aria-label={t("chrome.soundToggleTitle")}
            aria-pressed={soundEnabled}
            className={`grid h-[2.5rem] w-[2.5rem] place-items-center border-2 border-solid [border-radius:var(--wob-sm)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0 active:translate-y-0.5 ${soundEnabled ? "border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [box-shadow:0_3px_0_var(--mwp-shadow-sm)]" : "border-dashed border-[color:var(--mwp-nline)] bg-transparent text-[color:var(--mwp-cream-dim)] hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-paper)] hover:text-[color:var(--mwp-ink)] active:[box-shadow:0_1px_0_var(--mwp-shadow-xs)]"}`}
          >
            <Icon name="volume" size={16} />
          </button>
        )}
        {/* Through the nav seam: a route change on the web, a screen swap
            inside the same mounted tool in the launcher. */}
        <MewScreenLink
          screen="builder"
          title={t("chrome.catBuilderTitle")}
          className="inline-flex items-center gap-[0.4375rem] border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-3.5 pb-1.5 pt-[0.5625rem] text-[0.875rem]/none tracking-[0.03em] text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)] [border-radius:var(--wob-sm)] [box-shadow:0_4px_0_var(--mwp-shadow-md)] [transform:rotate(-1.5deg)] transition-all hover:[transform:rotate(1deg)_translateY(-1px)] active:translate-y-0.5 active:[box-shadow:0_2px_0_var(--mwp-shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0 [&_svg]:text-[color:var(--mwp-pink)]"
        >
          <Icon name="paw" size={16} />
          <span className="max-[760px]:hidden">{t("chrome.catBuilder")}</span>
        </MewScreenLink>
        <button
          type="button"
          onClick={handleRandomClick}
          disabled={!ready}
          title={t("chrome.randomTitle")}
          aria-label={t("chrome.randomTitle")}
          className={`inline-flex items-center gap-[0.4375rem] border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-3.5 pb-1.5 pt-[0.5625rem] text-[0.875rem]/none tracking-[0.03em] text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)] [border-radius:var(--wob-sm)] [box-shadow:0_4px_0_var(--mwp-shadow-md)] [transform:rotate(1deg)] transition-all hover:[transform:rotate(-2deg)_translateY(-1px)] active:translate-y-0.5 active:[box-shadow:0_2px_0_var(--mwp-shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0 disabled:opacity-45 [&_svg]:text-[color:var(--mwp-red)] ${wobble ? "[animation:mew-wobble-pop_300ms_ease-out]" : ""}`}
        >
          <Icon name="sparkles" size={16} />
          <span className="max-[760px]:hidden">{t("chrome.random")}</span>
        </button>
      </div>
    </>
  )
}

export function MewCatTabs({ codex }: { codex: MewCodexModel }) {
  const t = useToolT(MEWGENICS_NS)
  const { cat, ready, abilitiesLoading, pickCat, playSound } = codex
  const tablistRef = React.useRef<HTMLDivElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const tabs = Array.from(tablistRef.current?.querySelectorAll('[role="tab"]') || []) as HTMLButtonElement[]
    const activeIdx = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true")
    let targetIdx = -1

    if (e.key === "ArrowLeft") { targetIdx = activeIdx > 0 ? activeIdx - 1 : tabs.length - 1; e.preventDefault() }
    else if (e.key === "ArrowRight") { targetIdx = activeIdx < tabs.length - 1 ? activeIdx + 1 : 0; e.preventDefault() }
    else if (e.key === "Home") { targetIdx = 0; e.preventDefault() }
    else if (e.key === "End") { targetIdx = tabs.length - 1; e.preventDefault() }

    if (targetIdx >= 0 && tabs[targetIdx]) {
      const targetTab = tabs[targetIdx]
      const catKey = targetTab.getAttribute("data-cat-key")
      if (catKey) {
        playSound("tab")
        pickCat(catKey)
      }
      setTimeout(() => targetTab.focus(), 0)
    }
  }

  return (
    <div
      ref={tablistRef}
      className="-my-2 flex flex-1 items-end gap-2 overflow-x-auto py-2 [scrollbar-width:thin]"
      role="tablist"
      aria-label={t("chrome.tabsAriaLabel")}
      onKeyDown={handleKeyDown}
    >
      {MEW_CATS.map((c, i) => {
        const on = c.key === cat
        const n = c.remote && abilitiesLoading && !(MewData.data[c.key] || []).length ? "…" : (MewData.data[c.key] || []).length
        return (
          <button
            key={c.key}
            type="button"
            role="tab"
            id={`mew-tab-${c.key}`}
            aria-selected={on}
            aria-controls={`mew-panel-${c.key}`}
            tabIndex={on ? 0 : -1}
            data-cat-key={c.key}
            style={{ "--h": c.hue } as React.CSSProperties}
            onClick={() => {
              playSound("tab")
              pickCat(c.key)
            }}
            className={
              "flex flex-none items-center gap-[0.4375rem] border-2 border-solid px-3 pb-1.5 pt-[0.5625rem] text-[0.8125rem]/none tracking-[0.04em] [font-family:var(--mwf-disp)] [border-radius:var(--wob-sm)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0 " +
              (i % 2 ? "[transform:rotate(0.8deg)]" : "[transform:rotate(-0.8deg)]") + " " +
              (on
                ? "border-[color:var(--mwp-ink)] bg-[hsl(var(--h)_55%_80%)] text-[color:var(--mwp-ink)] [box-shadow:var(--mwp-hard)] [transform:rotate(-1deg)_scale(1.05)] active:translate-y-0.5 active:[box-shadow:0_2px_0_var(--mwp-shadow-sm)] [&_svg]:text-[hsl(var(--h)_70%_26%)]"
                : "border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-3)] text-[color:var(--mwp-cream-dim)] hover:border-[hsl(var(--h)_40%_48%)] hover:text-[color:var(--mwp-cream)] active:translate-y-0.5 active:[box-shadow:0_1px_0_var(--mwp-shadow-xs)] [&_svg]:text-[hsl(var(--h)_60%_62%)]")
            }
          >
            <Icon name={c.icon} size={15} />
            <span>{t(mewCatKey(c.key, "label"))}</span>
            {ready && <span className={"font-mono text-[var(--mwp-fs-tiny)]/none [border-radius:8px_10px_9px_11px] px-[0.3125rem] py-0.5 " + (on ? "bg-[color:var(--mwp-highlight-light)] text-[color:var(--mwp-ink)]" : "bg-[var(--mwp-shadow-xs)] text-inherit")}>{n}</span>}
          </button>
        )
      })}
    </div>
  )
}

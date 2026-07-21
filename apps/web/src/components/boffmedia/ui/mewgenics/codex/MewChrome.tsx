"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Icon } from "@/components/boffmedia/primitives"
import { MewData } from "../mew-store"
import { MEW, MEW_CATS } from "../mew-util"
import type { MewCodexModel } from "./useMewCodex"

// Presentational chrome strips driven by the codex model: brand/actions bar, the
// category tabs, and the visited-entity trail.

export function MewTopBar({ codex }: { codex: MewCodexModel }) {
  const t = useTranslations("mewgenics")
  const { ready, total, catDef, randomPick, setRosterOpen } = codex
  return (
    <div className="relative z-[2] flex min-h-[64px] flex-none flex-wrap items-center gap-4 border-b-2 border-solid border-[color:var(--mwp-nline)] px-[clamp(16px,2.4vw,36px)] pb-2.5 pt-3">
      <div className="flex min-w-0 items-center gap-[13px]">
        <span className="grid h-[42px] w-[42px] flex-none place-items-center border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [border-radius:55%_45%_50%_50%/50%_55%_45%_50%] [box-shadow:var(--mwp-hard)] [transform:rotate(-5deg)]">
          <Icon name="paw" size={22} />
        </span>
        <div className="flex min-w-0 flex-col gap-[3px]">
          <div className="text-[25px]/[0.9] tracking-[0.02em] text-[color:var(--mwp-cream)] [font-family:var(--mwf-disp)] [text-shadow:2.5px_2.5px_0_var(--mwp-red-deep)]">
            {t("codex")} <span className="not-italic text-[color:var(--mwp-pink)]">Mewgenics</span>
          </div>
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px]/[1.2] font-medium text-[color:var(--mwp-cream-dim)]">
            {ready ? t("chrome.entries", { total: total.toLocaleString("es"), lang: MewData.lang === "es" ? "ES" : "EN" }) : t("chrome.entriesLoading")}
          </div>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={randomPick}
          disabled={!ready}
          title={t("chrome.randomTitle")}
          className="inline-flex items-center gap-[7px] border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-3.5 pb-1.5 pt-[9px] text-[14px]/none tracking-[0.03em] text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)] [border-radius:var(--wob-sm)] [box-shadow:var(--mwp-hard)] [transform:rotate(1deg)] transition-transform hover:[transform:rotate(-2deg)_translateY(-1px)] disabled:opacity-45 [&_svg]:text-[color:var(--mwp-red)]"
        >
          <Icon name="sparkles" size={16} />
          <span className="max-[760px]:hidden">{t("chrome.random")}</span>
        </button>
        <button
          type="button"
          onClick={() => setRosterOpen((v) => !v)}
          className="hidden items-center gap-[7px] border-2 border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-3)] px-3 pb-1.5 pt-[9px] text-[13px]/none tracking-[0.03em] text-[color:var(--mwp-cream)] [font-family:var(--mwf-disp)] [border-radius:var(--wob-sm)] max-[760px]:inline-flex"
        >
          <Icon name="list" size={16} />
          {catDef.label}
        </button>
      </div>
    </div>
  )
}

export function MewCatTabs({ codex }: { codex: MewCodexModel }) {
  const t = useTranslations("mewgenics")
  const { cat, ready, abilitiesLoading, pickCat } = codex
  return (
    <div className="relative z-[2] flex flex-none items-end gap-2 overflow-x-auto border-b-2 border-solid border-[color:var(--mwp-nline)] px-[clamp(16px,2.4vw,36px)] pb-[11px] pt-3 [scrollbar-width:thin]" role="tablist" aria-label={t("chrome.tabsAriaLabel")}>
      {MEW_CATS.map((c, i) => {
        const on = c.key === cat
        const n = c.remote && abilitiesLoading && !(MewData.data[c.key] || []).length ? "…" : (MewData.data[c.key] || []).length
        return (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={on}
            style={{ "--h": c.hue } as React.CSSProperties}
            onClick={() => pickCat(c.key)}
            className={
              "flex flex-none items-center gap-[7px] border-2 border-solid px-3 pb-1.5 pt-[9px] text-[13px]/none tracking-[0.04em] [font-family:var(--mwf-disp)] [border-radius:var(--wob-sm)] transition-all " +
              (i % 2 ? "[transform:rotate(0.8deg)]" : "[transform:rotate(-0.8deg)]") + " " +
              (on
                ? "border-[color:var(--mwp-ink)] bg-[hsl(var(--h)_55%_80%)] text-[color:var(--mwp-ink)] [box-shadow:var(--mwp-hard)] [transform:rotate(-1deg)_scale(1.05)] [&_svg]:text-[hsl(var(--h)_70%_26%)]"
                : "border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-3)] text-[color:var(--mwp-cream-dim)] hover:border-[hsl(var(--h)_40%_48%)] hover:text-[color:var(--mwp-cream)] [&_svg]:text-[hsl(var(--h)_60%_62%)]")
            }
          >
            <Icon name={c.icon} size={15} />
            <span>{c.label}</span>
            {ready && <span className={"font-mono text-[10px]/none [border-radius:8px_10px_9px_11px] px-[5px] py-0.5 " + (on ? "bg-[rgba(255,255,255,0.5)] text-[color:var(--mwp-ink)]" : "bg-[rgba(0,0,0,0.28)] text-inherit")}>{n}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function MewTrail({ codex }: { codex: MewCodexModel }) {
  const t = useTranslations("mewgenics")
  const { ready, trail, cat, selId, onNav } = codex
  if (!ready || trail.length <= 1) return null
  return (
    <div className="relative z-[2] flex flex-none items-center gap-2.5 overflow-x-auto border-b border-dashed border-[color:var(--mwp-nline)] px-[clamp(16px,2.4vw,36px)] py-[7px] [scrollbar-width:none]">
      <span className="inline-flex flex-none items-center gap-1.5 text-[11px]/none tracking-[0.08em] text-[color:var(--mwp-cream-dim)] [font-family:var(--mwf-disp)]"><Icon name="paw" size={12} />{t("chrome.trail")}</span>
      <div className="flex gap-1.5">
        {trail.map((t) => {
          const tc = MEW.catBy[t.cat]
          const on = t.cat === cat && t.id === selId
          return (
            <button key={t.key} type="button" onClick={() => onNav(t.cat, t.id)} title={tc ? tc.label : ""} className={"inline-flex flex-none items-center gap-1.5 border-[1.5px] border-dashed px-[9px] py-[5px] text-[11.5px]/none font-semibold [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)] transition-all " + (on ? "border-[color:var(--mwp-cream-dim)] text-[color:var(--mwp-cream)]" : "border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-paper)] hover:text-[color:var(--mwp-ink)]")}>
              <Icon name={tc ? tc.icon : "paw"} size={11} />{t.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { useMewNav } from "../nav"
import { useToolT, MEWGENICS_NS } from "../i18n"
import { Icon } from "@boffmedia/ui"
import { MEW, mewCatKey } from "../mew-util"
import { cxTitle } from "./codex-config"
import type { MewCodexModel } from "./useMewCodex"
import { MEW_DETAIL } from "./views"

/**
 * The detail screen: a return/pager bar carrying the visited trail, then the
 * category's fiche at full page width. Browse and detail are separate screens,
 * so the fiche is never squeezed next to a list.
 */
export function MewFiche({ codex }: { codex: MewCodexModel }) {
  const t = useToolT(MEWGENICS_NS)
  const { cat, catDef, selRec, trail, selId, filtered, prevRec, nextRec, back, pick, onNav, isFav, toggleFav, playSound } = codex
  const [copied, setCopied] = React.useState(false)
  const nav = useMewNav()

  React.useEffect(() => {
    if (selRec) {
      playSound("open")
    }
  }, [selRec, playSound])

  const copyLink = React.useCallback(async () => {
    // Built against the public site, not `window.location`: in the launcher
    // that is the shell's own `index.html`, so the old link pointed at a file
    // on the sharer's disk that nobody else could open.
    const url = nav.shareUrl("codex", nav.hash)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* fallback: link copy failed, but continue */ }
  }, [nav])

  if (!selRec) return null
  const Detail = MEW_DETAIL[cat]
  // Counter and pager now work over filtered (full set), not capped shown
  const idx = filtered.findIndex((r) => r.id === selId)

  const pager = (
    <div className="flex flex-none items-center gap-1.5">
      <button
        type="button"
        onClick={() => prevRec && pick(prevRec.id)}
        disabled={!prevRec}
        title={prevRec ? cxTitle(prevRec) : undefined}
        aria-label={t("fiche.prev")}
        className="grid h-[44px] w-[44px] place-items-center border-[1.5px] border-dashed border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] [border-radius:var(--wob-sm)] transition-all enabled:hover:border-[color:var(--mwp-ink)] enabled:hover:bg-[color:var(--mwp-paper)] enabled:hover:text-[color:var(--mwp-ink)] enabled:active:translate-y-0.5 enabled:active:border-[color:var(--mwp-nline)] enabled:focus-visible:outline-none enabled:focus-visible:ring-2 enabled:focus-visible:ring-[color:var(--mwp-red)] enabled:focus-visible:ring-offset-0 disabled:opacity-35"
      >
        <Icon name="back" size={16} />
      </button>
      <button
        type="button"
        onClick={() => nextRec && pick(nextRec.id)}
        disabled={!nextRec}
        title={nextRec ? cxTitle(nextRec) : undefined}
        aria-label={t("fiche.next")}
        className="grid h-[44px] w-[44px] place-items-center border-[1.5px] border-dashed border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] [border-radius:var(--wob-sm)] transition-all enabled:hover:border-[color:var(--mwp-ink)] enabled:hover:bg-[color:var(--mwp-paper)] enabled:hover:text-[color:var(--mwp-ink)] enabled:active:translate-y-0.5 enabled:active:border-[color:var(--mwp-nline)] enabled:focus-visible:outline-none enabled:focus-visible:ring-2 enabled:focus-visible:ring-[color:var(--mwp-red)] enabled:focus-visible:ring-offset-0 disabled:opacity-35"
      >
        <Icon name="arrow" size={16} />
      </button>
      <button
        type="button"
        onClick={copyLink}
        title={t("fiche.share")}
        aria-label={copied ? t("fiche.shareCopied") : t("fiche.share")}
        className="grid h-[44px] w-[44px] place-items-center border-[1.5px] border-dashed border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] [border-radius:var(--wob-sm)] transition-all hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-paper)] hover:text-[color:var(--mwp-ink)] active:translate-y-0.5 active:border-[color:var(--mwp-nline)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0"
      >
        <Icon name={copied ? "check" : "link"} size={16} />
      </button>
      <button
        type="button"
        onClick={() => toggleFav(selRec)}
        aria-pressed={isFav(selRec)}
        aria-label={isFav(selRec) ? t("fiche.favRemove") : t("fiche.favAdd")}
        className="grid h-[44px] w-[44px] place-items-center border-[1.5px] border-dashed border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] [border-radius:var(--wob-sm)] transition-all hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-paper)] hover:text-[color:var(--mwp-ink)] active:translate-y-0.5 active:border-[color:var(--mwp-nline)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0 aria-pressed:border-[color:var(--mwp-ink)] aria-pressed:bg-[color:var(--mwp-paper)] aria-pressed:text-[color:var(--mwp-red)]"
      >
        <Icon name="star" size={16} />
      </button>
    </div>
  )

  return (
    <div className="px-[var(--mew-gutter)] pb-16 pt-4 [animation:mew-fade-rise_160ms_ease-out]">
      <div className="sticky top-0 z-[10] bg-[color:var(--mwp-night-2)] -mx-[var(--mew-gutter)] px-[var(--mew-gutter)] pb-3 pt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-dashed border-[color:var(--mwp-nline)]">
        <button
          type="button"
          onClick={() => {
            playSound("close")
            back()
          }}
          className="inline-flex flex-none items-center gap-[7px] border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-3 pb-1.5 pt-[9px] text-[13px]/none tracking-[0.03em] text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)] [border-radius:var(--wob-sm)] [box-shadow:var(--mwp-hard)] transition-all hover:-translate-y-[1px] active:translate-y-0.5 active:[box-shadow:0_2px_0_var(--mwp-shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0"
        >
          <Icon name="back" size={15} />
          {t("fiche.back", { category: t(mewCatKey(catDef.key, "label")) })}
        </button>

        {/* visited trail with scroll affordance */}
        {trail.length > 1 && (
          <div className="flex min-w-0 flex-1 items-center gap-1.5 relative">
            <span className="flex-none text-[10px]/none uppercase tracking-[0.08em] text-[color:var(--mwp-cream-dim)] [font-family:var(--mwf-disp)] flex items-center gap-0.5">
              <Icon name="clock" size={11} className="opacity-75" />
              {t("fiche.trailLabel")}
            </span>
            <div className="flex-1 overflow-x-auto [scrollbar-width:thin] [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]">
              <div className="flex items-center gap-1.5">
                {trail.map((crumb) => {
                  const tc = MEW.catBy[crumb.cat]
                  const on = crumb.cat === cat && crumb.id === selId
                  return (
                    <button
                      key={crumb.key}
                      type="button"
                      onClick={() => onNav(crumb.cat, crumb.id)}
                      title={tc ? t(mewCatKey(tc.key, "label")) : ""}
                      className={"inline-flex flex-none items-center gap-1.5 border-[1.5px] border-dashed px-[9px] py-1.5 text-[11.5px]/none font-semibold min-h-[28px] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0 active:translate-y-0.5 " + (on ? "border-[color:var(--mwp-cream-dim)] text-[color:var(--mwp-cream)] active:[box-shadow:0_1px_0_rgba(0,0,0,0.2)]" : "border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-paper)] hover:text-[color:var(--mwp-ink)] active:[box-shadow:0_1px_0_rgba(0,0,0,0.15)]")}
                    >
                      <Icon name={tc ? tc.icon : "paw"} size={11} />
                      {crumb.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="ml-auto flex flex-none items-center gap-2.5">
          {idx >= 0 && (
            <span className="text-[11px]/none tracking-[0.06em] text-[color:var(--mwp-cream-dim)] [font-family:var(--mwf-disp)] max-[620px]:hidden">
              {t("fiche.position", { n: idx + 1, total: filtered.length })}
            </span>
          )}
          {pager}
        </div>
      </div>

      <main className="mt-4 min-w-0">
        {Detail ? <Detail key={cat + selRec.id} rec={selRec} onNav={onNav} /> : null}
      </main>
    </div>
  )
}

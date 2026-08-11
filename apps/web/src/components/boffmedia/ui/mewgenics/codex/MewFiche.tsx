"use client"

import { useTranslations } from "next-intl"
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
  const t = useTranslations("mewgenics")
  const { cat, catDef, selRec, trail, selId, shown, prevRec, nextRec, back, pick, onNav } = codex
  if (!selRec) return null
  const Detail = MEW_DETAIL[cat]
  // -1 when the entry sits past CX_CAP (a deep link into a long list): the pager
  // has nothing to step through, so the counter would read "0 de N".
  const idx = shown.findIndex((r) => r.id === selId)

  const pager = (
    <div className="flex flex-none items-center gap-1.5">
      <button
        type="button"
        onClick={() => prevRec && pick(prevRec.id)}
        disabled={!prevRec}
        title={prevRec ? cxTitle(prevRec) : undefined}
        aria-label={t("fiche.prev")}
        className="grid h-[34px] w-[34px] place-items-center border-[1.5px] border-dashed border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] [border-radius:var(--wob-sm)] transition-colors enabled:hover:border-[color:var(--mwp-ink)] enabled:hover:bg-[color:var(--mwp-paper)] enabled:hover:text-[color:var(--mwp-ink)] disabled:opacity-35"
      >
        <Icon name="back" size={16} />
      </button>
      <button
        type="button"
        onClick={() => nextRec && pick(nextRec.id)}
        disabled={!nextRec}
        title={nextRec ? cxTitle(nextRec) : undefined}
        aria-label={t("fiche.next")}
        className="grid h-[34px] w-[34px] place-items-center border-[1.5px] border-dashed border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] [border-radius:var(--wob-sm)] transition-colors enabled:hover:border-[color:var(--mwp-ink)] enabled:hover:bg-[color:var(--mwp-paper)] enabled:hover:text-[color:var(--mwp-ink)] disabled:opacity-35"
      >
        <Icon name="arrow" size={16} />
      </button>
    </div>
  )

  return (
    <div className="px-[clamp(16px,2.4vw,36px)] pb-16 pt-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-dashed border-[color:var(--mwp-nline)] pb-3">
        <button
          type="button"
          onClick={back}
          className="inline-flex flex-none items-center gap-[7px] border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-3 pb-1.5 pt-[9px] text-[13px]/none tracking-[0.03em] text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)] [border-radius:var(--wob-sm)] [box-shadow:var(--mwp-hard)] transition-transform hover:-translate-y-[1px]"
        >
          <Icon name="back" size={15} />
          {t("fiche.back", { category: t(mewCatKey(catDef.key, "label")) })}
        </button>

        {/* visited trail — lives with the fiche now, where cross-links happen */}
        {trail.length > 1 && (
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {trail.map((crumb) => {
              const tc = MEW.catBy[crumb.cat]
              const on = crumb.cat === cat && crumb.id === selId
              return (
                <button
                  key={crumb.key}
                  type="button"
                  onClick={() => onNav(crumb.cat, crumb.id)}
                  title={tc ? t(mewCatKey(tc.key, "label")) : ""}
                  className={"inline-flex flex-none items-center gap-1.5 border-[1.5px] border-dashed px-[9px] py-[5px] text-[11.5px]/none font-semibold [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)] transition-all " + (on ? "border-[color:var(--mwp-cream-dim)] text-[color:var(--mwp-cream)]" : "border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-paper)] hover:text-[color:var(--mwp-ink)]")}
                >
                  <Icon name={tc ? tc.icon : "paw"} size={11} />
                  {crumb.name}
                </button>
              )
            })}
          </div>
        )}

        <div className="ml-auto flex flex-none items-center gap-2.5">
          {idx >= 0 && (
            <span className="text-[11px]/none tracking-[0.06em] text-[color:var(--mwp-cream-dim)] [font-family:var(--mwf-disp)] max-[620px]:hidden">
              {t("fiche.position", { n: idx + 1, total: shown.length })}
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

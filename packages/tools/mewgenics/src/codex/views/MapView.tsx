"use client"

import * as React from "react"
import { useToolT, MEWGENICS_NS } from "../../i18n"
import { cn } from '@boffmedia/ui'
import { MewPanel, MewTile, MewMapBand } from "../../MewAtoms"
import { mewHuman, type MewRec } from "../../mew-util"
import { MewFlag, MewRef, MewRefList, type NavFn } from "../MewRefs"
import { mewMapArt } from "../../mew-art"
import { select } from "../../mew-store"
import { store } from "../../mew-store-state"
import { MewDetail, MewFacts, MewHero, MewSections, MewSubLabel, MewTag, rows, type ViewProps } from "./scaffold"

/** Compact character card for bosses/minibosses. */
function MewCharacterCard({ id, onNav }: { id: string; onNav: NavFn }) {
  // Map boss ids are loose aliases ("radicalrat"), so resolve the way MewRef
  // does — select.get alone misses them and used to render nothing at all.
  const char = select.char(id) || select.get("characters", id)

  // For unresolvable character ids, check boss_cutscenes for better display name
  if (!char) {
    const bossCutscenes = (store.data as any)?.boss_cutscenes || []
    const cutscene = bossCutscenes.find((b: any) => b._id === id || b.id === id)
    const displayName = cutscene ? (cutscene.name_en || cutscene.name_key || id) : mewHuman(id)
    return <MewRef id={id} label={displayName} cat="characters" icon="skull" onNav={onNav} />
  }
  return (
    <button
      type="button"
      onClick={() => onNav("characters", id)}
      className={cn(
        "relative flex flex-col items-center gap-1.5 border-2 border-solid p-2 text-center cursor-pointer",
        "border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper)] hover:bg-[color:var(--mwp-paper-3)]",
        "transition-all [border-radius:var(--wob-b)] [box-shadow:0_3px_0_var(--mwp-shadow-md)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0"
      )}
    >
      <MewTile cat="characters" rec={char as MewRec} size={60} frame="slot" />
      <span className="text-[0.71875rem]/[1.2] font-semibold max-w-[5.3125rem] text-[color:var(--mwp-ink)]">{char.name}</span>
    </button>
  )
}

export function MapView({ rec, onNav }: ViewProps) {
  const t = useToolT(MEWGENICS_NS)
  const [showMapLightbox, setShowMapLightbox] = React.useState(false)
  const pools = rec.enemies || {}
  const poolOrder = ["small", "medium", "large"]
  const poolLabel: Record<string, string> = { small: t("label.poolSmall"), medium: t("label.poolMedium"), large: t("label.poolLarge") }
  const hasBosses = (rec.bosses && rec.bosses.length) || (rec.minibosses && rec.minibosses.length)

  const mapArt = React.useMemo(() => {
    if (!rec.id) return null
    return mewMapArt(rec.id)
  }, [rec.id])

  return (
    <>
      <MewDetail id={rec.id}>
        {mapArt?.graphic && (
          <MewMapBand
            src={mapArt.graphic}
            alt={rec.name}
            onOpenLightbox={() => setShowMapLightbox(true)}
          />
        )}
        <MewHero
          cat="maps"
          rec={rec}
          badges={
            <>
              <MewFlag icon="layers">{t("label.mapBadge", { act: rec.act ?? "", chapter: rec.chapter ?? "" })}</MewFlag>
              {rec.tileset && <MewFlag icon="grid">{mewHuman(rec.tileset)}</MewFlag>}
            </>
          }
        />
        <MewSections>
        {hasBosses && (
          <MewPanel title={t("panel.bosses")} icon="skull">
            {rec.bosses && rec.bosses.length > 0 && (
              <div className="mb-3">
                <MewSubLabel>{t("label.bossLabel")}</MewSubLabel>
                <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(5rem,1fr))]">
                  {rec.bosses.map((id) => (
                    <MewCharacterCard key={id} id={id} onNav={onNav} />
                  ))}
                </div>
              </div>
            )}
            {rec.minibosses && rec.minibosses.length > 0 && (
              <div>
                <MewSubLabel>{t("label.minibosses")}</MewSubLabel>
                <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(5rem,1fr))]">
                  {rec.minibosses.map((id) => (
                    <MewCharacterCard key={id} id={id} onNav={onNav} />
                  ))}
                </div>
              </div>
            )}
          </MewPanel>
        )}
        {poolOrder.some((p) => (pools[p] || []).length) && (
          <MewPanel
            title={t("panel.enemyPools")}
            icon="paw"
            span="full"
          >
            {poolOrder.map((p) =>
              (pools[p] || []).length ? (
                <div key={p} className="mb-3 last:mb-0">
                  <MewSubLabel n={pools[p].length}>{poolLabel[p]}</MewSubLabel>
                  <MewRefList ids={pools[p]} cat="characters" icon="paw" onNav={onNav} />
                </div>
              ) : null,
            )}
          </MewPanel>
        )}
        <MewPanel title={t("panel.data")} icon="database">
          <MewFacts
            rows={rows([
              { label: t("label.act"), value: rec.act },
              { label: t("label.chapter"), value: rec.chapter },
              rec.tileset && { label: t("label.tileset"), value: mewHuman(rec.tileset) },
              rec.music && { label: t("label.music"), value: mewHuman(rec.music) },
            ])}
          />
        </MewPanel>
        {rec.items && Object.keys(rec.items).length > 0 && (
          <MewPanel title={t("panel.itemPools")} icon="sword">
            <div className="flex flex-wrap gap-1.5">
              {Object.values(rec.items).flat().map((v, i) => <MewTag key={i}>{mewHuman(String(v))}</MewTag>)}
            </div>
          </MewPanel>
        )}
      </MewSections>
    </MewDetail>

    {/* Map Lightbox */}
    {showMapLightbox && mapArt?.graphic && (
      <div
        className="fixed inset-0 z-[999] flex items-center justify-center bg-[var(--mwp-scrim)] p-4 backdrop-blur-sm [animation:mew-fade-rise_200ms_ease-out] [animation-play-state:var(--motion-safe,running)]"
        onClick={() => setShowMapLightbox(false)}
        role="dialog"
        aria-modal="true"
        aria-label={rec.name}
        onKeyDown={(e) => {
          if (e.key === "Escape") setShowMapLightbox(false)
        }}
      >
        <div
          className="flex flex-col items-center gap-3 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={mapArt.graphic}
            alt={rec.name}
            className="max-h-[70vh] max-w-[90vw] [image-rendering:pixelated] block object-contain"
          />
          <div className="text-center">
            <div className="text-[clamp(1rem,2vw,1.75rem)] font-bold text-white [font-family:var(--mwf-disp)] [text-wrap:balance]">
              {rec.name}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMapLightbox(false)}
            className="absolute top-2 right-2 grid h-8 w-8 place-items-center border-[1.5px] border-solid border-white/50 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-0"
            aria-label={t("common.closeLightbox") || "Close"}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    )}
    </>
  )
}

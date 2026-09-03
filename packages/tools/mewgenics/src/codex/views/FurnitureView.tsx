"use client"

import * as React from "react"
import { useToolT, MEWGENICS_NS } from "../../i18n"
import { MewPanel, MewNote, MewTile } from "../../MewAtoms"
import { MEW_STATMOD, mewHuman, mewStatModLabel } from "../../mew-util"
import { mewFurnitureArt } from "../../mew-art"
import { select, MewData } from "../../mew-store"
import { MewDesc, MewDetail, MewFactGrid, MewHero, MewHeroMedia, MewSections, MewSubLabel, num, rows, type ViewProps } from "./scaffold"

export function FurnitureView({ rec, onNav }: ViewProps) {
  const t = useToolT(MEWGENICS_NS)
  const statRows = Object.entries(rec.stats || {})
    .map(([k, v]) => {
      const furnitureLabel = ["comfort", "appeal", "stimulation", "evolution", "health"].includes(k) ? t(`label.${k}`) : mewStatModLabel(t, k)
      return { label: furnitureLabel, value: v }
    })

  const flagNotes: string[] = []
  if (rec.special) flagNotes.push(t("label.special"))
  if (rec.removed) flagNotes.push(t("label.removed"))

  // Set family: the game's own `set` field when present (220 records), else
  // the id-prefix heuristic ("set_80s_*" → "set_80s") for unlabeled pieces.
  const setFamily = React.useMemo(() => {
    if (typeof rec.set === "string" && rec.set) return rec.set
    if (!rec.id) return null
    const match = rec.id.match(/^(set_[a-z0-9]+)_/)
    return match ? match[1] : null
  }, [rec.set, rec.id])

  // Find sibling furniture in the same set family
  const siblings = React.useMemo(() => {
    if (!setFamily) return []
    const all = MewData.data.furniture || []
    return all.filter((f) => f.id !== rec.id && (f.set === setFamily || f.id?.startsWith(setFamily + "_")))
  }, [setFamily, rec.id])

  const furnitureArt = React.useMemo(() => mewFurnitureArt(rec.id), [rec.id])

  return (
    <MewDetail id={rec.id}>
      <MewHero cat="furniture" rec={rec} media={furnitureArt ? <MewHeroMedia src={furnitureArt} alt={rec.name} max={200} /> : undefined} />
      <MewDesc>{rec.desc}</MewDesc>
      <MewSections>
        {statRows.length > 0 && (
          <MewPanel title={t("panel.stats")} icon="home">
            <MewFactGrid rows={statRows} />
          </MewPanel>
        )}
        {flagNotes.length > 0 && (
          <MewPanel title={t("label.properties")} icon="bookmark">
            <div className="space-y-1">
              {flagNotes.map((n) => (
                <div key={n} className="text-[color:var(--mwp-ink)] text-sm">
                  {n}
                </div>
              ))}
            </div>
          </MewPanel>
        )}
        {statRows.length === 0 && flagNotes.length === 0 && (
          <MewPanel>
            <MewNote>{t("label.noData")}</MewNote>
          </MewPanel>
        )}
        {siblings.length > 0 && (
          <MewPanel title={t("label.setFamily")} icon="layers" count={siblings.length} span="full">
            <MewSubLabel n={siblings.length}>{mewHuman(setFamily!)}</MewSubLabel>
            <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(5.5rem,1fr))]">
              {siblings.map((sib) => (
                <button
                  key={sib.id}
                  type="button"
                  onClick={() => onNav("furniture", sib.id)}
                  className="text-left p-0 border-0 bg-transparent hover:opacity-80 transition-opacity cursor-pointer [border-radius:var(--wob-sm)]"
                  title={sib.name}
                >
                  <div className="[border-radius:var(--wob-sm)] border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] overflow-hidden">
                    {mewFurnitureArt(sib.id) && (
                      <img
                        src={mewFurnitureArt(sib.id)!}
                        alt={sib.name}
                        className="w-full h-[5.5rem] object-contain p-1.5"
                      />
                    )}
                  </div>
                  <div className="mt-1 text-[0.65625rem] text-[color:var(--mwp-ink)] font-semibold text-center line-clamp-2">
                    {sib.name}
                  </div>
                </button>
              ))}
            </div>
          </MewPanel>
        )}
      </MewSections>
    </MewDetail>
  )
}

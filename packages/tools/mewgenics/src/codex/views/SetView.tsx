"use client"

import * as React from "react"
import { useToolT, MEWGENICS_NS } from "../../i18n"
import { cn } from '@boffmedia/ui'
import { MewPanel, MewNote, MewTile, MewKind, MewRarity } from "../../MewAtoms"
import { select, MewData } from "../../mew-store"
import { mewHuman, mewStatModLabel, type MewRec } from "../../mew-util"
import { MewEffects } from "../MewRefs"
import { MewDesc, MewDetail, MewFacts, MewHero, MewSections, rows, type ViewProps } from "./scaffold"

/** Face-up set piece tile with icon, name, kind, and rarity. */
function MewSetPiece({ item, onNav }: { item: MewRec; onNav: (cat: string, id: string) => void }) {
  const t = useToolT(MEWGENICS_NS)
  return (
    <button
      type="button"
      onClick={() => onNav("items", item.id)}
      className={cn(
        "relative flex flex-col items-center gap-1.5 border-2 border-solid border-[color:var(--h-ink)] p-2 text-center",
        "bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] cursor-pointer",
        "hover:bg-[color:var(--mwp-paper-3)] hover:shadow-md transition-all [border-radius:var(--wob-b)]",
        "[box-shadow:0_3px_0_var(--mwp-shadow-md)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0"
      )}
      style={{ "--h": select.find(item.id)?.rec ? "44" : "230" } as React.CSSProperties}
    >
      <MewTile cat="items" rec={item} size={72} frame="slot" />
      <span className="text-[12px]/[1.2] font-semibold max-w-[90px] text-[color:var(--mwp-ink)]">{item.name}</span>
      <div className="flex gap-1 flex-wrap justify-center">
        {item.kind && <MewKind kind={item.kind} />}
        {item.rarity && <MewRarity rarity={item.rarity} />}
      </div>
    </button>
  )
}

export function SetView({ rec, onNav }: ViewProps) {
  const t = useToolT(MEWGENICS_NS)
  const setData = React.useMemo(() => select.set(rec.id), [rec.id])
  const members = setData.members || []

  const statModRows = rec.statMods
    ? Object.entries(rec.statMods as Record<string, unknown>).map(([k, v]) => ({ label: mewStatModLabel(t, k), value: (typeof v === "number" && v > 0 ? "+" : "") + v }))
    : []
  const passN = rec.passives ? Object.keys(rec.passives as Record<string, unknown>).length : 0
  const piecesLabel = rec.pieces_required != null ? t("pop.setPieces", { n: rec.pieces_required }) : null

  return (
    <MewDetail id={rec.id}>
      <MewHero cat="sets" rec={rec} />
      <MewDesc>{rec.desc}</MewDesc>
      <MewSections>
        {members.length > 0 && (
          <MewPanel title={t("panel.setMembers")} icon="layers" count={members.length} span="full">
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(100px,1fr))]">
              {members.map((member) => {
                const item = select.get("items", member.id)
                return item ? <MewSetPiece key={member.id} item={item} onNav={onNav} /> : null
              })}
            </div>
          </MewPanel>
        )}
        {statModRows.length > 0 && (
          <MewPanel title={piecesLabel || t("panel.statMods")} icon={piecesLabel ? "shield" : "sliders"} aside={piecesLabel || undefined}>
            <MewFacts rows={statModRows} />
          </MewPanel>
        )}
        {passN > 0 && rec.passives && (
          <MewPanel title={t("panel.passivesGranted")} icon="shield" count={passN}>
            {statModRows.length === 0 && piecesLabel && <div className="text-[13px] font-semibold mb-2">{piecesLabel}</div>}
            <MewEffects map={rec.passives as Record<string, unknown>} onNav={onNav} />
          </MewPanel>
        )}
        {members.length === 0 && statModRows.length === 0 && passN === 0 && !rec.desc && (
          <MewPanel>
            <MewNote>{t("label.noData")}</MewNote>
          </MewPanel>
        )}
      </MewSections>
    </MewDetail>
  )
}

"use client"

import * as React from "react"
import { useToolT, MEWGENICS_NS } from "../../i18n"
import { MewPanel, MewNote } from "../../MewAtoms"
import { mewBodyPartLabel, mewStatModLabel } from "../../mew-util"
import { mewTokenSrc } from "../../mew-art"
import { MewEffects } from "../MewRefs"
import { MewDesc, MewDetail, MewFacts, MewHero, MewSections, rows, type ViewProps } from "./scaffold"

// Placeholder component for mutation art (cat part slot) - will be filled in by the cat compositor
function MewMutationArt({ bodyPart }: { bodyPart?: string }) {
  const t = useToolT(MEWGENICS_NS)
  if (!bodyPart) return null
  const label = mewBodyPartLabel(t, bodyPart)
  const glyph = mewTokenSrc(bodyPart)
  return (
    <div className="flex items-center justify-center gap-2 p-4 [border-radius:var(--wob-a)] border-2 border-dashed border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)]">
      {glyph && <img src={glyph} alt={label} className="w-6 h-6" />}
      <span className="text-[0.75rem] font-semibold text-[color:var(--mwp-ink-soft)]">{label}</span>
    </div>
  )
}

export function MutationView({ rec, onNav }: ViewProps) {
  const t = useToolT(MEWGENICS_NS)
  const statModRows = rec.statMods
    ? Object.entries(rec.statMods as Record<string, unknown>).map(([k, v]) => ({ label: mewStatModLabel(t, k), value: (typeof v === "number" && v > 0 ? "+" : "") + v }))
    : []
  const passN = rec.passives ? Object.keys(rec.passives as Record<string, unknown>).length : 0

  // Synthesize display name if mutation name is just a number
  const displayName = React.useMemo(() => {
    if (!rec.name || /^\d+$/.test(rec.name)) {
      const bodyPart = rec.body_part ? mewBodyPartLabel(t, String(rec.body_part)) : "Unknown"
      const num = rec.num || "?"
      return `${bodyPart} #${num}`
    }
    return rec.name
  }, [rec.name, rec.body_part, rec.num, t])

  return (
    <MewDetail id={rec.id}>
      <MewHero cat="mutations" rec={rec} title={displayName} />
      <MewDesc>{rec.desc}</MewDesc>
      <MewSections>
        {rec.body_part && (
          <MewPanel title={t("label.bodyPart")} icon="sparkles">
            <MewMutationArt bodyPart={String(rec.body_part)} />
            <div className="mt-3 pt-3 border-t border-dashed border-[color:var(--mwp-ink-line)]">
              <MewFacts rows={[
                { label: t("label.bodyPart"), value: mewBodyPartLabel(t, String(rec.body_part)) },
                ...(rec.num ? [{ label: t("label.mutationNumber"), value: String(rec.num) }] : []),
              ]} />
            </div>
          </MewPanel>
        )}
        {statModRows.length > 0 && (
          <MewPanel title={t("panel.statMods")} icon="sliders">
            <MewFacts rows={statModRows} />
          </MewPanel>
        )}
        {passN > 0 && rec.passives && (
          <MewPanel title={t("panel.passivesGranted")} icon="shield" count={passN}>
            <MewEffects map={rec.passives as Record<string, unknown>} onNav={onNav} />
          </MewPanel>
        )}
        {statModRows.length === 0 && passN === 0 && !rec.desc && (
          <MewPanel>
            <MewNote>{t("label.noData")}</MewNote>
          </MewPanel>
        )}
      </MewSections>
    </MewDetail>
  )
}

"use client"

import * as React from "react"
import { useToolT, MEWGENICS_NS } from "../../i18n"
import { Icon } from "@boffmedia/ui"
import { MewPanel } from "../../MewAtoms"
import { MewCat, mewStoryCatAppearance } from "../../cat"
import { mewClassColor, mewHuman } from "../../mew-util"
import { MewDesc, MewDetail, MewFactGrid, MewHero, MewSections, rows, type ViewProps } from "./scaffold"

const PART_ROWS: { key: string; label: string }[] = [
  { key: "body", label: "builder.parts.body" },
  { key: "head", label: "builder.parts.head" },
  { key: "texture", label: "builder.parts.texture" },
  { key: "mouth", label: "builder.parts.mouth" },
  { key: "tail", label: "builder.parts.tail" },
  { key: "claws", label: "builder.parts.claws" },
]

/**
 * Story cats carry no stats and almost never a description — what they DO have
 * is a complete appearance line, so the compositor is the entry's content
 * rather than a decoration. Every one of the 210 renders.
 */
export function StoryCatView({ rec }: ViewProps) {
  const t = useToolT(MEWGENICS_NS)
  const { parts, palette } = React.useMemo(() => mewStoryCatAppearance(rec as Record<string, unknown>), [rec])
  const cls = typeof rec.class_anis === "string" ? rec.class_anis : undefined
  const clsColor = cls ? null : mewClassColor(palette)

  const partRows = React.useMemo(
    () => rows(PART_ROWS.map((p) => (typeof rec[p.key] === "number" ? { label: t(p.label), value: String(rec[p.key]) } : null))),
    [rec, t],
  )
  const traitRows = React.useMemo(
    () =>
      rows([
        { label: t("builder.palette"), value: String(palette) },
        typeof rec.voice === "string" && { label: t("storyCat.voice"), value: mewHuman(rec.voice) },
        typeof rec.pitch === "number" && { label: t("storyCat.pitch"), value: rec.pitch.toFixed(2) },
        cls && { label: t("label.class"), value: mewHuman(cls) },
      ]),
    [rec, palette, cls, t],
  )

  return (
    <MewDetail id={rec.id}>
      <MewHero
        cat="story_cats"
        rec={rec}
        media={
          <span className="inline-block border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper-2)] p-1.5 [border-radius:var(--wob-sm)] [box-shadow:0_3px_0_var(--mwp-shadow-md)]">
            <MewCat parts={parts} palette={palette} pose={{ eyes: "open", mouth: "normal" }} size={220} />
          </span>
        }
      />
      <MewDesc>{rec.desc}</MewDesc>
      <MewSections>
        <MewPanel title={t("storyCat.appearance")} icon="paw">
          <div className="flex flex-col gap-3">
            <MewFactGrid rows={traitRows} />
            <a
              href={`/otros/mewgenics/builder?preset=${encodeURIComponent(rec.id)}`}
              className="inline-flex w-fit items-center gap-1.5 border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper-2)] px-3 pb-1.5 pt-[7px] text-[12px]/none font-bold text-[color:var(--mwp-ink)] no-underline [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)] [box-shadow:0_2px_0_var(--mwp-shadow-sm)] transition-all hover:-translate-y-px active:translate-y-0.5 active:[box-shadow:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0"
              style={clsColor ? { borderColor: clsColor.readable } : undefined}
            >
              <Icon name="edit" size={12} />
              {t("storyCat.openInBuilder")}
            </a>
          </div>
        </MewPanel>
        {partRows.length > 0 && (
          <MewPanel title={t("builder.partsTitle")} icon="layers" count={partRows.length}>
            <MewFactGrid rows={partRows} />
          </MewPanel>
        )}
      </MewSections>
    </MewDetail>
  )
}

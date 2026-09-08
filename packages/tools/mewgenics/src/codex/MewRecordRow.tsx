"use client"

import * as React from "react"
import { Icon } from "@boffmedia/ui"
import { useToolT, MEWGENICS_NS } from "../i18n"
import { MewTile } from "../MewAtoms"
import { mewClip, mewHueFor, mewRarityAccent, type MewRec } from "../mew-util"
import { MewRecordMeta } from "./MewRecordMeta"

export type MewListDensity = "compact" | "comfortable"

/** A dense, keyboard-friendly reference row for the Codex list mode. */
export function MewRecordRow({
  cat,
  rec,
  density,
  favorite = false,
  onOpen,
}: {
  cat: string
  rec: MewRec
  density: MewListDensity
  favorite?: boolean
  onOpen: () => void
}) {
  const t = useToolT(MEWGENICS_NS)
  const summary = mewClip(rec.desc || rec.tip || rec.prompt, 170)
  const rarityAccent = cat === "items" ? mewRarityAccent(rec.rarity, rec.cursed) : undefined

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("roster.openEntry", { name: rec.name })}
      data-cxid={rec.id}
      data-density={density}
      style={{
        "--h": mewHueFor(cat, rec),
        ...(rarityAccent ? { "--mew-card-accent": rarityAccent } : {}),
      } as React.CSSProperties}
      className="mew-reference-row mew-paper"
    >
      <span className="mew-reference-row__art" aria-hidden>
        <MewTile cat={cat} rec={rec} size={density === "compact" ? 40 : 48} frame="slot" />
      </span>
      <span className="mew-reference-row__main">
        <span className="mew-reference-row__title-line">
          <span className="mew-reference-row__name">{rec.name}</span>
          {favorite && (
            <span className="mew-reference-row__favorite" title={t("roster.favorite")} aria-label={t("roster.favorite")}>
              <Icon name="star" size={12} aria-hidden />
            </span>
          )}
        </span>
        {summary && <span className="mew-reference-row__summary">{summary}</span>}
        <span className="mew-reference-row__meta">
          <MewRecordMeta cat={cat} rec={rec} />
        </span>
      </span>
      <span className="mew-reference-row__aside">
        <span className="mew-reference-row__id" title={rec.id}>{t("label.id")}: {rec.id}</span>
        <Icon name="chevronRight" size={16} aria-hidden />
      </span>
    </button>
  )
}

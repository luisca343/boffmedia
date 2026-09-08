"use client"

import { useToolT, MEWGENICS_NS } from "../i18n"
import { MewTag } from "../mew-kit"
import { MewFaction, MewKind, MewRarity } from "../MewAtoms"
import {
  mewBodyPartLabel,
  mewHuman,
  type MewRec,
} from "../mew-util"

/**
 * The compact facts shown on a browse row and a gallery card.
 *
 * Keeping this category projection in one place is important: a list row must
 * be able to replace a card without changing the meaning of its metadata.
 */
export function MewRecordMeta({ cat, rec }: { cat: string; rec: MewRec }) {
  const t = useToolT(MEWGENICS_NS)
  const firstFurnitureStat = rec.stats ? Object.keys(rec.stats)[0] : undefined

  if (cat === "items") {
    return (
      <>
        {rec.kind && <MewKind kind={rec.kind} />}
        <MewRarity rarity={rec.rarity} cursed={rec.cursed} />
      </>
    )
  }

  if (cat === "characters") {
    return (
      <>
        {rec.faction && <MewFaction faction={rec.faction} />}
        {rec.type && <MewTag icon="star">{mewHuman(rec.type)}</MewTag>}
        {rec.hp != null && <MewTag icon="heart" tone="bad">{rec.hp} {t("data.statAbbr.pv")}</MewTag>}
      </>
    )
  }

  if (cat === "abilities") {
    return (
      <>
        {rec.cls && <MewTag icon="star">{mewHuman(rec.cls)}</MewTag>}
        {rec.cost?.act_points != null && <MewTag icon="bolt" tone="warn">{rec.cost.act_points} {t("data.statAbbr.pa")}</MewTag>}
        {rec.cost?.move_points != null && <MewTag icon="compass">{rec.cost.move_points} {t("data.statAbbr.pm")}</MewTag>}
      </>
    )
  }

  if (cat === "passives") {
    return rec.cls
      ? <MewTag icon="star">{mewHuman(rec.cls)}</MewTag>
      : <MewTag icon="shield">{t("label.general")}</MewTag>
  }

  if (cat === "keywords") return <MewTag icon="flame" tone="warn">{t("label.statusBadge")}</MewTag>
  if (cat === "events") return rec.subject ? <MewTag icon="compass">{rec.subject}</MewTag> : null

  if (cat === "classes") {
    return (
      <>
        {rec.weapon && <MewTag icon="sword">{mewHuman(rec.weapon)}</MewTag>}
        {!rec.weapon && rec.abilities && rec.abilities.length > 0 && <MewTag icon="bolt">{rec.abilities.length}</MewTag>}
      </>
    )
  }

  if (cat === "maps") {
    return rec.act != null
      ? <MewTag icon="map">{t("label.act")} {rec.act} {rec.tileset && `· ${rec.tileset}`}</MewTag>
      : null
  }

  if (cat === "furniture") {
    return (
      <>
        {firstFurnitureStat && (
          <MewTag icon="home">
            {["comfort", "appeal", "stimulation", "evolution", "health"].includes(firstFurnitureStat)
              ? t(`label.${firstFurnitureStat}`)
              : mewHuman(firstFurnitureStat)}
          </MewTag>
        )}
        {rec.special && <MewTag icon="star" tone="good">{t("label.special")}</MewTag>}
        {rec.removed && <MewTag icon="trash" tone="bad">{t("label.removed")}</MewTag>}
      </>
    )
  }

  if (cat === "mutations") return rec.body_part ? <MewTag icon="sparkles">{mewBodyPartLabel(t, String(rec.body_part))}</MewTag> : null
  if (cat === "sets") return rec.pieces_required != null ? <MewTag icon="layers">{rec.pieces_required}</MewTag> : null
  if (cat === "story_cats") return <MewTag icon="book">{t("label.storyCat")}</MewTag>

  return null
}

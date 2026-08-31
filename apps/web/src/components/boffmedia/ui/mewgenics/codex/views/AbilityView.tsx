"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { MewPanel } from "../../MewAtoms"
import { MewData } from "../../mew-store"
import { mewHuman } from "../../mew-util"
import { MewEffects, MewFlag, MewRef, MewRefList } from "../MewRefs"
import { getTargetMode, abilityRange, mewClassName } from "./ability-format"
import { MewAbilityInline } from "./inline"
import { MewDesc, MewDetail, MewFacts, MewHero, MewMoreTag, MewSections, MewSubLabel, MewTag, mewTruncate, rows, type ViewProps } from "./scaffold"

export function AbilityView({ rec, onNav }: ViewProps) {
  const t = useTranslations("mewgenics")
  const TARGET_MODE = getTargetMode(t)
  const cost = rec.cost || {}
  const tgt = rec.target || {}
  const dmg = rec.dmg || {}
  const usedByAll = React.useMemo(() => {
    return MewData.select.abilityUsedBy(rec.id)
  }, [rec.id])
  const { list: usedByChars, more: usedByCharsMore } = mewTruncate(usedByAll.chars, 10)
  const { list: usedByClasses, more: usedByClassesMore } = mewTruncate(usedByAll.classes, 8)
  const rangeStr = abilityRange(tgt)
  const aoeStr = tgt.max_aoe ? (tgt.min_aoe || 0) + "–" + tgt.max_aoe : null
  const chained = [rec.chain, rec.sub].filter(Boolean) as string[]
  const effN = dmg.effects ? Object.keys(dmg.effects).length : 0

  return (
    <MewDetail id={rec.id}>
      <MewHero
        cat="abilities"
        rec={rec}
        badges={
          <>
            {rec.cls && <MewFlag icon="star">{mewClassName(rec.cls)}</MewFlag>}
            {cost.act_points != null && <MewFlag icon="bolt" tone="warn">{cost.act_points} {t("data.statAbbr.pa")}</MewFlag>}
            {cost.move_points ? <MewFlag icon="compass">{cost.move_points} {t("data.statAbbr.pm")}</MewFlag> : null}
          </>
        }
      />
      <MewDesc>{rec.desc}</MewDesc>
      <MewSections>
        <MewPanel title={t("panel.costRange")} icon="target">
          <MewFacts
            rows={rows([
              { label: t("label.actPoints"), value: cost.act_points != null ? cost.act_points : "—" },
              cost.move_points != null && { label: t("label.movePoints"), value: cost.move_points },
              cost.requires_hp_threshold != null && { label: t("label.hpThreshold"), value: cost.requires_hp_threshold },
              tgt.target_mode && { label: t("label.target"), value: TARGET_MODE[tgt.target_mode] || mewHuman(tgt.target_mode) },
              rangeStr && { label: t("label.range"), value: rangeStr },
              aoeStr && { label: t("label.area"), value: aoeStr },
            ])}
          />
        </MewPanel>
        {rec.dmg && (dmg.damage != null || dmg.heal != null || dmg.self != null || dmg.splash != null || dmg.effects) && (
          <MewPanel title={t("panel.damageEffect")} icon="flame">
            <MewFacts
              rows={rows([
                dmg.damage != null && { label: t("label.damage"), value: String(dmg.damage) },
                dmg.heal != null && { label: t("label.heal"), value: String(dmg.heal) },
                dmg.self != null && { label: t("label.selfDmg"), value: String(dmg.self) },
                dmg.splash != null && { label: t("label.splash"), value: String(dmg.splash) },
                dmg.type && { label: t("label.type"), value: mewHuman(dmg.type) },
              ])}
            />
            {effN > 0 && (
              <div className="mt-2.5">
                <MewSubLabel>{t("label.applies")}</MewSubLabel>
                <MewEffects map={dmg.effects} onNav={onNav} />
              </div>
            )}
          </MewPanel>
        )}
        {chained.length > 0 && (
          <MewPanel title={t("panel.chainsWith")} icon="link">
            <div className="flex flex-col">
              {chained.map((id) => <MewAbilityInline key={id} id={id} onNav={onNav} />)}
            </div>
          </MewPanel>
        )}
        {(rec.cls || rec.template || rec.variant_of) && (
          <MewPanel title={t("panel.data")} icon="database">
            <MewFacts
              rows={rows([
                rec.cls && { label: t("label.abilityClass"), value: mewClassName(rec.cls) },
                rec.template && { label: t("label.template"), value: mewHuman(rec.template) },
                rec.variant_of && { label: t("panel.variantOf"), value: <MewRef id={rec.variant_of} cat="abilities" onNav={onNav} /> },
              ])}
            />
          </MewPanel>
        )}
        {rec.bonus && Object.keys(rec.bonus).length > 0 && (
          <MewPanel title={t("panel.grantsPassives")} icon="shield"><MewEffects map={rec.bonus} onNav={onNav} /></MewPanel>
        )}
        {Array.isArray(rec.tags) && rec.tags.length > 0 && (
          <MewPanel title={t("panel.tags")} icon="bookmark">
            <div className="flex flex-wrap gap-1.5">{rec.tags.map((t) => <MewTag key={t}>{mewHuman(t)}</MewTag>)}</div>
          </MewPanel>
        )}
        {(usedByChars.length > 0 || usedByClasses.length > 0) && (
          <MewPanel title={t("panel.usedBy")} icon="paw" span="full">
            {usedByClasses.length > 0 && (
              <>
                <MewSubLabel>{t("label.classes")}</MewSubLabel>
                <div className="flex flex-wrap gap-1.5">
                  <MewRefList ids={usedByClasses.map((c) => c.id)} cat="classes" icon="star" onNav={onNav} />
                  {usedByClassesMore > 0 && <MewMoreTag n={usedByClassesMore} />}
                </div>
              </>
            )}
            {usedByChars.length > 0 && (
              <div className={usedByClasses.length ? "mt-3" : ""}>
                <MewSubLabel>{t("label.characters")}</MewSubLabel>
                <div className="flex flex-wrap gap-1.5">
                  <MewRefList ids={usedByChars.map((c) => c.id)} cat="characters" icon="paw" onNav={onNav} />
                  {usedByCharsMore > 0 && <MewMoreTag n={usedByCharsMore} />}
                </div>
              </div>
            )}
          </MewPanel>
        )}
      </MewSections>
    </MewDetail>
  )
}

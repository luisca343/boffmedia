"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { MewPanel, MewFaction, MewStats } from "../../MewAtoms"
import { MewData } from "../../mew-store"
import { mewHuman, type MewRec } from "../../mew-util"
import { MewEffects, MewFlag, MewRefList } from "../MewRefs"
import { MewAbilityInline } from "./inline"
import { MewCol, MewDetail, MewFacts, MewGrid2, MewHero, MewSubLabel, rows, type ViewProps } from "./scaffold"

export function CharacterView({ rec, onNav }: ViewProps) {
  const t = useTranslations("mewgenics")
  const inMaps = React.useMemo(() => {
    const out: MewRec[] = []
    ;(MewData.data.maps || []).forEach((mp) => {
      const pool = JSON.stringify([mp.enemies, mp.bosses, mp.minibosses]).toLowerCase()
      if (pool.indexOf('"' + rec.id.toLowerCase() + '"') >= 0) out.push(mp)
    })
    return out.slice(0, 8)
  }, [rec.id])
  const passN = rec.passives ? Object.keys(rec.passives).length : 0

  return (
    <MewDetail>
      <MewHero
        cat="characters"
        rec={rec}
        tip={rec.tip}
        badges={
          <>
            {rec.faction && <MewFaction faction={rec.faction} />}
            {rec.type && <MewFlag icon="star" tone="warn">{mewHuman(rec.type)}</MewFlag>}
            {rec.hp != null && <MewFlag icon="heart">{rec.hp} PV</MewFlag>}
          </>
        }
      />
      <MewGrid2>
        <MewCol>
          {rec.stats && <MewPanel title={t("panel.stats")} icon="chart"><MewStats stats={rec.stats} /></MewPanel>}
          <MewPanel title={t("panel.combat")} icon="sword">
            {rec.atk && (
              <div className="mb-3">
                <MewSubLabel>{t("label.attack")}</MewSubLabel>
                <MewAbilityInline id={rec.atk} onNav={onNav} />
              </div>
            )}
            {(rec.move != null || rec.champ != null) && (
              <MewFacts
                rows={rows([
                  rec.move != null && { label: t("label.move"), value: rec.move },
                  rec.champ != null && { label: t("label.canBeChamp"), value: rec.champ ? t("label.yes") : t("label.no") },
                ])}
              />
            )}
            {rec.spells && rec.spells.length > 0 && (
              <div className="mt-2.5">
                <MewSubLabel>{t("label.spells")}</MewSubLabel>
                <MewRefList ids={rec.spells} cat="abilities" icon="bolt" onNav={onNav} />
              </div>
            )}
          </MewPanel>
          {passN > 0 && (
            <MewPanel title={t("panel.traitsPassives")} icon="shield" count={passN}>
              <MewEffects map={rec.passives} onNav={onNav} />
            </MewPanel>
          )}
        </MewCol>
        <MewCol>
          <MewPanel title={t("panel.data")} icon="database">
            <MewFacts
              rows={rows([
                { label: t("label.faction"), value: rec.faction ? <MewFaction faction={rec.faction} /> : "—" },
                rec.type && { label: t("label.type"), value: mewHuman(rec.type) },
                rec.hp != null && { label: t("label.hp"), value: rec.hp },
                { label: t("label.sprite"), value: rec.hasSprite ? t("label.spriteAvailable") : t("label.spriteNone") },
                { label: t("label.id"), value: rec.id, mono: true },
              ])}
            />
          </MewPanel>
          {rec.equipment && Object.keys(rec.equipment).length > 0 && (
            <MewPanel title={t("panel.equipment")} icon="sword"><MewEffects map={rec.equipment} onNav={onNav} /></MewPanel>
          )}
          {rec.variant_of && (
            <MewPanel title={t("panel.variantOf")} icon="layers"><MewRefList ids={[rec.variant_of]} cat="characters" icon="paw" onNav={onNav} /></MewPanel>
          )}
          {inMaps.length > 0 && (
            <MewPanel title={t("panel.appearsIn")} icon="map" count={inMaps.length}>
              <MewRefList ids={inMaps.map((m) => m.id)} cat="maps" icon="map" onNav={onNav} />
            </MewPanel>
          )}
        </MewCol>
      </MewGrid2>
    </MewDetail>
  )
}

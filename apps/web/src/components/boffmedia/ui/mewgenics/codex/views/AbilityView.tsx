"use client"

import * as React from "react"
import { MewPanel } from "../../MewAtoms"
import { MewData } from "../../mew-store"
import { mewHuman } from "../../mew-util"
import { MewEffects, MewFlag, MewRef, MewRefList } from "../MewRefs"
import { MEW_TARGET_MODE, abilityRange, mewClassName } from "./ability-format"
import { MewAbilityInline } from "./inline"
import { MewCol, MewDesc, MewDetail, MewFacts, MewGrid2, MewHero, MewSubLabel, MewTag, rows, type ViewProps } from "./scaffold"

export function AbilityView({ rec, onNav }: ViewProps) {
  const cost = rec.cost || {}
  const tgt = rec.target || {}
  const dmg = rec.dmg || {}
  const usedBy = React.useMemo(() => {
    const chars = (MewData.data.characters || []).filter((c) => c.atk === rec.id || (c.spells && c.spells.indexOf(rec.id) >= 0)).slice(0, 10)
    const classes = (MewData.data.classes || []).filter((c) => (c.abilities && c.abilities.indexOf(rec.id) >= 0)).slice(0, 8)
    return { chars, classes }
  }, [rec.id])
  const rangeStr = abilityRange(tgt)
  const aoeStr = tgt.max_aoe ? (tgt.min_aoe || 0) + "–" + tgt.max_aoe : null
  const chained = [rec.chain, rec.sub].filter(Boolean) as string[]
  const effN = dmg.effects ? Object.keys(dmg.effects).length : 0

  return (
    <MewDetail>
      <MewHero
        cat="abilities"
        rec={rec}
        badges={
          <>
            {rec.cls && <MewFlag icon="star">{mewClassName(rec.cls)}</MewFlag>}
            {cost.act_points != null && <MewFlag icon="bolt" tone="warn">{cost.act_points} PA</MewFlag>}
            {cost.move_points ? <MewFlag icon="compass">{cost.move_points} PM</MewFlag> : null}
          </>
        }
      />
      <MewDesc>{rec.desc}</MewDesc>
      <MewGrid2>
        <MewCol>
          <MewPanel title="Coste y alcance" icon="target">
            <MewFacts
              rows={rows([
                { label: "Puntos de acción", value: cost.act_points != null ? cost.act_points : "—" },
                cost.move_points != null && { label: "Puntos de movimiento", value: cost.move_points },
                cost.requires_hp_threshold != null && { label: "Umbral de salud", value: cost.requires_hp_threshold },
                tgt.target_mode && { label: "Objetivo", value: MEW_TARGET_MODE[tgt.target_mode] || mewHuman(tgt.target_mode) },
                rangeStr && { label: "Alcance", value: rangeStr },
                aoeStr && { label: "Área", value: aoeStr },
              ])}
            />
          </MewPanel>
          {rec.dmg && (dmg.damage != null || dmg.heal != null || dmg.self != null || dmg.splash != null || dmg.effects) && (
            <MewPanel title="Daño y efecto" icon="flame">
              <MewFacts
                rows={rows([
                  dmg.damage != null && { label: "Daño", value: String(dmg.damage) },
                  dmg.heal != null && { label: "Cura", value: String(dmg.heal) },
                  dmg.self != null && { label: "Daño propio", value: String(dmg.self) },
                  dmg.splash != null && { label: "Salpicadura", value: String(dmg.splash) },
                  dmg.type && { label: "Tipo", value: mewHuman(dmg.type) },
                ])}
              />
              {effN > 0 && (
                <div className="mt-2.5">
                  <MewSubLabel>Aplica</MewSubLabel>
                  <MewEffects map={dmg.effects} onNav={onNav} />
                </div>
              )}
            </MewPanel>
          )}
          {chained.length > 0 && (
            <MewPanel title="Encadena con" icon="link">
              <div className="flex flex-col">
                {chained.map((id) => <MewAbilityInline key={id} id={id} onNav={onNav} />)}
              </div>
            </MewPanel>
          )}
        </MewCol>
        <MewCol>
          <MewPanel title="Datos" icon="database">
            <MewFacts
              rows={rows([
                rec.cls && { label: "Clase de habilidad", value: mewClassName(rec.cls) },
                rec.template && { label: "Plantilla", value: mewHuman(rec.template) },
                rec.variant_of && { label: "Variante de", value: <MewRef id={rec.variant_of} cat="abilities" onNav={onNav} /> },
                { label: "ID", value: rec.id, mono: true },
              ])}
            />
          </MewPanel>
          {rec.bonus && Object.keys(rec.bonus).length > 0 && (
            <MewPanel title="Otorga pasivas" icon="shield"><MewEffects map={rec.bonus} onNav={onNav} /></MewPanel>
          )}
          {Array.isArray(rec.tags) && rec.tags.length > 0 && (
            <MewPanel title="Etiquetas" icon="bookmark">
              <div className="flex flex-wrap gap-1.5">{rec.tags.map((t) => <MewTag key={t}>{mewHuman(t)}</MewTag>)}</div>
            </MewPanel>
          )}
          {(usedBy.chars.length > 0 || usedBy.classes.length > 0) && (
            <MewPanel title="La usan" icon="paw">
              {usedBy.classes.length > 0 && (
                <>
                  <MewSubLabel>Clases</MewSubLabel>
                  <MewRefList ids={usedBy.classes.map((c) => c.id)} cat="classes" icon="star" onNav={onNav} />
                </>
              )}
              {usedBy.chars.length > 0 && (
                <div className={usedBy.classes.length ? "mt-3" : ""}>
                  <MewSubLabel>Personajes</MewSubLabel>
                  <MewRefList ids={usedBy.chars.map((c) => c.id)} cat="characters" icon="paw" onNav={onNav} />
                </div>
              )}
            </MewPanel>
          )}
        </MewCol>
      </MewGrid2>
    </MewDetail>
  )
}

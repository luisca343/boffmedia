"use client"

import * as React from "react"
import { MewPanel, MewFaction, MewStats } from "../../MewAtoms"
import { MewData } from "../../mew-store"
import { mewHuman, type MewRec } from "../../mew-util"
import { MewEffects, MewFlag, MewRefList } from "../MewRefs"
import { MewAbilityInline } from "./inline"
import { MewCol, MewDetail, MewFacts, MewGrid2, MewHero, MewSubLabel, rows, type ViewProps } from "./scaffold"

export function CharacterView({ rec, onNav }: ViewProps) {
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
          {rec.stats && <MewPanel title="Estadísticas" icon="chart"><MewStats stats={rec.stats} /></MewPanel>}
          <MewPanel title="Combate" icon="sword">
            {rec.atk && (
              <div className="mb-3">
                <MewSubLabel>Ataque</MewSubLabel>
                <MewAbilityInline id={rec.atk} onNav={onNav} />
              </div>
            )}
            {(rec.move != null || rec.champ != null) && (
              <MewFacts
                rows={rows([
                  rec.move != null && { label: "Movimiento", value: rec.move },
                  rec.champ != null && { label: "Puede ser campeón", value: rec.champ ? "Sí" : "No" },
                ])}
              />
            )}
            {rec.spells && rec.spells.length > 0 && (
              <div className="mt-2.5">
                <MewSubLabel>Hechizos</MewSubLabel>
                <MewRefList ids={rec.spells} cat="abilities" icon="bolt" onNav={onNav} />
              </div>
            )}
          </MewPanel>
          {passN > 0 && (
            <MewPanel title="Rasgos y pasivas" icon="shield" count={passN}>
              <MewEffects map={rec.passives} onNav={onNav} />
            </MewPanel>
          )}
        </MewCol>
        <MewCol>
          <MewPanel title="Datos" icon="database">
            <MewFacts
              rows={rows([
                { label: "Facción", value: rec.faction ? <MewFaction faction={rec.faction} /> : "—" },
                rec.type && { label: "Tipo", value: mewHuman(rec.type) },
                rec.hp != null && { label: "Salud", value: rec.hp },
                { label: "Sprite", value: rec.hasSprite ? "Disponible" : "Sin sprite" },
                { label: "ID", value: rec.id, mono: true },
              ])}
            />
          </MewPanel>
          {rec.equipment && Object.keys(rec.equipment).length > 0 && (
            <MewPanel title="Equipo" icon="sword"><MewEffects map={rec.equipment} onNav={onNav} /></MewPanel>
          )}
          {rec.variant_of && (
            <MewPanel title="Variante de" icon="layers"><MewRefList ids={[rec.variant_of]} cat="characters" icon="paw" onNav={onNav} /></MewPanel>
          )}
          {inMaps.length > 0 && (
            <MewPanel title="Aparece en" icon="map" count={inMaps.length}>
              <MewRefList ids={inMaps.map((m) => m.id)} cat="maps" icon="map" onNav={onNav} />
            </MewPanel>
          )}
        </MewCol>
      </MewGrid2>
    </MewDetail>
  )
}

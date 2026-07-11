"use client"

import { MewPanel } from "../../MewAtoms"
import { mewHuman } from "../../mew-util"
import { MewFlag, MewRefList } from "../MewRefs"
import { MewCol, MewDetail, MewFacts, MewGrid2, MewHero, MewSubLabel, MewTag, rows, type ViewProps } from "./scaffold"

export function MapView({ rec, onNav }: ViewProps) {
  const pools = rec.enemies || {}
  const poolOrder = ["small", "medium", "large"]
  const poolLabel: Record<string, string> = { small: "Pequeños", medium: "Medianos", large: "Grandes" }
  const hasBosses = (rec.bosses && rec.bosses.length) || (rec.minibosses && rec.minibosses.length)
  return (
    <MewDetail>
      <MewHero
        cat="maps"
        rec={rec}
        badges={
          <>
            <MewFlag icon="layers">Acto {rec.act} · Cap. {rec.chapter}</MewFlag>
            {rec.tileset && <MewFlag icon="grid">{mewHuman(rec.tileset)}</MewFlag>}
          </>
        }
      />
      <MewGrid2>
        <MewCol>
          {hasBosses && (
            <MewPanel title="Jefes" icon="skull">
              {rec.bosses && rec.bosses.length > 0 && (
                <>
                  <MewSubLabel>Jefes</MewSubLabel>
                  <MewRefList ids={rec.bosses} cat="characters" icon="skull" onNav={onNav} />
                </>
              )}
              {rec.minibosses && rec.minibosses.length > 0 && (
                <div className="mt-3">
                  <MewSubLabel>Minijefes</MewSubLabel>
                  <MewRefList ids={rec.minibosses} cat="characters" icon="paw" onNav={onNav} />
                </div>
              )}
            </MewPanel>
          )}
          {poolOrder.some((p) => (pools[p] || []).length) && (
            <MewPanel title="Reservas de enemigos" icon="paw">
              {poolOrder.map((p) =>
                (pools[p] || []).length ? (
                  <div key={p} className="mb-3 last:mb-0">
                    <MewSubLabel n={pools[p].length}>{poolLabel[p]}</MewSubLabel>
                    <MewRefList ids={pools[p]} cat="characters" icon="paw" onNav={onNav} />
                  </div>
                ) : null,
              )}
            </MewPanel>
          )}
        </MewCol>
        <MewCol>
          <MewPanel title="Datos" icon="database">
            <MewFacts
              rows={rows([
                { label: "Acto", value: rec.act },
                { label: "Capítulo", value: rec.chapter },
                rec.tileset && { label: "Tileset", value: mewHuman(rec.tileset) },
                rec.music && { label: "Música", value: mewHuman(rec.music) },
                { label: "ID", value: rec.id, mono: true },
              ])}
            />
          </MewPanel>
          {rec.items && Object.keys(rec.items).length > 0 && (
            <MewPanel title="Reservas de objetos" icon="sword">
              <div className="flex flex-wrap gap-1.5">
                {Object.values(rec.items).flat().map((v, i) => <MewTag key={i}>{mewHuman(String(v))}</MewTag>)}
              </div>
            </MewPanel>
          )}
        </MewCol>
      </MewGrid2>
    </MewDetail>
  )
}

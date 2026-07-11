"use client"

import { MewPanel } from "../../MewAtoms"
import { MewEffects, MewRef, MewRefList, type NavFn } from "../MewRefs"
import { MewItemInline } from "./inline"
import { MewCol, MewDesc, MewDetail, MewFacts, MewGrid2, MewHero, MewSubLabel, rows, type ViewProps } from "./scaffold"

function MewGroupSection({ title, ids, onNav }: { title: string; ids?: string[]; onNav: NavFn }) {
  if (!ids || !ids.length) return null
  return (
    <div className="mb-3.5 last:mb-0">
      <MewSubLabel n={ids.length}>{title}</MewSubLabel>
      <MewRefList ids={ids} cat="abilities" icon="bolt" onNav={onNav} />
    </div>
  )
}

export function ClassView({ rec, onNav }: ViewProps) {
  const g = rec.groups || {}
  const hasGroups = Object.keys(g).length > 0
  return (
    <MewDetail>
      <MewHero cat="classes" rec={rec} badges={rec.weapon ? <MewRef id={rec.weapon} cat="items" icon="sword" onNav={onNav} /> : undefined} />
      <MewDesc>{rec.desc}</MewDesc>
      <MewGrid2>
        <MewCol>
          {rec.weapon && (
            <MewPanel title="Arma innata" icon="sword">
              <MewItemInline id={rec.weapon} onNav={onNav} />
            </MewPanel>
          )}
          {rec.starters && rec.starters.length > 0 && (
            <MewPanel title="Habilidades iniciales" icon="play" count={rec.starters.length}>
              <MewRefList ids={rec.starters} cat="abilities" icon="star" onNav={onNav} />
            </MewPanel>
          )}
          <MewPanel title="Reserva de habilidades" icon="layers" count={(rec.abilities || []).length}>
            <MewGroupSection title="Ataque" ids={g.attack} onNav={onNav} />
            <MewGroupSection title="Defensa" ids={g.defense} onNav={onNav} />
            <MewGroupSection title="Movimiento" ids={g.move} onNav={onNav} />
            <MewGroupSection title="Varios" ids={g.misc} onNav={onNav} />
            {!hasGroups && <MewRefList ids={rec.abilities || []} cat="abilities" icon="bolt" onNav={onNav} />}
          </MewPanel>
        </MewCol>
        <MewCol>
          <MewPanel title="Datos" icon="database">
            <MewFacts
              rows={rows([
                { label: "Habilidades", value: (rec.abilities || []).length },
                { label: "ID", value: rec.id, mono: true },
              ])}
            />
          </MewPanel>
          {rec.statMods && Object.keys(rec.statMods).length > 0 && (
            <MewPanel title="Modificadores de estadística" icon="sliders"><MewEffects map={rec.statMods} onNav={onNav} /></MewPanel>
          )}
          {rec.passivePool && rec.passivePool.length > 0 && (
            <MewPanel title="Pasivas de clase" icon="shield" count={rec.passivePool.length}>
              <MewRefList ids={rec.passivePool} cat="passives" icon="shield" onNav={onNav} />
            </MewPanel>
          )}
        </MewCol>
      </MewGrid2>
    </MewDetail>
  )
}

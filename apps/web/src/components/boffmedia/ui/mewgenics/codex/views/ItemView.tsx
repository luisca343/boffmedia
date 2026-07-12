"use client"

import * as React from "react"
import { MewPanel, MewKind, MewRarity } from "../../MewAtoms"
import { select } from "../../mew-store"
import { MEW_STATMOD, mewHuman, mewSubItemName } from "../../mew-util"
import { MewEffects, MewFlag, MewRefList } from "../MewRefs"
import { MewAbilityInline } from "./inline"
import { MewCol, MewDesc, MewDetail, MewFacts, MewFlags, MewGrid2, MewHero, MewSubLabel, MewTag, num, rows, type ViewProps } from "./scaffold"

export function ItemView({ rec, onNav }: ViewProps) {
  const statRows = Object.keys(MEW_STATMOD)
    .filter((k) => rec[k] != null)
    .map((k) => ({ label: MEW_STATMOD[k], value: (num(rec, k)! > 0 ? "+" : "") + rec[k] }))
  const users = React.useMemo(() => select.charactersUsingItem(rec.id).slice(0, 12), [rec.id])
  const flags: React.ReactNode[] = []
  if (rec.consumable) flags.push(<MewFlag key="c" icon="drop" tone="warn">Consumible</MewFlag>)
  if (rec.cursed) flags.push(<MewFlag key="k" icon="skull" tone="bad">Maldito</MewFlag>)
  if (rec.parasite) flags.push(<MewFlag key="p" icon="bolt" tone="bad">Parásito</MewFlag>)
  if (rec.quest_item) flags.push(<MewFlag key="q" icon="bookmark">Objeto de misión</MewFlag>)
  if (rec.indestructible) flags.push(<MewFlag key="i" icon="shield">Indestructible</MewFlag>)
  if (rec.divine_shield) flags.push(<MewFlag key="d" icon="shield" tone="good">Escudo divino</MewFlag>)
  const sets = Array.isArray(rec.set) ? rec.set : rec.set ? [rec.set] : []
  const passN = rec.passives ? Object.keys(rec.passives).length : 0

  return (
    <MewDetail>
      <MewHero cat="items" rec={rec} badges={<>{rec.kind && <MewKind kind={rec.kind} />}{rec.rarity && <MewRarity rarity={rec.rarity} />}</>} />
      <MewDesc>{rec.desc}</MewDesc>
      {flags.length > 0 && <MewFlags>{flags}</MewFlags>}
      <MewGrid2>
        <MewCol>
          {statRows.length > 0 && (
            <MewPanel title="Modificadores" icon="sliders"><MewFacts rows={statRows} /></MewPanel>
          )}
          {passN > 0 && (
            <MewPanel title="Pasivas que otorga" icon="shield" count={passN}>
              <MewEffects map={rec.passives} onNav={onNav} />
            </MewPanel>
          )}
          {(rec.ability || rec.attack) && (
            <MewPanel title="Uso" icon="bolt">
              <div className="flex flex-col">
                {rec.ability && <MewAbilityInline id={rec.ability} onNav={onNav} label={mewSubItemName(select.name(rec.ability), rec.name)} />}
                {rec.attack && <MewAbilityInline id={rec.attack} onNav={onNav} />}
              </div>
            </MewPanel>
          )}
        </MewCol>
        <MewCol>
          <MewPanel title="Datos" icon="database">
            <MewFacts
              rows={rows([
                { label: "Tipo", value: rec.kind ? <MewKind kind={rec.kind} /> : "—" },
                { label: "Rareza", value: rec.rarity ? <MewRarity rarity={rec.rarity} /> : "—" },
                rec.shield != null && { label: "Escudo", value: rec.shield },
                rec.durability != null && { label: "Durabilidad", value: rec.durability },
                { label: "ID", value: rec.id, mono: true },
              ])}
            />
          </MewPanel>
          {sets.length > 0 && (
            <MewPanel title="Conjuntos" icon="layers" count={sets.length}>
              <div className="flex flex-col gap-3">
                {sets.map((s) => {
                  const set = select.set(s)
                  return (
                    <div key={s}>
                      <MewSubLabel n={set.members?.length}>{mewHuman(s)}</MewSubLabel>
                      <MewRefList ids={(set.members || []).map((m) => m.id)} cat="items" icon="sword" onNav={onNav} />
                    </div>
                  )
                })}
              </div>
            </MewPanel>
          )}
          {Array.isArray(rec.global_tags) && rec.global_tags.length > 0 && (
            <MewPanel title="Etiquetas" icon="bookmark">
              <div className="flex flex-wrap gap-1.5">{rec.global_tags.map((t) => <MewTag key={t}>{mewHuman(t)}</MewTag>)}</div>
            </MewPanel>
          )}
          {users.length > 0 && (
            <MewPanel title="Lo llevan" icon="paw" count={users.length}>
              <MewRefList ids={users.map((u) => u.id)} cat="characters" icon="paw" onNav={onNav} />
            </MewPanel>
          )}
        </MewCol>
      </MewGrid2>
    </MewDetail>
  )
}

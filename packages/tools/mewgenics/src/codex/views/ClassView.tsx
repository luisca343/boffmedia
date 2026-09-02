"use client"

import * as React from "react"
import { useToolT, MEWGENICS_NS } from "../../i18n"
import { MewPanel, MewClass } from "../../MewAtoms"
import { select } from "../../mew-store"
import { MewEffects, MewRef, MewRefList, type NavFn } from "../MewRefs"
import { MewItemInline } from "./inline"
import { MewDesc, MewDetail, MewFacts, MewHero, MewSections, MewSubLabel, rows, type ViewProps } from "./scaffold"

function MewGroupSection({ title, ids, onNav }: { title: string; ids?: string[]; onNav: NavFn }) {
  if (!ids || !ids.length) return null
  return (
    <div className="mb-3.5 last:mb-0">
      <MewSubLabel n={ids.length}>{title}</MewSubLabel>
      <MewRefList ids={ids} cat="abilities" icon="bolt" onNav={onNav} />
    </div>
  )
}

interface AbilityTableRow {
  id: string
  name: string
  cost: string | number
  range: string
  damage: string | number
  group: string | number
}

function MewAbilityTable({ ids, onNav }: { ids?: string[]; onNav: NavFn }) {
  const t = useToolT(MEWGENICS_NS)
  if (!ids || !ids.length) return null

  const rows: AbilityTableRow[] = ids
    .map((id) => {
      const rec = select.ability(id)
      if (!rec) return null
      return {
        id,
        name: rec.name || "—",
        cost: rec.cost?.act_points || "—",
        range: (rec.target?.min_range != null && rec.target?.max_range != null) ? `${rec.target.min_range}–${rec.target.max_range}` : "—",
        damage: rec.dmg?.damage != null ? rec.dmg.damage : "—",
        group: String(rec.group || "—"),
      } as AbilityTableRow
    })
    .filter((r): r is AbilityTableRow => r !== null)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr className="border-b-2 border-[color:var(--mwp-ink-line)]">
            <th className="text-left px-2 py-2 font-semibold text-[color:var(--mwp-ink-soft)]">{t("label.ability")}</th>
            <th className="text-center px-2 py-2 font-semibold text-[color:var(--mwp-ink-soft)] w-12">{t("label.cost")}</th>
            <th className="text-center px-2 py-2 font-semibold text-[color:var(--mwp-ink-soft)] w-12">{t("label.range")}</th>
            <th className="text-center px-2 py-2 font-semibold text-[color:var(--mwp-ink-soft)] w-12">{t("label.damage")}</th>
            <th className="text-center px-2 py-2 font-semibold text-[color:var(--mwp-ink-soft)] w-16">{t("label.group")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[color:var(--mwp-ink-line)] hover:bg-[color:var(--mwp-paper-2)] transition-colors cursor-pointer"
              onClick={() => onNav("abilities", row.id)}
            >
              <td className="px-2 py-2 text-[color:var(--mwp-ink)]">{row.name}</td>
              <td className="px-2 py-2 text-center text-[color:var(--mwp-ink-soft)]">{row.cost}</td>
              <td className="px-2 py-2 text-center text-[color:var(--mwp-ink-soft)]">{row.range}</td>
              <td className="px-2 py-2 text-center text-[color:var(--mwp-ink-soft)]">{row.damage}</td>
              <td className="px-2 py-2 text-center text-[color:var(--mwp-ink-soft)] text-[11px]">{row.group}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ClassView({ rec, onNav }: ViewProps) {
  const t = useToolT(MEWGENICS_NS)
  const g = rec.groups || {}
  const hasGroups = Object.keys(g).length > 0
  const classCharacters = React.useMemo(() => select.classToCharacters(rec.id), [rec.id])

  return (
    <MewDetail id={rec.id}>
      <MewHero
        cat="classes"
        rec={rec}
        badges={<>
          <MewClass cls={rec.id} />
          {rec.weapon ? <MewRef id={rec.weapon} cat="items" icon="sword" onNav={onNav} /> : undefined}
        </>}
      />
      <MewDesc>{rec.desc}</MewDesc>
      <MewSections>
        {rec.weapon && (
          <MewPanel title={t("panel.innateWeapon")} icon="sword">
            <MewItemInline id={rec.weapon} onNav={onNav} />
          </MewPanel>
        )}
        {rec.starters && rec.starters.length > 0 && (
          <MewPanel title={t("panel.starterAbilities")} icon="play" count={rec.starters.length}>
            <MewRefList ids={rec.starters} cat="abilities" icon="star" onNav={onNav} />
          </MewPanel>
        )}
        <MewPanel title={t("panel.abilityPool")} icon="layers" count={(rec.abilities || []).length} span="full">
          <MewAbilityTable ids={rec.abilities || []} onNav={onNav} />
        </MewPanel>
        {classCharacters.length > 0 && (
          <MewPanel title={t("panel.classCharacters")} icon="paw" count={classCharacters.length} span="full">
            <MewRefList ids={classCharacters.map((c) => c.id)} cat="characters" icon="paw" onNav={onNav} />
          </MewPanel>
        )}
        <MewPanel title={t("panel.data")} icon="database">
          <MewFacts
            rows={rows([
              { label: t("label.abilities"), value: (rec.abilities || []).length },
            ])}
          />
        </MewPanel>
        {rec.statMods && Object.keys(rec.statMods).length > 0 && (
          <MewPanel title={t("panel.statMods")} icon="sliders"><MewEffects map={rec.statMods} onNav={onNav} /></MewPanel>
        )}
        {rec.passivePool && rec.passivePool.length > 0 && (
          <MewPanel title={t("panel.classPassives")} icon="shield" count={rec.passivePool.length}>
            <MewRefList ids={rec.passivePool} cat="passives" icon="shield" onNav={onNav} />
          </MewPanel>
        )}
      </MewSections>
    </MewDetail>
  )
}

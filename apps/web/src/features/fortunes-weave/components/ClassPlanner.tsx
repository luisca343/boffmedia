"use client"

import { useMemo, useRef, useState } from "react"
import { Button, SearchInput, Select } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import { CLASS_TIERS, MOVEMENT_TYPES, WEAPON_TYPES, filterClasses, type ClassPlan, type ClassRoute, type WeaveClass } from "../class-model"
import { FORTUNES_WEAVE_ROUTES } from "../characters"
import { ClassCard } from "./ClassCard"
import { ClassComparison } from "./ClassComparison"
import { ClassRoster, type ClassRosterCharacter } from "./ClassRoster"

/** Controlled plans allow the route to own persistence and the showcase to use ephemeral data. */
export function ClassPlanner({ classes, characters, plan, onAssign, ready = true }: {
  classes: readonly WeaveClass[]
  characters: readonly ClassRosterCharacter[]
  plan: ClassPlan
  onAssign: (route: ClassRoute, characterId: string, classId: string) => void
  ready?: boolean
}) {
  const t = useTranslations("otros.fortunesWeave.classes")
  const routes = useTranslations("otros.fortunesWeave.routes")
  const [route, setRoute] = useState<ClassRoute>("cai")
  const [characterId, setCharacterId] = useState(characters[0]?.id ?? "")
  const [characterQuery, setCharacterQuery] = useState("")
  const [filters, setFilters] = useState({ query: "", tier: "all", weapon: "all", movement: "all" })
  const [comparisonIds, setComparisonIds] = useState<string[]>([])
  const comparisonRef = useRef<HTMLDivElement>(null)
  const character = characters.find((entry) => entry.id === characterId)
  const assignedId = plan[route][characterId]
  const assignedClass = classes.find((entry) => entry.id === assignedId)
  const shown = useMemo(() => filterClasses(classes, filters, (entry) => [
    t(`names.${entry.id}`),
    ...entry.weapons.map(({ type }) => t(`training.${type}`)),
    ...entry.requirements.ranks.map(({ type }) => t(`training.${type}`)),
    ...entry.skills.map((id) => t(`skillNames.${id}`)),
    entry.masterSkill ? t(`skillNames.${entry.masterSkill}`) : "",
  ].join(" ")), [classes, filters, t])
  const comparison = comparisonIds.map((id) => classes.find((entry) => entry.id === id)!).filter(Boolean)
  const toggleComparison = (id: string) => setComparisonIds((previous) => previous.includes(id)
    ? previous.filter((entry) => entry !== id) : previous.length < 3 ? [...previous, id] : previous)

  return <div className="grid gap-6">
    <div ref={comparisonRef} className="scroll-mt-[calc(var(--nav-h,0px)+1rem)]">
      <ClassComparison classes={comparison} onRemove={toggleComparison} onClear={() => setComparisonIds([])} />
    </div>
    <div className="grid items-start gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="grid min-w-0 gap-3 lg:sticky lg:top-[calc(var(--nav-h,0px)+1rem)]">
        <Select label={t("route")} value={route} onChange={(value) => setRoute(value as ClassRoute)}
          options={FORTUNES_WEAVE_ROUTES.map((id) => ({ value: id, label: routes(id) }))} />
        <ClassRoster characters={characters} assignments={plan[route]} selectedId={characterId} onSelect={setCharacterId} query={characterQuery} onQuery={setCharacterQuery} />
        <p className="text-xs leading-5 text-txt-dim">{t("eligibilityNote")}</p>
      </aside>
      <section aria-label={t("catalogTitle")} className="grid min-w-0 gap-4">
        <div className="z-10 grid gap-3 border border-solid border-line bg-base-2 p-4 lg:sticky lg:top-[var(--nav-h,0px)]">
          {character && <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl">{t("selectedCharacter", { character: character.name })}</h2>
              <p className="mt-1 text-xs text-txt-muted">{routes(route)} · {t("targetClass")}: <b className="text-accent">{assignedClass ? t(`names.${assignedClass.id}`) : t("noClass")}</b></p>
            </div>
            {assignedClass && <Button size="sm" variant="ghost" disabled={!ready} onClick={() => onAssign(route, characterId, "")}>{t("removePlan")}</Button>}
          </div>}
          <SearchInput value={filters.query} onChange={(query) => setFilters((previous) => ({ ...previous, query }))} placeholder={t("searchClasses")} size="sm" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Select size="sm" ariaLabel={t("tier")} value={filters.tier} onChange={(tier) => setFilters((previous) => ({ ...previous, tier }))}
              options={[{ value: "all", label: t("allTiers") }, ...CLASS_TIERS.map((id) => ({ value: id, label: t(`tiers.${id}`) }))]} />
            <Select size="sm" ariaLabel={t("weapon")} value={filters.weapon} onChange={(weapon) => setFilters((previous) => ({ ...previous, weapon }))}
              options={[{ value: "all", label: t("allWeapons") }, ...WEAPON_TYPES.map((id) => ({ value: id, label: t(`training.${id}`) }))]} />
            <Select size="sm" ariaLabel={t("movement")} value={filters.movement} onChange={(movement) => setFilters((previous) => ({ ...previous, movement }))}
              options={[{ value: "all", label: t("allMovement") }, ...MOVEMENT_TYPES.map((id) => ({ value: id, label: t(`movementTypes.${id}`) }))]} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p role="status" className="font-mono text-xs text-txt-muted">{t("results", { count: shown.length })}</p>
            {!!comparison.length && <Button size="sm" onClick={() => comparisonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>{t("viewComparison", { count: comparison.length })}</Button>}
            <Button size="sm" variant="ghost" onClick={() => setFilters({ query: "", tier: "all", weapon: "all", movement: "all" })}>{t("resetFilters")}</Button>
          </div>
        </div>
        {!ready && <p role="status" className="text-sm text-txt-muted">{t("loading")}</p>}
        <div className="grid items-stretch gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map((entry) => <ClassCard key={entry.id} entry={entry} selected={entry.id === assignedId} comparisonSelected={comparisonIds.includes(entry.id)}
            comparisonDisabled={comparisonIds.length >= 3} onCompare={toggleComparison}
            onAssign={ready && character ? (id) => onAssign(route, characterId, id) : undefined} characterName={character?.name} />)}
        </div>
        {!shown.length && <p className="border border-solid border-line p-8 text-center text-txt-muted">{t("noResults")}</p>}
      </section>
    </div>
  </div>
}

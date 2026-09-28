"use client"

import * as React from "react"
import Image from "next/image"
import { SearchInput } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import { CHARACTER_PORTRAITS } from "@/features/fortunes-weave/characters"
import {
  CHARACTERS,
  FORTUNES_WEAVE_SOURCE_URL,
  RECRUITMENT_TYPES,
  ROUTES,
  ROUTE_IDS,
  type RecruitmentCondition,
  type RecruitmentType,
  type RouteId,
  type WeaveCharacter,
} from "../data"

type Progress = Record<RouteId, Record<string, boolean>>
type ManualAssignments = Record<RouteId, string[]>
type TrackerState = { progress: Progress; manualAssignments: ManualAssignments }
type TrackerView = RouteId | "global"
type StatusFilter = "all" | "recruited" | "pending" | "notRecruitedAny" | "available" | "unavailable"
type SortBy = "name" | "renown" | "support"

const SUPPORT_LEVELS = [1, 2, 3]
const RENOWN_LEVELS = [3, 4, 5, 6, 7, 8, 9, 10]

function createDefaultProgress(): Progress {
  return Object.fromEntries(
    ROUTE_IDS.map((route) => [
      route,
      Object.fromEntries(CHARACTERS.map((character) => [character.id, character.routes[route].initiallyRecruited])),
    ]),
  ) as Progress
}

function createDefaultManualAssignments(): ManualAssignments {
  return Object.fromEntries(ROUTE_IDS.map((route) => [route, [] as string[]])) as ManualAssignments
}

function isTrackedOnRoute(
  character: WeaveCharacter,
  route: RouteId,
  manualAssignments: ManualAssignments,
): boolean {
  return character.routes[route].available || manualAssignments[route].includes(character.id)
}

function mergeStoredProgress(value: unknown): TrackerState {
  const progress = createDefaultProgress()
  const manualAssignments = createDefaultManualAssignments()
  if (typeof value !== "object" || value === null) return { progress, manualAssignments }

  const saved = value as Record<string, unknown>
  const hasProgressEnvelope = typeof saved.progress === "object" && saved.progress !== null
  const savedProgress = (hasProgressEnvelope ? saved.progress : saved) as Partial<
    Record<RouteId, Record<string, unknown>>
  >
  const savedAssignments = (
    typeof saved.manualAssignments === "object" && saved.manualAssignments !== null
      ? saved.manualAssignments
      : {}
  ) as Partial<Record<RouteId, unknown>>

  for (const route of ROUTE_IDS) {
    for (const character of CHARACTERS) {
      const recruited = savedProgress[route]?.[character.id]
      if (typeof recruited === "boolean") {
        progress[route][character.id] = recruited
      }
    }

    const assignments = savedAssignments[route]
    if (Array.isArray(assignments)) {
      manualAssignments[route] = Array.from(new Set(assignments.filter((id): id is string =>
        typeof id === "string" && CHARACTERS.some((character) =>
          character.id === id && !character.routes[route].available,
        ),
      )))
    }
  }

  return { progress, manualAssignments }
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-txt-muted">
      <span>{label}</span>
      <select
        className="h-11 w-full rounded-lg border border-solid border-line bg-base-2 px-3 text-[0.875rem] font-medium normal-case tracking-normal text-txt outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function CharacterPortrait({ character, label }: { character: WeaveCharacter; label: string }) {
  const portrait = CHARACTER_PORTRAITS[character.id]
  if (!portrait) {
    return (
      <div
        role="img"
        aria-label={label}
        className="flex h-12 w-12 flex-none items-center justify-center rounded-lg border border-solid border-line bg-base-2 font-display text-xl font-bold text-accent"
      >
        <span aria-hidden="true">{character.name.slice(0, 1)}</span>
      </div>
    )
  }

  return (
    <Image
      src={portrait}
      alt={label}
      width={48}
      height={48}
      className="h-12 w-12 flex-none rounded-lg border border-solid border-line bg-base-2 object-cover"
    />
  )
}

export function FortunesWeaveTracker({ accountKey }: { accountKey: string }) {
  const t = useTranslations("otros.fortunesWeave")
  const routeLabels: Record<RouteId, string> = {
    cai: t("routes.cai"),
    dietrich: t("routes.dietrich"),
    theodora: t("routes.theodora"),
    leda: t("routes.leda"),
  }
  const typeLabels: Record<RecruitmentType, string> = {
    auto: t("types.auto"),
    dialogue: t("types.dialogue"),
    gold: t("types.gold"),
    gold_paralogue: t("types.gold_paralogue"),
    item: t("types.item"),
    item_paralogue: t("types.item_paralogue"),
    paralogue: t("types.paralogue"),
    paralogue_dialogue: t("types.paralogue_dialogue"),
    quest: t("types.quest"),
    quest_dialogue: t("types.quest_dialogue"),
    support: t("types.support"),
    unavailable: t("types.unavailable"),
  }
  const scopedAccountKey = accountKey.replace(/[^a-zA-Z0-9_-]/g, "_")
  const storageKey = "boffmedia:fortunes-weave:v2:" + scopedAccountKey
  const legacyStorageKey = "boffmedia:fortunes-weave:v1:" + scopedAccountKey
  const [route, setRoute] = React.useState<TrackerView>("global")
  const [progress, setProgress] = React.useState<Progress>(createDefaultProgress)
  const [manualAssignments, setManualAssignments] = React.useState<ManualAssignments>(createDefaultManualAssignments)
  const [hydrated, setHydrated] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [supportFilter, setSupportFilter] = React.useState("any")
  const [renownFilter, setRenownFilter] = React.useState("any")
  const [typeFilter, setTypeFilter] = React.useState("any")
  const [sortBy, setSortBy] = React.useState<SortBy>("name")

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(legacyStorageKey)
      if (saved) {
        const merged = mergeStoredProgress(JSON.parse(saved) as unknown)
        setProgress(merged.progress)
        setManualAssignments(merged.manualAssignments)
      }
    } catch {
      // If browser storage is unavailable, the tracker still works for this visit.
    } finally {
      setHydrated(true)
    }
  }, [legacyStorageKey, storageKey])

  React.useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ progress, manualAssignments }))
    } catch {
      // Keep in-memory progress when the browser blocks local storage.
    }
  }, [hydrated, manualAssignments, progress, storageKey])

  const isGlobal = route === "global"
  const activeRoute: RouteId = isGlobal ? "cai" : route
  const routeRequirements = React.useMemo(
    () => CHARACTERS.map((character) => ({ character, recruitment: character.routes[activeRoute] })),
    [activeRoute],
  )

  const filteredCharacters = React.useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return routeRequirements
      .filter(({ character, recruitment }) => {
        const candidates = isGlobal
          ? ROUTE_IDS.map((routeId) => character.routes[routeId]).filter((item) => item.available)
          : [recruitment]
        const trackedRoutes = ROUTE_IDS.filter((routeId) => isTrackedOnRoute(character, routeId, manualAssignments))
        const recruitedOnAnyTrackedRoute = trackedRoutes.some((routeId) => progress[routeId][character.id])
        const recruitedInView = isGlobal
          ? recruitedOnAnyTrackedRoute
          : progress[activeRoute][character.id]
        const pendingInView = isGlobal
          ? trackedRoutes.some((routeId) => !progress[routeId][character.id])
          : trackedRoutes.includes(activeRoute) && !progress[activeRoute][character.id]
        const searchText = isGlobal
          ? candidates.map((item) => item.searchText).join(" ")
          : recruitment.searchText

        if (term && !(character.name + " " + searchText).toLocaleLowerCase().includes(term)) return false
        if (statusFilter === "recruited" && !recruitedInView) return false
        if (statusFilter === "pending" && !pendingInView) return false
        if (statusFilter === "notRecruitedAny" && recruitedOnAnyTrackedRoute) return false
        if (statusFilter === "available" && !candidates.some((item) => item.available)) return false
        if (statusFilter === "unavailable" && candidates.some((item) => item.available)) return false
        if (supportFilter !== "any" && !candidates.some((item) => item.supportLevel === Number(supportFilter))) return false
        if (renownFilter !== "any" && !candidates.some((item) => item.renownLevel === Number(renownFilter))) return false
        if (typeFilter !== "any" && !candidates.some((item) => item.type === typeFilter)) return false
        return true
      })
      .sort((a, b) => {
        const getSortLevel = (character: WeaveCharacter, field: "renownLevel" | "supportLevel") => {
          const candidates = isGlobal
            ? ROUTE_IDS.map((routeId) => character.routes[routeId]).filter((item) => item.available)
            : [character.routes[activeRoute]]
          const levels = candidates
            .map((item) => item[field])
            .filter((level): level is number => level !== null)
          return levels.length ? Math.min(...levels) : Number.MAX_SAFE_INTEGER
        }

        if (sortBy === "renown") {
          const renownOrder = getSortLevel(a.character, "renownLevel") - getSortLevel(b.character, "renownLevel")
          if (renownOrder !== 0) return renownOrder
        }
        if (sortBy === "support") {
          const supportOrder = getSortLevel(a.character, "supportLevel") - getSortLevel(b.character, "supportLevel")
          if (supportOrder !== 0) return supportOrder
        }
        return a.character.name.localeCompare(b.character.name)
      })
  }, [activeRoute, isGlobal, manualAssignments, progress, query, renownFilter, routeRequirements, sortBy, statusFilter, supportFilter, typeFilter])

  const routeStats = React.useMemo(
    () => Object.fromEntries(ROUTE_IDS.map((routeId) => {
      const tracked = CHARACTERS.filter((character) => isTrackedOnRoute(character, routeId, manualAssignments))
      return [routeId, {
        tracked: tracked.length,
        recruited: tracked.filter((character) => progress[routeId][character.id]).length,
      }]
    })) as Record<RouteId, { tracked: number; recruited: number }>,
    [manualAssignments, progress],
  )
  const globalTracked = ROUTE_IDS.reduce((count, routeId) => count + routeStats[routeId].tracked, 0)
  const globalRecruited = ROUTE_IDS.reduce((count, routeId) => count + routeStats[routeId].recruited, 0)
  const uniqueRecruited = CHARACTERS.filter((character) =>
    ROUTE_IDS.some((routeId) => isTrackedOnRoute(character, routeId, manualAssignments) && progress[routeId][character.id]),
  ).length
  const displayedRecruited = isGlobal ? globalRecruited : routeStats[activeRoute].recruited
  const displayedTotal = isGlobal ? globalTracked : routeStats[activeRoute].tracked

  const clearFilters = () => {
    setQuery("")
    setStatusFilter("all")
    setSupportFilter("any")
    setRenownFilter("any")
    setTypeFilter("any")
    setSortBy("name")
  }

  const selectView = (view: TrackerView) => {
    setRoute(view)
    if (view !== "global") {
      setStatusFilter((current) => current === "notRecruitedAny" ? "all" : current)
    }
  }

  const markRecruited = (character: WeaveCharacter, routeId: RouteId, value: boolean) => {
    if (!isTrackedOnRoute(character, routeId, manualAssignments)) return
    setProgress((current) => ({
      ...current,
      [routeId]: { ...current[routeId], [character.id]: value },
    }))
  }

  const addCharacterToRoute = (character: WeaveCharacter, routeId: RouteId) => {
    if (character.routes[routeId].available) return
    setManualAssignments((current) => ({
      ...current,
      [routeId]: current[routeId].includes(character.id)
        ? current[routeId]
        : [...current[routeId], character.id],
    }))
  }

  const removeCharacterFromRoute = (character: WeaveCharacter, routeId: RouteId) => {
    setManualAssignments((current) => ({
      ...current,
      [routeId]: current[routeId].filter((id) => id !== character.id),
    }))
    setProgress((current) => ({
      ...current,
      [routeId]: { ...current[routeId], [character.id]: false },
    }))
  }

  const conditionLabel = (condition: RecruitmentCondition): string => {
    switch (condition.kind) {
      case "automatic":
        return t("conditions.automatic")
      case "recruitmentTutorial":
        return t("conditions.recruitmentTutorial")
      case "automaticChapter":
        return t("conditions.automaticChapter", { chapter: condition.chapter })
      case "paralogue":
        return t("conditions.paralogue", { name: condition.name })
      case "pay":
        return t("conditions.pay", { amount: condition.amount })
      case "recruitmentQuest":
        return t("conditions.recruitmentQuest")
      case "questCount":
        return t("conditions.questCount", { count: condition.count })
      case "completeQuest":
        return t("conditions.completeQuest", { name: condition.name })
      case "giveItem":
        return t("conditions.giveItem", { count: condition.count, item: condition.item })
      case "suitableItem":
        return t("conditions.suitableItem")
      case "answerYesThreeTimes":
        return t("conditions.answerYesThreeTimes")
      case "chooseTails":
        return t("conditions.chooseTails")
      case "answerOptions":
        return t("conditions.answerOptions", {
          choices: condition.options.join(" " + t("conditions.or") + " "),
        })
      case "negotiatePayment":
        return t("conditions.negotiatePayment")
      case "answerQuestionThreeTimes":
        return t("conditions.answerQuestionThreeTimes")
    }
  }

  const statusOptions = [
    { value: "all", label: t("filters.allStatuses") },
    { value: "pending", label: t(isGlobal ? "filters.pendingAny" : "filters.notRecruited") },
    ...(isGlobal ? [{ value: "notRecruitedAny", label: t("filters.notRecruitedAny") }] : []),
    { value: "recruited", label: t("filters.recruited") },
    { value: "available", label: t(isGlobal ? "filters.availableAny" : "filters.available") },
    { value: "unavailable", label: t(isGlobal ? "filters.unavailableEvery" : "filters.unavailable") },
  ]
  const typeOptions = [
    { value: "any", label: t("filters.anyType") },
    ...RECRUITMENT_TYPES.filter((type) => type !== "unavailable").map((type) => ({
      value: type,
      label: typeLabels[type],
    })),
  ]
  const supportOptions = [
    { value: "any", label: t("filters.anySupport") },
    ...SUPPORT_LEVELS.map((level) => ({ value: String(level), label: t("filters.supportLevel", { level }) })),
  ]
  const renownOptions = [
    { value: "any", label: t("filters.anyRenown") },
    ...RENOWN_LEVELS.map((level) => ({ value: String(level), label: t("filters.renownLevel", { level }) })),
  ]
  const sortOptions = [
    { value: "name", label: t("filters.sortName") },
    { value: "renown", label: t("filters.sortRenown") },
    { value: "support", label: t("filters.sortSupport") },
  ]

  return (
    <main className="mx-auto w-full max-w-[112rem] space-y-8">
      <header className="max-w-4xl">
        <p className="mono-label mb-3">{t("eyebrow")}</p>
        <h1 className="text-[clamp(2rem,4.5vw,4rem)]">{t("title")}</h1>
        <p className="mt-3 max-w-[68ch] text-[1rem] leading-7 text-txt-muted">{t("description")}</p>
        <a
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
          href={FORTUNES_WEAVE_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
        >
          {t("sourceLink")}
          <span aria-hidden="true">↗</span>
        </a>
        <p className="mt-2 text-xs leading-5 text-txt-dim">{t("sourceNote")}</p>
      </header>

      <section aria-label={t("progress.title")} className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-solid border-line bg-panel p-5">
          <p className="mono-label">
            {isGlobal ? t("progress.allRoutes") : t("progress.currentRoute", { route: routeLabels[activeRoute] })}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-display text-4xl font-bold leading-none text-txt">{displayedRecruited}</span>
            <span className="mb-0.5 text-sm text-txt-muted">
              {t(isGlobal ? "progress.outOfAllRoutes" : "progress.outOf", { total: displayedTotal })}
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-base-2">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: displayedTotal ? ((displayedRecruited / displayedTotal) * 100) + "%" : "0%" }}
            />
          </div>
          {isGlobal && <p className="mt-3 text-sm text-txt-muted">{t("progress.globalNote")}</p>}
        </div>
        <div className="rounded-xl border border-solid border-line bg-panel p-5">
          <p className="mono-label">{t("progress.uniqueRoster")}</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-display text-4xl font-bold leading-none text-txt">{uniqueRecruited}</span>
            <span className="mb-0.5 text-sm text-txt-muted">{t("progress.outOf", { total: CHARACTERS.length })}</span>
          </div>
          <p className="mt-4 text-sm text-txt-muted">{t("progress.savedLocally")}</p>
        </div>
      </section>

      <nav aria-label={t("routes.label")} className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <button
          type="button"
          aria-current={isGlobal ? "page" : undefined}
          onClick={() => selectView("global")}
          className={
            "rounded-xl border border-solid p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
            (isGlobal ? "border-accent bg-base-2" : "border-line bg-panel hover:border-line-2")
          }
        >
          <span className="flex items-center justify-between gap-3">
            <span className="font-display text-lg font-bold text-txt">{t("routes.global")}</span>
            <span className="font-mono text-sm font-semibold text-accent">{uniqueRecruited}/{CHARACTERS.length}</span>
          </span>
          <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-base-2">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: CHARACTERS.length ? ((uniqueRecruited / CHARACTERS.length) * 100) + "%" : "0%" }}
            />
          </span>
        </button>
        {ROUTES.map((item) => {
          const count = routeStats[item.id].recruited
          const total = routeStats[item.id].tracked
          const selected = route === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-current={selected ? "page" : undefined}
              onClick={() => selectView(item.id)}
              className={
                "rounded-xl border border-solid p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
                (selected ? "border-accent bg-base-2" : "border-line bg-panel hover:border-line-2")
              }
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-display text-lg font-bold text-txt">{routeLabels[item.id]}</span>
                <span className="font-mono text-sm font-semibold text-accent">{count}/{total}</span>
              </span>
              <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-base-2">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{ width: total ? ((count / total) * 100) + "%" : "0%" }}
                />
              </span>
            </button>
          )
        })}
      </nav>

      <section className="rounded-xl border border-solid border-line bg-panel p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">{t("filters.title")}</h2>
            <p className="mt-1 text-sm text-txt-muted">{t(isGlobal ? "filters.leadGlobal" : "filters.lead")}</p>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md px-3 py-2 text-sm font-semibold text-accent transition hover:bg-base-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t("filters.clear")}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="sm:col-span-2">
            <SearchInput
              size="md"
              value={query}
              onChange={setQuery}
              placeholder={t("filters.search")}
              ariaLabel={t("filters.searchAria")}
            />
          </div>
          <FilterSelect label={t("filters.status")} value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)} options={statusOptions} />
          <FilterSelect label={t("filters.support")} value={supportFilter} onChange={setSupportFilter} options={supportOptions} />
          <FilterSelect label={t("filters.renown")} value={renownFilter} onChange={setRenownFilter} options={renownOptions} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <FilterSelect label={t("filters.type")} value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
          <FilterSelect label={t("filters.sort")} value={sortBy} onChange={(value) => setSortBy(value as SortBy)} options={sortOptions} />
        </div>
      </section>

      <section aria-live="polite" aria-label={t("results.label")}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">{t("results.count", { count: filteredCharacters.length })}</h2>
          <span className="text-sm text-txt-muted">
            {isGlobal ? t("results.global") : t("results.route", { route: routeLabels[activeRoute] })}
          </span>
        </div>

        {filteredCharacters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-panel px-6 py-12 text-center">
            <p className="font-display text-lg font-bold">{t("results.emptyTitle")}</p>
            <p className="mt-2 text-sm text-txt-muted">{t("results.emptyDescription")}</p>
          </div>
        ) : (
          <div className={isGlobal ? "grid gap-3" : "grid gap-3 lg:grid-cols-2"}>
            {filteredCharacters.map(({ character, recruitment }) => {
              const recruited = progress[activeRoute][character.id]
              const tracked = isTrackedOnRoute(character, activeRoute, manualAssignments)
              const manuallyAssigned = !recruitment.available && tracked

              if (isGlobal) {
                return (
                  <article key={character.id} className="min-w-0 rounded-xl border border-solid border-line bg-panel p-4 md:p-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <CharacterPortrait character={character} label={t("portraitAlt", { name: character.name })} />
                      <h3 className="font-display text-xl font-bold leading-tight text-txt">{character.name}</h3>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {ROUTES.map((item) => {
                        const routeRecruitment = character.routes[item.id]
                        const routeTracked = isTrackedOnRoute(character, item.id, manualAssignments)
                        const routeManual = !routeRecruitment.available && routeTracked
                        const routeRecruited = progress[item.id][character.id]

                        return (
                          <section key={item.id} className="min-w-0 rounded-lg border border-solid border-line bg-base-2 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="font-display font-bold text-txt">{routeLabels[item.id]}</h4>
                              {routeManual && (
                                <span className="rounded-full border border-solid border-line px-2 py-1 text-[0.625rem] font-semibold text-txt-muted">
                                  {t("actions.manualTracking")}
                                </span>
                              )}
                            </div>

                            {routeRecruitment.available ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <span className="rounded-md border border-solid border-line px-2 py-1 text-[0.625rem] font-semibold text-txt-muted">
                                  {typeLabels[routeRecruitment.type]}
                                </span>
                                {routeRecruitment.supportLevel !== null && (
                                  <span className="rounded-md border border-solid border-line px-2 py-1 text-[0.625rem] font-semibold text-txt-muted">
                                    {t("requirements.support", { level: routeRecruitment.supportLevel })}
                                  </span>
                                )}
                                {routeRecruitment.renownLevel !== null && (
                                  <span className="rounded-md border border-solid border-line px-2 py-1 text-[0.625rem] font-semibold text-txt-muted">
                                    {t("requirements.renown", { level: routeRecruitment.renownLevel })}
                                  </span>
                                )}
                                {routeRecruitment.supportLevel === null && routeRecruitment.renownLevel === null && (
                                  <span className="rounded-md border border-solid border-line px-2 py-1 text-[0.625rem] font-semibold text-txt-muted">
                                    {t("requirements.none")}
                                  </span>
                                )}
                              </div>
                            ) : !routeManual ? (
                              <p className="mt-2 text-xs leading-5 text-txt-muted">{t("actions.sourceUnavailable")}</p>
                            ) : null}

                            {routeTracked ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  aria-pressed={routeRecruited}
                                  onClick={() => markRecruited(character, item.id, !routeRecruited)}
                                  className={
                                    "inline-flex items-center justify-center gap-2 rounded-lg border border-solid px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
                                    (routeRecruited
                                      ? "border-emerald-700/50 bg-emerald-900/20 text-emerald-200 hover:bg-emerald-900/35"
                                      : "border-line bg-panel text-txt hover:border-accent")
                                  }
                                >
                                  <span aria-hidden="true">{routeRecruited ? "✓" : "+"}</span>
                                  {routeRecruited ? t("actions.recruited") : t("actions.markRecruited")}
                                </button>
                                {routeManual && (
                                  <button
                                    type="button"
                                    onClick={() => removeCharacterFromRoute(character, item.id)}
                                    aria-label={t("actions.removeFromRoute", { route: routeLabels[item.id] })}
                                    className="rounded-lg px-2 py-2 text-xs font-semibold text-txt-muted transition hover:bg-panel hover:text-txt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                  >
                                    {t("actions.remove")}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addCharacterToRoute(character, item.id)}
                                className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-solid border-accent px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                              >
                                <span aria-hidden="true">+</span>
                                {t("actions.addToRoute", { route: routeLabels[item.id] })}
                              </button>
                            )}
                          </section>
                        )
                      })}
                    </div>
                  </article>
                )
              }

              return (
                <article
                  key={character.id}
                  className="flex min-w-0 flex-col justify-between gap-4 rounded-xl border border-solid border-line bg-panel p-4 sm:flex-row sm:items-start"
                >
                  <div className="flex min-w-0 gap-3">
                    <CharacterPortrait character={character} label={t("portraitAlt", { name: character.name })} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-bold leading-tight text-txt">{character.name}</h3>
                        <span className="rounded-full border border-solid border-line px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-txt-muted">
                          {manuallyAssigned ? t("actions.manualTracking") : typeLabels[recruitment.type]}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {recruitment.supportLevel !== null && (
                          <span className="rounded-md bg-base-2 px-2.5 py-1.5 text-xs font-semibold text-txt">
                            {t("requirements.support", { level: recruitment.supportLevel })}
                          </span>
                        )}
                        {recruitment.renownLevel !== null && (
                          <span className="rounded-md bg-base-2 px-2.5 py-1.5 text-xs font-semibold text-txt">
                            {t("requirements.renown", { level: recruitment.renownLevel })}
                          </span>
                        )}
                        {recruitment.supportLevel === null && recruitment.renownLevel === null && (
                          <span className="rounded-md bg-base-2 px-2.5 py-1.5 text-xs font-semibold text-txt-muted">
                            {t("requirements.none")}
                          </span>
                        )}
                      </div>
                      {recruitment.conditions.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm leading-6 text-txt-muted">
                          {recruitment.conditions.map((condition, index) => (
                            <li key={character.id + "-" + index} className="before:mr-2 before:text-accent before:content-['•']">
                              {conditionLabel(condition)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {tracked ? (
                    <button
                      type="button"
                      aria-pressed={recruited}
                      onClick={() => markRecruited(character, activeRoute, !recruited)}
                      className={
                        "inline-flex flex-none items-center justify-center gap-2 rounded-lg border border-solid px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-w-[10rem] " +
                        (recruited
                          ? "border-emerald-700/50 bg-emerald-900/20 text-emerald-200 hover:bg-emerald-900/35"
                          : "border-line bg-base-2 text-txt hover:border-accent")
                      }
                    >
                      <span aria-hidden="true">{recruited ? "✓" : "+"}</span>
                      {recruited ? t("actions.recruited") : t("actions.markRecruited")}
                    </button>
                  ) : (
                    <span className="flex-none self-start rounded-lg bg-base-2 px-3 py-2.5 text-sm font-semibold text-txt-dim">
                      {t("actions.unavailable")}
                    </span>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-txt-dim">{t("progress.localStorageNote")}</p>
    </main>
  )
}

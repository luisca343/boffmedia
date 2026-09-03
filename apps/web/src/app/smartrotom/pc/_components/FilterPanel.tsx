"use client"

import { useMemo, useState, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { usePokemonStore } from "@/stores/pokemonStore"
import { useMarks, useMons } from "../_hooks/queries"
import { usePcUi } from "../_stores/pcUiStore"
import type { PokemonFilter, Sort, SortField } from "../_types/pc.types"
import { ALL_TYPES } from "../_utils/constants"
import { filterMons } from "../_utils/filters"
import { allTags } from "../_utils/marks"
import { typeColor } from "../_utils/typeColors"
import { Button, Icon, Input, Modal, Select, TypeBadge, type IconName } from "./ui"

function Section({
  icon,
  title,
  badge,
  children,
}: {
  icon: IconName
  title: string
  badge?: number
  children: ReactNode
}) {
  return (
    <section className="mb-5">
      <div className="mb-[0.6875rem] flex items-center gap-2">
        <Icon name={icon} size={15} className="text-pc-accent" />
        <h3 className="text-[0.8125rem] font-bold">{title}</h3>
        {!!badge && (
          <span className="rounded-pc-pill bg-pc-accent px-2 py-px text-[0.71875rem] font-semibold text-white">{badge}</span>
        )}
      </div>
      {children}
    </section>
  )
}

/** Solid glyphs read as "on"; an outline one (a tag, a gender) would just blob. */
const FILLABLE: ReadonlySet<string> = new Set(["heart", "sparkles", "star", "zap"])

/** A state toggle. The tone is a literal `text-pc-*` class, never interpolated. */
function Toggle({
  label,
  icon,
  tone,
  on,
  onClick,
}: {
  label: string
  icon: IconName
  tone: string
  on: boolean
  onClick: () => void
}) {
  return (
    <Button onClick={onClick} active={on} className="justify-start">
      <Icon name={icon} size={14} className={tone} fill={on && FILLABLE.has(icon) ? "currentColor" : "none"} />
      <span className="flex-1 text-left">{label}</span>
      {on && <Icon name="check" size={14} className="text-pc-accent" />}
    </Button>
  )
}

const SORT_FIELD_KEYS: [SortField, string][] = [
  ["box", "filters.sortFields.box"],
  ["level", "filters.sortFields.level"],
  ["dex", "filters.sortFields.dex"],
  ["name", "filters.sortFields.name"],
  ["iv", "filters.sortFields.iv"],
]

export interface FilterPanelProps {
  onClose: () => void
}

export function FilterPanel({ onClose }: FilterPanelProps) {
  const t = useTranslations("pc")
  const { mons } = useMons()
  const { data: marks } = useMarks()
  const pokemonByDex = usePokemonStore((s) => s.pokemonByDex)

  const storeFilters = usePcUi((s) => s.filters)
  const storeSearch = usePcUi((s) => s.search)
  const storeSort = usePcUi((s) => s.sort)
  const setFilters = usePcUi((s) => s.setFilters)
  const setSearch = usePcUi((s) => s.setSearch)
  const setSort = usePcUi((s) => s.setSort)

  const [f, setF] = useState<PokemonFilter>(storeFilters)
  const [s, setS] = useState(storeSearch)
  const [sort, setLocalSort] = useState<Sort>(storeSort)

  /**
   * Natures and abilities are derived from the collection itself: the game server has
   * no natures/abilities endpoint, so the only honest option list is the one the user
   * actually owns.
   */
  const { natures, abilities } = useMemo(() => {
    const n = new Set<string>()
    const a = new Set<string>()
    for (const m of mons) {
      if (m.pokemon.nature) n.add(m.pokemon.nature)
      if (m.pokemon.ability) a.add(m.pokemon.ability)
    }
    const by = (x: string, y: string) => x.localeCompare(y)
    return { natures: [...n].sort(by), abilities: [...a].sort(by) }
  }, [mons])

  const tags = useMemo(() => allTags(marks ?? {}), [marks])

  const count = useMemo(
    () => filterMons(mons, f, s, { speciesByDex: pokemonByDex, marks: marks ?? {} }).length,
    [mons, f, s, pokemonByDex, marks],
  )

  /** An off toggle is an *absent* key, so `hasAnyFilter` never counts a `false`. */
  const upd = (patch: Partial<PokemonFilter>) =>
    setF((prev) => {
      const next: PokemonFilter = { ...prev, ...patch }
      for (const k of Object.keys(next) as (keyof PokemonFilter)[]) {
        const v = next[k]
        if (v == null || v === false || v === "") delete next[k]
      }
      return next
    })

  const toggleType = (t: string) => {
    const cur = f.types ?? []
    const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]
    upd({ types: next.length ? next : undefined })
  }

  const apply = () => {
    setFilters(f)
    setSearch(s)
    setSort(sort)
    onClose()
  }

  return (
    <Modal
      onClose={onClose}
      title={t("filters.title")}
      subtitle={t("filters.subtitle")}
      icon="sliders"
      tone="text-pc-violet"
      width={560}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              setF({})
              setS("")
            }}
          >
            {t("common.clear")}
          </Button>
          <div className="flex-1 text-right text-[0.78125rem] text-pc-fg-muted">
            <b className="text-pc-accent">{count}</b> {t("filters.matchCount", { count })}
          </div>
          <Button variant="primary" onClick={apply}>
            <Icon name="check" size={15} />
            {t("common.apply")}
          </Button>
        </>
      }
    >
      <div className="p-[1.125rem]">
        <Section icon="search" title={t("filters.searchAndSort")}>
          <div className="relative mb-2.5">
            <Icon name="search" size={15} className="absolute left-[0.6875rem] top-[0.6875rem] text-pc-fg-subtle" />
            <Input
              value={s}
              onChange={(e) => setS(e.target.value)}
              aria-label={t("common.search")}
              placeholder={t("filters.searchPlaceholder")}
              className="pl-[2.0625rem]"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={sort.field}
              aria-label={t("filters.sortBy")}
              onChange={(e) => setLocalSort({ ...sort, field: e.target.value as SortField })}
              className="flex-1"
            >
              {SORT_FIELD_KEYS.map(([v, key]) => (
                <option key={v} value={v}>
                  {t(key)}
                </option>
              ))}
            </Select>
            <Button onClick={() => setLocalSort({ ...sort, dir: sort.dir === "asc" ? "desc" : "asc" })}>
              <Icon name="sort" size={14} />
              {sort.dir === "asc" ? t("filters.asc") : t("filters.desc")}
            </Button>
          </div>
        </Section>

        <Section icon="grid" title={t("filters.types")} badge={f.types?.length}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(4.875rem,1fr))] gap-1.5">
            {ALL_TYPES.map((t) => {
              const on = (f.types ?? []).includes(t)
              const { c } = typeColor(t)
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  aria-pressed={on}
                  className="flex justify-center rounded-[9px] px-1 py-1.5 focus-visible:outline-none"
                  // The type colour is data, so the lit border/wash is inline.
                  style={{
                    border: on ? `1.5px solid ${c}` : "1px solid var(--pc-line)",
                    background: on ? `${c}26` : "rgb(255 255 255 / .02)",
                  }}
                >
                  <TypeBadge type={t} size="sm" />
                </button>
              )
            })}
          </div>
        </Section>

        <Section icon="sort" title={t("filters.levelRange")} badge={f.minLevel || f.maxLevel ? 1 : 0}>
          <div className="flex items-center gap-2.5">
            <Input
              type="number"
              min={1}
              max={100}
              aria-label={t("filters.minLevel")}
              placeholder={t("filters.minLevel")}
              value={f.minLevel ?? ""}
              onChange={(e) => upd({ minLevel: e.target.value ? Number(e.target.value) : undefined })}
              className="flex-1"
            />
            <span className="text-pc-fg-subtle">—</span>
            <Input
              type="number"
              min={1}
              max={100}
              aria-label={t("filters.maxLevel")}
              placeholder={t("filters.maxLevel")}
              value={f.maxLevel ?? ""}
              onChange={(e) => upd({ maxLevel: e.target.value ? Number(e.target.value) : undefined })}
              className="flex-1"
            />
          </div>
        </Section>

        <Section icon="star" title={t("filters.specialStatus")}>
          <div className="grid grid-cols-2 gap-[0.4375rem]">
            <Toggle
              label={t("filters.statusToggles.shiny")}
              icon="sparkles"
              tone="text-pc-gold"
              on={!!f.isShiny}
              onClick={() => upd({ isShiny: !f.isShiny })}
            />
            <Toggle
              label={t("filters.statusToggles.legendary")}
              icon="zap"
              tone="text-pc-violet"
              on={!!f.isLegendary}
              onClick={() => upd({ isLegendary: !f.isLegendary })}
            />
            <Toggle
              label={t("filters.statusToggles.withItem")}
              icon="tag"
              tone="text-pc-amber"
              on={!!f.hasItem}
              onClick={() => upd({ hasItem: !f.hasItem })}
            />
            <Toggle
              label={t("filters.statusToggles.favorite")}
              icon="heart"
              tone="text-pc-rose"
              on={!!f.isFavorited}
              onClick={() => upd({ isFavorited: !f.isFavorited })}
            />
          </div>
        </Section>

        <Section icon="users" title={t("filters.gender")}>
          <div className="grid grid-cols-3 gap-[0.4375rem]">
            <Toggle
              label={t("filters.genderOptions.male")}
              icon="mars"
              tone="text-[#5aa9ff]"
              on={f.gender === "male"}
              onClick={() => upd({ gender: f.gender === "male" ? undefined : "male" })}
            />
            <Toggle
              label={t("filters.genderOptions.female")}
              icon="venus"
              tone="text-[#ff7eb6]"
              on={f.gender === "female"}
              onClick={() => upd({ gender: f.gender === "female" ? undefined : "female" })}
            />
            <Toggle
              label={t("filters.genderOptions.genderless")}
              icon="neuter"
              tone="text-pc-fg-muted"
              on={f.gender === "genderless"}
              onClick={() => upd({ gender: f.gender === "genderless" ? undefined : "genderless" })}
            />
          </div>
        </Section>

        <div className="grid grid-cols-2 gap-3.5">
          <Section icon="info" title={t("filters.nature")}>
            <Select
              value={f.nature ?? ""}
              aria-label={t("filters.nature")}
              onChange={(e) => upd({ nature: e.target.value || undefined })}
            >
              <option value="">{t("filters.all")}</option>
              {natures.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Section>
          <Section icon="zap" title={t("filters.ability")}>
            <Select
              value={f.ability ?? ""}
              aria-label={t("filters.ability")}
              onChange={(e) => upd({ ability: e.target.value || undefined })}
            >
              <option value="">{t("filters.all")}</option>
              {abilities.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </Section>
        </div>

        <Section icon="tag" title={t("filters.tag")}>
          <Select value={f.tag ?? ""} aria-label={t("filters.tag")} onChange={(e) => upd({ tag: e.target.value || undefined })}>
            <option value="">{t("filters.all")}</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Section>
      </div>
    </Modal>
  )
}

"use client"

import { useCallback, useEffect, useMemo, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { usePokemonStore } from "@/stores/pokemonStore"
import { useMarks, useMons, useSetMark } from "../_hooks/queries"
import { locId, usePcUi } from "../_stores/pcUiStore"
import type { Mon, SlotLoc } from "../_types/pc.types"
import { WALLPAPER_CLASS, defaultTheme } from "../_utils/boxThemes"
import {
  displayName,
  isLegendary,
  isNicknamed,
  isShiny,
  ivPct,
  isFainted,
  hasItem,
  prettyItem,
  typesOf,
} from "../_utils/derive"
import { hasAnyFilter, filterMons, sortMons } from "../_utils/filters"
import { markOf } from "../_utils/marks"
import { MovesGrid } from "./MovesGrid"
import { StatBars } from "./StatBars"
import { TagEditor } from "./TagEditor"
import { TypeMatchups } from "./TypeMatchups"
import {
  Button,
  Chip,
  Drawer,
  GenderIconFor,
  Icon,
  Sprite,
  TypeBadge,
  toast,
  type IconName,
} from "./ui"

/**
 * The Pokémon drawer.
 *
 * What it does **not** show is the point: the game payload carries no Poké Ball, no
 * OT, no met location, no friendship and no obtained date, so none of them appear —
 * the prototype's versions of those were mock data. There is no release endpoint
 * either (and there will not be one from the web), so there is no "Liberar" button
 * and no footer to hold it.
 */
export function PokemonDetail() {
  const t = useTranslations("pc")
  const detail = usePcUi((s) => s.detail)
  const setDetail = usePcUi((s) => s.setDetail)
  const compare = usePcUi((s) => s.compare)
  const toggleCompare = usePcUi((s) => s.toggleCompare)
  const filters = usePcUi((s) => s.filters)
  const search = usePcUi((s) => s.search)
  const sort = usePcUi((s) => s.sort)
  const boxMeta = usePcUi((s) => s.boxMeta)

  const { mons } = useMons()
  const { data: marks } = useMarks()
  const setMark = useSetMark()
  const speciesByDex = usePokemonStore((s) => s.pokemonByDex)

  const mon = useMemo(
    () => (detail ? (mons.find((m) => locId(m.loc) === locId(detail)) ?? null) : null),
    [detail, mons],
  )

  /**
   * What ← / → walks through. A filtered board is a list in its own right, so the
   * arrows follow *that* when one is active; otherwise they follow the Pokémon's own
   * container — the box it sits in, or the party.
   */
  const neighbours = useMemo<SlotLoc[]>(() => {
    if (!detail) return []
    if (hasAnyFilter(filters, search)) {
      const results = sortMons(filterMons(mons, filters, search, { speciesByDex, marks: marks ?? {} }), sort)
      return results.map((m) => m.loc)
    }
    const inSameContainer = (m: Mon) =>
      detail.kind === "party" ? m.loc.kind === "party" : m.loc.kind === "box" && m.loc.box === detail.box
    return mons
      .filter(inSameContainer)
      .sort((a, b) => a.loc.index - b.loc.index)
      .map((m) => m.loc)
  }, [detail, filters, search, sort, mons, speciesByDex, marks])

  const index = detail ? neighbours.findIndex((l) => locId(l) === locId(detail)) : -1

  const nav = useCallback(
    (step: number) => {
      if (index < 0 || neighbours.length < 2) return
      const next = (index + step + neighbours.length) % neighbours.length
      setDetail(neighbours[next])
    },
    [index, neighbours, setDetail],
  )

  // Escape is already handled by the Overlay; only the arrows are ours.
  useEffect(() => {
    if (!detail) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return
      e.preventDefault()
      nav(e.key === "ArrowLeft" ? -1 : 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [detail, nav])

  if (!detail || !mon) return null

  const p = mon.pokemon
  const mark = markOf(marks ?? {}, mon.key)
  const id = locId(mon.loc)
  const inCompare = compare.includes(id)
  const types = typesOf(p, speciesByDex)

  const theme = mon.loc.kind === "box" ? (boxMeta[mon.loc.box ?? 0]?.theme ?? defaultTheme(mon.loc.box ?? 0)) : "classic"

  const locLabel =
    mon.loc.kind === "party"
      ? t("detail.level")
      : `${t("filters.sortFields.box")} ${(mon.loc.box ?? 0) + 1} · ${t("detail.level")} ${mon.loc.index + 1}`

  const onCompare = () => {
    const error = toggleCompare(id)
    if (error) toast(error, "info")
  }

  return (
    <Drawer onClose={() => setDetail(null)} width={460} label={displayName(p)}>
      <header className="flex flex-none items-center gap-2 border-b border-pc-line px-4 py-3.5">
        <Button
          icon
          onClick={() => nav(-1)}
          disabled={neighbours.length < 2 || index < 0}
          aria-label={t("common.back")}
          title={t("common.back")}
        >
          <Icon name="chevL" size={16} />
        </Button>
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate font-pc-display text-[0.6875rem] uppercase tracking-[.06em] text-pc-fg-subtle">
            {locLabel}
          </div>
          <div className="font-pc-mono text-[0.6875rem] text-pc-fg-subtle">
            {index >= 0 ? index + 1 : "—"} / {neighbours.length}
          </div>
        </div>
        <Button
          icon
          onClick={() => nav(1)}
          disabled={neighbours.length < 2 || index < 0}
          aria-label={t("common.back")}
          title={t("common.back")}
        >
          <Icon name="chevR" size={16} />
        </Button>
        <Button variant="ghost" icon onClick={() => setDetail(null)} aria-label={t("common.close")} title={t("common.close")}>
          <Icon name="x" size={18} />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="relative overflow-hidden px-[1.125rem] pb-3.5 pt-[1.125rem] text-center">
          <span className={`pc-wp pc-wp-dots opacity-50 ${WALLPAPER_CLASS[theme]}`} aria-hidden="true" />

          <div className="relative">
            <div
              className={`mx-auto h-[10.5rem] w-[10.5rem] animate-pc-float motion-reduce:animate-none ${isFainted(p) ? "grayscale" : ""}`}
            >
              <Sprite
                dex={p.dex}
                form={p.form}
                palette={p.palette}
                pixelated={false}
                alt={displayName(p)}
                className="h-full w-full"
              />
            </div>

            <div className="mt-1 flex items-center justify-center gap-2">
              <h2 className="font-pc-display text-2xl font-bold text-pc-fg">{displayName(p)}</h2>
              <GenderIconFor pokemon={p} size={18} />
              {isShiny(p) && (
                <Icon name="sparkles" size={18} fill="currentColor" className="text-pc-gold" />
              )}
            </div>

            {isNicknamed(p) && <div className="text-xs text-pc-fg-subtle">{p.species}</div>}

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className="font-pc-mono text-[0.71875rem] text-pc-fg-subtle">
                #{String(p.dex).padStart(3, "0")}
              </span>
              <Chip className="text-[0.6875rem]">{t("detail.level")} {p.level}</Chip>
              {isLegendary(p) && (
                <Chip className="border-pc-violet text-[0.6875rem] text-pc-violet">
                  <Icon name="zap" size={11} />
                  {t("filters.statusToggles.legendary")}
                </Chip>
              )}
            </div>

            {types.length > 0 && (
              <div className="mt-2.5 flex justify-center gap-1.5">
                {types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-[0.4375rem] px-4 pb-3.5">
          <Button
            onClick={() => setMark.mutate({ key: mon.key, patch: { favorite: !mark.favorite } })}
            disabled={setMark.isPending}
            aria-pressed={mark.favorite}
            className={`flex-1 justify-center ${mark.favorite ? "border-pc-rose text-pc-rose" : ""}`}
          >
            <Icon name="heart" size={14} fill={mark.favorite ? "currentColor" : "none"} />
            {t("filters.statusToggles.favorite")}
          </Button>
          <Button
            onClick={onCompare}
            aria-pressed={inCompare}
            className={`flex-1 justify-center ${inCompare ? "border-pc-violet text-pc-violet" : ""}`}
          >
            <Icon name="layers" size={14} />
            {inCompare ? t("compare.title") : t("compare.title")}
          </Button>
        </div>

        <div className="flex flex-col gap-5 px-[1.125rem] pb-6">
          <section>
            <SectionTitle icon="sliders">{t("detail.stats")}</SectionTitle>
            <StatBars pokemon={p} />
            <div className="mt-3 flex gap-3.5 text-xs">
              <span className="text-pc-fg-muted">
                {t("detail.nature")}: <b className="text-pc-fg">{p.nature}</b>
              </span>
              <span className="text-pc-fg-muted">
                {t("filters.sortFields.iv")}{" "}
                <b className={ivPct(p) > 80 ? "text-pc-green" : "text-pc-fg"}>{ivPct(p)}%</b>
              </span>
            </div>
            <div className="mt-1.5 text-xs text-pc-fg-muted">
              {t("filters.ability")}: <b className="text-pc-fg">{p.ability}</b>
              {hasItem(p) && (
                <>
                  {" · "}{t("detail.item")}: <b className="text-pc-amber">{prettyItem(p.item)}</b>
                </>
              )}
            </div>
          </section>

          <section>
            <SectionTitle icon="zap">{t("filters.types")}</SectionTitle>
            <TypeMatchups types={types} />
          </section>

          <section>
            <SectionTitle icon="sword">{t("detail.moves")}</SectionTitle>
            <MovesGrid moves={p.moves} />
          </section>

          <section>
            <SectionTitle icon="tag">{t("filters.tag")}</SectionTitle>
            <TagEditor monKey={mon.key} />
          </section>
        </div>
      </div>
    </Drawer>
  )
}

function SectionTitle({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <div className="mb-[0.6875rem] flex items-center gap-[0.4375rem]">
      <Icon name={icon} size={15} className="text-pc-accent" />
      <span className="font-pc-display text-[0.78125rem] font-bold uppercase tracking-[.04em] text-pc-fg">
        {children}
      </span>
    </div>
  )
}

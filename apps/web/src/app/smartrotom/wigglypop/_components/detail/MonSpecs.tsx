"use client"

import { useTranslations } from "next-intl"
import type { WpMon } from "../../_types/market.types"
import { STAT_KEYS, STAT_LABEL_KEY, typeColor } from "../../_utils/typeColors"
import { Chip, DividerLabel, Icon, Panel, StatBar, TypeBadge } from "../ui"

/** The four headline facts, then the full IV/EV breakdown, then the moves. */
export function MonSpecs({ mon }: { mon: WpMon }) {
  const t = useTranslations("wigglypop")
  const maxStat = Math.max(...(mon.stats.length ? mon.stats : [1]))
  const perfect = mon.ivPct >= 90

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Spec k={t("specs.ability")} v={mon.ability} />
        <Spec k={t("specs.nature")} v={mon.nature} />
        <Spec
          k={t("specs.totalIvs")}
          v={t("specs.totalIvsValue", { pct: mon.ivPct, sum: mon.ivs.reduce((a, b) => a + b, 0) })}
          tone={perfect ? "text-wp-green" : undefined}
        />
        <Spec k={t("specs.item")} v={mon.heldItem ? prettyItem(mon.heldItem) : t("specs.none")} muted={!mon.heldItem} />
      </div>

      <Panel className="mt-3.5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-wp text-sm font-bold text-wp-fg">{t("specs.statsHeading")}</h3>
          <span className="font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
            {t("specs.statsSubheading")}
          </span>
        </div>
        <div className="grid gap-2.5">
          {STAT_KEYS.map((k, i) => (
            <div key={k} className="grid grid-cols-[1fr_auto] items-center gap-3">
              <div className="grid grid-cols-[64px_36px_1fr] items-center gap-2.5">
                <span className="font-wp text-[12px] font-bold text-wp-fg-muted">
                  {t(STAT_LABEL_KEY[k])}
                </span>
                <span className="wp-num text-right font-wp text-[12.5px] text-wp-fg">
                  {mon.stats[i] ?? "—"}
                </span>
                <StatBar statKey={k} value={mon.stats[i] ?? 0} max={maxStat} />
              </div>
              <div className="flex gap-1.5 whitespace-nowrap font-wp text-[11px]">
                <span className={mon.ivs[i] === 31 ? "wp-num text-wp-green" : "wp-num text-wp-fg-muted"}>
                  {t("specs.ivValue", { value: mon.ivs[i] ?? "—" })}
                </span>
                <span className="wp-num text-wp-fg-subtle">{t("specs.evValue", { value: mon.evs[i] ?? 0 })}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {mon.moves.length > 0 && (
        <div className="mt-3.5">
          <DividerLabel className="mb-2.5">{t("specs.movesHeading")}</DividerLabel>
          <div className="grid grid-cols-2 gap-2">
            {mon.moves.map((mv) => (
              <div
                key={mv}
                className="flex items-center gap-2.5 rounded-[10px] border border-wp-line/24 bg-wp-panel-2 px-3 py-2.5"
              >
                {/* The game gives us a move NAME, not its type — so this is a neutral
                    plum dot, not a coloured type dot. Painting it a type we do not
                    know would be a guess dressed up as data (§9). */}
                <span className="h-2.5 w-2.5 flex-none rounded-[3px] bg-wp-fg-subtle" />
                <span className="font-wp text-[13px] font-semibold text-wp-fg">
                  {prettyItem(mv)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2">
        {mon.ot && <Chip>{t("specs.otPrefix", { ot: mon.ot })}</Chip>}
        {mon.caughtIn && <Chip>{t("specs.caughtInPrefix", { place: mon.caughtIn })}</Chip>}
        {mon.ball && <Chip className="capitalize">{prettyItem(mon.ball)}</Chip>}
      </div>
    </>
  )
}

function Spec({
  k,
  v,
  tone,
  muted,
}: {
  k: string
  v: string
  tone?: string
  muted?: boolean
}) {
  return (
    <div className="rounded-[14px] border-wp border-wp-line/24 bg-white px-3.5 py-3">
      <div className="font-wp text-[10.5px] font-black uppercase tracking-[.06em] text-wp-fg-subtle">
        {k}
      </div>
      <div
        className={`mt-0.5 font-wp text-[14.5px] font-extrabold ${tone ?? (muted ? "text-wp-fg-subtle" : "text-wp-fg")}`}
      >
        {v}
      </div>
    </div>
  )
}

/** Pixelmon ships translation-key-ish strings ("item.pixelmon.leftovers"). */
export function prettyItem(raw: string): string {
  const leaf = raw.split(".").pop() ?? raw
  return leaf.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/** The type pill row under the title. */
export function TypeRow({ mon }: { mon: WpMon }) {
  const t = useTranslations("wigglypop")
  return (
    <div className="mt-2 flex flex-wrap items-center gap-[7px]">
      {mon.types.map((ty) => (
        <TypeBadge key={ty} type={ty} />
      ))}
      <Chip>{t("specs.levelChip", { level: mon.level })}</Chip>
      <Chip>{mon.nature}</Chip>
    </div>
  )
}

export function GenderIcon({ gender, size = 18 }: { gender: WpMon["gender"]; size?: number }) {
  const t = useTranslations("wigglypop")
  if (gender === "male")
    return <Icon name="mars" size={size} style={{ color: "#5aa9ff" }} aria-label={t("specs.male")} />
  if (gender === "female")
    return <Icon name="venus" size={size} style={{ color: "#ff7eb6" }} aria-label={t("specs.female")} />
  return null
}

/** Exported so the sell preview can reuse the exact same swatch logic. */
export const moveDotColor = (type: string) => typeColor(type).c

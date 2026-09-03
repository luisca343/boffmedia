"use client"

import { Fragment } from "react"
import { useTranslations } from "next-intl"
import { usePokemonStore } from "@/stores/pokemonStore"
import { locId } from "../_stores/pcUiStore"
import type { Mon } from "../_types/pc.types"
import { STAT_KEYS, STAT_LABELS } from "../_utils/constants"
import { displayName, ivPct, statAt, statTotal, typesOf } from "../_utils/derive"
import { StatRadar } from "./StatRadar"
import { Bar, Modal, Sprite, TypeBadge } from "./ui"

export interface ComparePanelProps {
  mons: Mon[]
  onClose: () => void
}

/** Side-by-side, up to four. Everything shown is real: `stats` and `ivs`, nothing else. */
export function ComparePanel({ mons, onClose }: ComparePanelProps) {
  const t = useTranslations("pc")
  const speciesByDex = usePokemonStore((s) => s.pokemonByDex)

  const best: Record<string, number> = {}
  for (const k of STAT_KEYS) best[k] = Math.max(...mons.map((m) => statAt(m.pokemon.stats, k)))
  const bestTotal = Math.max(...mons.map((m) => statTotal(m.pokemon)))

  return (
    <Modal
      onClose={onClose}
      title={t("compare.title")}
      icon="layers"
      tone="text-pc-violet"
      width={200 + mons.length * 200}
    >
      <div className="flex justify-center border-b border-pc-line px-[1.125rem] pb-1 pt-4">
        <StatRadar mons={mons} />
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: `120px repeat(${mons.length}, minmax(0, 1fr))` }}
      >
        <div />
        {mons.map((m) => {
          const p = m.pokemon
          return (
            <div key={locId(m.loc)} className="border-l border-pc-line p-3.5 text-center">
              <Sprite
                dex={p.dex}
                form={p.form}
                palette={p.palette}
                className="mx-auto h-24 w-24"
              />
              <div className="truncate text-[0.84375rem] font-bold text-pc-fg">{displayName(p)}</div>
              <div className="text-[0.6875rem] text-pc-fg-subtle">
                {t("detail.level")} {p.level} · {p.nature}
              </div>
              <div className="mt-1.5 flex justify-center gap-1">
                {typesOf(p, speciesByDex).map((t) => (
                  <TypeBadge key={t} type={t} size="sm" />
                ))}
              </div>
            </div>
          )
        })}

        {STAT_KEYS.map((k) => (
          <Fragment key={k}>
            <div className="flex items-center border-t border-pc-line px-3.5 py-[0.6875rem] text-xs text-pc-fg-muted">
              {STAT_LABELS[k]}
            </div>
            {mons.map((m) => {
              const v = statAt(m.pokemon.stats, k)
              const isBest = v === best[k]
              return (
                <div
                  key={locId(m.loc)}
                  className="flex items-center gap-2 border-l border-t border-pc-line px-3.5 py-[0.6875rem]"
                >
                  <span
                    className={`w-8 font-pc-mono text-[0.8125rem] font-extrabold ${isBest ? "text-pc-green" : "text-pc-fg"}`}
                  >
                    {v}
                  </span>
                  <Bar
                    pct={Math.min(100, (v / 200) * 100)}
                    tone={isBest ? "rgb(var(--pc-green))" : "rgb(var(--pc-accent))"}
                    className="flex-1"
                  />
                </div>
              )
            })}
          </Fragment>
        ))}

        <div className="border-t border-pc-line px-3.5 py-[0.6875rem] text-xs font-bold text-pc-fg-muted">
          {t("detail.stats")}
        </div>
        {mons.map((m) => {
          const total = statTotal(m.pokemon)
          return (
            <div
              key={locId(m.loc)}
              className={[
                "border-l border-t border-pc-line px-3.5 py-[0.6875rem] font-pc-mono font-extrabold",
                total === bestTotal ? "text-pc-green" : "text-pc-fg",
              ].join(" ")}
            >
              {total}
            </div>
          )
        })}

        <div className="border-t border-pc-line px-3.5 py-[0.6875rem] text-xs text-pc-fg-muted">{t("detail.stats")}</div>
        {mons.map((m) => (
          <div
            key={locId(m.loc)}
            className="border-l border-t border-pc-line px-3.5 py-[0.6875rem] font-pc-mono font-bold text-pc-fg"
          >
            {ivPct(m.pokemon)}%
          </div>
        ))}
      </div>
    </Modal>
  )
}

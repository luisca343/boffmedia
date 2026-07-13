"use client"

import Link from "next/link"
import type { ResolvedBox } from "../../_utils/inventory"
import { RARITY_ORDER, raritySkin, type ArRarity } from "../../_utils/rarity"
import { Button, Icon, Panel } from "../../_components/ui"

export interface BoxOddsPanelProps {
  box: ResolvedBox
  owned: number
  opening: boolean
  onOpen: () => void
  onShowInfo: () => void
}

const ladder = (odds: ResolvedBox["odds"]) =>
  [...odds].sort(
    (a, b) =>
      RARITY_ORDER.indexOf(b.rarity as ArRarity) - RARITY_ORDER.indexOf(a.rarity as ArRarity),
  )

/** Real odds: each rarity's share of the box's total weight, straight from the config. */
export function BoxOddsPanel({ box, owned, opening, onOpen, onShowInfo }: BoxOddsPanelProps) {
  const empty = (box.items ?? []).length === 0
  const canOpen = owned > 0 && !empty && !opening

  return (
    <Panel tone="void">
      <div className="mb-3.5 font-ar-display text-[9px] uppercase tracking-[0.18em] text-ar-cyan">
        Probabilidades
      </div>

      <div className="flex flex-col gap-2">
        {ladder(box.odds).map((o) => {
          const skin = raritySkin(o.rarity)
          return (
            <div key={o.rarity}>
              <div className="mb-1 flex items-center justify-between">
                <span
                  className="font-ar-display text-[9px] uppercase tracking-[0.12em]"
                  style={{ color: skin.fg }}
                >
                  {skin.name}
                </span>
                <span className="font-ar-mono text-[11px] tabular-nums text-ar-ink-dim">
                  {o.pct.toFixed(1)}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`${skin.name}: ${o.pct.toFixed(1)} por ciento`}
                aria-valuenow={Math.round(o.pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-sm border border-white/[.06] bg-black/50"
              >
                <div
                  className="h-full rounded-sm transition-[width] duration-500"
                  style={{
                    width: `${o.pct}%`,
                    background: `linear-gradient(90deg, ${skin.fg}aa, ${skin.fg}55)`,
                    boxShadow: `0 0 10px ${skin.bd}`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-[18px] rounded-[10px] border border-white/[.06] bg-black/40 px-3.5 py-3">
        <div className="font-ar-mono text-[11px] uppercase tracking-[0.12em] text-ar-ink-muted">
          En inventario
        </div>
        <div
          className={`mt-1.5 font-ar-display text-[16px] leading-relaxed ${owned > 0 ? "text-ar-ink" : "text-ar-ink-muted"}`}
        >
          {owned}× {box.name}
        </div>
        {owned === 0 && (
          <p className="mt-2 font-ar text-xs leading-relaxed text-ar-ink-dim">
            No tienes esta caja. Se consiguen en la{" "}
            <Link href="/smartrotom/arcade/racha" className="text-ar-cyan underline-offset-2 hover:underline">
              racha diaria
            </Link>{" "}
            y jugando en el servidor.
          </p>
        )}
      </div>

      <div className="mt-3.5">
        <Button
          variant="primary"
          size="lg"
          full
          icon={<Icon.Box s={14} />}
          onClick={onOpen}
          disabled={!canOpen}
        >
          {opening ? "Abriendo…" : "Abrir caja"}
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        full
        className="mt-2.5"
        icon={<Icon.Info s={12} />}
        onClick={onShowInfo}
      >
        Ver probabilidades completas
      </Button>

      {empty && (
        <p role="alert" className="mt-2.5 font-ar-mono text-[11px] text-ar-danger">
          Esta caja no tiene objetos configurados.
        </p>
      )}
    </Panel>
  )
}

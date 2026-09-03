"use client"

import { useTranslations } from "next-intl"
import type { SatchelItem } from "../_types"
import { ItemSprite } from "./ui"

/**
 * One cell of La Mochila. The API has no rarity, so there is only one
 * distinction to draw: owned or not. An unearned item keeps its mystery —
 * greyed out, its sprite swapped for a "?" — rather than spoiling what you
 * haven't gotten yet.
 */
export function SatchelSlot({ item }: { item: SatchelItem }) {
  const t = useTranslations("misiones.satchelSlot")
  const locked = !item.owned

  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-[3px] border-[1.5px] border-ms-paper-edge/60 shadow-[inset_0_2px_8px_rgba(60,40,20,.3)] transition-transform duration-150 hover:-translate-y-[3px] hover:scale-[1.04] focus-within:-translate-y-[3px] focus-within:scale-[1.04] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100"
      style={{
        background: "radial-gradient(ellipse at 40% 30%, rgba(255,240,200,.6), rgba(180,150,100,.35))",
        filter: locked ? "grayscale(.7) brightness(.72)" : "none",
      }}
      tabIndex={0}
      title={locked ? t("lockedTitle", { name: item.name }) : item.name}
    >
      <div className="grid h-full w-full place-items-center focus-visible:outline-none">
        {locked ? (
          <span aria-hidden className="font-ms-display text-[2.125rem] leading-none text-ms-ink-2">
            ?
          </span>
        ) : (
          <ItemSprite name={item.sprite} size={40} />
        )}
      </div>

      {!locked && item.count > 1 && (
        <span className="absolute bottom-1 right-[0.3125rem] z-[2] rounded-full border border-ms-gold-4 bg-ms-gold-1 px-[0.3125rem] font-ms-mono text-[0.6875rem] font-bold leading-[1.4] text-[#1e120a]">
          ×{item.count}
        </span>
      )}

      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%_+_6px)] left-1/2 z-[60] w-[9.375rem] -translate-x-1/2 rounded-sm border border-ms-ink-3/50 bg-gradient-to-b from-ms-paper-1 to-ms-paper-3 px-2.5 py-2 text-center opacity-0 shadow-[0_8px_20px_rgba(0,0,0,.5)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
      >
        <div className="font-ms-display text-[0.8125rem] text-ms-ink-1">{item.name}</div>
        {locked && (
          <div className="mt-0.5 font-ms-uppercase text-[0.5625rem] uppercase tracking-[.12em] text-ms-ink-3">
            {t("notObtained")}
          </div>
        )}
      </div>
    </div>
  )
}

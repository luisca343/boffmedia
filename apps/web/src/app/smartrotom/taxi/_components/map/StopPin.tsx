import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "../ui"
import type { EnrichedStop } from "../../_types"

/** A destination on the map. Selected flips it to amber — the same amber that will charge. */
export function StopPin({
  stop,
  x,
  y,
  selected,
  onSelect,
}: {
  stop: EnrichedStop
  x: number
  y: number
  selected: boolean
  onSelect: (stop: EnrichedStop) => void
}) {
  const t = useTranslations("taxi.map")
  return (
    <button
      type="button"
      style={{ left: x, top: y }}
      // The map owns mousedown for panning; a pin must not start a drag.
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(stop)
      }}
      aria-label={t("destination", { name: stop.id })}
      aria-pressed={selected}
      className={cn(
        "absolute z-[12] inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-[0.4375rem]",
        "rounded-tx-pill border border-solid py-1 pl-[0.3125rem] pr-[0.6875rem] shadow-tx-1",
        "transition-[transform,border-color,box-shadow] duration-200 ease-tx",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent",
        selected
          ? "z-[15] scale-[1.08] bg-tx-accent text-tx-on-accent border-white shadow-[0_0_0_4px_var(--tx-accent-soft),var(--tx-shadow-1)]"
          : "bg-tx-pin-bg text-tx-pin-ink border-tx-line-2 hover:z-[14] hover:scale-105 hover:border-tx-accent",
      )}
    >
      <span
        className={cn(
          "grid h-[1.5625rem] w-[1.5625rem] place-items-center rounded-full shadow-[0_2px_8px_rgb(0_0_0/0.35)]",
          selected
            ? "bg-tx-on-accent text-tx-accent"
            : "bg-[linear-gradient(140deg,rgb(var(--tx-blue-500)),rgb(var(--tx-blue-700)))] text-white",
        )}
      >
        <Icon name="pin" size={selected ? 17 : 14} stroke={2.4} />
      </span>
      <span className="whitespace-nowrap pr-[3px] text-xs font-bold">{stop.id}</span>
    </button>
  )
}

/**
 * A stop that has panned off screen, pinned to the edge and aimed at where it went. The
 * player can always get back to a destination without hunting for it.
 */
export function OffscreenPin({
  stop,
  x,
  y,
  angle,
  selected,
  onSelect,
}: {
  stop: EnrichedStop
  x: number
  y: number
  /** Radians, screen-space, from the viewport centre toward the stop. */
  angle: number
  selected: boolean
  onSelect: (stop: EnrichedStop) => void
}) {
  const t = useTranslations("taxi.map")
  return (
    <button
      type="button"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(stop)
      }}
      title={stop.id}
      aria-label={t("goTo", { name: stop.id })}
      className={cn(
        "absolute z-[18] grid h-[1.875rem] w-[1.875rem] -translate-x-1/2 -translate-y-1/2 place-items-center",
        "rounded-full border border-solid shadow-tx-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent",
        selected
          ? "bg-tx-accent text-tx-on-accent border-white"
          : "bg-tx-pin-bg text-tx-blue-400 border-tx-line-2",
      )}
    >
      {/* The nav glyph points up by default, hence the +90°. */}
      <Icon name="nav" size={13} stroke={2.5} style={{ transform: `rotate(${(angle * 180) / Math.PI + 90}deg)` }} />
    </button>
  )
}

/** The player. Pings so you can find yourself on a busy map at a glance. */
export function PlayerMarker({ x, y, reduceMotion }: { x: number; y: number; reduceMotion: boolean }) {
  const t = useTranslations("taxi.map")
  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y }}
      aria-hidden="true"
    >
      {!reduceMotion && (
        <span className="absolute -inset-[0.875rem] rounded-full bg-tx-blue-400 opacity-30 animate-tx-ping motion-reduce:animate-none" />
      )}
      <span className="relative grid h-[2.375rem] w-[2.375rem] place-items-center rounded-full border-[2.5px] border-solid border-white bg-[linear-gradient(140deg,rgb(var(--tx-blue-400)),rgb(var(--tx-blue-700)))] shadow-[0_0_16px_rgb(59_130_246/0.7)]">
        <span className="text-[0.6875rem] font-extrabold tracking-[0.3px] text-white">{t("you")}</span>
      </span>
    </div>
  )
}

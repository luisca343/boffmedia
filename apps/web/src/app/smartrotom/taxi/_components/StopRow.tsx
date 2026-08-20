import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, RegionTag } from "./ui"
import { formatMoney, formatNum } from "../_utils/format"
import { compassKey } from "../_utils/geo"
import type { EnrichedStop } from "../_types"

/**
 * One destination in the list: where it is, how far, which way, and what it costs. The
 * fare turns red when the player cannot afford it — but it also keeps its `−` and the
 * row stays selectable, so the colour is never the only signal.
 */
export function StopRow({
  stop,
  selected,
  affordable,
  favorite,
  onSelect,
  onToggleFavorite,
}: {
  stop: EnrichedStop
  selected: boolean
  affordable: boolean
  favorite: boolean
  onSelect: (stop: EnrichedStop) => void
  onToggleFavorite: (id: string) => void
}) {
  const t = useTranslations("taxi")
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onSelect(stop)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect(stop)
        }
      }}
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-3 rounded-tx-md p-3 text-left",
        "border border-solid transition-[border-color,background,transform] duration-150 ease-tx",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent",
        selected
          ? "border-tx-accent bg-tx-accent-soft"
          : "border-tx-line bg-tx-surface hover:-translate-y-px hover:border-tx-line-2 hover:bg-tx-surface-2",
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
          selected
            ? "bg-tx-accent text-tx-on-accent"
            : "bg-[linear-gradient(140deg,rgb(var(--tx-blue-500)),rgb(var(--tx-blue-700)))] text-white",
        )}
      >
        <Icon name="pin" size={17} stroke={2.4} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <span className="flex items-center gap-2">
          <span className="truncate text-[14.5px] font-bold text-tx-txt">{stop.id}</span>
          {stop.region && <RegionTag>{stop.region}</RegionTag>}
        </span>
        <span className="flex items-center gap-[11px] text-xs text-tx-txt-2">
          <span className="inline-flex items-center gap-1">
            <Icon name="walking" size={13} stroke={2} />
            <span className="font-tx-mono">{formatNum(stop.dist)}</span> b
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon
              name="nav"
              size={12}
              stroke={2.2}
              className="text-tx-accent"
              style={{ transform: `rotate(${stop.bearing}deg)` }}
            />
            {t(`compass.${compassKey(stop.bearing)}`)}
          </span>
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-[5px]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(stop.id)
          }}
          aria-label={
            favorite
              ? t("stopRow.removeFromFavorites", { name: stop.id })
              : t("stopRow.addToFavorites", { name: stop.id })
          }
          aria-pressed={favorite}
          className={cn(
            "grid h-[26px] w-[26px] place-items-center rounded-lg transition-[color,transform] duration-150 ease-tx",
            "hover:scale-110 hover:text-tx-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent",
            favorite ? "text-tx-accent" : "text-tx-txt-3",
          )}
        >
          <Icon name="star" size={16} stroke={2.2} style={{ fill: favorite ? "currentColor" : "none" }} />
        </button>
        <span
          className={cn(
            "font-tx-mono text-[14.5px] font-extrabold",
            affordable ? "text-tx-money" : "text-tx-no",
          )}
        >
          {formatMoney(stop.price)}
        </span>
      </span>
    </div>
  )
}

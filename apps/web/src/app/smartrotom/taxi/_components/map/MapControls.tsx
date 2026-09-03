import { useTranslations } from "next-intl"
import { Icon } from "../ui"
import { GRID_CELL_BLOCKS } from "../../_utils/constants"

const CHIP = "absolute z-[22] bg-tx-bg-1/70 backdrop-blur-[8px] border border-solid border-tx-line text-tx-txt-2"

/** Fixed north — the world doesn't rotate, so this orients rather than steers. */
export function Compass() {
  const t = useTranslations("taxi.map")
  return (
    <div className={`${CHIP} left-4 top-4 grid h-11 w-11 place-items-center rounded-full text-tx-blue-400`} aria-hidden="true">
      <span className="absolute top-[3px] text-[0.5625rem] font-extrabold text-tx-accent">{t("north")}</span>
      <Icon name="nav" size={18} />
    </div>
  )
}

export function ZoomControls({ onZoom }: { onZoom: (factor: number) => void }) {
  const t = useTranslations("taxi.map")
  return (
    <div className={`${CHIP} right-4 top-4 flex flex-col overflow-hidden rounded-tx-md`}>
      <button
        type="button"
        onClick={() => onZoom(1.25)}
        aria-label={t("zoomIn")}
        className="grid h-10 w-[2.625rem] place-items-center text-tx-txt transition-colors duration-150 hover:bg-tx-surface-2"
      >
        <Icon name="plus" size={18} />
      </button>
      <div className="h-px bg-tx-line" />
      <button
        type="button"
        onClick={() => onZoom(1 / 1.25)}
        aria-label={t("zoomOut")}
        className="grid h-10 w-[2.625rem] place-items-center text-tx-txt transition-colors duration-150 hover:bg-tx-surface-2"
      >
        <Icon name="minus" size={18} />
      </button>
    </div>
  )
}

/** Turns the abstract zoom into a real distance — the bar IS 500 blocks at this scale. */
export function ScaleChip({ scale, bottom }: { scale: number; bottom: number }) {
  const t = useTranslations("taxi.map")
  return (
    <div
      className={`${CHIP} left-4 flex flex-col gap-1 rounded-tx-sm px-2.5 py-1.5 text-[0.6875rem] font-bold`}
      style={{ bottom }}
    >
      <span
        className="h-1 min-w-[1.5rem] rounded-sm bg-tx-txt-2"
        style={{ width: GRID_CELL_BLOCKS * scale }}
      />
      <span>{t("scale", { blocks: GRID_CELL_BLOCKS })}</span>
    </div>
  )
}

export function RecenterButton({ onClick, bottom }: { onClick: () => void; bottom: number }) {
  const t = useTranslations("taxi.map")
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("recenter")}
      style={{ bottom }}
      className="absolute right-[1.125rem] z-[24] grid h-[3.125rem] w-[3.125rem] place-items-center rounded-2xl border border-solid border-white/20 bg-[linear-gradient(140deg,rgb(var(--tx-blue-500)),rgb(var(--tx-blue-700)))] text-white shadow-[var(--tx-shadow-1),0_0_16px_rgb(59_130_246/0.4)] transition-transform duration-200 ease-tx hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent"
    >
      <Icon name="crosshair" size={20} stroke={2} />
    </button>
  )
}

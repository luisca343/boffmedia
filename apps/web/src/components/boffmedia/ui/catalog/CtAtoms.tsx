"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import { CT_STATUS, CT_STATUS_ORDER, CtStore, useCtStatus, type CtStatusKey } from "./catalog-util"

// Catálogo atoms: half-star rating, status pill, status menu + log button.
// Prefix ct- in catalogo.css.

export function CtStars({ value = 0, onChange, size = 16, count, ariaLabel }: { value?: number; onChange?: (v: number) => void; size?: number; count?: React.ReactNode; ariaLabel?: string }) {
  const t = useTranslations("common.catalog")
  const [hover, setHover] = React.useState(0)
  const interactive = !!onChange
  const shown = interactive && hover ? hover : value
  const pct = (Math.max(0, Math.min(5, shown)) / 5) * 100
  const stars = (fill: boolean) => [0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={size} className={cn("block", fill && "fill-current")} />)

  if (!interactive) {
    return (
      <span className="inline-flex items-center gap-2" title={value ? value + "/5" : t("noRating")} aria-label={(ariaLabel ?? t("rating")) + " " + value + " de 5"}>
        <span className="relative inline-flex leading-[0] text-line-2">
          {stars(false)}
          <span className="absolute inset-0 inline-flex overflow-hidden whitespace-nowrap text-accent" style={{ width: pct + "%" }}>
            {stars(true)}
          </span>
        </span>
        {count != null && <span className="font-mono text-[11px]/none font-semibold tracking-[0.04em] text-txt-muted">{count}</span>}
      </span>
    )
  }
  return (
    <span className="relative inline-flex cursor-pointer items-center gap-2 [&:hover_.ct-fill]:text-accent-bright" role="slider" aria-label={ariaLabel ?? t("rating")} aria-valuemin={0} aria-valuemax={5} aria-valuenow={value} onMouseLeave={() => setHover(0)}>
      <span aria-hidden className="relative inline-flex leading-[0] text-line-2">
        {stars(false)}
        <span className="ct-fill absolute inset-0 inline-flex overflow-hidden whitespace-nowrap text-accent" style={{ width: pct + "%" }}>
          {stars(true)}
        </span>
        <span className="absolute inset-0 flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <React.Fragment key={n}>
              <button type="button" tabIndex={-1} aria-label={t("halfStars", { count: n - 0.5 })} className="m-0 h-full flex-1 cursor-pointer border-0 bg-transparent p-0" onMouseEnter={() => setHover(n - 0.5)} onClick={() => onChange!(n - 0.5 === value ? 0 : n - 0.5)} />
              <button type="button" tabIndex={-1} aria-label={t("stars", { count: n })} className="m-0 h-full flex-1 cursor-pointer border-0 bg-transparent p-0" onMouseEnter={() => setHover(n)} onClick={() => onChange!(n === value ? 0 : n)} />
            </React.Fragment>
          ))}
        </span>
      </span>
    </span>
  )
}

export function CtStatusPill({ status, size = "md", solid = false, showLabel = true }: { status: CtStatusKey; size?: "sm" | "md"; solid?: boolean; showLabel?: boolean }) {
  const t = useTranslations("common.catalog")
  const s = CT_STATUS[status]
  if (!s) return null
  return (
    <span
      style={{ "--sc": s.color } as React.CSSProperties}
      className={cn(
        "inline-flex items-center whitespace-nowrap border border-solid font-body font-semibold tracking-[0.02em]",
        size === "sm" ? "gap-1 px-[7px] py-[3px] text-[10px]" : "gap-[5px] px-[9px] py-1 text-[11px]",
        solid ? "border-[color:var(--sc)] bg-[color:var(--sc)] text-accent-ink [&_svg]:text-accent-ink" : "border-[color-mix(in_oklch,var(--sc)_45%,var(--line))] bg-[color-mix(in_oklch,var(--sc)_14%,transparent)] text-[color:var(--sc)]",
      )}
    >
      <Icon name={s.icon} size={size === "sm" ? 11 : 13} className={status === "wishlist" ? "fill-current" : undefined} />
      {showLabel && <span>{t(`status.${status}.label`)}</span>}
    </span>
  )
}

export function CtStatusMenu({ gameId, onClose, block }: { gameId: string; onClose?: () => void; block?: boolean }) {
  const t = useTranslations("common.catalog")
  const cur = useCtStatus(gameId)
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose?.()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.()
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [onClose])
  return (
    <div ref={ref} role="menu" className={cn("absolute left-0 top-[calc(100%_+_6px)] z-40 flex min-w-[210px] flex-col gap-px border border-solid border-line-2 bg-panel p-[5px] [box-shadow:0_18px_50px_rgba(0,0,0,0.5)]", block && "right-0")}>
      {CT_STATUS_ORDER.map((k) => {
        const s = CT_STATUS[k]
        const on = cur === k
        return (
          <button
            key={k}
            type="button"
            role="menuitemradio"
            aria-checked={on}
            style={{ "--sc": s.color } as React.CSSProperties}
            onClick={() => {
              CtStore.setStatus(gameId, k)
              onClose?.()
            }}
            className={cn("flex w-full items-center gap-2.5 border-0 bg-transparent px-2.5 py-[9px] text-left font-body text-[13px]/none font-semibold text-txt transition-[background] duration-[140ms] hover:bg-panel-2", on && "text-[color:var(--sc)]")}
          >
            <span className="grid h-[26px] w-[26px] flex-none place-items-center border border-solid border-[color-mix(in_oklch,var(--sc)_40%,var(--line))] bg-[color-mix(in_oklch,var(--sc)_12%,transparent)] text-[color:var(--sc)]">
              <Icon name={s.icon} size={15} className={k === "wishlist" ? "fill-current" : undefined} />
            </span>
            <span className="flex-1">{t(`status.${k}.label`)}</span>
            {on && <Icon name="check" size={14} className="text-[color:var(--sc)]" />}
          </button>
        )
      })}
      {cur && (
        <button
          type="button"
          onClick={() => {
            CtStore.setStatus(gameId, cur)
            onClose?.()
          }}
          className="mt-[3px] flex w-full items-center gap-2.5 border-0 border-t border-solid border-line bg-transparent px-2.5 pb-[9px] pt-[11px] text-left font-body text-[13px]/none font-semibold text-txt-muted transition-[color] duration-[140ms] hover:text-bad"
        >
          <span className="grid h-[26px] w-[26px] flex-none place-items-center border border-solid border-line text-txt-dim">
            <Icon name="x" size={15} />
          </span>
          <span className="flex-1">{t("removeFromLibrary")}</span>
        </button>
      )}
    </div>
  )
}

export function CtLogButton({ gameId, block = false, size = "md" }: { gameId: string; block?: boolean; size?: "sm" | "md" }) {
  const t = useTranslations("common.catalog")
  const [open, setOpen] = React.useState(false)
  const cur = useCtStatus(gameId)
  const s = cur ? CT_STATUS[cur] : null
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        style={s ? ({ "--sc": s.color } as React.CSSProperties) : undefined}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={cn(
          "inline-flex items-center border border-solid font-mono font-semibold uppercase cut [--cut:7px] transition-[border-color,background,color] duration-[140ms]",
          size === "sm" ? "gap-[5px] px-2.5 py-[7px] text-[10px]" : "gap-[7px] px-3 py-[9px] text-[11px] tracking-[0.05em]",
          block && "w-full justify-center",
          s ? "border-[color-mix(in_oklch,var(--sc)_55%,var(--line))] bg-[color-mix(in_oklch,var(--sc)_16%,var(--panel-2))] text-[color:var(--sc)]" : "border-line-2 bg-panel-2 text-txt hover:border-accent-line",
        )}
      >
        <Icon name={s ? s.icon : "plus"} size={size === "sm" ? 13 : 15} className={cur === "wishlist" ? "fill-current" : undefined} />
        {cur ? t(`status.${cur}.label`) : t("log")}
        <Icon name="chevronDown" size={13} className="opacity-60" />
      </button>
      {open && <CtStatusMenu gameId={gameId} onClose={() => setOpen(false)} block={block} />}
    </span>
  )
}

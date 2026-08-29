"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@boffmedia/ui"

/**
 * Manga admin «Señal» atoms — the `av-chapter` chip strip, `av-mcard` library
 * cards and the download/export progress readout, on Tailwind + v3 tokens.
 * Shared by the downloader and the library panels.
 */

/* ---- diagonal-stripe cover (av-mcard__cover) ------------------------------- */

export function MgCover({
  src,
  alt,
  className,
  children,
}: {
  src?: string | null
  alt?: string
  className?: string
  children?: React.ReactNode
}) {
  const [broken, setBroken] = React.useState(false)
  const showImg = src && !broken
  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden border-b border-solid border-line text-txt-dim",
        "bg-[repeating-linear-gradient(45deg,var(--panel-2)_0_8px,var(--base-2)_8px_16px)]",
        className,
      )}
    >
      {showImg ? (
        <img src={src} alt={alt ?? ""} className="h-full w-full object-cover" loading="lazy" onError={() => setBroken(true)} />
      ) : (
        <Icon name="book" size={26} />
      )}
      {children}
    </div>
  )
}

/* ---- series library card (av-mcard) ---------------------------------------- */

export function MgCard({
  title,
  meta,
  cover,
  onClick,
  badge,
}: {
  title: string
  meta: React.ReactNode
  cover?: string | null
  onClick: () => void
  badge?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group border border-solid border-line bg-panel text-left transition-colors hover:border-accent-line"
    >
      <MgCover src={cover} alt={title} className="aspect-[3/2]">
        {badge && <span className="absolute left-2 top-2">{badge}</span>}
      </MgCover>
      <div className="px-[13px] py-[11px]">
        <p className="truncate font-display text-[15px] font-bold not-italic uppercase leading-[1.15] text-txt transition-colors group-hover:text-accent">
          {title}
        </p>
        <p className="mt-1 truncate font-mono text-[10px] font-medium uppercase leading-none tracking-[0.06em] text-txt-dim">
          {meta}
        </p>
      </div>
    </button>
  )
}

/* ---- chapter chip (av-chapter) --------------------------------------------- */

export function MgChapter({
  label,
  state = "off",
  icon,
  onClick,
  title,
}: {
  label: React.ReactNode
  state?: "off" | "on" | "done"
  icon?: IconName
  onClick?: () => void
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "cut cut-edge-slant [--cut-line:var(--line-2)] [--cut:5px] inline-flex min-w-[40px] items-center justify-center gap-[4px] border border-solid px-[10px] py-[7px] font-mono text-[12px] font-semibold leading-none transition-colors",
        state === "on" && "border-accent bg-accent-soft text-accent",
        state === "done" && "border-transparent bg-ok-soft text-ok",
        state === "off" && "border-line-2 bg-base-2 text-txt-muted hover:border-line-2 hover:text-txt",
      )}
    >
      {icon && <Icon name={icon} size={11} />}
      {label}
    </button>
  )
}

/* ---- search result row ----------------------------------------------------- */

export function MgResult({
  title,
  sub,
  cover,
  onClick,
}: {
  title: string
  sub?: string
  cover?: string | null
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 border border-solid border-line bg-panel px-4 py-3 text-left transition-colors hover:border-accent-line hover:bg-panel-2"
    >
      <MgCover src={cover} alt={title} className="h-14 w-10 flex-none cut-seal cut-seal-edge [--cut-line:var(--accent-line)] [--cut:6px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-txt transition-colors group-hover:text-accent">{title}</p>
        {sub && <p className="mt-0.5 truncate font-mono text-[11px] text-txt-dim">{sub}</p>}
      </div>
      <Icon name="chevronRight" size={16} className="flex-none text-txt-dim transition-colors group-hover:text-accent" />
    </button>
  )
}


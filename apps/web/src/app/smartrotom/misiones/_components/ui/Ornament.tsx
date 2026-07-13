"use client"

import { useId } from "react"

type Orientation = "tl" | "tr" | "bl" | "br"

const FLIP: Record<Orientation, string> = {
  tl: "",
  tr: "scale(-1 1) translate(-60 0)",
  bl: "scale(1 -1) translate(0 -60)",
  br: "scale(-1 -1) translate(-60 -60)",
}

/** One curling corner ornament, drawn in ink. */
export function Flourish({
  size = 60,
  orientation = "tl",
  className,
}: {
  size?: number
  orientation?: Orientation
  className?: string
}) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} className={className} aria-hidden>
      <g transform={FLIP[orientation]} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M 2 30 Q 2 2 30 2" />
        <path d="M 7 30 Q 7 7 30 7" />
        <path d="M 6 18 Q 12 14 18 18 Q 18 22 14 22" fill="currentColor" opacity="0.85" />
        <path d="M 18 6 Q 22 12 18 18 Q 14 18 14 14" fill="currentColor" opacity="0.85" />
        <circle cx="2" cy="30" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="30" cy="2" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="22" cy="22" r="1.2" fill="currentColor" stroke="none" />
        <path d="M 30 14 Q 32 18 28 22 Q 24 24 22 28" />
      </g>
    </svg>
  )
}

/** All four corners at once — what makes a sheet feel like an illuminated page. */
export function FlourishCorners({
  size = 36,
  offset = 6,
  className = "text-ms-gold-3/60",
}: {
  size?: number
  offset?: number
  className?: string
}) {
  const corners: Array<[Orientation, React.CSSProperties]> = [
    ["tl", { top: offset, left: offset }],
    ["tr", { top: offset, right: offset }],
    ["bl", { bottom: offset, left: offset }],
    ["br", { bottom: offset, right: offset }],
  ]
  return (
    <>
      {corners.map(([orientation, position]) => (
        <div key={orientation} className={`pointer-events-none absolute ${className}`} style={position}>
          <Flourish orientation={orientation} size={size} />
        </div>
      ))}
    </>
  )
}

/** A rule with a glyph in the middle — how the letter separates its sections. */
export function Divider({ glyph = "❦", className = "text-ms-ink-3" }: { glyph?: string; className?: string }) {
  return (
    <div className={`flex w-full items-center justify-center gap-2.5 font-ms-display opacity-70 ${className}`} aria-hidden>
      <svg viewBox="0 0 100 12" height="12" className="max-w-[84px] flex-1">
        <line x1="0" y1="6" x2="80" y2="6" stroke="currentColor" strokeWidth="0.8" />
        <path d="M 80 6 L 92 2 L 100 6 L 92 10 Z" fill="currentColor" />
      </svg>
      <span className="text-lg leading-none">{glyph}</span>
      <svg viewBox="0 0 100 12" height="12" className="max-w-[84px] flex-1 -scale-x-100">
        <line x1="0" y1="6" x2="80" y2="6" stroke="currentColor" strokeWidth="0.8" />
        <path d="M 80 6 L 92 2 L 100 6 L 92 10 Z" fill="currentColor" />
      </svg>
    </div>
  )
}

/** Heraldic banner with notched ends — carries the status of an open letter. */
export function Ribbon({
  children,
  color = "rgb(var(--ms-seal-available))",
  width = 320,
  height = 56,
}: {
  children: React.ReactNode
  color?: string
  width?: number
  height?: number
}) {
  const id = useId().replace(/:/g, "")
  const w = width
  const h = height
  return (
    <div className="relative inline-block" style={{ width: w, height: h }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        aria-hidden
        className="absolute inset-0"
        style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,.5))" }}
      >
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor="rgba(0,0,0,.4)" />
          </linearGradient>
        </defs>
        <path
          d={`M 14 8 L ${w - 14} 8 L ${w - 2} ${h / 2} L ${w - 14} ${h - 8} L 14 ${h - 8} L 2 ${h / 2} Z`}
          fill={`url(#${id})`}
          stroke="rgba(0,0,0,.45)"
          strokeWidth="1"
        />
        <path d={`M 2 ${h / 2} L 14 8 L 18 ${h / 2} L 14 ${h - 8} Z`} fill="rgba(0,0,0,.32)" />
        <path d={`M ${w - 2} ${h / 2} L ${w - 14} 8 L ${w - 18} ${h / 2} L ${w - 14} ${h - 8} Z`} fill="rgba(0,0,0,.32)" />
        <path d={`M 16 12 L ${w - 16} 12`} stroke="rgba(255,255,255,.35)" strokeWidth="1.2" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center px-6 text-center font-ms-display text-base font-bold uppercase tracking-[.12em] text-ms-paper-1 [text-shadow:1px_1px_0_rgba(0,0,0,.5)]">
        {children}
      </div>
    </div>
  )
}

/** Heraldic shield — the plate a figure is engraved on. */
export function Shield({
  size = 48,
  color = "rgb(var(--ms-gold-2))",
  children,
}: {
  size?: number
  color?: string
  children?: React.ReactNode
}) {
  const id = useId().replace(/:/g, "")
  return (
    <div className="relative inline-block" style={{ width: size, height: size * 1.18 }}>
      <svg
        viewBox="0 0 100 118"
        width={size}
        height={size * 1.18}
        aria-hidden
        className="absolute inset-0"
        style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,.5))" }}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
            <stop offset="30%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor="rgba(0,0,0,.6)" />
          </linearGradient>
        </defs>
        <path d="M 8 4 L 92 4 L 92 56 Q 92 100 50 114 Q 8 100 8 56 Z" fill={`url(#${id})`} stroke="rgba(0,0,0,.5)" strokeWidth="1.5" />
        <path d="M 8 4 L 92 4 L 92 12 L 8 12 Z" fill="rgba(0,0,0,.32)" />
        <path d="M 16 14 L 84 14 L 84 56 Q 84 92 50 106 Q 16 92 16 56 Z" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="0.8" />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-ms-display font-bold text-[#1e120a]"
        style={{ fontSize: size * 0.42, paddingTop: size * 0.12 }}
      >
        {children}
      </div>
    </div>
  )
}

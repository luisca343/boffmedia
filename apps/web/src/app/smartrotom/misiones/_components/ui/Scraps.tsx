"use client"

import { useId, type ReactNode } from "react"

/**
 * The things pinned to a real board that aren't quests: a note in someone's
 * hand, a clipping, a photo, a doodle, a blot of spilled ink. They are the
 * board's texture — never interactive, never carrying data.
 */

export function PostIt({
  children,
  color = "#fff77a",
  tilt = -3,
  size = 130,
  footer,
}: {
  children: ReactNode
  color?: string
  tilt?: number
  size?: number
  footer?: string
}) {
  return (
    <div
      aria-hidden
      className="relative font-ms-hand text-sm leading-tight text-[#3a2a18]"
      style={{
        width: size,
        minHeight: size * 0.9,
        padding: "16px 14px 12px",
        background: `linear-gradient(180deg, ${color}, ${color}cc)`,
        transform: `rotate(${tilt}deg)`,
        boxShadow: "0 1px 0 rgba(0,0,0,.1), 4px 8px 12px rgba(0,0,0,.35), 12px 16px 24px -8px rgba(0,0,0,.3)",
      }}
    >
      <span
        className="absolute -top-2 left-1/2 h-4 w-[3.125rem] -translate-x-1/2 -rotate-3 border border-[rgba(180,150,100,.3)] bg-[rgba(220,200,160,.55)] shadow-[0_2px_3px_rgba(0,0,0,.2)]"
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />
      {children}
      {footer && (
        <div className="mt-2 border-t border-[rgba(60,40,20,.2)] pt-1 text-right text-[0.6875rem] opacity-55">{footer}</div>
      )}
    </div>
  )
}

export function NewspaperClipping({
  headline,
  body,
  source = "El Heraldo de Kanto",
  tilt = 1.6,
  width = 220,
}: {
  headline: string
  body: string
  source?: string
  tilt?: number
  width?: number
}) {
  return (
    <div
      aria-hidden
      className="text-[#1a1208]"
      style={{
        width,
        padding: "12px 14px",
        background: "linear-gradient(180deg, #efe8d2, #d6cca6)",
        transform: `rotate(${tilt}deg)`,
        boxShadow:
          "inset 0 0 30px rgba(80,50,20,.15), 4px 6px 10px rgba(0,0,0,.35), 10px 14px 22px -10px rgba(0,0,0,.4)",
        clipPath: "polygon(2% 0%, 98% 1%, 100% 4%, 99% 96%, 97% 100%, 3% 99%, 1% 96%, 2% 4%)",
      }}
    >
      <div className="mb-1 border-b border-black/40 pb-[3px] text-center font-ms-uppercase text-[0.5rem] uppercase tracking-[.2em] opacity-70">
        {source}
      </div>
      <div className="mb-1.5 font-ms-uppercase text-sm font-bold uppercase leading-[1.05] tracking-[.02em]">{headline}</div>
      <div className="text-justify font-ms text-[0.5625rem] leading-[1.4] text-[#2a1810] [column-count:2] [column-gap:6px]">{body}</div>
    </div>
  )
}

export function Polaroid({ caption = "Ruta 1", tilt = -4, size = 130 }: { caption?: string; tilt?: number; size?: number }) {
  return (
    <div
      aria-hidden
      className="relative bg-[#f5efde]"
      style={{
        width: size,
        padding: "10px 10px 22px",
        transform: `rotate(${tilt}deg)`,
        boxShadow: "0 1px 0 rgba(0,0,0,.06), 4px 8px 14px rgba(0,0,0,.4), 12px 20px 28px -10px rgba(0,0,0,.45)",
      }}
    >
      <span className="absolute -right-2.5 -top-2.5 h-[1.375rem] w-[2.375rem] rotate-[28deg] border border-[rgba(180,150,100,.3)] bg-[rgba(220,200,160,.6)]" />
      <div
        className="relative overflow-hidden shadow-[inset_0_0_0_1px_rgba(0,0,0,.4)]"
        style={{ aspectRatio: "1 / 0.95", background: "linear-gradient(135deg, #4a5a2c 0%, #7a8a4a 40%, #c8b86a 90%)" }}
      >
        <svg viewBox="0 0 100 95" width="100%" height="100%">
          <rect x="0" y="60" width="100" height="35" fill="#5a4830" />
          <path d="M 0 60 L 30 35 L 50 50 L 80 25 L 100 45 L 100 60 Z" fill="#3a4a22" />
          <circle cx="78" cy="20" r="9" fill="#f5d785" opacity="0.85" />
          <path d="M 15 70 L 22 60 L 28 70 Z" fill="#2a1810" />
          <path d="M 60 76 L 68 64 L 74 76 Z" fill="#2a1810" />
        </svg>
      </div>
      <div className="mt-2 text-center font-ms-hand text-[0.8125rem] text-[#3a2a18]">{caption}</div>
    </div>
  )
}

type DoodleKind = "arrow" | "star" | "check" | "skull"

export function Doodle({ kind = "arrow", tilt = 0, size = 110 }: { kind?: DoodleKind; tilt?: number; size?: number }) {
  const doodles: Record<DoodleKind, ReactNode> = {
    arrow: (
      <svg viewBox="0 0 100 60" width={size} height={size * 0.6}>
        <path d="M 8 30 C 20 6, 60 6, 86 28 L 78 22 M 86 28 L 78 36" fill="none" stroke="#2a1810" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    star: (
      <svg viewBox="0 0 60 60" width={size * 0.6} height={size * 0.6}>
        <path d="M 30 6 L 36 24 L 54 24 L 40 35 L 46 53 L 30 42 L 14 53 L 20 35 L 6 24 L 24 24 Z" fill="none" stroke="#2a1810" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 60 60" width={size * 0.6} height={size * 0.6}>
        <path d="M 8 32 L 22 48 L 52 12" fill="none" stroke="#6b1410" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    ),
    skull: (
      <svg viewBox="0 0 60 60" width={size * 0.6} height={size * 0.6}>
        <circle cx="30" cy="26" r="16" fill="none" stroke="#2a1810" strokeWidth="2" />
        <circle cx="24" cy="26" r="3" fill="#2a1810" />
        <circle cx="36" cy="26" r="3" fill="#2a1810" />
        <path d="M 22 42 L 24 50 M 28 42 L 28 50 M 32 42 L 32 50 M 36 42 L 38 50" stroke="#2a1810" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  }
  return (
    <div aria-hidden className="inline-block" style={{ transform: `rotate(${tilt}deg)` }}>
      {doodles[kind]}
    </div>
  )
}

export function InkBlot({ size = 60, color = "#1a1208", tilt = 0 }: { size?: number; color?: string; tilt?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      style={{ transform: `rotate(${tilt}deg)`, filter: "drop-shadow(0 2px 3px rgba(0,0,0,.3))" }}
    >
      <path
        d="M 30 18 C 14 24, 8 44, 14 58 C 6 72, 22 86, 38 80 C 48 90, 70 86, 76 72 C 92 70, 94 50, 82 42 C 88 28, 70 14, 56 22 C 48 12, 32 12, 30 18 Z"
        fill={color}
        opacity="0.88"
      />
      <circle cx="86" cy="20" r="3" fill={color} opacity="0.7" />
      <circle cx="12" cy="78" r="2" fill={color} opacity="0.6" />
      <circle cx="96" cy="60" r="2" fill={color} opacity="0.7" />
    </svg>
  )
}

/** The inkwell on the desk the letter is read at. */
export function Inkwell({ size = 84 }: { size?: number }) {
  const id = useId().replace(/:/g, "")
  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      aria-hidden
      style={{ filter: "drop-shadow(2px 6px 6px rgba(0,0,0,.55))" }}
    >
      <defs>
        <radialGradient id={`${id}glass`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#7e6450" />
          <stop offset="40%" stopColor="#3a2618" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#120a04" />
        </radialGradient>
        <linearGradient id={`${id}rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d6a13f" />
          <stop offset="100%" stopColor="#6b440f" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="106" rx="44" ry="8" fill="#1a0e07" opacity="0.6" />
      <path d="M 12 96 L 88 96 L 84 110 L 16 110 Z" fill={`url(#${id}rim)`} stroke="#3a1e0a" strokeWidth="1" />
      <path d="M 22 48 Q 22 24 50 24 Q 78 24 78 48 L 78 96 L 22 96 Z" fill={`url(#${id}glass)`} stroke="#1a0e07" strokeWidth="1.5" />
      <ellipse cx="50" cy="28" rx="22" ry="6" fill={`url(#${id}rim)`} stroke="#3a1e0a" strokeWidth="1" />
      <ellipse cx="50" cy="28" rx="18" ry="4" fill="#0a0604" />
      <ellipse cx="50" cy="30" rx="14" ry="2.5" fill="#1a0a05" />
      <ellipse cx="44" cy="29" rx="4" ry="1" fill="rgba(255,255,255,.18)" />
      <path d="M 30 52 Q 32 70 36 90" stroke="rgba(255,255,255,.16)" strokeWidth="2" fill="none" />
    </svg>
  )
}

/** The quill resting beside it. */
export function QuillPen({ size = 140, tilt = 18 }: { size?: number; tilt?: number }) {
  const id = useId().replace(/:/g, "")
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-hidden
      style={{ transform: `rotate(${tilt}deg)`, filter: "drop-shadow(2px 4px 5px rgba(0,0,0,.5))" }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5e8b8" />
          <stop offset="45%" stopColor="#c89a4a" />
          <stop offset="100%" stopColor="#5a3a18" />
        </linearGradient>
      </defs>
      <path
        d="M 30 170 Q 60 110 100 60 Q 140 20 170 20 Q 168 50 140 80 Q 100 120 60 160 Q 50 168 30 170 Z"
        fill={`url(#${id})`}
        stroke="#3a2410"
        strokeWidth="1.5"
      />
      <path d="M 30 170 Q 80 110 165 25" fill="none" stroke="#3a2410" strokeWidth="2.5" strokeLinecap="round" />
      {Array.from({ length: 14 }, (_, i) => {
        const t = i / 14
        const x1 = 30 + (165 - 30) * t
        const y1 = 170 + (25 - 170) * t
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x1 + (-22 + i * 1.4)}
            y2={y1 + (-28 + i * 0.4)}
            stroke="#3a2410"
            strokeWidth="0.6"
            opacity="0.5"
          />
        )
      })}
      <path d="M 20 180 L 30 168 L 38 178 L 28 188 Z" fill="#1a0e07" stroke="#000" strokeWidth="0.8" />
      <path d="M 24 184 L 30 178" stroke="#6b1410" strokeWidth="1.5" />
    </svg>
  )
}

/** A twisted strand — what ties one paper of a chain to the next. */
export function RopePath({ d, thickness = 6, color = "#6b4a28" }: { d: string; thickness?: number; color?: string }) {
  return (
    <>
      <path d={d} fill="none" stroke="#1a0e07" strokeWidth={thickness + 2} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#3a2410" strokeWidth={thickness} strokeLinecap="round" strokeDasharray="6 4" opacity="0.55" />
      <path d={d} fill="none" stroke="#c8a26a" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 3" opacity="0.65" />
    </>
  )
}

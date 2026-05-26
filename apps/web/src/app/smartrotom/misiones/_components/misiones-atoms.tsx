"use client"

import React, { useMemo } from "react"
import { QuestStatus } from "@/types/misiones"

// ============ WAX SEAL ============
function ridgedPath(cx: number, cy: number, rOuter: number, rInner: number, points = 28): string {
  let d = ""
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const x = cx + r * Math.cos(a)
    const y = cy + r * Math.sin(a)
    d += (i === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2) + " "
  }
  return d + "Z"
}
const WAX_RIDGE_PATH = ridgedPath(50, 50, 46, 41, 32)

interface WaxSealProps {
  glyph?: string
  color?: string
  size?: number
  tilt?: number
  className?: string
}
export function WaxSeal({ glyph = "Q", color = "var(--seal-available)", size = 60, tilt = -8, className = "" }: WaxSealProps) {
  const id = useMemo(() => "wax_" + Math.random().toString(36).slice(2, 8), [])
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className}
      style={{ transform: `rotate(${tilt}deg)`, filter: "drop-shadow(2px 4px 4px rgba(0,0,0,0.5))", flexShrink: 0 }}>
      <defs>
        <radialGradient id={id + "wax"} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35"/>
          <stop offset="20%" stopColor={color} stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#000" stopOpacity="0.55"/>
        </radialGradient>
        <radialGradient id={id + "in"} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18"/>
          <stop offset="60%" stopColor="rgba(0,0,0,0)" stopOpacity="0"/>
          <stop offset="100%" stopColor="#000" stopOpacity="0.40"/>
        </radialGradient>
      </defs>
      <path d={WAX_RIDGE_PATH} fill={color}/>
      <circle cx="50" cy="50" r="36" fill={color}/>
      <circle cx="50" cy="50" r="36" fill={`url(#${id}wax)`} style={{ mixBlendMode: "multiply" }}/>
      <circle cx="50" cy="50" r="36" fill={`url(#${id}in)`}/>
      <circle cx="50" cy="50" r="29" fill="none" stroke="rgba(0,0,0,0.32)" strokeWidth="1.2"/>
      <circle cx="50" cy="50" r="29" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>
      <ellipse cx="38" cy="32" rx="14" ry="6" fill="rgba(255,255,255,0.28)" transform="rotate(-25 38 32)"/>
      <text x="50" y="62" textAnchor="middle"
        fontFamily="Cinzel Decorative, Cinzel, serif" fontSize="30" fontWeight="700"
        fill="rgba(0,0,0,0.55)"
        style={{ paintOrder: "stroke" } as React.CSSProperties}
        stroke="rgba(0,0,0,0.5)" strokeWidth="0.6">
        {glyph}
      </text>
    </svg>
  )
}

// ============ NAIL ============
interface NailProps { size?: number; color?: string; className?: string }
export function Nail({ size = 14, color = "#3a2a18", className = "" }: NailProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}
      style={{ filter: "drop-shadow(1px 2px 2px rgba(0,0,0,0.5))" }}>
      <defs>
        <radialGradient id="nail-g" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#c0a070"/>
          <stop offset="40%" stopColor="#8a6840"/>
          <stop offset="100%" stopColor={color}/>
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="8" fill="url(#nail-g)" stroke="rgba(0,0,0,0.5)" strokeWidth="0.5"/>
      <ellipse cx="9.5" cy="8.5" rx="3" ry="1.2" fill="rgba(255,255,255,0.4)" transform="rotate(-30 9.5 8.5)"/>
      <circle cx="12" cy="12" r="1" fill="rgba(0,0,0,0.45)"/>
    </svg>
  )
}

// ============ THUMBTACK ============
interface ThumbTackProps { size?: number; color?: string; className?: string }
export function Thumbtack({ size = 16, color = "#a82a18", className = "" }: ThumbTackProps) {
  const gid = "tt-" + color.replace("#", "")
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}
      style={{ filter: "drop-shadow(1px 3px 3px rgba(0,0,0,0.5))" }}>
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55"/>
          <stop offset="40%" stopColor={color}/>
          <stop offset="100%" stopColor="#000" stopOpacity="0.5"/>
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#${gid})`} stroke="rgba(0,0,0,0.4)" strokeWidth="0.4"/>
      <ellipse cx="9" cy="8" rx="3.5" ry="1.5" fill="rgba(255,255,255,0.5)" transform="rotate(-30 9 8)"/>
    </svg>
  )
}

// ============ CORNER FLOURISH ============
type FlourishOrientation = "tl" | "tr" | "bl" | "br"
interface FlourishProps { size?: number; orientation?: FlourishOrientation; color?: string; className?: string }
export function Flourish({ size = 60, orientation = "tl", color = "currentColor", className = "" }: FlourishProps) {
  const transforms: Record<FlourishOrientation, string> = {
    tl: "",
    tr: "scale(-1 1) translate(-60 0)",
    bl: "scale(1 -1) translate(0 -60)",
    br: "scale(-1 -1) translate(-60 -60)",
  }
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} className={className} style={{ color }}>
      <g transform={transforms[orientation]} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M 2 30 Q 2 2 30 2"/>
        <path d="M 7 30 Q 7 7 30 7"/>
        <path d="M 6 18 Q 12 14 18 18 Q 18 22 14 22" fill="currentColor" opacity="0.85"/>
        <path d="M 18 6 Q 22 12 18 18 Q 14 18 14 14" fill="currentColor" opacity="0.85"/>
        <circle cx="2" cy="30" r="1.8" fill="currentColor" stroke="none"/>
        <circle cx="30" cy="2" r="1.8" fill="currentColor" stroke="none"/>
        <circle cx="22" cy="22" r="1.2" fill="currentColor" stroke="none"/>
        <path d="M 30 14 Q 32 18 28 22 Q 24 24 22 28"/>
      </g>
    </svg>
  )
}

interface FlourishCornersProps { size?: number; color?: string; offset?: number; opacity?: number }
export function FlourishCorners({ size = 36, color = "var(--ink-2)", offset = 6, opacity = 0.55 }: FlourishCornersProps) {
  const wrap: React.CSSProperties = { position: "absolute", color, opacity, pointerEvents: "none" }
  return (
    <>
      <div style={{ ...wrap, top: offset, left: offset }}><Flourish orientation="tl" size={size}/></div>
      <div style={{ ...wrap, top: offset, right: offset }}><Flourish orientation="tr" size={size}/></div>
      <div style={{ ...wrap, bottom: offset, left: offset }}><Flourish orientation="bl" size={size}/></div>
      <div style={{ ...wrap, bottom: offset, right: offset }}><Flourish orientation="br" size={size}/></div>
    </>
  )
}

// ============ DECORATIVE DIVIDER ============
interface DividerProps { color?: string; glyph?: string; className?: string }
export function Divider({ color = "currentColor", glyph = "❦", className = "" }: DividerProps) {
  return (
    <div className={className} style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      color, fontFamily: "var(--font-display)", fontSize: 16, opacity: 0.7,
      width: "100%",
    }}>
      <svg viewBox="0 0 100 12" height="12" style={{ flex: 1, maxWidth: 80 }}>
        <line x1="0" y1="6" x2="80" y2="6" stroke="currentColor" strokeWidth="0.8"/>
        <path d="M 80 6 L 92 2 L 100 6 L 92 10 Z" fill="currentColor"/>
      </svg>
      <span style={{ fontSize: 18 }}>{glyph}</span>
      <svg viewBox="0 0 100 12" height="12" style={{ flex: 1, maxWidth: 80, transform: "scaleX(-1)" }}>
        <line x1="0" y1="6" x2="80" y2="6" stroke="currentColor" strokeWidth="0.8"/>
        <path d="M 80 6 L 92 2 L 100 6 L 92 10 Z" fill="currentColor"/>
      </svg>
    </div>
  )
}

// ============ RIBBON BANNER ============
interface RibbonProps { children: React.ReactNode; color?: string; width?: number; height?: number }
export function Ribbon({ children, color, width = 320, height = 56 }: RibbonProps) {
  const w = width, h = height
  const c = color || "var(--seal-available)"
  return (
    <div style={{ position: "relative", width: w, height: h, display: "inline-block" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{
        position: "absolute", inset: 0, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
      }}>
        <defs>
          <linearGradient id="rib-g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.95"/>
            <stop offset="50%" stopColor={c} stopOpacity="1"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.4)"/>
          </linearGradient>
        </defs>
        <path d={`M 14 8 L ${w-14} 8 L ${w-2} ${h/2} L ${w-14} ${h-8} L 14 ${h-8} L 2 ${h/2} Z`}
          fill="url(#rib-g)" stroke="rgba(0,0,0,0.45)" strokeWidth="1"/>
        <path d={`M 2 ${h/2} L 14 8 L 18 ${h/2} L 14 ${h-8} Z`} fill="rgba(0,0,0,0.32)"/>
        <path d={`M ${w-2} ${h/2} L ${w-14} 8 L ${w-18} ${h/2} L ${w-14} ${h-8} Z`} fill="rgba(0,0,0,0.32)"/>
        <path d={`M 16 12 L ${w-16} 12`} stroke="rgba(255,255,255,0.35)" strokeWidth="1.2"/>
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--paper-1)",
        fontFamily: "var(--font-display)",
        fontSize: 16, fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
      }}>{children}</div>
    </div>
  )
}

// ============ STAMP ============
interface StampProps { children: React.ReactNode; kind?: "completed" | "failed" | "active"; animate?: boolean }
export function Stamp({ children, kind = "completed", animate = false }: StampProps) {
  const cls = ["stamp"]
  if (kind === "failed") cls.push("stamp-failed")
  if (kind === "active") cls.push("stamp-active")
  if (animate) cls.push("stamp-anim")
  return <div className={cls.join(" ")}>{children}</div>
}

// ============ SPARKLES ============
interface SparklesProps { count?: number }
export function Sparkles({ count = 4 }: SparklesProps) {
  const positions = useMemo(() =>
    Array.from({ length: count }).map(() => ({
      left: Math.random() * 80 + 10 + "%",
      top: Math.random() * 80 + 10 + "%",
      delay: Math.random() * 3 + "s",
      size: Math.random() * 4 + 4,
    }))
  , [count])
  return (
    <>
      {positions.map((p, i) => (
        <span key={i} className="sparkle" style={{
          left: p.left, top: p.top, width: p.size, height: p.size,
          animationDelay: p.delay,
        }}/>
      ))}
    </>
  )
}

// ============ HERALDIC SHIELD ============
interface ShieldProps { size?: number; color?: string; children?: React.ReactNode }
export function Shield({ size = 48, color = "var(--gold-2)", children }: ShieldProps) {
  return (
    <div style={{ position: "relative", width: size, height: size * 1.18, display: "inline-block" }}>
      <svg viewBox="0 0 100 118" width={size} height={size * 1.18} style={{
        position: "absolute", inset: 0, filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.5))",
      }}>
        <defs>
          <linearGradient id="sh-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.4"/>
            <stop offset="30%" stopColor={color} stopOpacity="0.95"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.6)"/>
          </linearGradient>
        </defs>
        <path d="M 8 4 L 92 4 L 92 56 Q 92 100 50 114 Q 8 100 8 56 Z" fill="url(#sh-g)" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5"/>
        <path d="M 8 4 L 92 4 L 92 12 L 8 12 Z" fill="rgba(0,0,0,0.32)"/>
        <path d="M 16 14 L 84 14 L 84 56 Q 84 92 50 106 Q 16 92 16 56 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        color: "#1e120a", fontFamily: "var(--font-display)",
        fontWeight: 700, fontSize: size * 0.42,
        paddingTop: size * 0.12,
      }}>{children}</div>
    </div>
  )
}

// ============ INLINE SVG ICONS ============
type IconProps = { size?: number }

export const Icon = {
  Scroll: (p: IconProps) => (<svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h12a3 3 0 0 1 3 3v10a3 3 0 0 0 3 3H8a3 3 0 0 1-3-3V7a3 3 0 0 0-3-3Z"/><path d="M9 9h6M9 13h6"/></svg>),
  Map: (p: IconProps) => (<svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z"/><path d="M9 3v16M15 5v16"/></svg>),
  Medal: (p: IconProps) => (<svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="14" r="6"/><path d="M8 2v6M16 2v6M9 8l3 6 3-6"/></svg>),
  Quill: (p: IconProps) => (<svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 4 9 15l-3 3v3h3l3-3L23 7Z"/><path d="M14 5h6v6"/></svg>),
  Pin: (p: IconProps) => (<svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-7.6 7-13a7 7 0 0 0-14 0c0 5.4 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>),
  Lock: (p: IconProps) => (<svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>),
  X: (p: IconProps) => (<svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>),
  Check: (p: IconProps) => (<svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="5,12 10,17 20,7"/></svg>),
  Search: (p: IconProps) => (<svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>),
  Target: (p: IconProps) => (<svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>),
  Gift: (p: IconProps) => (<svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,12 20,22 4,22 4,12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7a2.5 2.5 0 0 1 0-5C10.5 2 12 7 12 7zM12 7h5a2.5 2.5 0 0 0 0-5C13.5 2 12 7 12 7z"/></svg>),
  Arrow: (p: IconProps) => (<svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13,5 20,12 13,19"/></svg>),
  Info: (p: IconProps) => (<svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v0M12 12v5"/></svg>),
  Sword: (p: IconProps) => (<svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m14 4 6 6-9 9-2 1H4v-5l1-2 9-9Z"/><path d="m12 6 6 6"/></svg>),
}

// ============ STATUS CONSTANTS ============
export const STATUS_LABEL: Record<QuestStatus, string> = {
  [QuestStatus.ACTIVE]: "Vigente",
  [QuestStatus.AVAILABLE]: "Disponible",
  [QuestStatus.COMPLETED]: "Completada",
  [QuestStatus.FAILED]: "Fallida",
  [QuestStatus.LOCKED]: "Sellada",
  [QuestStatus.NOT_STARTED]: "Sin empezar",
}

export const STATUS_GLYPH: Record<QuestStatus, string> = {
  [QuestStatus.ACTIVE]: "V",
  [QuestStatus.AVAILABLE]: "D",
  [QuestStatus.COMPLETED]: "C",
  [QuestStatus.FAILED]: "F",
  [QuestStatus.LOCKED]: "L",
  [QuestStatus.NOT_STARTED]: "N",
}

export const STATUS_COLOR: Record<QuestStatus, string> = {
  [QuestStatus.ACTIVE]: "var(--seal-active)",
  [QuestStatus.AVAILABLE]: "var(--seal-available)",
  [QuestStatus.COMPLETED]: "var(--seal-completed)",
  [QuestStatus.FAILED]: "var(--seal-failed)",
  [QuestStatus.LOCKED]: "var(--seal-locked)",
  [QuestStatus.NOT_STARTED]: "var(--seal-locked)",
}

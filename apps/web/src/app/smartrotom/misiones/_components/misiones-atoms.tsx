"use client"

import React, { useMemo } from "react"
import { QuestStatus } from "@/types/misiones"
import { CravatarHead } from "@/components/smartrotom/CravatarHead"

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

// ============ PAPER RUSTLE SOUND ============
export function playPaperRustle() {
  if (typeof window === "undefined") return;
  if ((window as any).__paperSoundEnabled === false) return;
  try {
    const win = window as any;
    const ctx: AudioContext = win.__audioCtx || (win.__audioCtx = new (window.AudioContext || (win as any).webkitAudioContext)());
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2) * 0.18;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1200;
    const g = ctx.createGain();
    g.gain.value = 0.6;
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start();
  } catch (_) {}
}

// ============ MINECRAFT HEAD (cravatar.eu face) ============
interface MinecraftHeadProps { skin?: string; size?: number }
export function MinecraftHead({ skin, size = 32 }: MinecraftHeadProps) {
  return <CravatarHead username={skin} size={size} variant="face" />
}

// ============ MINECRAFT SKIN AVATAR ============
interface MinecraftSkinAvatarProps {
  skin?: string;
  size?: number;
  ring?: boolean;
  ringColor?: string;
  headOnly?: boolean;
}
export function MinecraftSkinAvatar({ skin, size = 56, ring = false, ringColor = "var(--gold-2)", headOnly = false }: MinecraftSkinAvatarProps) {
  const inner = (
    <CravatarHead username={skin} size={size} variant={headOnly ? "face" : "head3d"} />
  );

  if (ring) {
    return (
      <div style={{
        borderRadius: 3,
        background: "#1a1208",
        padding: 2,
        outline: `1.5px solid ${ringColor}`,
        display: "inline-block",
        flexShrink: 0,
      }}>
        {inner}
      </div>
    );
  }

  return inner;
}

// ============ CORK BOARD PAPER DECORATIONS ============
interface PostItProps { children?: React.ReactNode; color?: string; tilt?: number; size?: number; footer?: string }
export function PostIt({ children, color = "#fff77a", tilt = -3, size = 130, footer = "" }: PostItProps) {
  return (
    <div style={{
      width: size, minHeight: size * 0.9,
      padding: "16px 14px 12px 14px",
      background: `linear-gradient(180deg, ${color}, ${color}cc)`,
      transform: `rotate(${tilt}deg)`,
      boxShadow: "0 1px 0 rgba(0,0,0,0.1), 4px 8px 12px rgba(0,0,0,0.35), 12px 16px 24px -8px rgba(0,0,0,0.3)",
      position: "relative",
      fontFamily: "'Patrick Hand', 'Caveat', cursive",
      fontSize: 14, color: "#3a2a18", lineHeight: 1.3,
    }}>
      <div style={{
        position: "absolute", top: -8, left: "50%",
        transform: "translateX(-50%) rotate(-3deg)",
        width: 50, height: 16,
        background: "rgba(220,200,160,0.55)",
        border: "1px solid rgba(180,150,100,0.3)",
        boxShadow: "0 2px 3px rgba(0,0,0,0.2)",
      }}/>
      {children}
      {footer && (
        <div style={{
          marginTop: 8, fontSize: 11, opacity: 0.55, textAlign: "right",
          borderTop: "1px solid rgba(60,40,20,0.2)", paddingTop: 4,
        }}>{footer}</div>
      )}
    </div>
  );
}

interface NewspaperClippingProps { headline: string; body: string; source?: string; tilt?: number; width?: number }
export function NewspaperClipping({ headline, body, source = "The Pewter Times", tilt = 1.6, width = 220 }: NewspaperClippingProps) {
  return (
    <div style={{
      width, padding: "12px 14px",
      background: "linear-gradient(180deg, #efe8d2, #d6cca6)",
      transform: `rotate(${tilt}deg)`,
      boxShadow: "inset 0 0 30px rgba(80,50,20,0.15), 4px 6px 10px rgba(0,0,0,0.35), 10px 14px 22px -10px rgba(0,0,0,0.4)",
      color: "#1a1208",
      fontFamily: "'IM Fell English SC', 'Times New Roman', serif",
      clipPath: "polygon(2% 0%, 98% 1%, 100% 4%, 99% 96%, 97% 100%, 3% 99%, 1% 96%, 2% 4%)",
    }}>
      <div style={{ fontSize: 8, letterSpacing: "0.20em", textTransform: "uppercase", textAlign: "center", opacity: 0.7, marginBottom: 4, borderBottom: "1px solid rgba(0,0,0,0.4)", paddingBottom: 3 }}>{source}</div>
      <div style={{ fontFamily: "'IM Fell English SC', serif", fontWeight: 700, fontSize: 14, lineHeight: 1.05, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.02em" }}>{headline}</div>
      <div style={{ fontSize: 9, lineHeight: 1.4, columnCount: 2, columnGap: 6, fontFamily: "'EB Garamond', serif", textAlign: "justify", color: "#2a1810" }}>{body}</div>
    </div>
  );
}

interface PolaroidProps { caption?: string; tilt?: number; size?: number; image?: React.ReactNode }
export function Polaroid({ caption = "Ruta 1", tilt = -4, size = 130, image }: PolaroidProps) {
  return (
    <div style={{
      width: size, padding: "10px 10px 22px 10px",
      background: "#f5efde",
      transform: `rotate(${tilt}deg)`,
      boxShadow: "0 1px 0 rgba(0,0,0,0.06), 4px 8px 14px rgba(0,0,0,0.4), 12px 20px 28px -10px rgba(0,0,0,0.45)",
      position: "relative",
    }}>
      <div style={{ position: "absolute", top: -10, right: -10, width: 38, height: 22, background: "rgba(220,200,160,0.6)", border: "1px solid rgba(180,150,100,0.3)", transform: "rotate(28deg)" }}/>
      <div style={{ width: "100%", aspectRatio: "1 / 0.95", background: "linear-gradient(135deg, #4a5a2c 0%, #7a8a4a 40%, #c8b86a 90%)", position: "relative", overflow: "hidden", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.4)" }}>
        {image || (
          <svg viewBox="0 0 100 95" width="100%" height="100%">
            <rect x="0" y="60" width="100" height="35" fill="#5a4830"/>
            <path d="M 0 60 L 30 35 L 50 50 L 80 25 L 100 45 L 100 60 Z" fill="#3a4a22"/>
            <circle cx="78" cy="20" r="9" fill="#f5d785" opacity="0.85"/>
            <path d="M 15 70 L 22 60 L 28 70 Z" fill="#2a1810"/>
            <path d="M 60 76 L 68 64 L 74 76 Z" fill="#2a1810"/>
          </svg>
        )}
      </div>
      <div style={{ textAlign: "center", marginTop: 8, fontFamily: "'Patrick Hand', 'Caveat', cursive", fontSize: 13, color: "#3a2a18" }}>{caption}</div>
    </div>
  );
}

type DoodleKind = "arrow" | "star" | "check" | "skull"
interface DoodleProps { tilt?: number; size?: number; kind?: DoodleKind }
export function Doodle({ tilt = 0, size = 110, kind = "arrow" }: DoodleProps) {
  const doodles: Record<DoodleKind, React.ReactNode> = {
    arrow: (
      <svg viewBox="0 0 100 60" width={size} height={size * 0.6}>
        <path d="M 8 30 C 20 6, 60 6, 86 28 L 78 22 M 86 28 L 78 36" fill="none" stroke="#2a1810" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    star: (
      <svg viewBox="0 0 60 60" width={size * 0.6} height={size * 0.6}>
        <path d="M 30 6 L 36 24 L 54 24 L 40 35 L 46 53 L 30 42 L 14 53 L 20 35 L 6 24 L 24 24 Z" fill="none" stroke="#2a1810" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
    check: (
      <svg viewBox="0 0 60 60" width={size * 0.6} height={size * 0.6}>
        <path d="M 8 32 L 22 48 L 52 12" fill="none" stroke="#6b1410" strokeWidth="3.5" strokeLinecap="round"/>
      </svg>
    ),
    skull: (
      <svg viewBox="0 0 60 60" width={size * 0.6} height={size * 0.6}>
        <circle cx="30" cy="26" r="16" fill="none" stroke="#2a1810" strokeWidth="2"/>
        <circle cx="24" cy="26" r="3" fill="#2a1810"/>
        <circle cx="36" cy="26" r="3" fill="#2a1810"/>
        <path d="M 22 42 L 24 50 M 28 42 L 28 50 M 32 42 L 32 50 M 36 42 L 38 50" stroke="#2a1810" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  };
  return (
    <div style={{ transform: `rotate(${tilt}deg)`, display: "inline-block" }}>
      {doodles[kind]}
    </div>
  );
}

interface InkBlotProps { size?: number; color?: string; tilt?: number }
export function InkBlot({ size = 60, color = "#1a1208", tilt = 0 }: InkBlotProps) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}
      style={{ transform: `rotate(${tilt}deg)`, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))" }}>
      <path d="M 30 18 C 14 24, 8 44, 14 58 C 6 72, 22 86, 38 80 C 48 90, 70 86, 76 72 C 92 70, 94 50, 82 42 C 88 28, 70 14, 56 22 C 48 12, 32 12, 30 18 Z" fill={color} opacity="0.88"/>
      <circle cx="86" cy="20" r="3" fill={color} opacity="0.7"/>
      <circle cx="12" cy="78" r="2" fill={color} opacity="0.6"/>
      <circle cx="96" cy="60" r="2" fill={color} opacity="0.7"/>
    </svg>
  );
}

// ============ INKWELL + QUILL (letter desk decor) ============
interface InkwellProps { size?: number }
export function Inkwell({ size = 84 }: InkwellProps) {
  return (
    <svg viewBox="0 0 100 120" width={size} height={size * 1.2}
      style={{ filter: "drop-shadow(2px 6px 6px rgba(0,0,0,0.55))" }}>
      <defs>
        <radialGradient id="ink-glass" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#7e6450"/>
          <stop offset="40%" stopColor="#3a2618" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#120a04"/>
        </radialGradient>
        <linearGradient id="ink-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d6a13f"/>
          <stop offset="100%" stopColor="#6b440f"/>
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="106" rx="44" ry="8" fill="#1a0e07" opacity="0.6"/>
      <path d="M 12 96 L 88 96 L 84 110 L 16 110 Z" fill="url(#ink-rim)" stroke="#3a1e0a" strokeWidth="1"/>
      <path d="M 22 48 Q 22 24 50 24 Q 78 24 78 48 L 78 96 L 22 96 Z" fill="url(#ink-glass)" stroke="#1a0e07" strokeWidth="1.5"/>
      <ellipse cx="50" cy="28" rx="22" ry="6" fill="url(#ink-rim)" stroke="#3a1e0a" strokeWidth="1"/>
      <ellipse cx="50" cy="28" rx="18" ry="4" fill="#0a0604"/>
      <ellipse cx="50" cy="30" rx="14" ry="2.5" fill="#1a0a05"/>
      <ellipse cx="44" cy="29" rx="4" ry="1" fill="rgba(255,255,255,0.18)"/>
      <path d="M 30 52 Q 32 70 36 90" stroke="rgba(255,255,255,0.16)" strokeWidth="2" fill="none"/>
    </svg>
  );
}

interface QuillProps { size?: number; tilt?: number }
export function Quill({ size = 140, tilt = 18 }: QuillProps) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size}
      style={{ transform: `rotate(${tilt}deg)`, filter: "drop-shadow(2px 4px 5px rgba(0,0,0,0.5))" }}>
      <defs>
        <linearGradient id="feather-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5e8b8"/>
          <stop offset="45%" stopColor="#c89a4a"/>
          <stop offset="100%" stopColor="#5a3a18"/>
        </linearGradient>
      </defs>
      <path d="M 30 170 Q 60 110 100 60 Q 140 20 170 20 Q 168 50 140 80 Q 100 120 60 160 Q 50 168 30 170 Z" fill="url(#feather-g)" stroke="#3a2410" strokeWidth="1.5"/>
      <path d="M 30 170 Q 80 110 165 25" fill="none" stroke="#3a2410" strokeWidth="2.5" strokeLinecap="round"/>
      {Array.from({ length: 14 }).map((_, i) => {
        const t = i / 14;
        const x1 = 30 + (165 - 30) * t;
        const y1 = 170 + (25 - 170) * t;
        return (
          <line key={i} x1={x1} y1={y1} x2={x1 + (-22 + i * 1.4)} y2={y1 + (-28 + i * 0.4)}
            stroke="#3a2410" strokeWidth="0.6" opacity="0.5"/>
        );
      })}
      <path d="M 20 180 L 30 168 L 38 178 L 28 188 Z" fill="#1a0e07" stroke="#000" strokeWidth="0.8"/>
      <path d="M 24 184 L 30 178" stroke="#6b1410" strokeWidth="1.5"/>
    </svg>
  );
}

// ============ ROPE PATH (SVG, renders inside <svg> context) ============
interface RopePathProps { d: string; thickness?: number; color?: string }
export function RopePath({ d, thickness = 6, color = "#6b4a28" }: RopePathProps) {
  return (
    <>
      <path d={d} fill="none" stroke="#1a0e07" strokeWidth={thickness + 2} strokeLinecap="round"/>
      <path d={d} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round"/>
      <path d={d} fill="none" stroke="#3a2410" strokeWidth={thickness} strokeLinecap="round" strokeDasharray="6 4" opacity="0.55"/>
      <path d={d} fill="none" stroke="#c8a26a" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 3" opacity="0.65"/>
    </>
  );
}

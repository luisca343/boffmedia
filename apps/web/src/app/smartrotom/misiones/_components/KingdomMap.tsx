"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { useBoard } from "../_hooks/useBoard"
import { npcForQuest } from "../_utils/quests"
import { normalizeStatus, SEAL_FILL } from "../_utils/status"
import type { QuestData, TerrainKind } from "../_types"
import { FlourishCorners, Label, NpcPortrait, Paper, WaxSeal } from "./ui"

/**
 * Roads on the hand-drawn atlas. They connect the same fixed slots
 * `_utils/regions.ts` hands out to real categories (its `LAND_SLOTS` /
 * `ISLAND_SLOT`) — the atlas itself is static cartography; which quest
 * category happens to occupy a given town is the only dynamic part.
 */
const KINGDOM_ROADS = [
  "M 240 530 Q 280 470 360 380",
  "M 360 380 Q 420 330 520 270",
  "M 520 270 Q 600 220 700 200",
  "M 700 200 Q 770 300 830 420",
  "M 240 530 Q 160 380 130 220",
]

function TerrainVignette({ kind, cx, cy }: { kind: TerrainKind; cx: number; cy: number }) {
  if (kind === "town") {
    return (
      <g transform={`translate(${cx - 32} ${cy - 26})`} aria-hidden>
        <rect x="6" y="20" width="14" height="14" fill="#d4a76a" stroke="#3a2410" strokeWidth="1" />
        <path d="M 6 20 L 13 12 L 20 20 Z" fill="#8a3a18" stroke="#3a2410" strokeWidth="1" />
        <rect x="22" y="22" width="12" height="12" fill="#c89860" stroke="#3a2410" strokeWidth="1" />
        <path d="M 22 22 L 28 14 L 34 22 Z" fill="#6b1410" stroke="#3a2410" strokeWidth="1" />
        <rect x="38" y="18" width="16" height="16" fill="#d4a76a" stroke="#3a2410" strokeWidth="1" />
        <path d="M 38 18 L 46 10 L 54 18 Z" fill="#8a3a18" stroke="#3a2410" strokeWidth="1" />
        <rect x="10" y="26" width="3" height="3" fill="#f5d785" />
        <rect x="26" y="27" width="3" height="3" fill="#f5d785" />
        <rect x="44" y="24" width="3" height="3" fill="#f5d785" />
      </g>
    )
  }
  if (kind === "forest") {
    return (
      <g transform={`translate(${cx - 44} ${cy - 28})`} aria-hidden>
        {[[10, 30], [26, 26], [42, 30], [58, 28], [74, 30], [16, 16], [34, 12], [52, 14], [70, 16]].map(
          ([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <path d="M 0 18 L 8 0 L 16 18 Z" fill="#2a4a1a" stroke="#1a2a0a" strokeWidth="1" />
              <path d="M 2 22 L 8 8 L 14 22 Z" fill="#3a5a22" stroke="#1a2a0a" strokeWidth="1" />
              <rect x="6" y="22" width="4" height="3" fill="#3a2410" />
            </g>
          ),
        )}
      </g>
    )
  }
  if (kind === "city") {
    return (
      <g transform={`translate(${cx - 30} ${cy - 30})`} aria-hidden>
        <rect x="8" y="28" width="44" height="24" fill="#9a9a9a" stroke="#2a2a2a" strokeWidth="1" />
        <path
          d="M 8 28 L 12 24 L 12 28 M 18 28 L 22 24 L 22 28 M 28 28 L 32 24 L 32 28 M 38 28 L 42 24 L 42 28 M 48 28 L 52 24 L 52 28"
          stroke="#2a2a2a"
          strokeWidth="1"
          fill="#9a9a9a"
        />
        <rect x="22" y="10" width="16" height="20" fill="#7a7a7a" stroke="#2a2a2a" strokeWidth="1" />
        <path d="M 22 10 L 30 2 L 38 10 Z" fill="#5a1a18" stroke="#2a2a2a" strokeWidth="1" />
        <rect x="28" y="18" width="4" height="6" fill="#1a1208" />
        <path d="M 26 52 L 26 40 Q 30 36 34 40 L 34 52 Z" fill="#3a2410" stroke="#1a0e07" strokeWidth="1" />
      </g>
    )
  }
  if (kind === "mountain") {
    return (
      <g transform={`translate(${cx - 48} ${cy - 30})`} aria-hidden>
        <path d="M 0 48 L 28 6 L 50 30 L 70 12 L 96 48 Z" fill="#7a6a52" stroke="#2a1a0a" strokeWidth="1.2" />
        <path d="M 22 14 L 28 6 L 34 14 L 30 18 L 26 16 Z" fill="#f5f0e2" />
        <path d="M 64 18 L 70 12 L 76 18 L 72 22 L 68 20 Z" fill="#f5f0e2" />
        <path d="M 14 30 L 28 14 L 34 22 L 28 32 Z" fill="#5a4830" opacity="0.6" />
        <path d="M 56 26 L 70 14 L 76 22 L 70 32 Z" fill="#5a4830" opacity="0.6" />
        <circle cx="86" cy="-2" r="6" fill="#f5d785" />
        <circle cx="89" cy="-4" r="5" fill="#3a2618" />
      </g>
    )
  }
  if (kind === "ruins") {
    return (
      <g transform={`translate(${cx - 32} ${cy - 26})`} aria-hidden>
        <rect x="6" y="18" width="6" height="22" fill="#c8b89a" stroke="#3a2410" strokeWidth="1" />
        <rect x="3" y="14" width="12" height="6" fill="#a89878" stroke="#3a2410" strokeWidth="1" />
        <rect x="20" y="10" width="6" height="30" fill="#c8b89a" stroke="#3a2410" strokeWidth="1" />
        <rect x="17" y="6" width="12" height="6" fill="#a89878" stroke="#3a2410" strokeWidth="1" />
        <rect x="34" y="22" width="6" height="18" fill="#c8b89a" stroke="#3a2410" strokeWidth="1" />
        <path d="M 34 22 L 28 16 L 28 8 L 34 8 Z" fill="#a89878" stroke="#3a2410" strokeWidth="1" />
        <rect x="48" y="14" width="6" height="26" fill="#c8b89a" stroke="#3a2410" strokeWidth="1" />
        <rect x="45" y="10" width="12" height="6" fill="#a89878" stroke="#3a2410" strokeWidth="1" />
        <path d="M 0 6 L 32 0 L 64 6 L 60 12 L 4 12 Z" fill="#a89878" stroke="#3a2410" strokeWidth="1" />
      </g>
    )
  }
  if (kind === "island") {
    return (
      <g transform={`translate(${cx - 40} ${cy - 22})`} aria-hidden>
        <ellipse cx="36" cy="36" rx="36" ry="10" fill="#c4b078" stroke="#3a2410" strokeWidth="1" />
        <ellipse cx="36" cy="34" rx="30" ry="6" fill="#d4c088" />
        <path d="M 28 32 Q 36 22 44 32 Z" fill="#1a0e07" />
        <path d="M 56 30 Q 60 26 64 30 Z" fill="#1a0e07" />
        <path d="M 14 30 L 14 18" stroke="#3a2410" strokeWidth="2" />
        <path
          d="M 14 18 Q 8 14 4 18 M 14 18 Q 20 14 24 18 M 14 18 Q 10 12 14 8 M 14 18 Q 18 12 14 8"
          stroke="#2a4a1a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    )
  }
  return null
}

function MapPin({
  x,
  y,
  color,
  active,
  count,
  label,
  onClick,
}: {
  x: number
  y: number
  color: string
  active: boolean
  count: number
  label: string
  onClick: () => void
}) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      className="cursor-pointer outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ms-gold-2"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick()
        }
      }}
    >
      <ellipse cx="0" cy="6" rx="10" ry="3" fill="rgba(0,0,0,0.45)" />
      {active && <circle cx="0" cy="-8" r="12.5" fill="none" stroke="rgb(var(--ms-gold-1))" strokeWidth="1.4" opacity="0.85" />}
      <line x1="0" y1="-4" x2="0" y2="10" stroke="#1a0e07" strokeWidth="1.5" />
      <circle cx="0" cy="-8" r="9" fill={color} stroke="#1a0e07" strokeWidth="1.2" />
      <circle cx="-3" cy="-11" r="3" fill="rgba(255,255,255,0.45)" />
      {count > 0 && (
        <text x="0" y="-5" textAnchor="middle" fontSize="9" className="font-ms-display font-bold" fill="rgba(0,0,0,0.7)">
          {count}
        </text>
      )}
    </g>
  )
}

function CompassRose({ x = 870, y = 590, size = 60 }: { x?: number; y?: number; size?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity="0.85" aria-hidden>
      <circle cx="0" cy="0" r={size / 2 + 4} fill="rgba(255,240,200,0.35)" stroke="#3a2410" strokeWidth="0.8" />
      <circle cx="0" cy="0" r={size / 2} fill="none" stroke="#3a2410" strokeWidth="1" />
      <circle cx="0" cy="0" r={size / 3} fill="none" stroke="#3a2410" strokeWidth="0.6" strokeDasharray="2 3" />
      <path d={`M 0 ${-size / 2} L 6 0 L 0 ${size / 2} L -6 0 Z`} fill="#3a2410" />
      <path d={`M ${-size / 2} 0 L 0 6 L ${size / 2} 0 L 0 -6 Z`} fill="#3a2410" opacity="0.55" />
      <text x="0" y={-size / 2 - 6} textAnchor="middle" fontSize="11" className="font-ms-display font-bold" fill="#3a2410">
        N
      </text>
      <text x="0" y={size / 2 + 14} textAnchor="middle" fontSize="11" className="font-ms-display font-bold" fill="#3a2410">
        S
      </text>
      <text x={size / 2 + 8} y="4" textAnchor="middle" fontSize="11" className="font-ms-display font-bold" fill="#3a2410">
        E
      </text>
      <text x={-size / 2 - 8} y="4" textAnchor="middle" fontSize="11" className="font-ms-display font-bold" fill="#3a2410">
        O
      </text>
    </g>
  )
}

function SeaCartouche({ x = 90, y = 110 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity="0.78" aria-hidden>
      <path
        d="M 0 0 Q 12 -10 24 0 Q 34 8 28 18 Q 22 24 18 18 Q 22 14 20 10 Q 16 8 12 12 Q 14 16 18 18"
        fill="none"
        stroke="#2a4a6a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="22" cy="2" r="1.5" fill="#2a4a6a" />
      <path d="M 28 18 Q 36 22 32 30 Q 28 36 36 38" fill="none" stroke="#2a4a6a" strokeWidth="1.5" strokeLinecap="round" />
      <text x="0" y="56" className="font-ms-uppercase italic" fontSize="11" fill="#3a4a6a">
        Hic sunt dracones
      </text>
    </g>
  )
}

/**
 * The atlas. Everything a region needs to draw itself — its terrain, its
 * label, its pin colour and completion ring — comes straight from `useBoard()`
 * (region.x/y are the already-computed hand-drawn-atlas coordinates from
 * `_utils/regions.ts`). No mock data anywhere here.
 */
export function KingdomMap() {
  const t = useTranslations("misiones.kingdomMap")
  const { quests, npcs, regions, open } = useBoard()
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const activeId = selected ?? hovered
  const activeRegion = activeId ? regions.find((r) => r.id === activeId) : undefined
  const activeQuests: QuestData[] = activeRegion ? quests.filter((q) => activeRegion.questIds.includes(q.id)) : []
  const activeNpc = activeQuests[0] ? npcForQuest(npcs, activeQuests[0]) : undefined
  const activeCompleted = activeQuests.filter((q) => normalizeStatus(q) === "COMPLETED").length
  const activeHasActive = activeQuests.some((q) => normalizeStatus(q) === "ACTIVE")

  return (
    <div>
      <div
        className="relative rounded-[4px] p-2 shadow-[inset_0_0_24px_rgba(0,0,0,.6),0_6px_20px_rgba(0,0,0,.6)]"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgb(var(--ms-board-frame)) 0px, rgb(var(--ms-board-frame-hi)) 12px," +
            "rgb(var(--ms-board-frame)) 22px, rgb(var(--ms-board-frame-hi)) 40px, rgb(var(--ms-board-frame)) 56px)",
        }}
      >
        <Paper className="relative overflow-hidden p-0">
          <FlourishCorners size={48} offset={14} className="text-ms-ink-2/45" />

          <svg viewBox="0 0 1000 680" className="relative z-[1] block w-full">
            <defs>
              <pattern id="map-grain" patternUnits="userSpaceOnUse" width="120" height="120">
                <rect width="120" height="120" fill="transparent" />
                <circle cx="20" cy="30" r="0.6" fill="#3a2410" opacity="0.3" />
                <circle cx="78" cy="92" r="0.5" fill="#3a2410" opacity="0.3" />
                <circle cx="42" cy="64" r="0.4" fill="#3a2410" opacity="0.3" />
                <circle cx="95" cy="22" r="0.4" fill="#3a2410" opacity="0.3" />
              </pattern>
              <radialGradient id="sea-g" cx="20%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#8aa8b8" />
                <stop offset="60%" stopColor="#6688a0" />
                <stop offset="100%" stopColor="#3a5a72" />
              </radialGradient>
              <radialGradient id="land-g" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#e8d4a4" />
                <stop offset="70%" stopColor="#cdb172" />
                <stop offset="100%" stopColor="#9a7842" />
              </radialGradient>
            </defs>

            <rect x="0" y="0" width="1000" height="680" fill="url(#sea-g)" />
            {Array.from({ length: 20 }).map((_, i) => (
              <path
                key={i}
                d={`M 0 ${30 + i * 32} Q 100 ${20 + i * 32} 200 ${30 + i * 32} T 400 ${30 + i * 32} T 600 ${30 + i * 32} T 800 ${30 + i * 32} T 1000 ${30 + i * 32}`}
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="0.6"
              />
            ))}

            <path
              d="M 180 580 C 130 540, 110 470, 130 410 C 145 360, 130 320, 160 290 C 190 260, 200 250, 220 240 C 250 230, 270 240, 290 245 C 305 215, 340 200, 380 200 C 430 195, 460 220, 500 215 C 540 210, 580 195, 620 195 C 660 195, 700 190, 740 200 C 780 210, 820 245, 850 290 C 880 335, 890 380, 880 430 C 870 480, 850 520, 820 555 C 790 590, 740 615, 690 620 C 640 625, 580 615, 540 620 C 500 625, 460 625, 420 620 C 380 615, 340 615, 300 615 C 260 615, 220 605, 180 580 Z"
              fill="url(#land-g)"
              stroke="#3a2410"
              strokeWidth="2"
            />
            <path
              d="M 180 580 C 130 540, 110 470, 130 410 C 145 360, 130 320, 160 290 C 190 260, 200 250, 220 240 C 250 230, 270 240, 290 245 C 305 215, 340 200, 380 200 C 430 195, 460 220, 500 215 C 540 210, 580 195, 620 195 C 660 195, 700 190, 740 200 C 780 210, 820 245, 850 290 C 880 335, 890 380, 880 430 C 870 480, 850 520, 820 555 C 790 590, 740 615, 690 620 C 640 625, 580 615, 540 620 C 500 625, 460 625, 420 620 C 380 615, 340 615, 300 615 C 260 615, 220 605, 180 580 Z"
              fill="url(#map-grain)"
              opacity="0.7"
            />

            <path
              d="M 195 575 C 145 535, 125 470, 145 415 C 158 365, 145 325, 175 295 C 205 265, 215 255, 235 248 C 263 240, 280 248, 295 252 C 308 225, 345 213, 385 213 C 432 209, 460 232, 500 228 C 540 224, 580 210, 620 210 C 660 210, 700 207, 740 215 C 780 224, 815 253, 842 295 C 870 340, 880 380, 870 428 C 862 475, 842 515, 814 547 C 786 580, 740 602, 690 607"
              fill="none"
              stroke="rgba(58,36,16,0.4)"
              strokeWidth="0.8"
              strokeDasharray="2 4"
            />

            <ellipse cx="130" cy="220" rx="56" ry="22" fill="url(#land-g)" stroke="#3a2410" strokeWidth="1.5" />
            <ellipse cx="110" cy="160" rx="22" ry="10" fill="url(#land-g)" stroke="#3a2410" strokeWidth="1.3" />
            <ellipse cx="170" cy="280" rx="14" ry="6" fill="url(#land-g)" stroke="#3a2410" strokeWidth="1" />
            <ellipse cx="130" cy="220" rx="56" ry="22" fill="url(#map-grain)" opacity="0.6" />

            {KINGDOM_ROADS.slice(0, 4).map((d, i) => (
              <g key={i}>
                <path d={d} fill="none" stroke="rgba(58,36,16,0.6)" strokeWidth="3.5" strokeDasharray="6 6" strokeLinecap="round" />
                <path d={d} fill="none" stroke="rgba(248,228,170,0.5)" strokeWidth="1" strokeDasharray="2 8" strokeLinecap="round" />
              </g>
            ))}
            <path
              d={KINGDOM_ROADS[4]}
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.8"
              strokeDasharray="3 5"
              strokeLinecap="round"
            />

            <text x="500" y="430" textAnchor="middle" className="font-ms-display tracking-[0.3em]" fontSize="32" fill="#3a2410" opacity="0.5">
              {t("mapTitle")}
            </text>
            <text x="500" y="455" textAnchor="middle" className="font-ms-uppercase italic" fontSize="13" fill="#3a2410" opacity="0.55">
              {t("mapSubtitle")}
            </text>

            {regions.map((r) => (
              <TerrainVignette key={r.id} kind={r.terrain} cx={r.x} cy={r.y - 24} />
            ))}

            {regions.map((r) => (
              <text
                key={`${r.id}-lbl`}
                x={r.x}
                y={r.y + 26}
                textAnchor="middle"
                className="font-ms-display font-bold"
                fontSize="13"
                fill="#1a0e07"
                style={{ paintOrder: "stroke", stroke: "rgba(245,229,180,0.85)", strokeWidth: 3, strokeLinejoin: "round" }}
              >
                {r.name}
              </text>
            ))}

            {regions.map((r) => {
              const regionQuests = quests.filter((q) => r.questIds.includes(q.id))
              const hasActive = regionQuests.some((q) => normalizeStatus(q) === "ACTIVE")
              const hasAvailable = regionQuests.some((q) => normalizeStatus(q) === "AVAILABLE")
              const color = hasActive ? SEAL_FILL.ACTIVE : hasAvailable ? SEAL_FILL.AVAILABLE : SEAL_FILL.LOCKED
              const done = regionQuests.filter((q) => normalizeStatus(q) === "COMPLETED").length
              const frac = regionQuests.length ? done / regionQuests.length : 0
              const R = 21
              const C = 2 * Math.PI * R
              const isActive = activeId === r.id

              return (
                <g key={r.id} onMouseEnter={() => setHovered(r.id)} onMouseLeave={() => setHovered(null)}>
                  <g transform={`translate(${r.x} ${r.y - 8})`} className="pointer-events-none">
                    <circle r={R} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="3" />
                    <circle
                      r={R}
                      fill="none"
                      stroke="rgb(var(--ms-gold-2))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      transform="rotate(-90)"
                      strokeDasharray={C}
                      strokeDashoffset={C * (1 - frac)}
                      opacity={regionQuests.length ? 0.95 : 0}
                      className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
                    />
                    {frac >= 1 && regionQuests.length > 0 && (
                      <circle r={R + 4} fill="none" stroke="rgb(var(--ms-gold-1))" strokeWidth="0.8" opacity="0.6" />
                    )}
                  </g>
                  <MapPin
                    x={r.x}
                    y={r.y}
                    color={color}
                    active={isActive}
                    count={regionQuests.length}
                    label={`${r.name}: ${regionQuests.length} misiones`}
                    onClick={() => setSelected(selected === r.id ? null : r.id)}
                  />
                </g>
              )
            })}

            <SeaCartouche />
            <CompassRose />

            <g opacity="0.92">
              <path
                d="M 30 30 Q 50 26 70 30 L 200 30 Q 220 26 240 30 L 240 50 Q 220 54 200 50 L 70 50 Q 50 54 30 50 Z"
                fill="#f5e8c2"
                stroke="#3a2410"
                strokeWidth="1.2"
              />
              <text x="135" y="44" textAnchor="middle" className="font-ms-display font-bold" fontSize="13" fill="#3a2410">
                ATLAS DEL REINO
              </text>
            </g>
          </svg>

          {activeRegion && (
            <div
              className={cn("absolute z-20 w-[280px]", selected ? "pointer-events-auto" : "pointer-events-none")}
              style={{
                left: `calc(${(activeRegion.x / 1000) * 100}% + 18px)`,
                top: `calc(${(activeRegion.y / 680) * 100}% - 40px)`,
              }}
            >
              <Paper tilt={-1} className="relative px-3.5 py-3">
                <FlourishCorners size={18} offset={4} className="text-ms-gold-3/50" />
                <div className="mb-1.5 flex items-center gap-2.5">
                  {activeNpc && <NpcPortrait skin={activeNpc.skin} size={36} />}
                  <div className="min-w-0 flex-1">
                    <div className="font-ms-display text-[15px] leading-tight text-ms-ink-1">{activeRegion.name}</div>
                  </div>
                </div>
                <div className="mb-1.5 flex flex-wrap items-center gap-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-ms-ink-3 bg-gradient-to-b from-ms-paper-2 to-ms-paper-3 px-2.5 py-1 font-ms-uppercase text-[9px] uppercase tracking-[.12em] text-ms-ink-2 shadow-[inset_0_1px_0_rgba(255,255,255,.35)]">
                    {activeQuests.length} misiones
                  </span>
                  {activeHasActive && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-ms-gold-4 bg-gradient-to-b from-ms-gold-2 to-ms-gold-3 px-2.5 py-1 font-ms-uppercase text-[9px] uppercase tracking-[.12em] text-[#1e120a] shadow-[inset_0_1px_0_rgba(255,255,255,.45)]">
                      {t("active")}
                    </span>
                  )}
                  {activeQuests.length > 0 && (
                    <span className="ml-auto font-ms-uppercase text-[10px] tracking-[.1em] text-ms-gold-3">
                      {activeCompleted}/{activeQuests.length} ⚜
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  {activeQuests.slice(0, 3).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => open(q)}
                      className="flex items-center justify-between gap-1.5 rounded-sm border border-ms-ink-3/20 bg-ms-ink-1/5 px-2 py-1.5 text-left font-ms text-[11px] italic text-ms-ink-2 transition-colors hover:bg-ms-ink-1/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ms-gold-2"
                    >
                      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{q.name}</span>
                      <WaxSeal status={normalizeStatus(q)} size={18} tilt={-10} />
                    </button>
                  ))}
                  {activeQuests.length > 3 && (
                    <div className="text-center font-ms text-[10px] italic text-ms-ink-3">{t("more", { count: activeQuests.length - 3 })}</div>
                  )}
                </div>
              </Paper>
            </div>
          )}
        </Paper>
      </div>

      <Paper tilt={0.4} className="mt-3.5 flex flex-wrap items-center justify-center gap-4 px-4 py-3">
        <Label className="text-ms-ink-2">{t("legend")}</Label>
        {(
          [
            { c: SEAL_FILL.ACTIVE, l: t("legendActive") },
            { c: SEAL_FILL.AVAILABLE, l: t("legendAvailable") },
            { c: SEAL_FILL.LOCKED, l: t("legendLocked") },
          ] as const
        ).map((it) => (
          <span key={it.l} className="flex items-center gap-2 text-xs text-ms-ink-2">
            <svg viewBox="-12 -16 24 24" width="20" height="20" aria-hidden>
              <line x1="0" y1="-4" x2="0" y2="6" stroke="#1a0e07" strokeWidth="1.5" />
              <circle cx="0" cy="-8" r="7" fill={it.c} stroke="#1a0e07" strokeWidth="1" />
            </svg>
            {it.l}
          </span>
        ))}
        <span className="flex items-center gap-2 text-xs text-ms-ink-2">
          <svg width="40" height="8" aria-hidden>
            <line x1="0" y1="4" x2="40" y2="4" stroke="rgba(58,36,16,0.6)" strokeWidth="3" strokeDasharray="5 4" />
          </svg>
          {t("legendRoad")}
        </span>
        <span className="flex items-center gap-2 text-xs text-ms-ink-2">
          <svg width="40" height="8" aria-hidden>
            <line x1="0" y1="4" x2="40" y2="4" stroke="rgba(8,40,72,0.7)" strokeWidth="2" strokeDasharray="3 4" />
          </svg>
          {t("legendSea")}
        </span>
      </Paper>
    </div>
  )
}

"use client"

import React, { useMemo } from "react"
import { useTranslations } from "next-intl"
import { QuestData } from "@/types/misiones"
import { WaxSeal, RopePath, STATUS_LABEL, STATUS_GLYPH, STATUS_COLOR } from "./misiones-atoms"

type ChainEntry = QuestData & { _rel: "prev" | "self" | "next" }

function buildChain(quest: QuestData, allQuests: QuestData[]): ChainEntry[] {
  const out: ChainEntry[] = []
  const visited = new Set<number>()

  // Find parent
  const parent = allQuests.find((q) => q.nextQuest === quest.id)
  if (parent) out.push({ ...parent, _rel: "prev" })

  out.push({ ...quest, _rel: "self" })
  visited.add(quest.id)

  let cursor: QuestData = quest
  while (cursor.nextQuest && cursor.nextQuest !== 0 && !visited.has(cursor.nextQuest)) {
    const next = allQuests.find((q) => q.id === cursor.nextQuest)
    if (!next) break
    out.push({ ...next, _rel: "next" })
    visited.add(next.id)
    cursor = next
  }

  return out
}

interface ChainNodeProps {
  q: ChainEntry
  isCurrent: boolean
  onSelect?: (q: QuestData) => void
  compact: boolean
}

function ChainNode({ q, isCurrent, onSelect, compact }: ChainNodeProps) {
  const t = useTranslations("misiones")
  const color = STATUS_COLOR[q.status] ?? "var(--seal-locked)"

  return (
    <div
      onClick={() => !isCurrent && onSelect?.(q)}
      style={{
        width: 200, padding: "10px 12px",
        position: "relative",
        background: "radial-gradient(ellipse at 50% 50%, var(--paper-1), var(--paper-2) 80%, var(--paper-3))",
        color: "var(--ink-1)",
        border: "1px solid rgba(60,40,20,0.25)",
        boxShadow: "inset 0 0 18px rgba(80,50,20,0.18), 0 4px 8px rgba(0,0,0,0.35), 0 10px 18px -6px rgba(0,0,0,0.4)",
        clipPath: "polygon(2% 4%, 6% 0%, 95% 1%, 100% 5%, 99% 96%, 95% 100%, 5% 99%, 0% 95%)",
        cursor: isCurrent ? "default" : "pointer",
        opacity: q.status === "LOCKED" ? 0.7 : 1,
        flexShrink: 0,
      }}
    >
      <div style={{ position: "absolute", top: -8, right: -8 }}>
        <WaxSeal glyph={STATUS_GLYPH[q.status]} color={color} size={24} tilt={-12}/>
      </div>
      {isCurrent && (
        <div style={{
          position: "absolute", top: -6, left: 8,
          background: "var(--gold-2)", color: "#1e120a",
          padding: "1px 6px", fontSize: 8,
          fontFamily: "var(--font-uppercase)", letterSpacing: "0.16em",
          border: "1px solid var(--gold-4)",
        }}>
          {t("chain_here")}
        </div>
      )}
      <div className="label" style={{ color, marginBottom: 2 }}>
        {STATUS_LABEL[q.status]}
      </div>
      <div className="dec-title" style={{ fontSize: compact ? 12 : 13, lineHeight: 1.15 }}>
        {q.name}
      </div>
    </div>
  )
}

export interface QuestChainProps {
  quest: QuestData
  allQuests: QuestData[]
  onSelect?: (q: QuestData) => void
  compact?: boolean
}

export function QuestChain({ quest, allQuests, onSelect, compact = false }: QuestChainProps) {
  const chain = useMemo(() => buildChain(quest, allQuests), [quest, allQuests])
  if (chain.length < 2) return null

  const nodeW = 200
  const gap = 60
  const padX = 30
  const totalW = chain.length * nodeW + (chain.length - 1) * gap + padX * 2
  const ropeY = compact ? 56 : 72

  return (
    <div style={{ width: "100%", overflowX: "auto", paddingBottom: 8 }}>
      <div style={{
        position: "relative",
        width: totalW,
        minHeight: compact ? 110 : 140,
        padding: `${compact ? 18 : 30}px ${padX}px ${compact ? 10 : 20}px ${padX}px`,
      }}>
        <svg
          viewBox={`0 0 ${totalW} ${compact ? 120 : 160}`}
          width={totalW}
          height={compact ? 120 : 160}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {chain.slice(0, -1).map((_, i) => {
            const x1 = padX + nodeW * (i + 1) - 12 + i * gap
            const x2 = padX + nodeW * (i + 1) + gap + 12 + i * gap
            const d = `M ${x1} ${ropeY} Q ${(x1 + x2) / 2} ${ropeY + 22} ${x2} ${ropeY}`
            return <RopePath key={i} d={d} thickness={5} color="#7a4e22"/>
          })}
          {chain.map((_, i) => {
            const cx = padX + nodeW / 2 + i * (nodeW + gap)
            return (
              <g key={"knot" + i}>
                <circle cx={cx} cy={ropeY} r="5" fill="#1a0e07"/>
                <circle cx={cx} cy={ropeY} r="4" fill="#6b4a28"/>
                <circle cx={cx - 1.5} cy={ropeY - 1.5} r="1" fill="#c8a26a"/>
              </g>
            )
          })}
        </svg>
        <div style={{ position: "relative", display: "flex", gap, alignItems: "center" }}>
          {chain.map((entry, i) => (
            <ChainNode
              key={entry.id + "_" + i}
              q={entry}
              isCurrent={entry._rel === "self"}
              onSelect={onSelect}
              compact={compact}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

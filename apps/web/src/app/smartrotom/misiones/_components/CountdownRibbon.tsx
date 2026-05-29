"use client"

import { useState, useEffect, useMemo } from "react"
import { QuestData } from "@/types/misiones"

function questResetTarget(quest: QuestData): number {
  const now = new Date()
  // type 2 = Diaria
  if (quest.type === 2) {
    const t = new Date(now)
    t.setHours(24, 0, 0, 0)
    return t.getTime()
  }
  const span = 6 * 3600 * 1000
  const offset = (quest.id * 1373) % span
  return Math.ceil((now.getTime() - offset) / span) * span + offset
}

function useCountdown(targetMs: number) {
  const [, force] = useState(0)
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [targetMs])
  const diff = Math.max(0, targetMs - Date.now())
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { h, m, s, done: diff <= 0 }
}

export interface CountdownRibbonProps {
  quest: QuestData
  compact?: boolean
}

export function CountdownRibbon({ quest, compact = false }: CountdownRibbonProps) {
  const target = useMemo(() => questResetTarget(quest), [quest.id])
  const { h, m, s } = useCountdown(target)
  if (!quest.repeatable && quest.type !== 2) return null
  const txt = h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(s).padStart(2, "0")}s`
  return (
    <div className="countdown" style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: compact ? "3px 8px" : "4px 10px",
      background: "rgba(60,40,20,0.10)",
      border: "1px solid rgba(60,40,20,0.28)",
      borderRadius: 99,
      fontFamily: "var(--font-uppercase)", letterSpacing: "0.10em",
      fontSize: compact ? 9 : 10, color: "var(--ink-2)",
    }}>
      <span className="hourglass">⧗</span>
      <span>{quest.type === 2 ? "Renueva en" : "Repetible ·"} {txt}</span>
    </div>
  )
}

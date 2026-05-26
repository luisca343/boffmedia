"use client"

import React, { useMemo } from "react"
import { QuestData, QuestStatus } from "@/types/misiones"
import { FlourishCorners, Divider, Shield, Stamp } from "./misiones-atoms"
import { getQuestTypeLabel } from "../_utils/questUtils"

export interface TrophyScreenProps {
  quests: QuestData[]
}

export function TrophyScreen({ quests }: TrophyScreenProps) {
  const total = quests.length
  const completed = quests.filter((q) => q.status === QuestStatus.COMPLETED).length
  const active = quests.filter((q) => q.status === QuestStatus.ACTIVE).length
  const failed = quests.filter((q) => q.status === QuestStatus.FAILED).length

  const typeGroups = useMemo(() => {
    const groups: Record<string, { total: number; done: number }> = {}
    for (const q of quests) {
      const t = getQuestTypeLabel(q.type)
      if (!groups[t]) groups[t] = { total: 0, done: 0 }
      groups[t].total++
      if (q.status === QuestStatus.COMPLETED) groups[t].done++
    }
    return groups
  }, [quests])

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 30, marginTop: 10 }}>
        <span className="label" style={{ color: "var(--gold-1)" }}>Vitrina</span>
        <h1 className="dec-title" style={{ fontSize: 38, color: "var(--paper-1)", margin: "4px 0 6px 0", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
          Sala de Trofeos
        </h1>
        <div style={{ color: "var(--paper-3)", fontSize: 14, fontStyle: "italic" }}>
          {completed} de {total} misiones completadas
        </div>
        <div style={{ marginTop: 16, color: "var(--gold-2)", opacity: 0.7 }}>
          <Divider color="var(--gold-2)" glyph="⚜"/>
        </div>
      </div>

      {/* Overall progress */}
      <div className="paper" style={{ padding: "22px 28px", marginBottom: 28, position: "relative" }}>
        <FlourishCorners size={32} color="var(--gold-3)" offset={8} opacity={0.6}/>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span className="dec-title" style={{ fontSize: 20, color: "var(--gold-3)" }}>Progreso General</span>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <Shield size={80} color={completed > 0 ? "var(--gold-2)" : "var(--ink-3)"}>
            {completed > 0 ? "★" : "·"}
          </Shield>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6,
              fontFamily: "var(--font-uppercase)", letterSpacing: "0.12em", color: "var(--ink-3)" }}>
              <span>Completadas</span>
              <span style={{ color: "var(--gold-3)" }}>{completed} / {total}</span>
            </div>
            <div className="bar gold"><span style={{ width: total > 0 ? (completed / total * 100) + "%" : "0%" }}/></div>
            <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
              {[
                { label: "Vigentes", value: active, color: "var(--seal-active)" },
                { label: "Completadas", value: completed, color: "var(--seal-completed)" },
                { label: "Fallidas", value: failed, color: "var(--seal-failed)" },
              ].map((s) => (
                <div key={s.label} style={{
                  padding: "8px 12px", background: "rgba(60,40,20,0.06)",
                  border: "1px solid rgba(60,40,20,0.18)", borderRadius: 2, textAlign: "center",
                }}>
                  <div className="dec-title" style={{ fontSize: 20, color: s.color }}>{s.value}</div>
                  <div className="label" style={{ marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Per-type breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
        {Object.entries(typeGroups).map(([type, { total: t, done }]) => {
          const pct = t > 0 ? Math.round((done / t) * 100) : 0
          const isDone = done === t && t > 0
          return (
            <div key={type} className="paper" style={{ padding: 18, position: "relative", textAlign: "center", opacity: isDone ? 1 : 0.93 }}>
              <FlourishCorners size={20} color="var(--gold-3)" offset={4} opacity={0.45}/>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 6, marginBottom: 12, filter: isDone ? "" : "grayscale(0.4) brightness(0.85)" }}>
                <Shield size={64} color={isDone ? "var(--gold-2)" : "var(--ink-3)"}>
                  {isDone ? "★" : "·"}
                </Shield>
              </div>
              <h3 className="dec-title" style={{ fontSize: 17, margin: "0 0 4px 0", color: "var(--ink-1)" }}>{type}</h3>
              <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "0 0 12px 0", fontStyle: "italic" }}>{done}/{t} misiones</p>
              <div style={{ marginBottom: 6, fontSize: 10, color: "var(--ink-3)", fontFamily: "var(--font-uppercase)", letterSpacing: "0.14em" }}>{pct}%</div>
              <div className="bar gold"><span style={{ width: pct + "%" }}/></div>
              {isDone && (
                <div style={{ position: "absolute", top: 10, right: 14, transform: "rotate(8deg)" }}>
                  <Stamp kind="active" animate>Completado</Stamp>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

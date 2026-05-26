"use client"

import React from "react"
import { QuestData, NPC } from "@/types/misiones"
import {
  WaxSeal, Nail, FlourishCorners, Ribbon, Sparkles, Icon,
  STATUS_LABEL, STATUS_GLYPH, STATUS_COLOR,
} from "./misiones-atoms"
import { getQuestTypeLabel } from "../_utils/questUtils"

export interface TrackedQuestPaperProps {
  quest: QuestData
  npc: NPC | undefined
  regionName: string
  onOpen: () => void
}

export function TrackedQuestPaper({ quest, npc, regionName, onOpen }: TrackedQuestPaperProps) {
  const nextObjective = (quest.objectives || []).find((o) => o.progress < o.total)
  const progressValue = (quest.objectives || []).reduce((s, o) => s + Math.min(o.progress, o.total), 0)
  const progressTotal = (quest.objectives || []).reduce((s, o) => s + o.total, 0)
  const pct = progressTotal > 0 ? Math.round((progressValue / progressTotal) * 100) : 0

  return (
    <div className="paper pinnable sparkle-host" style={{
      padding: "26px 30px 22px 30px",
      transform: "rotate(-0.5deg)",
      position: "relative",
      cursor: "pointer",
    }} onClick={onOpen}>
      <Sparkles count={9}/>

      <div style={{ position: "absolute", top: -28, left: "50%", transform: "translateX(-50%)", zIndex: 8 }}>
        <Ribbon color="var(--stamp-red)" width={260} height={48}>¶ Misión Rastreada</Ribbon>
      </div>

      <div style={{ position: "absolute", top: 10, left: 10 }}><Nail size={14}/></div>
      <div style={{ position: "absolute", top: 10, right: 10 }}><Nail size={14}/></div>
      <div style={{ position: "absolute", bottom: 10, left: 10 }}><Nail size={14}/></div>
      <div style={{ position: "absolute", bottom: 10, right: 10 }}><Nail size={14}/></div>

      <FlourishCorners size={32} color="var(--gold-3)" offset={20} opacity={0.7}/>

      <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 14 }}>
        <WaxSeal glyph={STATUS_GLYPH[quest.status]} color={STATUS_COLOR[quest.status]} size={68} tilt={-12}/>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="label" style={{ color: STATUS_COLOR[quest.status] }}>
            {STATUS_LABEL[quest.status]} · {getQuestTypeLabel(quest.type)}
          </span>
          <h2 className="dec-title" style={{ fontSize: 28, margin: "4px 0 6px 0", color: "var(--ink-1)" }}>
            {quest.name}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-3)", fontSize: 13, fontStyle: "italic", marginBottom: 12 }}>
            <Icon.Quill size={12}/>
            <span>encomendada por</span>
            <strong style={{ color: "var(--ink-2)", fontStyle: "normal" }}>{npc?.name ?? "Desconocido"}</strong>
            {regionName && (
              <>
                <span style={{ opacity: 0.5 }}>·</span>
                <Icon.Pin size={12}/>
                <span>{regionName}</span>
              </>
            )}
          </div>

          {nextObjective && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(255,240,200,0.5)",
              border: "1px solid rgba(60,40,20,0.3)",
              borderRadius: 2, marginBottom: 12,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <Icon.Target size={16}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-uppercase)", letterSpacing: "0.12em" }}>SIGUIENTE</div>
                <div style={{ fontSize: 14, color: "var(--ink-1)", fontWeight: 500 }}>{nextObjective.name}</div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink-2)" }}>
                {nextObjective.progress}/{nextObjective.total}
              </span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="bar gold" style={{ flex: 1 }}><span style={{ width: pct + "%" }}/></div>
            <span style={{ fontFamily: "var(--font-uppercase)", fontSize: 12, color: "var(--gold-3)", letterSpacing: "0.08em" }}>
              {pct}%
            </span>
            <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); onOpen() }}>
              <Icon.Quill size={12}/> Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

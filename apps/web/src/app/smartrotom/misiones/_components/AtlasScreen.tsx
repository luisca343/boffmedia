"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { QuestData, QuestStatus } from "@/types/misiones"
import { WaxSeal, FlourishCorners, Divider, Shield } from "./misiones-atoms"
import { STATUS_GLYPH, STATUS_COLOR } from "./misiones-atoms"
import { Region } from "../_types/board"

export interface AtlasScreenProps {
  quests: QuestData[]
  regions: Region[]
  onSelect: (q: QuestData) => void
}

export function AtlasScreen({ quests, regions, onSelect }: AtlasScreenProps) {
  const t = useTranslations("misiones")
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 30, marginTop: 10 }}>
        <span className="label" style={{ color: "var(--gold-1)" }}>{t("atlas_label")}</span>
        <h1 className="dec-title" style={{ fontSize: 38, color: "var(--paper-1)", margin: "4px 0 6px 0", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
          {t("atlas_title")}
        </h1>
        <div style={{ color: "var(--paper-3)", fontSize: 14, fontStyle: "italic" }}>
          {t("atlas_subtitle")}
        </div>
        <div style={{ marginTop: 16, color: "var(--gold-2)", opacity: 0.7 }}>
          <Divider color="var(--gold-2)" glyph="✦"/>
        </div>
      </div>

      {regions.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--paper-2)", fontStyle: "italic", padding: "40px 0" }}>
          {t("atlas_loading")}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 22 }}>
          {regions.map((r, ri) => {
            const questsHere = quests.filter((q) => q.category === r.id)
            const completed = questsHere.filter((q) => q.status === QuestStatus.COMPLETED).length
            const active = questsHere.filter((q) => q.status === QuestStatus.ACTIVE).length
            const available = questsHere.filter((q) => q.status === QuestStatus.AVAILABLE).length
            const pct = questsHere.length > 0 ? Math.round((completed / questsHere.length) * 100) : 0
            const hue = (ri * 47 + 35) % 360
            return (
              <div key={r.id} className="paper" style={{ padding: "20px 22px", position: "relative" }}>
                <FlourishCorners size={26} color="var(--gold-3)" offset={6} opacity={0.5}/>
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                  <Shield size={50} color={`hsl(${hue}, 45%, 48%)`}>{r.glyph}</Shield>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="label">{t("atlas_category")}</span>
                    <h3 className="dec-title" style={{ fontSize: 20, margin: "2px 0", color: "var(--ink-1)" }}>{r.name}</h3>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="dec-title" style={{ fontSize: 22, color: "var(--gold-3)", lineHeight: 1 }}>{pct}%</div>
                    <div className="label" style={{ marginTop: 2 }}>{t("atlas_done")}</div>
                  </div>
                </div>
                <div className="bar gold"><span style={{ width: pct + "%" }}/></div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                  {active > 0 && <span className="chip" style={{ color: "var(--seal-active)", borderColor: "var(--seal-active)", background: "rgba(200,144,38,0.08)" }}>{active} {t(active === 1 ? "atlas_active_one" : "atlas_active_other")}</span>}
                  {available > 0 && <span className="chip" style={{ color: "var(--seal-available)", borderColor: "var(--seal-available)", background: "rgba(179,65,26,0.08)" }}>{available} {t(available === 1 ? "atlas_available_one" : "atlas_available_other")}</span>}
                  {completed > 0 && <span className="chip" style={{ color: "var(--seal-completed)", borderColor: "var(--seal-completed)", background: "rgba(107,20,16,0.08)" }}>{completed} {t(completed === 1 ? "atlas_completed_one" : "atlas_completed_other")}</span>}
                </div>
                {questsHere.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed rgba(60,40,20,0.3)", display: "flex", flexDirection: "column", gap: 6 }}>
                    {questsHere.slice(0, 3).map((q) => (
                      <div key={q.id} onClick={() => onSelect(q)} style={{
                        padding: "8px 10px", background: "rgba(60,40,20,0.06)",
                        borderRadius: 2, cursor: "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                        fontSize: 13, color: "var(--ink-2)",
                      }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic" }}>{q.name}</span>
                        <WaxSeal glyph={STATUS_GLYPH[q.status]} color={STATUS_COLOR[q.status]} size={22} tilt={-10}/>
                      </div>
                    ))}
                    {questsHere.length > 3 && (
                      <div style={{ fontSize: 11, color: "var(--ink-3)", textAlign: "center", fontStyle: "italic" }}>
                        {t("atlas_more", { count: questsHere.length - 3 })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

"use client"

import React, { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { QuestData, QuestStatus, IDialogue, NPC } from "@/types/misiones"
import {
  WaxSeal, FlourishCorners, Ribbon, Divider, Icon,
  STATUS_LABEL, STATUS_GLYPH, STATUS_COLOR,
} from "./misiones-atoms"
import { getQuestTypeKey, formatItemName, getNpcForQuest } from "../_utils/questUtils"
import { Region } from "../_types/board"

export interface QuestLetterProps {
  quest: QuestData
  npcs: NPC[]
  dialogs: IDialogue[]
  regions: Region[]
  onClose: () => void
}

export function QuestLetter({ quest, npcs, dialogs, regions, onClose }: QuestLetterProps) {
  const t = useTranslations("misiones")
  const [tick, setTick] = useState(0)
  useEffect(() => { setTick((t) => t + 1) }, [quest?.id])

  const npc = getNpcForQuest(quest, npcs)
  const regionName = quest.category || ""
  const dialog = dialogs.find((d) => d.questId === quest.id || d.id === quest.dialogId)
  const objectivesTotal = (quest.objectives || []).length

  return (
    <div key={tick} className="letter" style={{
      height: "100%", display: "flex", flexDirection: "column",
      overflow: "hidden", position: "relative",
    }}>
      {/* grain + edges */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.2,
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100' height='100' filter='url(%23n)' opacity='0.5'/></svg>\")",
      } as React.CSSProperties}/>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        boxShadow: "inset 0 0 60px rgba(80,50,20,0.3), inset 0 0 12px rgba(60,30,10,0.2)",
      }}/>

      <FlourishCorners size={48} color="var(--gold-3)" offset={12} opacity={0.65}/>

      {/* Close */}
      <button className="btn btn-ghost btn-sm" onClick={onClose}
        style={{ position: "absolute", top: 14, right: 14, zIndex: 5 }}>
        <Icon.X size={14}/> {t("close")}
      </button>

      <div style={{ flex: 1, overflow: "auto", padding: "60px 56px 24px 56px", position: "relative", zIndex: 1 }}>
        {/* Floating wax seal */}
        <div style={{ position: "absolute", left: 22, top: 60 }}>
          <WaxSeal glyph={STATUS_GLYPH[quest.status]} color={STATUS_COLOR[quest.status]} size={64} tilt={-15}/>
        </div>

        {/* Ribbon */}
        <div style={{ textAlign: "center", marginBottom: 14, marginLeft: 60, marginTop: -32 }}>
          <Ribbon color={STATUS_COLOR[quest.status]} width={280} height={50}>
            {STATUS_LABEL[quest.status]} · {t(getQuestTypeKey(quest.type))}
          </Ribbon>
        </div>

        {/* Title */}
        <h1 className="dec-title fade-up" style={{ fontSize: 36, textAlign: "center", margin: "12px 0 4px 0", color: "var(--ink-1)" }}>
          {quest.name}
        </h1>

        <Divider color="var(--ink-3)" glyph="❦" className="fade-up"/>

        {/* Meta */}
        <div className="fade-up" style={{
          display: "flex", justifyContent: "center", gap: 16, fontSize: 13,
          color: "var(--ink-3)", marginBottom: 18, fontStyle: "italic", flexWrap: "wrap",
        }}>
          {(quest.npcName || npc) && <span><Icon.Quill size={11}/> de <strong style={{ color: "var(--ink-2)", fontStyle: "normal" }}>{quest.npcName ?? npc?.name}</strong></span>}
          {regionName && <span><Icon.Pin size={11}/> {regionName}</span>}
          {quest.requirements?.requiredLevel > 0 && (
            <span style={{ color: "var(--gold-3)" }}>{t("quest_level_required")} {quest.requirements.requiredLevel}</span>
          )}
          {quest.repeatable && <span style={{ color: "var(--gold-3)" }}>· {t("quest_repeatable")}</span>}
        </div>

        {/* Description with drop cap */}
        <div className="fade-up" style={{ animationDelay: "0.1s" }}>
          <p className="drop-cap" style={{
            fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.7,
            color: "var(--ink-1)", margin: 0, padding: "0 8px",
            textAlign: "justify", hyphens: "auto",
          }}>
            {quest.logText}
          </p>
        </div>

        {/* Objectives */}
        {objectivesTotal > 0 && (
          <div className="fade-up" style={{ animationDelay: "0.18s", marginTop: 26 }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <span className="dec-title" style={{ fontSize: 18, color: "var(--gold-3)", letterSpacing: "0.08em" }}>
                {t("objectives_section")}
              </span>
            </div>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {quest.objectives.map((o, i) => {
                const done = o.progress >= o.total
                return (
                  <li key={i} style={{
                    display: "flex", gap: 14, alignItems: "center",
                    padding: "10px 14px",
                    background: done ? "rgba(150,100,40,0.10)" : "rgba(255,240,200,0.35)",
                    border: "1px solid rgba(60,40,20,0.2)",
                    borderRadius: 2,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      border: "1.5px solid var(--ink-2)",
                      background: done ? "var(--ink-2)" : "transparent",
                      color: done ? "var(--paper-1)" : "var(--ink-2)",
                      display: "grid", placeItems: "center", flexShrink: 0,
                      fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
                    }}>
                      {done ? <Icon.Check size={14}/> : (i + 1)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, color: done ? "var(--ink-3)" : "var(--ink-1)",
                        textDecoration: done ? "line-through" : "none",
                        marginBottom: 4, fontWeight: done ? 400 : 500,
                      }}>{o.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="bar" style={{ flex: 1 }}>
                          <span style={{ width: ((o.progress / o.total) * 100) + "%" }}/>
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-2)", minWidth: 38, textAlign: "right" }}>
                          {o.progress}/{o.total}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {/* Rewards */}
        {(quest.rewards || []).length > 0 && (
          <div className="fade-up" style={{ animationDelay: "0.26s", marginTop: 26 }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <span className="dec-title" style={{ fontSize: 18, color: "var(--gold-3)", letterSpacing: "0.08em" }}>
                {t("rewards_section")}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              {quest.rewards.map((r, ri) => (
                <div key={ri} style={{
                  padding: 12, borderRadius: 2,
                  background: "rgba(255,240,200,0.45)",
                  border: "1px solid rgba(60,40,20,0.3)",
                  display: "flex", gap: 12, alignItems: "center",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                    background: "linear-gradient(135deg, var(--gold-1), var(--gold-2))",
                    border: "1px solid var(--gold-3)",
                    display: "grid", placeItems: "center",
                    fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink-1)",
                  }}>
                    <Icon.Gift size={18}/>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, color: "var(--ink-1)", fontWeight: 600, lineHeight: 1.2 }}>
                      {formatItemName(r.item)}
                    </div>
                    {r.count > 1 && (
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>×{r.count}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NPC words (dialog) */}
        {dialog && (
          <div className="fade-up" style={{ animationDelay: "0.34s", marginTop: 26 }}>
            <Divider color="var(--ink-3)" glyph="✦"/>
            <div style={{
              padding: 14, background: "rgba(255,240,200,0.3)",
              border: "1px solid rgba(60,40,20,0.22)", borderRadius: 2,
              marginTop: 14,
            }}>
              <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-uppercase)", letterSpacing: "0.14em", marginBottom: 6 }}>
                {npc?.name ?? "NPC"} {t("npc_says_suffix")}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink-1)", fontStyle: "italic", borderLeft: "2px solid var(--ink-3)", paddingLeft: 12, margin: 0 }}>
                &ldquo;{dialog.text}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Complete text */}
        {quest.completeText && quest.status === QuestStatus.COMPLETED && (
          <div className="fade-up" style={{ animationDelay: "0.42s", marginTop: 20 }}>
            <div style={{
              padding: "12px 16px",
              background: "rgba(150,100,40,0.08)",
              border: "1px solid var(--seal-completed)",
              borderRadius: 2,
            }}>
              <div style={{ fontSize: 11, color: "var(--seal-completed)", fontFamily: "var(--font-uppercase)", letterSpacing: "0.12em", marginBottom: 4 }}>
                {t("conclusion")}
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, margin: 0 }}>
                {quest.completeText}
              </p>
            </div>
          </div>
        )}

        {/* Signature bottom */}
        <div className="fade-up" style={{ animationDelay: "0.50s", marginTop: 28, paddingTop: 16, borderTop: "1px dashed rgba(60,40,20,0.3)" }}>
          <Divider color="var(--ink-4)" glyph="✥"/>
          <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--font-uppercase)", letterSpacing: "0.12em", fontStyle: "italic" }}>
            {t("sealed_footer")}
          </div>
        </div>
      </div>
    </div>
  )
}

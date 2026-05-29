"use client"

import React, { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { QuestData, QuestStatus, IDialogue, NPC, NPCCatalogResponse } from "@/types/misiones"
import { WaxSeal } from "../_ui/primitives/WaxSeal"
import { FlourishCorners } from "../_ui/flourishes/FlourishCorners"
import { Ribbon } from "../_ui/flourishes/Ribbon"
import { Divider } from "../_ui/flourishes/Divider"
import { Icon } from "../_ui/icons"
import { MinecraftSkinAvatar } from "../_ui/minecraft/MinecraftAvatar"
import { Inkwell } from "../_ui/letter-decor/Inkwell"
import { Quill } from "../_ui/letter-decor/Quill"
import { InkBlot } from "../_ui/board-decor/InkBlot"
import { STATUS_LABEL, STATUS_GLYPH, STATUS_COLOR } from "../_constants/questStatus"
import { QuestChain } from "./QuestChain"
import { RewardCard } from "./RewardCard"
import { CountdownRibbon } from "./CountdownRibbon"
import { getQuestTypeKey, formatItemName, getNpcForQuest } from "../_utils/questUtils"
import { Region } from "../_types/board"

export interface QuestLetterProps {
  quest: QuestData
  allQuests: QuestData[]
  npcs: NPC[]
  dialogs: IDialogue[]
  regions: Region[]
  npcCatalog?: NPCCatalogResponse
  onClose: () => void
  onSelectQuest?: (q: QuestData) => void
  onOpenNpc?: (npc: NPC) => void
}

export function QuestLetter({ quest, allQuests, npcs, dialogs, regions, npcCatalog, onClose, onSelectQuest, onOpenNpc }: QuestLetterProps) {
  const t = useTranslations("misiones")
  const [tick, setTick] = useState(0)
  useEffect(() => { setTick((p) => p + 1) }, [quest?.id])

  const npc = getNpcForQuest(quest, npcs)
  const dialog = dialogs.find((d) => d.questId === quest.id || d.id === quest.dialogId)
  const objectivesTotal = (quest.objectives || []).length
  const catalogEntry = npcCatalog?.[String(quest.dialogId)]?.[0]
  const catalogSkin = catalogEntry?.skin
  const npcLocation = dialog?.npcLocations?.[0]

  return (
    <div key={tick} style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      background: "repeating-linear-gradient(90deg, #2a180a 0px, #5a3818 12px, #3a2410 22px, #5a3818 40px, #2a180a 56px)",
      boxShadow: "inset 0 0 60px rgba(0,0,0,0.6)",
    }}>
      {/* Floating parchment over the desk */}
      <div style={{
        flex: 1,
        margin: "44px 60px 86px 44px",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        background: "var(--paper-1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
      }}>
        {/* parchment texture */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.18,
          backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100' height='100' filter='url(%23n)' opacity='0.5'/></svg>\")",
        } as React.CSSProperties}/>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 60px rgba(80,50,20,0.3), inset 0 0 12px rgba(60,30,10,0.2)" }}/>

        <FlourishCorners size={48} color="var(--gold-3)" offset={12} opacity={0.65}/>

        {/* Brass nameplate top-left */}
        <div style={{
          position: "absolute", top: 14, left: 22, zIndex: 5,
          background: "linear-gradient(135deg, #c8a840, #9a6f18)",
          padding: "3px 10px",
          border: "1px solid rgba(0,0,0,0.4)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
          fontFamily: "var(--font-uppercase)",
          fontSize: 9, letterSpacing: "0.18em",
          color: "#1e120a",
        }}>
          {t("board_subtitle")}
        </div>

        {/* InkBlot top-right decor */}
        <div style={{ position: "absolute", top: -8, right: -10, zIndex: 2, pointerEvents: "none" }}>
          <InkBlot size={72} tilt={-15} color="#1a1208"/>
        </div>

        {/* Close */}
        <button className="btn btn-ghost btn-sm" onClick={onClose}
          style={{ position: "absolute", top: 14, right: 14, zIndex: 6 }}>
          <Icon.X size={14}/> {t("close")}
        </button>

        {/* Scrollable parchment body */}
        <div style={{ flex: 1, overflow: "auto", padding: "60px 56px 32px 56px", position: "relative", zIndex: 1 }}>
          {/* Wax seal */}
          <div style={{ position: "absolute", left: 22, top: 60 }}>
            <WaxSeal glyph={STATUS_GLYPH[quest.status]} color={STATUS_COLOR[quest.status]} size={64} tilt={-15}/>
          </div>

          {/* Ribbon */}
          <div style={{ textAlign: "center", marginBottom: 14, marginLeft: 60, marginTop: -32 }}>
            <Ribbon color={STATUS_COLOR[quest.status]} width={280} height={50}>
              {STATUS_LABEL[quest.status]} · {t(getQuestTypeKey(quest.type))}
            </Ribbon>
          </div>

          {/* NPC avatar + name row — clickable for dossier */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 12 }}>
            <MinecraftSkinAvatar skin={catalogSkin} size={72} ring ringColor={STATUS_COLOR[quest.status]}/>
            <div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-uppercase)", letterSpacing: "0.14em" }}>
                {t("npc_says_suffix")}
              </div>
              {onOpenNpc && npc ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenNpc(npc) }}
                  title={t("npc_dossier_open", { name: catalogEntry?.name ?? npc.name })}
                  style={{
                    appearance: "none", border: "none", background: "transparent", padding: 0,
                    font: "inherit", color: "inherit", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 6,
                    borderBottom: "1px dashed rgba(60,40,20,0.4)",
                  }}
                >
                  <span className="dec-title" style={{ fontSize: 18, color: "var(--ink-2)" }}>
                    {catalogEntry?.name ?? quest.npcName ?? npc.name}
                  </span>
                </button>
              ) : (
                <div className="dec-title" style={{ fontSize: 18, color: "var(--ink-2)" }}>
                  {catalogEntry?.name ?? quest.npcName ?? npc?.name ?? t("quest_unknown_npc")}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="dec-title fade-up" style={{ fontSize: 36, textAlign: "center", margin: "12px 0 4px 0", color: "var(--ink-1)" }}>
            {quest.name}
          </h1>

          <Divider color="var(--ink-3)" glyph="❦" className="fade-up"/>

          {/* Meta */}
          <div className="fade-up" style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 13, color: "var(--ink-3)", marginBottom: 18, fontStyle: "italic", flexWrap: "wrap", alignItems: "center" }}>
            {quest.requirements?.requiredLevel > 0 && (
              <span style={{ color: "var(--gold-3)" }}>{t("quest_level_required")} {quest.requirements.requiredLevel}</span>
            )}
            {quest.repeatable && <span style={{ color: "var(--gold-3)" }}>· {t("quest_repeatable")}</span>}
          </div>

          {/* Countdown for daily / repeatable */}
          {(quest.repeatable || quest.type === 2) && quest.status !== QuestStatus.LOCKED && quest.status !== QuestStatus.COMPLETED && (
            <div className="fade-up" style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <CountdownRibbon quest={quest}/>
            </div>
          )}

          {/* Quest chain */}
          <div className="fade-up" style={{ animationDelay: "0.08s", marginBottom: 22 }}>
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <span className="dec-title" style={{ fontSize: 16, color: "var(--gold-3)", letterSpacing: "0.08em" }}>
                {t("chain_section")}
              </span>
            </div>
            <QuestChain quest={quest} allQuests={allQuests} onSelect={onSelectQuest} compact/>
          </div>

          {/* Description with drop cap */}
          <div className="fade-up" style={{ animationDelay: "0.1s" }}>
            <p className="drop-cap" style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.7, color: "var(--ink-1)", margin: 0, padding: "0 8px", textAlign: "justify", hyphens: "auto" }}>
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
                      border: "1px solid rgba(60,40,20,0.2)", borderRadius: 2,
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
                        <div style={{ fontSize: 14, color: done ? "var(--ink-3)" : "var(--ink-1)", textDecoration: done ? "line-through" : "none", marginBottom: 4, fontWeight: done ? 400 : 500 }}>
                          {o.name}
                        </div>
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

          {/* Rewards with rarity glow */}
          {(quest.rewards || []).length > 0 && (
            <div className="fade-up" style={{ animationDelay: "0.26s", marginTop: 26 }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <span className="dec-title" style={{ fontSize: 18, color: "var(--gold-3)", letterSpacing: "0.08em" }}>
                  {t("rewards_section")}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
                {quest.rewards.map((r, ri) => (
                  <RewardCard key={ri} name={formatItemName(r.item)} icon="●" rarity="common"/>
                ))}
              </div>
            </div>
          )}

          {/* NPC dialog */}
          {dialog && (
            <div className="fade-up" style={{ animationDelay: "0.34s", marginTop: 26 }}>
              <Divider color="var(--ink-3)" glyph="✦"/>
              <div style={{ padding: 14, background: "rgba(255,240,200,0.3)", border: "1px solid rgba(60,40,20,0.22)", borderRadius: 2, marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-uppercase)", letterSpacing: "0.14em" }}>
                    {catalogEntry?.name ?? npc?.name ?? "NPC"} {t("npc_says_suffix")}
                  </div>
                  {npcLocation && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                      <Icon.Pin size={10}/>
                      {npcLocation.x.toFixed(0)}, {npcLocation.z.toFixed(0)}
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink-1)", fontStyle: "italic", borderLeft: "2px solid var(--ink-3)", paddingLeft: 12, margin: 0 }}>
                  &ldquo;{dialog.text}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Conclusion */}
          {quest.completeText && quest.status === QuestStatus.COMPLETED && (
            <div className="fade-up" style={{ animationDelay: "0.42s", marginTop: 20 }}>
              <div style={{ padding: "12px 16px", background: "rgba(150,100,40,0.08)", border: "1px solid var(--seal-completed)", borderRadius: 2 }}>
                <div style={{ fontSize: 11, color: "var(--seal-completed)", fontFamily: "var(--font-uppercase)", letterSpacing: "0.12em", marginBottom: 4 }}>
                  {t("conclusion")}
                </div>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, margin: 0 }}>{quest.completeText}</p>
              </div>
            </div>
          )}

          {/* Signature footer */}
          <div className="fade-up" style={{ animationDelay: "0.50s", marginTop: 28, paddingTop: 16, borderTop: "1px dashed rgba(60,40,20,0.3)" }}>
            <Divider color="var(--ink-4)" glyph="✥"/>
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--font-uppercase)", letterSpacing: "0.12em", fontStyle: "italic" }}>
              {t("sealed_footer")}
            </div>
          </div>
        </div>
      </div>

      {/* Desk decorations — outside parchment, on wood surface */}
      <div style={{ position: "absolute", bottom: 0, left: 0, pointerEvents: "none", zIndex: 10 }}>
        <Inkwell size={76}/>
      </div>
      <div style={{ position: "absolute", bottom: -8, left: 64, pointerEvents: "none", zIndex: 9 }}>
        <Quill size={110} tilt={-22}/>
      </div>

      {/* Footer action row on desk surface */}
      <div style={{
        position: "absolute", bottom: 0, left: 160, right: 0,
        height: 86, display: "flex", alignItems: "center",
        padding: "0 28px", gap: 12,
        zIndex: 11,
      }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          <Icon.X size={12}/> {t("close")}
        </button>
      </div>
    </div>
  )
}

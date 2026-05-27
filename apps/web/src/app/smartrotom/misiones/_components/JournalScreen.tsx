"use client"

import React, { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { IDialogue, NPC, QuestData, NPCCatalogResponse } from "@/types/misiones"
import { WaxSeal } from "../_ui/primitives/WaxSeal"
import { FlourishCorners } from "../_ui/flourishes/FlourishCorners"
import { Divider } from "../_ui/flourishes/Divider"
import { Icon } from "../_ui/icons"

export interface JournalScreenProps {
  dialogs: IDialogue[]
  npcs: NPC[]
  quests: QuestData[]
  npcCatalog?: NPCCatalogResponse
  onSelectQuest: (q: QuestData) => void
}

export function JournalScreen({ dialogs, npcs, quests, npcCatalog, onSelectQuest }: JournalScreenProps) {
  const t = useTranslations("misiones")
  const [searchD, setSearchD] = useState("")

  const filtered = useMemo(() => {
    if (!searchD.trim()) return dialogs
    const s = searchD.toLowerCase()
    return dialogs.filter((d) =>
      d.text.toLowerCase().includes(s) ||
      d.name.toLowerCase().includes(s)
    )
  }, [dialogs, searchD])

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 24, marginTop: 10 }}>
        <span className="label" style={{ color: "var(--gold-1)" }}>{t("journal_label")}</span>
        <h1 className="dec-title" style={{ fontSize: 38, color: "var(--paper-1)", margin: "4px 0 6px 0", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
          {t("journal_title")}
        </h1>
        <div style={{ color: "var(--paper-3)", fontSize: 14, fontStyle: "italic" }}>
          {t("journal_subtitle")}
        </div>
        <div style={{ marginTop: 16, color: "var(--gold-2)", opacity: 0.7 }}>
          <Divider color="var(--gold-2)" glyph="✦"/>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ position: "relative", maxWidth: 380, marginBottom: 20 }}>
          <input className="field" value={searchD} onChange={(e) => setSearchD(e.target.value)}
            placeholder={t("journal_search_placeholder")} style={{ paddingLeft: 34 }}/>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)" }}>
            <Icon.Search size={14}/>
          </div>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--paper-2)", fontStyle: "italic", padding: "40px 0" }}>
            {t("journal_empty")}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((d) => {
            const npc = npcs.find((n) => n.dialogId === d.id)
            const catalogEntry = npcCatalog?.[String(d.id)]?.[0]
            const quest = quests.find((q) => q.id === d.questId)
            const tilt = ((d.id * 13) % 100) / 100 * 1.6 - 0.8
            const npcName = catalogEntry?.name ?? npc?.name
            const npcInitial = (npcName ?? d.name ?? "?")[0].toUpperCase()
            return (
              <div key={d.id} className="paper" style={{ padding: "20px 26px", position: "relative", transform: `rotate(${tilt}deg)` }}>
                <FlourishCorners size={20} color="var(--gold-3)" offset={6} opacity={0.4}/>
                <div style={{ position: "absolute", top: -10, left: 30 }}>
                  <WaxSeal glyph={npcInitial} color="var(--seal-available)" size={36} tilt={-12}/>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 20, marginBottom: 8, gap: 14 }}>
                  <div>
                    <div className="dec-title" style={{ fontSize: 18, color: "var(--ink-1)" }}>{npcName ?? d.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", fontStyle: "italic" }}>{d.name}</div>
                  </div>
                </div>

                <p style={{
                  fontSize: 15, lineHeight: 1.65, color: "var(--ink-1)", fontStyle: "italic",
                  borderLeft: "2px solid var(--ink-3)", paddingLeft: 14, margin: "8px 0",
                }}>
                  &ldquo;{d.text}&rdquo;
                </p>

                {quest && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed rgba(60,40,20,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <span className="label">{t("journal_related_mission")}</span>
                    <button className="btn btn-sm" onClick={() => onSelectQuest(quest)}>
                      <Icon.Scroll size={11}/> {quest.name} <Icon.Arrow size={11}/>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

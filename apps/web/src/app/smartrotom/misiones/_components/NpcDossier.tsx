"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { QuestData, QuestStatus, IDialogue, NPC, NPCCatalogResponse } from "@/types/misiones"
import { WaxSeal } from "../_ui/primitives/WaxSeal"
import { Thumbtack } from "../_ui/primitives/Thumbtack"
import { FlourishCorners } from "../_ui/flourishes/FlourishCorners"
import { Divider } from "../_ui/flourishes/Divider"
import { Icon } from "../_ui/icons"
import { MinecraftSkinAvatar } from "../_ui/minecraft/MinecraftAvatar"
import { STATUS_LABEL, STATUS_GLYPH, STATUS_COLOR } from "../_constants/questStatus"
import { Region } from "../_types/board"

export interface NpcDossierProps {
  npc: NPC
  quests: QuestData[]
  dialogs: IDialogue[]
  regions: Region[]
  npcCatalog?: NPCCatalogResponse
  onClose: () => void
  onSelectQuest: (q: QuestData) => void
}

export function NpcDossier({ npc, quests, dialogs, regions, npcCatalog, onClose, onSelectQuest }: NpcDossierProps) {
  const t = useTranslations("misiones")
  const catalogEntry = npcCatalog ? Object.values(npcCatalog).flat().find((e) => e.name === npc.name) : undefined
  const given = quests.filter((q) => q.dialogId === npc.dialogId)
  const dialog = dialogs.find((d) => given.some((q) => q.id === d.questId))
  const done = given.filter((q) => q.status === QuestStatus.COMPLETED).length
  const active = given.filter((q) => q.status === QuestStatus.ACTIVE).length

  return (
    <div onClick={onClose} className="npc-dossier-overlay">
      <div onClick={(e) => e.stopPropagation()} className="paper" style={{
        maxWidth: 560, width: "100%", maxHeight: "88vh", overflow: "auto",
        padding: "30px 34px", position: "relative", transform: "rotate(-0.5deg)",
      }}>
        <div style={{ position: "absolute", top: 10, left: 12 }}><Thumbtack size={18} color="#a82a18"/></div>
        <div style={{ position: "absolute", top: 10, right: 12 }}><Thumbtack size={18} color="#a82a18"/></div>
        <FlourishCorners size={30} color="var(--gold-3)" offset={8} opacity={0.55}/>

        <button className="btn btn-sm btn-ghost" onClick={onClose} style={{ position: "absolute", top: 14, right: 40 }}>
          <Icon.X size={12}/> {t("close")}
        </button>

        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div className="label" style={{ color: "var(--seal-available)", letterSpacing: "0.34em", justifyContent: "center" }}>
            ✦ {t("npc_dossier_title")} ✦
          </div>
          <div style={{ display: "flex", justifyContent: "center", margin: "12px 0 6px 0" }}>
            <div style={{ position: "relative" }}>
              <MinecraftSkinAvatar skin={catalogEntry?.skin || npc.skin} size={104} ring ringColor="var(--gold-2)"/>
              <div style={{ position: "absolute", bottom: -10, right: -10 }}>
                <WaxSeal glyph={(npc.name || "?")[0]} color="var(--seal-available)" size={38} tilt={-12}/>
              </div>
            </div>
          </div>
          <h1 className="dec-title" style={{ fontSize: 32, margin: "6px 0 2px 0", color: "var(--ink-1)" }}>{npc.name}</h1>
          <div style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>
            {t("quest_unknown_npc")}
          </div>
        </div>

        <Divider color="var(--ink-3)" glyph="❦"/>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, margin: "14px 0 18px 0" }}>
          {[
            { l: t("npc_dossier_quests"), v: given.length },
            { l: t("npc_dossier_active"), v: active, c: "var(--seal-active)" },
            { l: t("npc_dossier_done"), v: done, c: "var(--seal-completed)" },
          ].map((s) => (
            <div key={s.l} style={{ textAlign: "center", padding: "8px 4px", background: "rgba(60,40,20,0.07)", border: "1px solid rgba(60,40,20,0.2)" }}>
              <div className="dec-title" style={{ fontSize: 22, color: s.c || "var(--ink-1)", lineHeight: 1 }}>{s.v}</div>
              <div className="label" style={{ marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {dialog && (
          <p style={{
            fontSize: 14, fontStyle: "italic", lineHeight: 1.6, color: "var(--ink-1)",
            borderLeft: "2px solid var(--ink-3)", paddingLeft: 12, margin: "0 0 18px 0",
          }}>
            &ldquo;{dialog.text}&rdquo;
          </p>
        )}

        <div className="label" style={{ marginBottom: 8 }}>{t("npc_dossier_given_by")} {npc.name.split(" ")[0]}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {given.map((q) => (
            <button key={q.id} onClick={() => { onSelectQuest(q); onClose() }} style={{
              display: "flex", alignItems: "center", gap: 10, textAlign: "left",
              padding: "8px 10px", cursor: "pointer",
              background: "rgba(255,240,200,0.4)", border: "1px solid rgba(60,40,20,0.2)", borderRadius: 2,
            }}>
              <WaxSeal glyph={STATUS_GLYPH[q.status]} color={STATUS_COLOR[q.status]} size={26} tilt={-10}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="dec-title" style={{ fontSize: 14, color: "var(--ink-1)", lineHeight: 1.15 }}>{q.name}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{STATUS_LABEL[q.status]} · {q.type}</div>
              </div>
              <Icon.Arrow size={13}/>
            </button>
          ))}
          {given.length === 0 && (
            <div style={{ color: "var(--ink-3)", fontStyle: "italic", fontSize: 13, padding: 12, textAlign: "center" }}>
              {t("npc_dossier_no_quests")}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

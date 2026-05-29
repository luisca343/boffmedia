"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { QuestData, NPC, QuestStatus, NPCCatalogResponse } from "@/types/misiones"
import { WaxSeal } from "../_ui/primitives/WaxSeal"
import { Nail } from "../_ui/primitives/Nail"
import { Thumbtack } from "../_ui/primitives/Thumbtack"
import { Sparkles, Stamp } from "../_ui/stamps"
import { Icon } from "../_ui/icons"
import { MinecraftSkinAvatar } from "../_ui/minecraft/MinecraftAvatar"
import { playPaperRustle } from "../_utils/sound"
import { STATUS_GLYPH, STATUS_COLOR } from "../_constants/questStatus"
import { getQuestTypeKey } from "../_utils/questUtils"
import { CountdownRibbon } from "./CountdownRibbon"

export interface QuestPaperProps {
  quest: QuestData
  npc: NPC | undefined
  npcCatalog?: NPCCatalogResponse
  regionName: string
  selected: boolean
  tilt: number
  onClick: () => void
}

export function QuestPaper({ quest, npc, npcCatalog, regionName, selected, tilt, onClick }: QuestPaperProps) {
  const catalogEntry = npcCatalog?.[String(quest.dialogId)]?.[0]
  const catalogSkin = catalogEntry?.skin
  const t = useTranslations("misiones")
  const objectivesDone = (quest.objectives || []).filter((o) => o.progress >= o.total).length
  const objectivesTotal = (quest.objectives || []).length
  const progressValue = (quest.objectives || []).reduce((s, o) => s + Math.min(o.progress, o.total), 0)
  const progressTotal = (quest.objectives || []).reduce((s, o) => s + o.total, 0)
  const pct = progressTotal > 0 ? Math.round((progressValue / progressTotal) * 100) : 0

  const cls = ["quest-paper", "paper", "pinnable", "sparkle-host"]
  if (quest.status === QuestStatus.LOCKED || quest.status === QuestStatus.NOT_STARTED) cls.push("is-locked")
  if (quest.status === QuestStatus.FAILED) cls.push("is-failed")
  if (quest.status === QuestStatus.COMPLETED) cls.push("is-completed")
  if (selected) cls.push("is-selected")

  const isActive = quest.status === QuestStatus.ACTIVE
  const isAvailable = quest.status === QuestStatus.AVAILABLE

  return (
    <div
      className={cls.join(" ")}
      onClick={onClick}
      onMouseEnter={playPaperRustle}
      style={{
        padding: "20px 22px 16px 22px",
        transform: `rotate(${tilt}deg)`,
        minHeight: 220,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Pin at top */}
      <div style={{ position: "absolute", left: "50%", top: -12, transform: "translateX(-50%)", zIndex: 6 }}>
        {isActive ? (
          <Thumbtack size={20} color="#c89026"/>
        ) : isAvailable ? (
          <Thumbtack size={20} color="#a82a18"/>
        ) : (
          <Nail size={18}/>
        )}
      </div>

      {isActive && <Sparkles count={5}/>}

      {quest.status === QuestStatus.COMPLETED && <Stamp kind="completed">{t("quest_stamp_completed")}</Stamp>}
      {quest.status === QuestStatus.FAILED && <Stamp kind="failed">{t("quest_stamp_failed")}</Stamp>}

      {quest.status === QuestStatus.LOCKED && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(135deg, transparent 48%, rgba(60,30,10,0.35) 50%, transparent 52%), linear-gradient(45deg, transparent 48%, rgba(60,30,10,0.35) 50%, transparent 52%)",
        }}/>
      )}

      {/* Type + level (uses requiredLevel from requirements) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span className="label" style={{ color: STATUS_COLOR[quest.status] }}>
          {t(getQuestTypeKey(quest.type))}
        </span>
        {quest.requirements?.requiredLevel > 0 && (
          <span className="label">{t("quest_level")} {quest.requirements.requiredLevel}</span>
        )}
      </div>

      {/* Title */}
      <h3 className="dec-title" style={{ fontSize: 19, margin: "2px 0 8px 0", lineHeight: 1.15, color: "var(--ink-1)" }}>
        {quest.name}
      </h3>

      {/* NPC + region */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 10, color: "var(--ink-3)", fontStyle: "italic" }}>
        <MinecraftSkinAvatar skin={catalogSkin} size={22}/>
        <span>de <strong style={{ color: "var(--ink-2)", fontStyle: "normal" }}>{catalogEntry?.name ?? quest.npcName ?? npc?.name ?? t("quest_unknown_npc")}</strong></span>
        {regionName && (
          <>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon.Pin size={11}/> {regionName}
            </span>
          </>
        )}
      </div>

      {/* Countdown for daily / repeatable */}
      {(quest.repeatable || quest.type === 2) && quest.status !== QuestStatus.LOCKED && quest.status !== QuestStatus.COMPLETED && (
        <div style={{ marginBottom: 10 }}>
          <CountdownRibbon quest={quest} compact/>
        </div>
      )}

      {/* Log text excerpt */}
      <p style={{
        margin: "0 0 12px 0", fontSize: 13, lineHeight: 1.55,
        color: "var(--ink-2)", fontStyle: "italic",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        overflow: "hidden",
      } as React.CSSProperties}>
        &ldquo;{quest.logText}&rdquo;
      </p>

      {/* Progress */}
      {objectivesTotal > 0 && quest.status !== QuestStatus.LOCKED && quest.status !== QuestStatus.COMPLETED && quest.status !== QuestStatus.NOT_STARTED && (
        <div style={{ marginBottom: 12 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4,
            fontFamily: "var(--font-uppercase)", letterSpacing: "0.12em", color: "var(--ink-3)",
          }}>
            <span>{objectivesDone}/{objectivesTotal} {t("quest_objectives")}</span>
            <span>{pct}%</span>
          </div>
          <div className="bar"><span style={{ width: pct + "%" }}/></div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: "auto", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12,
        paddingTop: 10, borderTop: "1px dashed rgba(60,40,20,0.3)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {quest.repeatable && (
            <span className="label" style={{ color: "var(--gold-3)" }}>{t("quest_repeatable")}</span>
          )}
          <span className="label" style={{ color: "var(--ink-3)" }}>{quest.category}</span>
        </div>
        <WaxSeal
          glyph={STATUS_GLYPH[quest.status]}
          color={STATUS_COLOR[quest.status]}
          size={42}
          tilt={-12}
        />
      </div>
    </div>
  )
}

"use client"

import React from "react"
import { QuestData, QuestStatus, NPC, IDialogue } from "@/types/misiones"
import { Nail, FlourishCorners, Shield, Icon } from "./misiones-atoms"
import { getNpcForQuest, tiltFor } from "../_utils/questUtils"
import { Region } from "../_types/board"
import { useQuestBoard } from "../_hooks/useQuestBoard"
import { QuestPaper } from "./QuestPaper"
import { TrackedQuestPaper } from "./TrackedQuestPaper"
import { BoardFilters } from "./BoardFilters"

export interface BoardScreenProps {
  quests: QuestData[]
  npcs: NPC[]
  dialogs: IDialogue[]
  regions: Region[]
  categories: Record<string, number[]>
  search: string
  setSearch: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  sort: string
  setSort: (v: string) => void
  regionFilter: string | null
  setRegionFilter: (v: string | null) => void
  selectedId: number | null
  onSelect: (q: QuestData) => void
  trackedQuestId: number | null
  setTrackedQuestId: (id: number | null) => void
}

export function BoardScreen({
  quests, npcs, dialogs, regions, categories,
  search, setSearch, statusFilter, setStatusFilter,
  sort, setSort, regionFilter, setRegionFilter,
  selectedId, onSelect, trackedQuestId, setTrackedQuestId,
}: BoardScreenProps) {
  const { counts, filtered } = useQuestBoard({
    quests, search, statusFilter, regionFilter, sort, trackedQuestId,
  })

  const trackedQuest = quests.find((q) => q.id === trackedQuestId)
  const trackedNpc = trackedQuest ? getNpcForQuest(trackedQuest, npcs) : undefined

  // Quest stats for header
  const activeCount = quests.filter((q) => q.status === QuestStatus.ACTIVE).length
  const availableCount = quests.filter((q) => q.status === QuestStatus.AVAILABLE).length
  const completedCount = quests.filter((q) => q.status === QuestStatus.COMPLETED).length

  return (
    <div>
      {/* Stats header */}
      <div className="paper pinnable" style={{ padding: "18px 22px", transform: "rotate(-0.4deg)", position: "relative", marginBottom: 28 }}>
        <div style={{ position: "absolute", top: 8, left: 14 }}><Nail size={14}/></div>
        <div style={{ position: "absolute", top: 8, right: 14 }}><Nail size={14}/></div>
        <FlourishCorners size={28} color="var(--gold-3)" offset={4} opacity={0.55}/>

        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <Shield size={68} color="var(--gold-2)"><Icon.Sword size={22}/></Shield>
          <div style={{ flex: "1 1 240px", minWidth: 0 }}>
            <span className="label" style={{ color: "var(--gold-3)" }}>Bitácora del aventurero</span>
            <h1 className="dec-title" style={{ fontSize: 28, margin: "2px 0 2px 0", color: "var(--ink-1)" }}>El Tablón de Misiones</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>Posada del Rotom · Pixelmon</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(72px, 1fr))", gap: 10, flex: "1 1 260px" }}>
            {[
              { label: "Vigentes", value: activeCount, color: "var(--seal-active)" },
              { label: "Disponibles", value: availableCount, color: "var(--seal-available)" },
              { label: "Hechas", value: completedCount, color: "var(--seal-completed)" },
            ].map((s) => (
              <div key={s.label} style={{
                padding: "10px 6px", textAlign: "center",
                background: "rgba(60,40,20,0.08)",
                border: "1px solid rgba(60,40,20,0.2)", borderRadius: 2,
              }}>
                <div className="dec-title" style={{ fontSize: 22, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div className="label" style={{ marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tracked quest */}
      {trackedQuest && (
        <div style={{ marginBottom: 32, marginTop: 32 }}>
          <TrackedQuestPaper
            quest={trackedQuest}
            npc={trackedNpc}
            regionName={trackedQuest.category ?? ""}
            onOpen={() => onSelect(trackedQuest)}
          />
        </div>
      )}

      {/* Category filter strip */}
      {regions.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, color: "var(--gold-1)" }}>
            <span className="dec-title" style={{ fontSize: 18, letterSpacing: "0.04em" }}>Filtrar por categoría</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--gold-3), transparent)", opacity: 0.5 }}/>
            {regionFilter && (
              <button className="btn btn-sm btn-dark" onClick={() => setRegionFilter(null)}>
                <Icon.X size={11}/> Quitar
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {regions.map((r) => {
              const count = quests.filter((q) => q.category === r.id).length
              const active = regionFilter === r.id
              return (
                <button key={r.id} className={`chip ${active ? "active" : ""}`}
                  onClick={() => setRegionFilter(active ? null : r.id)}>
                  <Icon.Pin size={11}/> {r.name}
                  <span style={{ opacity: 0.65 }}>({count})</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <BoardFilters
        search={search} setSearch={setSearch}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        sort={sort} setSort={setSort}
        counts={counts}
      />

      {/* Cork board */}
      <div style={{
        position: "relative",
        padding: "32px 24px 40px 24px",
        background: "radial-gradient(ellipse at 30% 20%, rgba(255,220,160,0.08), transparent 50%), linear-gradient(180deg, rgba(40,24,12,0.4), rgba(20,12,6,0.5))",
        border: "1px solid rgba(0,0,0,0.45)",
        borderRadius: 4,
        boxShadow: "inset 0 1px 0 rgba(255,200,100,0.12), inset 0 0 80px rgba(0,0,0,0.5)",
        minHeight: 200,
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "inherit",
          backgroundImage:
            "radial-gradient(circle at 22% 32%, rgba(255,220,160,0.05) 0 1.5px, transparent 2px),"
            + "radial-gradient(circle at 68% 21%, rgba(0,0,0,0.18) 0 1px, transparent 2px),"
            + "radial-gradient(circle at 43% 76%, rgba(0,0,0,0.12) 0 1.5px, transparent 2.5px),"
            + "radial-gradient(circle at 78% 60%, rgba(255,220,160,0.06) 0 1px, transparent 2px)",
          backgroundSize: "240px 240px",
        }}/>
        {filtered.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--paper-2)", fontFamily: "var(--font-display)", fontSize: 18, fontStyle: "italic" }}>
            ✥ El tablón está vacío con esos criterios. Cambia los filtros.
          </div>
        ) : (
          <div className="board-grid">
            {filtered.map((q) => (
              <QuestPaper
                key={q.id}
                quest={q}
                npc={getNpcForQuest(q, npcs)}
                regionName={q.category ?? ""}
                selected={selectedId === q.id}
                onClick={() => {
                  onSelect(q)
                  if (q.status === QuestStatus.ACTIVE && !trackedQuestId) setTrackedQuestId(q.id)
                }}
                tilt={tiltFor(q.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

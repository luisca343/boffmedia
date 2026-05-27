"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { QuestData, QuestStatus, NPC, IDialogue, NPCCatalogResponse } from "@/types/misiones"
import { Nail, FlourishCorners, Shield, Icon, PostIt, NewspaperClipping, Polaroid, Doodle, InkBlot } from "./misiones-atoms"
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
  npcCatalog?: NPCCatalogResponse
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

function ScatterLayer() {
  return (
    <>
      <div style={{ position: "absolute", top: 18, right: 30, zIndex: 1, pointerEvents: "none", transform: "rotate(5deg)", opacity: 0.95 }}>
        <div style={{ width: 150, padding: "10px 12px", background: "linear-gradient(180deg, #f0e0a8, #d8c080)", border: "1px solid rgba(60,40,20,0.4)", boxShadow: "4px 6px 10px rgba(0,0,0,0.4)", fontFamily: "Cinzel Decorative, serif", color: "#1a0e07", textAlign: "center" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", marginBottom: 2 }}>SE BUSCA</div>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>TEAM ROCKET</div>
          <div style={{ margin: "8px auto", width: 60, height: 60, background: "linear-gradient(135deg, #aa2a2a, #6b1410)", display: "grid", placeItems: "center", color: "#f5d785", fontSize: 30, fontWeight: 900, border: "1px solid rgba(0,0,0,0.5)" }}>R</div>
          <div style={{ fontSize: 10, fontStyle: "italic" }}>Recompensa 5000₽</div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 90, left: 32, zIndex: 1, pointerEvents: "none" }}>
        <Doodle kind="arrow" tilt={-12} size={130}/>
      </div>
      <div style={{ position: "absolute", top: 270, left: 8, zIndex: 1, pointerEvents: "none" }}>
        <InkBlot size={50} tilt={30}/>
      </div>
      <div style={{ position: "absolute", top: 360, right: 20, zIndex: 1, pointerEvents: "none" }}>
        <PostIt color="#a4d4ff" tilt={6} size={150} footer="— Oak">
          Si encuentras a <strong>Mew</strong>, ¡tráelo al laboratorio inmediatamente!
        </PostIt>
      </div>
    </>
  )
}

function ScatterBottom() {
  return (
    <>
      <div style={{ position: "absolute", bottom: 12, left: 30, zIndex: 1, pointerEvents: "none" }}>
        <NewspaperClipping tilt={3.5} width={210} source="Daily Pokémon" headline="ROTOM DESAPARECE DE UNA TELEVISIÓN" body="El extraño Pokémon eléctrico fantasma ha vuelto a hacer de las suyas. Los testigos aseguran haberle visto colarse en una bicicleta vieja."/>
      </div>
      <div style={{ position: "absolute", bottom: 30, right: 70, zIndex: 1, pointerEvents: "none" }}>
        <Doodle kind="check" tilt={8} size={90}/>
      </div>
      <div style={{ position: "absolute", bottom: 18, left: "44%", zIndex: 1, pointerEvents: "none" }}>
        <Doodle kind="star" tilt={-20} size={80}/>
      </div>
    </>
  )
}

export function BoardScreen({
  quests, npcs, dialogs, regions, categories, npcCatalog,
  search, setSearch, statusFilter, setStatusFilter,
  sort, setSort, regionFilter, setRegionFilter,
  selectedId, onSelect, trackedQuestId, setTrackedQuestId,
}: BoardScreenProps) {
  const t = useTranslations("misiones")
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
            <span className="label" style={{ color: "var(--gold-3)" }}>{t("board_label")}</span>
            <h1 className="dec-title" style={{ fontSize: 28, margin: "2px 0 2px 0", color: "var(--ink-1)" }}>{t("board_title")}</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>{t("board_subtitle")}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(72px, 1fr))", gap: 10, flex: "1 1 260px" }}>
            {[
              { label: t("board_stat_active"), value: activeCount, color: "var(--seal-active)" },
              { label: t("board_stat_available"), value: availableCount, color: "var(--seal-available)" },
              { label: t("board_stat_completed"), value: completedCount, color: "var(--seal-completed)" },
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
            npcCatalog={npcCatalog}
            regionName={trackedQuest.category ?? ""}
            onOpen={() => onSelect(trackedQuest)}
          />
        </div>
      )}

      {/* Category filter strip */}
      {regions.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, color: "var(--gold-1)" }}>
            <span className="dec-title" style={{ fontSize: 18, letterSpacing: "0.04em" }}>{t("board_filter_category")}</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--gold-3), transparent)", opacity: 0.5 }}/>
            {regionFilter && (
              <button className="btn btn-sm btn-dark" onClick={() => setRegionFilter(null)}>
                <Icon.X size={11}/> {t("board_filter_remove")}
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
        padding: "32px 24px 60px 24px",
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

        <ScatterLayer/>

        {filtered.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--paper-2)", fontFamily: "var(--font-display)", fontSize: 18, fontStyle: "italic", position: "relative", zIndex: 2 }}>
            {t("board_empty")}
          </div>
        ) : (
          <div className="board-grid" style={{ position: "relative", zIndex: 2 }}>
            {filtered.map((q, idx) => (
              <React.Fragment key={q.id}>
                <QuestPaper
                  quest={q}
                  npc={getNpcForQuest(q, npcs)}
                  npcCatalog={npcCatalog}
                  regionName={q.category ?? ""}
                  selected={selectedId === q.id}
                  onClick={() => {
                    onSelect(q)
                    if (q.status === QuestStatus.ACTIVE && !trackedQuestId) setTrackedQuestId(q.id)
                  }}
                  tilt={tiltFor(q.id)}
                />
                {idx === 1 && (
                  <div style={{ display: "grid", placeItems: "center", minHeight: 220, position: "relative" }}>
                    <PostIt color="#fff77a" tilt={4} size={180} footer="— Misty">
                      Recuerda: <strong>SÚPER POCIÓN</strong> antes del gimnasio. ¡No otra vez!
                    </PostIt>
                  </div>
                )}
                {idx === 3 && (
                  <div style={{ display: "grid", placeItems: "center", minHeight: 220, position: "relative" }}>
                    <NewspaperClipping tilt={-2.5} width={250} headline="LÍDER BROCK RECIBE RETADORES" body="El Gimnasio de Ciudad Plateada vuelve a abrir sus puertas. Brock asegura que su equipo está más duro que nunca. Se recomienda llegar antes del atardecer para inscribirse." source="The Pewter Times"/>
                  </div>
                )}
                {idx === 5 && (
                  <div style={{ display: "grid", placeItems: "center", minHeight: 220, position: "relative" }}>
                    <Polaroid tilt={-6} caption="Ruta 1 — primer Pidgey"/>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <ScatterBottom/>
      </div>
    </div>
  )
}

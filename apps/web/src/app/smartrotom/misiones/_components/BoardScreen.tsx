"use client"

import { useTranslations } from "next-intl"
import { QuestData, QuestStatus, NPC, IDialogue, NPCCatalogResponse } from "@/types/misiones"
import { Nail } from "../_ui/primitives/Nail"
import { FlourishCorners } from "../_ui/flourishes/FlourishCorners"
import { Shield } from "../_ui/primitives/Shield"
import { Icon } from "../_ui/icons"
import { PostIt } from "../_ui/board-decor/PostIt"
import { NewspaperClipping } from "../_ui/board-decor/NewspaperClipping"
import { ScatterLayer } from "./ScatterLayer"
import type { ScatterItem } from "../_ui/board-decor/ScatterConfig"
import { DEFAULT_SCATTER_TOP, DEFAULT_SCATTER_BOTTOM } from "../_utils/defaultScatterConfig"
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
  /** Override top-overlay scatter items. Defaults to DEFAULT_SCATTER_TOP. */
  scatterTopItems?: ScatterItem[]
  /** Override bottom-overlay scatter items. Defaults to DEFAULT_SCATTER_BOTTOM. */
  scatterBottomItems?: ScatterItem[]
}

export function BoardScreen({
  quests, npcs, dialogs, regions, categories, npcCatalog,
  search, setSearch, statusFilter, setStatusFilter,
  sort, setSort, regionFilter, setRegionFilter,
  selectedId, onSelect, trackedQuestId, setTrackedQuestId,
  scatterTopItems = DEFAULT_SCATTER_TOP,
  scatterBottomItems = DEFAULT_SCATTER_BOTTOM,
}: BoardScreenProps) {
  const t = useTranslations("misiones")
  const { counts, filtered } = useQuestBoard({
    quests, search, statusFilter, regionFilter, sort,
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
        isolation: "isolate",
        padding: "32px 24px 140px 24px",
        background: "radial-gradient(ellipse at 30% 20%, rgba(255,220,160,0.08), transparent 50%), linear-gradient(180deg, rgba(40,24,12,0.4), rgba(20,12,6,0.5))",
        border: "1px solid rgba(0,0,0,0.45)",
        borderRadius: 4,
        boxShadow: "inset 0 1px 0 rgba(255,200,100,0.12), inset 0 0 80px rgba(0,0,0,0.5)",
        minHeight: 500,
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

        <ScatterLayer items={scatterTopItems} />

        {filtered.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--paper-2)", fontFamily: "var(--font-display)", fontSize: 18, fontStyle: "italic", position: "relative", zIndex: 2 }}>
            {t("board_empty")}
          </div>
        ) : (
          <div className="board-grid" style={{ position: "relative", zIndex: 2 }}>
            {filtered.map((q) => (
              <QuestPaper
                key={q.id}
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
            ))}
            {/* Decoration cells — fill empty grid slots so the last row never looks bare */}
            <div style={{ display: "grid", placeItems: "center", minHeight: 220, pointerEvents: "none" }}>
              <PostIt color="#fff77a" tilt={-4} size={150} footer="— Misty">
                Recuerda llevar <strong>SÚPER POCIÓN</strong> antes de entrar al gimnasio.
              </PostIt>
            </div>
            <div style={{ display: "grid", placeItems: "center", minHeight: 220, pointerEvents: "none" }}>
              <NewspaperClipping tilt={1.8} width={200} source="The Pewter Times" headline="LÍDER BROCK INVICTO" body="El líder del gimnasio de Pewter City lleva 40 días sin perder ningún combate oficial." />
            </div>
          </div>
        )}

        <ScatterLayer items={scatterBottomItems} />
      </div>
    </div>
  )
}

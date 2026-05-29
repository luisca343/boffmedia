"use client"

import React from "react"
import { useTranslations } from "next-intl"
import "./misiones-board.css"
import { useMisionesState } from "./_hooks/useMisionesState"
import { FlourishCorners } from "./_ui/flourishes/FlourishCorners"
import { SideRail } from "./_components/SideRail"
import { MobileTop } from "./_components/MobileTop"
import { BoardScreen } from "./_components/BoardScreen"
import { AtlasScreen } from "./_components/AtlasScreen"
import { TrophyScreen } from "./_components/TrophyScreen"
import { JournalScreen } from "./_components/JournalScreen"
import { QuestLetter } from "./_components/QuestLetter"
import { ConspiracyScreen } from "./_components/ConspiracyScreen"
import { InventoryScreen } from "./_components/InventoryScreen"
import { NpcDossier } from "./_components/NpcDossier"
import { CandleGlow } from "./_components/CandleGlow"
import { Palette } from "./_types/board"

export default function QuestLog() {
  const t = useTranslations("misiones")
  const {
    quests,
    categories,
    dialogs,
    npcs,
    npcCatalog,
    isLoading,
    section,
    setSection,
    selectedQuest,
    setSelectedQuest,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    regionFilter,
    setRegionFilter,
    sort,
    setSort,
    palette,
    setPalette,
    isMobile,
    trackedQuestId,
    setTrackedQuestId,
    regions,
    candlelight,
    setCandlelight,
    candleIntensity,
    setCandleIntensity,
    yarn,
    setYarn,
    npcDossier,
    setNpcDossier,
  } = useMisionesState()

  if (isLoading) {
    return (
      <div className="misiones-board" data-palette={palette}>
        <div className="tavern-bg" style={{ display: "grid", placeItems: "center", flex: 1 }}>
          <div className="paper" style={{ padding: "28px 44px", textAlign: "center", position: "relative" }}>
            <FlourishCorners size={28} color="var(--gold-3)" offset={8} opacity={0.6}/>
            <div className="dec-title" style={{ fontSize: 22, color: "var(--ink-1)", margin: "0 0 8px 0" }}>
              {t("loading_title")}
            </div>
            <div style={{ color: "var(--ink-3)", fontStyle: "italic", fontSize: 14 }}>
              {t("loading_subtitle")}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="misiones-board" data-palette={palette}>
      <div className="tavern-bg" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {/* Palette switcher removed — kept in state for future use */}

        <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
          <SideRail section={section} setSection={setSection}/>

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative" }}>
            {isMobile && <MobileTop section={section} setSection={setSection}/>}

            <main style={{ flex: 1, overflow: "auto", padding: "28px 36px", position: "relative", zIndex: 1 }}>
              <div style={{ maxWidth: 1760, margin: "0 auto", paddingBottom: 80 }}>
                {section === "board" && (
                  <BoardScreen
                    quests={quests}
                    npcs={npcs}
                    dialogs={dialogs}
                    regions={regions}
                    categories={categories}
                    npcCatalog={npcCatalog}
                    search={search} setSearch={setSearch}
                    statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                    sort={sort} setSort={setSort}
                    regionFilter={regionFilter} setRegionFilter={setRegionFilter}
                    selectedId={selectedQuest?.id ?? null}
                    onSelect={setSelectedQuest}
                    trackedQuestId={trackedQuestId}
                    setTrackedQuestId={setTrackedQuestId}
                  />
                )}
                {section === "trama" && (
                  <ConspiracyScreen
                    quests={quests}
                    npcs={npcs}
                    regions={regions}
                    npcCatalog={npcCatalog}
                    yarn={yarn}
                    onSelect={setSelectedQuest}
                  />
                )}
                {section === "atlas" && (
                  <AtlasScreen
                    quests={quests}
                    regions={regions}
                    npcCatalog={npcCatalog}
                    onSelect={(q) => { setSelectedQuest(q); setSection("board") }}
                  />
                )}
                {section === "mochila" && (
                  <InventoryScreen quests={quests}/>
                )}
                {section === "trophy" && <TrophyScreen quests={quests}/>}
                {section === "journal" && (
                  <JournalScreen
                    dialogs={dialogs}
                    npcs={npcs}
                    quests={quests}
                    npcCatalog={npcCatalog}
                    onSelectQuest={(q) => { setSection("board"); setSelectedQuest(q) }}
                  />
                )}
              </div>
            </main>

            {/* Detail letter slide-in */}
            {selectedQuest && (
              <>
                <div
                  onClick={() => setSelectedQuest(null)}
                  style={{
                    position: "absolute", inset: 0,
                    background: "rgba(20,12,6,0.5)", backdropFilter: "blur(2px)",
                    zIndex: 40,
                    animation: "mis-fade-up 0.18s ease",
                  }}
                />
                <div style={{
                  position: "absolute", inset: "0 0 0 auto",
                  width: "min(1000px, 68%)", zIndex: 50,
                  animation: "mis-slide-in 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
                }}>
                  <QuestLetter
                    quest={selectedQuest}
                    allQuests={quests}
                    npcs={npcs}
                    dialogs={dialogs}
                    regions={regions}
                    npcCatalog={npcCatalog}
                    onClose={() => setSelectedQuest(null)}
                    onSelectQuest={(q) => setSelectedQuest(q)}
                    onOpenNpc={(npc) => setNpcDossier(npc)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Candle glow overlay */}
      <CandleGlow on={candlelight} intensity={candleIntensity}/>

      {/* NPC dossier modal */}
      {npcDossier && (
        <NpcDossier
          npc={npcDossier}
          quests={quests}
          dialogs={dialogs}
          regions={regions}
          npcCatalog={npcCatalog}
          onClose={() => setNpcDossier(null)}
          onSelectQuest={(q) => { setSelectedQuest(q); setNpcDossier(null) }}
        />
      )}
    </div>
  )
}

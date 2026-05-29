"use client"

import React, { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { QuestData, QuestStatus, NPCCatalogResponse, NPCCatalogEntry } from "@/types/misiones"
import { WaxSeal } from "../_ui/primitives/WaxSeal"
import { FlourishCorners } from "../_ui/flourishes/FlourishCorners"
import { Divider } from "../_ui/flourishes/Divider"
import { STATUS_GLYPH, STATUS_COLOR } from "../_constants/questStatus"
import { Region } from "../_types/board"
import {
  StandardizedMap,
  CoordinateTransformer,
  MAP_CONSTANTS,
  Position,
} from "@/components/shared/map/StandardizedMap"

export interface AtlasScreenProps {
  quests: QuestData[]
  regions: Region[]
  npcCatalog?: NPCCatalogResponse
  onSelect: (q: QuestData) => void
}

const transformer = new CoordinateTransformer(MAP_CONSTANTS.WORLD_BOUNDS)

function worldPct(x: number, z: number): { left: string; top: string } {
  const px = transformer.worldToMapPixels(x, z)
  return {
    left: `${(px.x / MAP_CONSTANTS.FIXED_MAP_SIZE_X) * 100}%`,
    top: `${(px.z / MAP_CONSTANTS.FIXED_MAP_SIZE_Z) * 100}%`,
  }
}

interface NpcPin {
  entry: NPCCatalogEntry
  dialogId: string
  questsHere: QuestData[]
  pct: { left: string; top: string }
}

export function AtlasScreen({ quests, regions, npcCatalog, onSelect }: AtlasScreenProps) {
  const t = useTranslations("misiones")
  const [mapCenter, setMapCenter] = useState<Position>({ x: 0, z: 0 })
  const [zoomLevel, setZoomLevel] = useState(1)
  const [hoveredUuid, setHoveredUuid] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  const pins: NpcPin[] = useMemo(() => {
    if (!npcCatalog) return []

    return Object.entries(npcCatalog).flatMap(([dialogId, entries]) =>
      entries.map((entry) => {
        const questsHere = quests.filter(
          (q) => q.dialogId === Number(dialogId)
        )
        return {
          entry,
          dialogId,
          questsHere,
          pct: worldPct(entry.x, entry.z),
        }
      })
    )
  }, [npcCatalog, quests])

  const hasActive = (pin: NpcPin) => pin.questsHere.some((q) => q.status === QuestStatus.ACTIVE)
  const hasAvailable = (pin: NpcPin) => pin.questsHere.some((q) => q.status === QuestStatus.AVAILABLE)

  function pinColor(pin: NpcPin): string {
    if (hasActive(pin)) return "var(--seal-active)"
    if (hasAvailable(pin)) return "var(--seal-available)"
    return "var(--seal-locked)"
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 22, marginTop: 10 }}>
        <span className="label" style={{ color: "var(--gold-1)" }}>{t("atlas_label")}</span>
        <h1 className="dec-title" style={{ fontSize: 38, color: "var(--paper-1)", margin: "4px 0 6px 0", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
          {t("atlas_title")}
        </h1>
        <div style={{ color: "var(--paper-3)", fontSize: 14, fontStyle: "italic" }}>
          {t("atlas_subtitle_map")}
        </div>
        <div style={{ marginTop: 14, color: "var(--gold-2)", opacity: 0.7 }}>
          <Divider color="var(--gold-2)" glyph="✦"/>
        </div>
      </div>

      {/* Map with NPC pins */}
      <div className="paper" style={{ padding: 0, overflow: "hidden", position: "relative", borderRadius: 4, marginBottom: 20 }}>
        <FlourishCorners size={36} color="var(--ink-2)" offset={10} opacity={0.4}/>
        <div style={{ height: "clamp(520px, 48vh, 760px)", position: "relative" }}>
          <StandardizedMap
            mapCenter={mapCenter}
            zoomLevel={zoomLevel}
            onMapCenterChange={setMapCenter}
            onZoomChange={setZoomLevel}
            className="h-full w-full"
            minZoom={0.5}
            maxZoom={15}
          >
            {/* NPC pins positioned as % of the map image */}
            {pins.filter((pin) => showCompleted || hasActive(pin) || hasAvailable(pin)).map((pin) => (
              <div
                key={`${pin.entry.uuid}-${pin.dialogId}`}
                style={{
                  position: "absolute",
                  left: pin.pct.left,
                  top: pin.pct.top,
                  transform: "translate(-50%, -100%)",
                  zIndex: hoveredUuid === `${pin.entry.uuid}-${pin.dialogId}` ? 30 : 20,
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHoveredUuid(`${pin.entry.uuid}-${pin.dialogId}`)}
                onMouseLeave={() => setHoveredUuid(null)}
              >
                {/* Pin needle + head with completion ring */}
                <svg viewBox="-14 -24 28 32" width="28" height="32" style={{ display: "block", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
                  {/* Completion ring */}
                  {(() => {
                    const done = pin.questsHere.filter((q) => q.status === QuestStatus.COMPLETED).length
                    const total = pin.questsHere.length
                    const frac = total > 0 ? done / total : 0
                    const R = 13
                    const C = 2 * Math.PI * R
                    return total > 0 ? (
                      <>
                        <circle cx="0" cy="-10" r={R} fill="none" className="region-ring-track" strokeWidth="2.5"/>
                        <circle cx="0" cy="-10" r={R} fill="none" stroke="var(--gold-2)" strokeWidth="2.5"
                          strokeLinecap="round" className="region-ring-fill"
                          transform="rotate(-90 0 -10)"
                          strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
                          opacity={0.95}/>
                      </>
                    ) : null
                  })()}
                  <line x1="0" y1="-4" x2="0" y2="8" stroke="#1a0e07" strokeWidth="1.5"/>
                  <circle cx="0" cy="-10" r="9" fill={pinColor(pin)} stroke="#1a0e07" strokeWidth="1.2"/>
                  <circle cx="-3" cy="-13" r="3" fill="rgba(255,255,255,0.45)"/>
                  {pin.questsHere.length > 0 && (
                    <text x="0" y="-7" textAnchor="middle" fontSize="8" fontWeight="700" fill="rgba(0,0,0,0.7)" fontFamily="serif">
                      {pin.questsHere.length}
                    </text>
                  )}
                </svg>

                {/* Hover popover */}
                {hoveredUuid === `${pin.entry.uuid}-${pin.dialogId}` && (
                  <div style={{
                    position: "absolute",
                    bottom: "110%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 240,
                    zIndex: 50,
                    pointerEvents: "none",
                  }}>
                    <div className="paper" style={{ padding: "10px 12px", transform: "rotate(-1deg)", background: "var(--paper-1)" }}>
                      <FlourishCorners size={14} color="var(--gold-3)" offset={3} opacity={0.5}/>
                      <div className="dec-title" style={{ fontSize: 14, color: "var(--ink-1)", marginBottom: 2 }}>
                        {pin.entry.name}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--ink-3)", fontStyle: "italic", marginBottom: 6 }}>
                        {pin.entry.x.toFixed(0)}, {pin.entry.z.toFixed(0)} · {pin.entry.world}
                      </div>
                      {pin.questsHere.slice(0, 3).map((q) => (
                        <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, padding: "3px 0" }}>
                          <span style={{ fontSize: 11, color: "var(--ink-2)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.name}</span>
                          <WaxSeal glyph={STATUS_GLYPH[q.status]} color={STATUS_COLOR[q.status]} size={16} tilt={-8}/>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </StandardizedMap>
        </div>
      </div>

      {/* Legend */}
      <div className="paper" style={{ padding: "10px 16px", marginBottom: 20, transform: "rotate(0.3deg)" }}>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
          <span className="label" style={{ color: "var(--ink-2)" }}>Leyenda</span>
          {[
            { c: "var(--seal-active)", l: "NPC con misión vigente", toggle: false },
            { c: "var(--seal-available)", l: "Disponible", toggle: false },
            { c: "var(--seal-locked)", l: "Completadas", toggle: true },
          ].map((it, i) => (
            <span
              key={i}
              onClick={it.toggle ? () => setShowCompleted((v) => !v) : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 8, fontSize: 12,
                color: "var(--ink-2)",
                cursor: it.toggle ? "pointer" : "default",
                opacity: it.toggle && !showCompleted ? 0.4 : 1,
                userSelect: "none",
              }}
            >
              <svg viewBox="-12 -16 24 24" width="18" height="18">
                <line x1="0" y1="-4" x2="0" y2="6" stroke="#1a0e07" strokeWidth="1.5"/>
                <circle cx="0" cy="-8" r="7" fill={it.c} stroke="#1a0e07" strokeWidth="1"/>
              </svg>
              {it.l}
            </span>
          ))}
        </div>
      </div>

      {/* Category cards below map */}
      {regions.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {regions.map((r) => {
            const questsHere = quests.filter((q) => q.category === r.id)
            const completed = questsHere.filter((q) => q.status === QuestStatus.COMPLETED).length
            const active = questsHere.filter((q) => q.status === QuestStatus.ACTIVE).length
            const available = questsHere.filter((q) => q.status === QuestStatus.AVAILABLE).length
            const pct = questsHere.length > 0 ? Math.round((completed / questsHere.length) * 100) : 0
            return (
              <div key={r.id} className="paper" style={{ padding: "16px 18px", position: "relative" }}>
                <FlourishCorners size={20} color="var(--gold-3)" offset={4} opacity={0.4}/>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h3 className="dec-title" style={{ fontSize: 17, margin: 0, color: "var(--ink-1)" }}>{r.name}</h3>
                  <div className="dec-title" style={{ fontSize: 18, color: "var(--gold-3)", lineHeight: 1 }}>{pct}%</div>
                </div>
                <div className="bar gold" style={{ marginBottom: 8 }}><span style={{ width: pct + "%" }}/></div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {active > 0 && <span className="chip" style={{ color: "var(--seal-active)", borderColor: "var(--seal-active)", fontSize: 10 }}>{active} {t(active === 1 ? "atlas_active_one" : "atlas_active_other")}</span>}
                  {available > 0 && <span className="chip" style={{ color: "var(--seal-available)", borderColor: "var(--seal-available)", fontSize: 10 }}>{available} {t(available === 1 ? "atlas_available_one" : "atlas_available_other")}</span>}
                  {completed > 0 && <span className="chip" style={{ color: "var(--seal-completed)", borderColor: "var(--seal-completed)", fontSize: 10 }}>{completed} {t(completed === 1 ? "atlas_completed_one" : "atlas_completed_other")}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

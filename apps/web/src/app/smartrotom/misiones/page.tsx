"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { useGetRotomQuests } from "./_hooks/useGetRotomQuests"
import { QuestData, QuestStatus, IDialogue, NPC } from "@/types/misiones"
import Fuse from "fuse.js"
import "./misiones-board.css"
import {
  WaxSeal, Nail, Thumbtack, Flourish, FlourishCorners,
  Divider, Ribbon, Stamp, Sparkles, Shield, Icon,
  STATUS_LABEL, STATUS_GLYPH, STATUS_COLOR,
} from "./_components/misiones-atoms"

// ---- Helpers ----

const QUEST_TYPE_LABELS: Record<number, string> = {
  0: "Principal", 1: "Secundaria", 2: "Diaria",
  3: "Gimnasio", 4: "Rival", 5: "Endgame",
}

function getQuestTypeLabel(type: number): string {
  return QUEST_TYPE_LABELS[type] ?? "Misión"
}

function formatItemName(item: string): string {
  const parts = item.split(":")
  const raw = parts[parts.length - 1] ?? item
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function tiltFor(id: number): number {
  const seed = (id * 2654435761) % (2 ** 32)
  return ((seed % 100) / 100 - 0.5) * 3.4
}

// Category → region-like object
interface Region { id: string; name: string; glyph: string }
function makeRegions(categories: Record<string, number[]>): Region[] {
  return Object.keys(categories).map((name) => ({
    id: name,
    name,
    glyph: name.substring(0, 2).toUpperCase(),
  }))
}

// Find NPC for a quest via dialogId
function getNpcForQuest(quest: QuestData, npcs: NPC[]): NPC | undefined {
  return npcs.find((n) => n.dialogId === quest.dialogId)
}

// Palette options
type Palette = "pergamino" | "grimdark" | "royal" | "forest"

const STATUS_ORDER: Record<string, number> = {
  ACTIVE: 1, AVAILABLE: 2, COMPLETED: 3, FAILED: 4, LOCKED: 5, NOT_STARTED: 6,
}

// ===================== QUEST PAPER CARD =====================
interface QuestPaperProps {
  quest: QuestData
  npc: NPC | undefined
  regionName: string
  selected: boolean
  tilt: number
  onClick: () => void
}
function QuestPaper({ quest, npc, regionName, selected, tilt, onClick }: QuestPaperProps) {
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

      {quest.status === QuestStatus.COMPLETED && <Stamp kind="completed">Completada</Stamp>}
      {quest.status === QuestStatus.FAILED && <Stamp kind="failed">Fallida</Stamp>}

      {(quest.status === QuestStatus.LOCKED || quest.status === QuestStatus.NOT_STARTED) && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(135deg, transparent 48%, rgba(60,30,10,0.35) 50%, transparent 52%), linear-gradient(45deg, transparent 48%, rgba(60,30,10,0.35) 50%, transparent 52%)",
        }}/>
      )}

      {/* Type + level (uses requiredLevel from requirements) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span className="label" style={{ color: STATUS_COLOR[quest.status] }}>
          {getQuestTypeLabel(quest.type)}
        </span>
        {quest.requirements?.requiredLevel > 0 && (
          <span className="label">Nv. {quest.requirements.requiredLevel}</span>
        )}
      </div>

      {/* Title */}
      <h3 className="dec-title" style={{ fontSize: 19, margin: "2px 0 8px 0", lineHeight: 1.15, color: "var(--ink-1)" }}>
        {quest.name}
      </h3>

      {/* NPC + region */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 10, color: "var(--ink-3)", fontStyle: "italic" }}>
        <Icon.Quill size={11}/>
        <span>de <strong style={{ color: "var(--ink-2)", fontStyle: "normal" }}>{npc?.name ?? "Desconocido"}</strong></span>
        {regionName && (
          <>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon.Pin size={11}/> {regionName}
            </span>
          </>
        )}
      </div>

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
            <span>{objectivesDone}/{objectivesTotal} OBJETIVOS</span>
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
            <span className="label" style={{ color: "var(--gold-3)" }}>Repetible</span>
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

// ===================== TRACKED QUEST CENTERPIECE =====================
interface TrackedQuestPaperProps {
  quest: QuestData
  npc: NPC | undefined
  regionName: string
  onOpen: () => void
}
function TrackedQuestPaper({ quest, npc, regionName, onOpen }: TrackedQuestPaperProps) {
  const nextObjective = (quest.objectives || []).find((o) => o.progress < o.total)
  const progressValue = (quest.objectives || []).reduce((s, o) => s + Math.min(o.progress, o.total), 0)
  const progressTotal = (quest.objectives || []).reduce((s, o) => s + o.total, 0)
  const pct = progressTotal > 0 ? Math.round((progressValue / progressTotal) * 100) : 0

  return (
    <div className="paper pinnable sparkle-host" style={{
      padding: "26px 30px 22px 30px",
      transform: "rotate(-0.5deg)",
      position: "relative",
      cursor: "pointer",
    }} onClick={onOpen}>
      <Sparkles count={9}/>

      <div style={{ position: "absolute", top: -28, left: "50%", transform: "translateX(-50%)", zIndex: 8 }}>
        <Ribbon color="var(--stamp-red)" width={260} height={48}>¶ Misión Rastreada</Ribbon>
      </div>

      <div style={{ position: "absolute", top: 10, left: 10 }}><Nail size={14}/></div>
      <div style={{ position: "absolute", top: 10, right: 10 }}><Nail size={14}/></div>
      <div style={{ position: "absolute", bottom: 10, left: 10 }}><Nail size={14}/></div>
      <div style={{ position: "absolute", bottom: 10, right: 10 }}><Nail size={14}/></div>

      <FlourishCorners size={32} color="var(--gold-3)" offset={20} opacity={0.7}/>

      <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 14 }}>
        <WaxSeal glyph={STATUS_GLYPH[quest.status]} color={STATUS_COLOR[quest.status]} size={68} tilt={-12}/>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="label" style={{ color: STATUS_COLOR[quest.status] }}>
            {STATUS_LABEL[quest.status]} · {getQuestTypeLabel(quest.type)}
          </span>
          <h2 className="dec-title" style={{ fontSize: 28, margin: "4px 0 6px 0", color: "var(--ink-1)" }}>
            {quest.name}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-3)", fontSize: 13, fontStyle: "italic", marginBottom: 12 }}>
            <Icon.Quill size={12}/>
            <span>encomendada por</span>
            <strong style={{ color: "var(--ink-2)", fontStyle: "normal" }}>{npc?.name ?? "Desconocido"}</strong>
            {regionName && (
              <>
                <span style={{ opacity: 0.5 }}>·</span>
                <Icon.Pin size={12}/>
                <span>{regionName}</span>
              </>
            )}
          </div>

          {nextObjective && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(255,240,200,0.5)",
              border: "1px solid rgba(60,40,20,0.3)",
              borderRadius: 2, marginBottom: 12,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <Icon.Target size={16}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-uppercase)", letterSpacing: "0.12em" }}>SIGUIENTE</div>
                <div style={{ fontSize: 14, color: "var(--ink-1)", fontWeight: 500 }}>{nextObjective.name}</div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink-2)" }}>
                {nextObjective.progress}/{nextObjective.total}
              </span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="bar gold" style={{ flex: 1 }}><span style={{ width: pct + "%" }}/></div>
            <span style={{ fontFamily: "var(--font-uppercase)", fontSize: 12, color: "var(--gold-3)", letterSpacing: "0.08em" }}>
              {pct}%
            </span>
            <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); onOpen() }}>
              <Icon.Quill size={12}/> Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===================== QUEST LETTER (detail panel) =====================
interface QuestLetterProps {
  quest: QuestData
  npcs: NPC[]
  dialogs: IDialogue[]
  regions: Region[]
  onClose: () => void
}
function QuestLetter({ quest, npcs, dialogs, regions, onClose }: QuestLetterProps) {
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
        <Icon.X size={14}/> Cerrar
      </button>

      <div style={{ flex: 1, overflow: "auto", padding: "60px 56px 24px 56px", position: "relative", zIndex: 1 }}>
        {/* Floating wax seal */}
        <div style={{ position: "absolute", left: 22, top: 60 }}>
          <WaxSeal glyph={STATUS_GLYPH[quest.status]} color={STATUS_COLOR[quest.status]} size={64} tilt={-15}/>
        </div>

        {/* Ribbon */}
        <div style={{ textAlign: "center", marginBottom: 14, marginLeft: 60, marginTop: -32 }}>
          <Ribbon color={STATUS_COLOR[quest.status]} width={280} height={50}>
            {STATUS_LABEL[quest.status]} · {getQuestTypeLabel(quest.type)}
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
          {npc && <span><Icon.Quill size={11}/> de <strong style={{ color: "var(--ink-2)", fontStyle: "normal" }}>{npc.name}</strong></span>}
          {regionName && <span><Icon.Pin size={11}/> {regionName}</span>}
          {quest.requirements?.requiredLevel > 0 && (
            <span style={{ color: "var(--gold-3)" }}>Nv. requerido: {quest.requirements.requiredLevel}</span>
          )}
          {quest.repeatable && <span style={{ color: "var(--gold-3)" }}>· Repetible</span>}
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
                ⚜ Objetivos ⚜
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
                ⚜ Recompensas ⚜
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
                {npc?.name ?? "NPC"} dice:
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
                Conclusión
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
            Sellado en la Posada del Rotom
          </div>
        </div>
      </div>
    </div>
  )
}

// ===================== FILTERS BAR =====================
interface BoardFiltersProps {
  search: string
  setSearch: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  sort: string
  setSort: (v: string) => void
  counts: Record<string, number>
}
function BoardFilters({ search, setSearch, statusFilter, setStatusFilter, sort, setSort, counts }: BoardFiltersProps) {
  const statuses = ["ALL", QuestStatus.ACTIVE, QuestStatus.AVAILABLE, QuestStatus.COMPLETED, QuestStatus.FAILED, QuestStatus.LOCKED]
  return (
    <div style={{
      padding: "12px 16px",
      background: "linear-gradient(180deg, rgba(60,40,20,0.55), rgba(40,24,12,0.65))",
      border: "1px solid rgba(0,0,0,0.4)",
      borderRadius: 4,
      boxShadow: "inset 0 1px 0 rgba(255,200,100,0.1)",
      display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
      marginBottom: 24,
    }}>
      <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 320 }}>
        <input
          className="field"
          type="text"
          placeholder="Buscar misión, NPC, lugar…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 34 }}
        />
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)" }}>
          <Icon.Search size={14}/>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {statuses.map((s) => (
          <button key={s} className={`chip ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
            {s === "ALL" ? "Todas" : STATUS_LABEL[s as QuestStatus]}
            <span style={{ opacity: 0.65 }}>({counts[s] || 0})</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }}/>

      <select value={sort} onChange={(e) => setSort(e.target.value)} className="field" style={{
        width: "auto", padding: "9px 12px", fontFamily: "var(--font-uppercase)", fontSize: 11, letterSpacing: "0.10em",
      }}>
        <option value="status">Orden: por sello</option>
        <option value="name">Orden: alfabético</option>
        <option value="type">Orden: por tipo</option>
      </select>
    </div>
  )
}

// ===================== BOARD SCREEN =====================
interface BoardScreenProps {
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
function BoardScreen({
  quests, npcs, dialogs, regions, categories,
  search, setSearch, statusFilter, setStatusFilter,
  sort, setSort, regionFilter, setRegionFilter,
  selectedId, onSelect, trackedQuestId, setTrackedQuestId,
}: BoardScreenProps) {
  const fuse = useMemo(() => new Fuse(quests, {
    keys: ["name", "logText", "category"],
    threshold: 0.4,
  }), [quests])

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: quests.length }
    for (const q of quests) c[q.status] = (c[q.status] || 0) + 1
    return c
  }, [quests])

  const filtered = useMemo(() => {
    let list: QuestData[] = quests.filter((q) => q.id !== trackedQuestId)
    if (statusFilter !== "ALL") list = list.filter((q) => q.status === statusFilter)
    if (regionFilter) list = list.filter((q) => q.category === regionFilter)
    if (search.trim()) {
      list = fuse.search(search).map((r) => r.item).filter((q) => q.id !== trackedQuestId)
    }
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === "type") list.sort((a, b) => a.type - b.type)
    else list.sort((a, b) => (STATUS_ORDER[a.status] || 9) - (STATUS_ORDER[b.status] || 9))
    return list
  }, [quests, statusFilter, regionFilter, search, sort, trackedQuestId, fuse])

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

// ===================== ATLAS SCREEN =====================
interface AtlasScreenProps {
  quests: QuestData[]
  regions: Region[]
  onSelect: (q: QuestData) => void
}
function AtlasScreen({ quests, regions, onSelect }: AtlasScreenProps) {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 30, marginTop: 10 }}>
        <span className="label" style={{ color: "var(--gold-1)" }}>Atlas</span>
        <h1 className="dec-title" style={{ fontSize: 38, color: "var(--paper-1)", margin: "4px 0 6px 0", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
          Mapa del Reino
        </h1>
        <div style={{ color: "var(--paper-3)", fontSize: 14, fontStyle: "italic" }}>
          Cada categoría guarda misiones y secretos por descubrir
        </div>
        <div style={{ marginTop: 16, color: "var(--gold-2)", opacity: 0.7 }}>
          <Divider color="var(--gold-2)" glyph="✦"/>
        </div>
      </div>

      {regions.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--paper-2)", fontStyle: "italic", padding: "40px 0" }}>
          Cargando el mapa…
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 22 }}>
          {regions.map((r, ri) => {
            const questsHere = quests.filter((q) => q.category === r.id)
            const completed = questsHere.filter((q) => q.status === QuestStatus.COMPLETED).length
            const active = questsHere.filter((q) => q.status === QuestStatus.ACTIVE).length
            const available = questsHere.filter((q) => q.status === QuestStatus.AVAILABLE).length
            const pct = questsHere.length > 0 ? Math.round((completed / questsHere.length) * 100) : 0
            const hue = (ri * 47 + 35) % 360
            return (
              <div key={r.id} className="paper" style={{ padding: "20px 22px", position: "relative" }}>
                <FlourishCorners size={26} color="var(--gold-3)" offset={6} opacity={0.5}/>
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                  <Shield size={50} color={`hsl(${hue}, 45%, 48%)`}>{r.glyph}</Shield>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="label">Categoría</span>
                    <h3 className="dec-title" style={{ fontSize: 20, margin: "2px 0", color: "var(--ink-1)" }}>{r.name}</h3>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="dec-title" style={{ fontSize: 22, color: "var(--gold-3)", lineHeight: 1 }}>{pct}%</div>
                    <div className="label" style={{ marginTop: 2 }}>hecho</div>
                  </div>
                </div>
                <div className="bar gold"><span style={{ width: pct + "%" }}/></div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                  {active > 0 && <span className="chip" style={{ color: "var(--seal-active)", borderColor: "var(--seal-active)", background: "rgba(200,144,38,0.08)" }}>{active} vigente{active > 1 ? "s" : ""}</span>}
                  {available > 0 && <span className="chip" style={{ color: "var(--seal-available)", borderColor: "var(--seal-available)", background: "rgba(179,65,26,0.08)" }}>{available} disponible{available > 1 ? "s" : ""}</span>}
                  {completed > 0 && <span className="chip" style={{ color: "var(--seal-completed)", borderColor: "var(--seal-completed)", background: "rgba(107,20,16,0.08)" }}>{completed} hecha{completed > 1 ? "s" : ""}</span>}
                </div>
                {questsHere.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed rgba(60,40,20,0.3)", display: "flex", flexDirection: "column", gap: 6 }}>
                    {questsHere.slice(0, 3).map((q) => (
                      <div key={q.id} onClick={() => onSelect(q)} style={{
                        padding: "8px 10px", background: "rgba(60,40,20,0.06)",
                        borderRadius: 2, cursor: "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                        fontSize: 13, color: "var(--ink-2)",
                      }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic" }}>{q.name}</span>
                        <WaxSeal glyph={STATUS_GLYPH[q.status]} color={STATUS_COLOR[q.status]} size={22} tilt={-10}/>
                      </div>
                    ))}
                    {questsHere.length > 3 && (
                      <div style={{ fontSize: 11, color: "var(--ink-3)", textAlign: "center", fontStyle: "italic" }}>
                        +{questsHere.length - 3} más
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ===================== TROPHY SCREEN =====================
interface TrophyScreenProps { quests: QuestData[] }
function TrophyScreen({ quests }: TrophyScreenProps) {
  const total = quests.length
  const completed = quests.filter((q) => q.status === QuestStatus.COMPLETED).length
  const active = quests.filter((q) => q.status === QuestStatus.ACTIVE).length
  const failed = quests.filter((q) => q.status === QuestStatus.FAILED).length

  const typeGroups = useMemo(() => {
    const groups: Record<string, { total: number; done: number }> = {}
    for (const q of quests) {
      const t = getQuestTypeLabel(q.type)
      if (!groups[t]) groups[t] = { total: 0, done: 0 }
      groups[t].total++
      if (q.status === QuestStatus.COMPLETED) groups[t].done++
    }
    return groups
  }, [quests])

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 30, marginTop: 10 }}>
        <span className="label" style={{ color: "var(--gold-1)" }}>Vitrina</span>
        <h1 className="dec-title" style={{ fontSize: 38, color: "var(--paper-1)", margin: "4px 0 6px 0", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
          Sala de Trofeos
        </h1>
        <div style={{ color: "var(--paper-3)", fontSize: 14, fontStyle: "italic" }}>
          {completed} de {total} misiones completadas
        </div>
        <div style={{ marginTop: 16, color: "var(--gold-2)", opacity: 0.7 }}>
          <Divider color="var(--gold-2)" glyph="⚜"/>
        </div>
      </div>

      {/* Overall progress */}
      <div className="paper" style={{ padding: "22px 28px", marginBottom: 28, position: "relative" }}>
        <FlourishCorners size={32} color="var(--gold-3)" offset={8} opacity={0.6}/>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span className="dec-title" style={{ fontSize: 20, color: "var(--gold-3)" }}>Progreso General</span>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <Shield size={80} color={completed > 0 ? "var(--gold-2)" : "var(--ink-3)"}>
            {completed > 0 ? "★" : "·"}
          </Shield>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6,
              fontFamily: "var(--font-uppercase)", letterSpacing: "0.12em", color: "var(--ink-3)" }}>
              <span>Completadas</span>
              <span style={{ color: "var(--gold-3)" }}>{completed} / {total}</span>
            </div>
            <div className="bar gold"><span style={{ width: total > 0 ? (completed / total * 100) + "%" : "0%" }}/></div>
            <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
              {[
                { label: "Vigentes", value: active, color: "var(--seal-active)" },
                { label: "Completadas", value: completed, color: "var(--seal-completed)" },
                { label: "Fallidas", value: failed, color: "var(--seal-failed)" },
              ].map((s) => (
                <div key={s.label} style={{
                  padding: "8px 12px", background: "rgba(60,40,20,0.06)",
                  border: "1px solid rgba(60,40,20,0.18)", borderRadius: 2, textAlign: "center",
                }}>
                  <div className="dec-title" style={{ fontSize: 20, color: s.color }}>{s.value}</div>
                  <div className="label" style={{ marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Per-type breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
        {Object.entries(typeGroups).map(([type, { total: t, done }]) => {
          const pct = t > 0 ? Math.round((done / t) * 100) : 0
          const isDone = done === t && t > 0
          return (
            <div key={type} className="paper" style={{ padding: 18, position: "relative", textAlign: "center", opacity: isDone ? 1 : 0.93 }}>
              <FlourishCorners size={20} color="var(--gold-3)" offset={4} opacity={0.45}/>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 6, marginBottom: 12, filter: isDone ? "" : "grayscale(0.4) brightness(0.85)" }}>
                <Shield size={64} color={isDone ? "var(--gold-2)" : "var(--ink-3)"}>
                  {isDone ? "★" : "·"}
                </Shield>
              </div>
              <h3 className="dec-title" style={{ fontSize: 17, margin: "0 0 4px 0", color: "var(--ink-1)" }}>{type}</h3>
              <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "0 0 12px 0", fontStyle: "italic" }}>{done}/{t} misiones</p>
              <div style={{ marginBottom: 6, fontSize: 10, color: "var(--ink-3)", fontFamily: "var(--font-uppercase)", letterSpacing: "0.14em" }}>{pct}%</div>
              <div className="bar gold"><span style={{ width: pct + "%" }}/></div>
              {isDone && (
                <div style={{ position: "absolute", top: 10, right: 14, transform: "rotate(8deg)" }}>
                  <Stamp kind="active" animate>Completado</Stamp>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===================== JOURNAL SCREEN =====================
interface JournalScreenProps {
  dialogs: IDialogue[]
  npcs: NPC[]
  quests: QuestData[]
  onSelectQuest: (q: QuestData) => void
}
function JournalScreen({ dialogs, npcs, quests, onSelectQuest }: JournalScreenProps) {
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
        <span className="label" style={{ color: "var(--gold-1)" }}>Diario</span>
        <h1 className="dec-title" style={{ fontSize: 38, color: "var(--paper-1)", margin: "4px 0 6px 0", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
          Bitácora de Diálogos
        </h1>
        <div style={{ color: "var(--paper-3)", fontSize: 14, fontStyle: "italic" }}>
          Cada palabra registrada con tinta indeleble
        </div>
        <div style={{ marginTop: 16, color: "var(--gold-2)", opacity: 0.7 }}>
          <Divider color="var(--gold-2)" glyph="✦"/>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ position: "relative", maxWidth: 380, marginBottom: 20 }}>
          <input className="field" value={searchD} onChange={(e) => setSearchD(e.target.value)}
            placeholder="Buscar en la bitácora…" style={{ paddingLeft: 34 }}/>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)" }}>
            <Icon.Search size={14}/>
          </div>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--paper-2)", fontStyle: "italic", padding: "40px 0" }}>
            No hay entradas que coincidan.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((d) => {
            const npc = npcs.find((n) => n.dialogId === d.id)
            const quest = quests.find((q) => q.id === d.questId)
            const tilt = ((d.id * 13) % 100) / 100 * 1.6 - 0.8
            const npcInitial = (npc?.name ?? d.name ?? "?")[0].toUpperCase()
            return (
              <div key={d.id} className="paper" style={{ padding: "20px 26px", position: "relative", transform: `rotate(${tilt}deg)` }}>
                <FlourishCorners size={20} color="var(--gold-3)" offset={6} opacity={0.4}/>
                <div style={{ position: "absolute", top: -10, left: 30 }}>
                  <WaxSeal glyph={npcInitial} color="var(--seal-available)" size={36} tilt={-12}/>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 20, marginBottom: 8, gap: 14 }}>
                  <div>
                    <div className="dec-title" style={{ fontSize: 18, color: "var(--ink-1)" }}>{npc?.name ?? d.name}</div>
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
                    <span className="label">— misión relacionada</span>
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

// ===================== SIDE RAIL =====================
type Section = "board" | "atlas" | "trophy" | "journal"
interface SideRailProps { section: Section; setSection: (s: Section) => void }
function SideRail({ section, setSection }: SideRailProps) {
  const items: { id: Section; label: string; glyph: string }[] = [
    { id: "board", label: "El Tablón", glyph: "❦" },
    { id: "atlas", label: "Mapa del Reino", glyph: "✦" },
    { id: "trophy", label: "Sala de Trofeos", glyph: "⚜" },
    { id: "journal", label: "Bitácora", glyph: "✥" },
  ]
  return (
    <aside className="wood-frame hide-mobile" style={{
      width: 240, flexShrink: 0,
      display: "flex", flexDirection: "column",
      borderRight: "3px solid #050201",
      position: "relative",
    }}>
      <div style={{ padding: "22px 16px 18px 16px", textAlign: "center", background: "linear-gradient(180deg, rgba(0,0,0,0.4), transparent)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--gold-2)", letterSpacing: "0.20em", fontFamily: "var(--font-uppercase)" }}>
          ✦ POSADA DEL ROTOM ✦
        </div>
        <h1 className="dec-title" style={{ margin: "8px 0 0 0", fontSize: 26, color: "var(--gold-1)", lineHeight: 1, textShadow: "0 2px 4px rgba(0,0,0,0.7)" }}>
          Misiones
        </h1>
        <div style={{ marginTop: 8, fontSize: 10, color: "var(--gold-3)", letterSpacing: "0.16em", fontFamily: "var(--font-uppercase)", fontStyle: "italic", opacity: 0.8 }}>
          — Bitácora del aventurero —
        </div>
      </div>

      <div style={{ height: 2, marginInline: 14, background: "linear-gradient(90deg, transparent, var(--gold-3), transparent)", opacity: 0.5 }}/>

      <nav style={{ padding: "14px 0", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((it) => (
          <div key={it.id} className={`leather-tab ${section === it.id ? "active" : ""}`} onClick={() => setSection(it.id)}>
            <span style={{ fontSize: 16, opacity: 0.7 }}>{it.glyph}</span>
            <span style={{ flex: 1 }}>{it.label}</span>
          </div>
        ))}
      </nav>

      <div style={{ padding: "8px 14px 14px 14px", fontSize: 9, color: "rgba(217, 182, 115, 0.5)", fontFamily: "var(--font-uppercase)", letterSpacing: "0.16em", textAlign: "center" }}>
        ◆ ROTOM·CODEX v3.2
      </div>
    </aside>
  )
}

// ===================== MOBILE TOP BAR =====================
interface MobileTopProps { section: Section; setSection: (s: Section) => void }
function MobileTop({ section, setSection }: MobileTopProps) {
  const items: { id: Section; label: string }[] = [
    { id: "board", label: "Tablón" },
    { id: "atlas", label: "Mapa" },
    { id: "trophy", label: "Trofeos" },
    { id: "journal", label: "Bitácora" },
  ]
  return (
    <div className="wood-frame" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px", overflowX: "auto" }}>
      <span className="dec-title" style={{ color: "var(--gold-1)", fontSize: 16, flexShrink: 0, marginRight: 8 }}>✦ Misiones</span>
      {items.map((it) => {
        const active = section === it.id
        return (
          <button key={it.id} onClick={() => setSection(it.id)} className="btn btn-sm" style={{
            background: active ? "linear-gradient(180deg, var(--gold-2), var(--gold-3))" : "transparent",
            color: active ? "#1e120a" : "var(--gold-1)",
            border: active ? "1px solid var(--gold-4)" : "1px solid rgba(255,200,100,0.3)",
            flexShrink: 0,
          }}>
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

// ===================== MAIN PAGE =====================
export default function QuestLog() {
  const { quests, categories, dialogs, npcs, isLoading } = useGetRotomQuests()

  const [section, setSection] = useState<Section>("board")
  const [selectedQuest, setSelectedQuest] = useState<QuestData | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [regionFilter, setRegionFilter] = useState<string | null>(null)
  const [sort, setSort] = useState("status")
  const [palette, setPalette] = useState<Palette>("pergamino")
  const [isMobile, setIsMobile] = useState(false)

  // Auto-track the first ACTIVE quest
  const firstActiveId = useMemo(
    () => quests.find((q) => q.status === QuestStatus.ACTIVE)?.id ?? null,
    [quests.length] // intentionally uses .length — only recalculate when quest count changes
  )
  const [trackedQuestId, setTrackedQuestId] = useState<number | null>(null)
  useEffect(() => {
    if (trackedQuestId === null && firstActiveId !== null) {
      setTrackedQuestId(firstActiveId)
    }
  }, [firstActiveId, trackedQuestId])

  const regions = useMemo(() => makeRegions(categories), [categories])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (isLoading) {
    return (
      <div className="misiones-board" data-palette={palette}>
        <div className="tavern-bg" style={{ display: "grid", placeItems: "center", flex: 1 }}>
          <div className="paper" style={{ padding: "28px 44px", textAlign: "center", position: "relative" }}>
            <FlourishCorners size={28} color="var(--gold-3)" offset={8} opacity={0.6}/>
            <div className="dec-title" style={{ fontSize: 22, color: "var(--ink-1)", margin: "0 0 8px 0" }}>
              Consultando el tablón…
            </div>
            <div style={{ color: "var(--ink-3)", fontStyle: "italic", fontSize: 14 }}>
              Un momento, viajero.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="misiones-board" data-palette={palette}>
      <div className="tavern-bg" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {/* Palette switcher */}
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 20,
          display: "flex", gap: 4,
        }}>
          {(["pergamino", "grimdark", "royal", "forest"] as Palette[]).map((p) => (
            <button key={p} onClick={() => setPalette(p)} style={{
              width: 14, height: 14, borderRadius: "50%", border: palette === p ? "2px solid var(--gold-1)" : "1px solid rgba(255,200,100,0.4)",
              background: p === "pergamino" ? "#e7d094" : p === "grimdark" ? "#2a1810" : p === "royal" ? "#1e2756" : "#2a3e22",
              cursor: "pointer", padding: 0,
            }}/>
          ))}
        </div>

        <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
          <SideRail section={section} setSection={setSection}/>

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative" }}>
            {isMobile && <MobileTop section={section} setSection={setSection}/>}

            <main style={{ flex: 1, overflow: "auto", padding: "28px 36px", position: "relative", zIndex: 1 }}>
              <div style={{ maxWidth: 1280, margin: "0 auto", paddingBottom: 80 }}>
                {section === "board" && (
                  <BoardScreen
                    quests={quests}
                    npcs={npcs}
                    dialogs={dialogs}
                    regions={regions}
                    categories={categories}
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
                {section === "atlas" && (
                  <AtlasScreen
                    quests={quests}
                    regions={regions}
                    onSelect={(q) => { setSelectedQuest(q); setSection("board") }}
                  />
                )}
                {section === "trophy" && <TrophyScreen quests={quests}/>}
                {section === "journal" && (
                  <JournalScreen
                    dialogs={dialogs}
                    npcs={npcs}
                    quests={quests}
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
                  width: "min(620px, 90%)", zIndex: 50,
                  animation: "mis-slide-in 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
                }}>
                  <QuestLetter
                    quest={selectedQuest}
                    npcs={npcs}
                    dialogs={dialogs}
                    regions={regions}
                    onClose={() => setSelectedQuest(null)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
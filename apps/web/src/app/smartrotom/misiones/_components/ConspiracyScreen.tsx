"use client"

import React, { useMemo } from "react"
import { useTranslations } from "next-intl"
import { QuestData, QuestStatus, NPC, NPCCatalogResponse } from "@/types/misiones"
import { WaxSeal } from "../_ui/primitives/WaxSeal"
import { Thumbtack } from "../_ui/primitives/Thumbtack"
import { Icon } from "../_ui/icons"
import { MinecraftSkinAvatar } from "../_ui/minecraft/MinecraftAvatar"
import { STATUS_LABEL, STATUS_GLYPH, STATUS_COLOR } from "../_constants/questStatus"
import { Region, YarnColor } from "../_types/board"
import { getNpcForQuest } from "../_utils/questUtils"

const YARN_MAP: Record<string, string> = { carmesi: "#a8201a", cordel: "#b89a5e", tinta: "#243a6a" }

export interface ConspiracyScreenProps {
  quests: QuestData[]
  npcs: NPC[]
  regions: Region[]
  npcCatalog?: NPCCatalogResponse
  yarn: YarnColor
  onSelect: (q: QuestData) => void
}

interface ThreadEntry {
  quest: QuestData
  rel: "prev" | "self" | "next"
}

function buildThreads(quests: QuestData[]): { chains: ThreadEntry[][]; loose: QuestData[] } {
  // Identify quests that are children of another quest's nextQuest link
  const childIds = new Set<number>()
  quests.forEach((q) => {
    if (q.nextQuest && q.nextQuest !== 0) childIds.add(q.nextQuest)
  })

  // Roots: quests that start a chain (not a child AND have a valid nextQuest)
  const roots = quests.filter((q) => !childIds.has(q.id) && q.nextQuest && q.nextQuest !== 0)
  const seen = new Set<number>()

  const build = (start: QuestData): ThreadEntry[] => {
    const line: ThreadEntry[] = []
    let cur: QuestData | null = start
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id)
      line.push({ quest: cur, rel: line.length === 0 ? "self" : "next" })
      const nextId: number | null = cur.nextQuest && cur.nextQuest !== 0 ? cur.nextQuest : null
      cur = nextId ? quests.find((q) => q.id === nextId) || null : null
    }
    if (line.length > 0) line[0].rel = "self"
    return line
  }

  const chains = roots.map(build).filter((l) => l.length > 1)
  // Loose: standalone quests that are not part of any chain
  const loose = quests.filter((q) => !seen.has(q.id) && (!q.nextQuest || q.nextQuest === 0) && !childIds.has(q.id))
  return { chains, loose }
}

export function ConspiracyScreen({ quests, npcs, regions, npcCatalog, yarn, onSelect }: ConspiracyScreenProps) {
  const t = useTranslations("misiones")
  const yarnColor = YARN_MAP[yarn] || YARN_MAP.carmesi

  const threads = useMemo(() => buildThreads(quests), [quests])

  const NODE_W = 230
  const NODE_H = 132
  const GAP_X = 86
  const GAP_Y = 54
  const PAD = 48
  const hasChains = threads.chains.length > 0
  const maxLen = hasChains ? Math.max(1, ...threads.chains.map((c) => c.length)) : 1
  const boardW = PAD * 2 + maxLen * NODE_W + (maxLen - 1) * GAP_X
  const rowH = NODE_H + GAP_Y

  const cx = (col: number) => PAD + col * (NODE_W + GAP_X) + NODE_W / 2
  const cyTop = (row: number) => PAD + row * rowH
  const cy = (row: number) => cyTop(row) + NODE_H / 2

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 18, marginTop: 8 }}>
        <span className="label" style={{ color: "var(--gold-1)" }}>{t("trama_label")}</span>
        <h1 className="dec-title" style={{ fontSize: 38, color: "var(--paper-1)", margin: "4px 0 6px 0", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
          {t("trama_title")}
        </h1>
        <div style={{ color: "var(--paper-3)", fontSize: 14, fontStyle: "italic" }}>
          {t("trama_subtitle")}
        </div>
      </div>

      {/* Conspiracy thread board — only rendered when chains exist */}
      {hasChains && (
        <div style={{
          position: "relative", borderRadius: 4, overflowX: "auto", overflowY: "hidden",
          background: "radial-gradient(ellipse at 40% 10%, rgba(255,220,160,0.07), transparent 55%), linear-gradient(180deg, rgba(40,24,12,0.45), rgba(18,10,5,0.55))",
          border: "1px solid rgba(0,0,0,0.5)",
          boxShadow: "inset 0 1px 0 rgba(255,200,100,0.12), inset 0 0 90px rgba(0,0,0,0.55)",
        }}>
          <div style={{ position: "relative", width: boardW, height: PAD * 2 + threads.chains.length * rowH - GAP_Y + 10 }}>
            {/* Cork speck texture */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              backgroundImage: "radial-gradient(circle at 18% 24%, rgba(255,220,160,0.05) 0 1.5px, transparent 2px), radial-gradient(circle at 62% 70%, rgba(0,0,0,0.16) 0 1px, transparent 2px), radial-gradient(circle at 84% 30%, rgba(255,220,160,0.05) 0 1px, transparent 2px)",
              backgroundSize: "200px 200px",
            }}/>

            {/* Yarn SVG layer */}
            <svg width={boardW} height={PAD * 2 + threads.chains.length * rowH} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {threads.chains.map((line, row) =>
                line.slice(0, -1).map((_, col) => {
                  const x1 = cx(col) + NODE_W / 2 - 6
                  const y1 = cy(row)
                  const x2 = cx(col + 1) - NODE_W / 2 + 6
                  const y2 = cy(row)
                  const sag = 26
                  const d = `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${y1 + sag} ${x2} ${y2}`
                  return (
                    <g key={`${row}-${col}`}>
                      <path d={d} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="3.5" transform="translate(1.5,3)"/>
                      <path d={d} fill="none" stroke={yarnColor} strokeWidth="2.6" strokeLinecap="round"/>
                      <path d={d} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" strokeDasharray="2 5"/>
                    </g>
                  )
                })
              )}
            </svg>

            {/* Nodes */}
            {threads.chains.map((line, row) => (
              <React.Fragment key={`t${row}`}>
                <div style={{
                  position: "absolute", left: PAD, top: cyTop(row) - 26,
                  fontFamily: "var(--font-uppercase)", fontSize: 10, letterSpacing: "0.18em",
                  color: "var(--gold-1)", opacity: 0.8,
                }}>
                  ❦ {t("trama_thread")} {row + 1}
                </div>
                {line.map((entry, col) => (
                  <ThreadCard
                    key={`${entry.quest.id}-${col}`}
                    quest={entry.quest}
                    npc={getNpcForQuest(entry.quest, npcs)}
                    npcCatalog={npcCatalog}
                    onClick={() => entry.quest.status !== QuestStatus.LOCKED && onSelect(entry.quest)}
                    style={{ position: "absolute", left: cx(col) - NODE_W / 2, top: cyTop(row), width: NODE_W, height: NODE_H }}
                    yarn={yarnColor}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Standalone / loose quests */}
      {threads.loose.length > 0 && (
        <div style={{ marginTop: hasChains ? 26 : 0 }}>
          {hasChains && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, color: "var(--gold-1)" }}>
              <span className="dec-title" style={{ fontSize: 18 }}>{t("trama_loose")}</span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--gold-3), transparent)", opacity: 0.5 }}/>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 20 }}>
            {threads.loose.map((q) => (
              <ThreadCard key={q.id} quest={q} npc={getNpcForQuest(q, npcs)} npcCatalog={npcCatalog}
                onClick={() => q.status !== QuestStatus.LOCKED && onSelect(q)} yarn={yarnColor}
                style={{ height: NODE_H }}/>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasChains && threads.loose.length === 0 && (
        <div style={{
          padding: "60px 20px", textAlign: "center",
          color: "var(--paper-3)", fontFamily: "var(--font-display)",
          fontSize: 18, fontStyle: "italic",
        }}>
          ✥ No hay misiones en el tablón.
        </div>
      )}
    </div>
  )
}

interface ThreadCardProps {
  quest: QuestData
  npc: NPC | undefined
  npcCatalog?: NPCCatalogResponse
  onClick: () => void
  style?: React.CSSProperties
  yarn: string
}

function ThreadCard({ quest, npc, npcCatalog, onClick, style, yarn }: ThreadCardProps) {
  const locked = quest.status === QuestStatus.LOCKED
  const tiltSeed = ((quest.id * 53) % 100) / 100 * 2.6 - 1.3
  const catalogEntry = npcCatalog?.[String(quest.dialogId)]?.[0]

  return (
    <div onClick={onClick} className="thread-card" style={{
      ...style,
      transform: `rotate(${tiltSeed}deg)`,
      cursor: locked ? "default" : "pointer",
      padding: "14px 14px 10px 14px",
      background: "radial-gradient(ellipse at 50% 40%, var(--paper-1), var(--paper-2) 80%, var(--paper-3))",
      border: "1px solid rgba(60,40,20,0.3)",
      boxShadow: "inset 0 0 20px rgba(80,50,20,0.16), 0 4px 8px rgba(0,0,0,0.4), 0 12px 22px -8px rgba(0,0,0,0.5)",
      borderRadius: 2,
      display: "flex", flexDirection: "column",
      opacity: locked ? 0.74 : 1, filter: locked ? "grayscale(0.4)" : "none",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", zIndex: 4 }}>
        <Thumbtack size={18} color={yarn}/>
      </div>
      {locked && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: 3, color: "var(--ink-2)", opacity: 0.5 }}>
          <Icon.Lock size={28}/>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span className="label" style={{ color: STATUS_COLOR[quest.status] }}>{STATUS_LABEL[quest.status]}</span>
      </div>
      <h3 className="dec-title" style={{ fontSize: 15, margin: "0 0 6px 0", lineHeight: 1.15, color: "var(--ink-1)" }}>{quest.name}</h3>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ink-3)", fontStyle: "italic", minWidth: 0 }}>
          <MinecraftSkinAvatar skin={catalogEntry?.skin || npc?.skin} size={20}/>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{catalogEntry?.name || npc?.name || "—"}</span>
        </div>
        <WaxSeal glyph={STATUS_GLYPH[quest.status]} color={STATUS_COLOR[quest.status]} size={28} tilt={-12}/>
      </div>
    </div>
  )
}

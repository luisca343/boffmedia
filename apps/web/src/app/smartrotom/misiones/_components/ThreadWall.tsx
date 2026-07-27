"use client"

import type { CSSProperties } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { useBoard } from "../_hooks/useBoard"
import { buildChains, npcForQuest, tiltFor } from "../_utils/quests"
import { normalizeStatus, SEAL_TEXT, STATUS_LABEL_KEY, STATUS_PAPER_FILTER } from "../_utils/status"
import type { NPC, QuestData } from "../_types"
import { Icon, Label, NpcPortrait, Paper, Thumbtack, WaxSeal } from "./ui"

/** The tweakable yarn colour from the handoff is not a feature we ship — carmesí, always. */
const CARMESI = "#a8201a"

const NODE_W = 230
const NODE_H = 132
const GAP_X = 86
const GAP_Y = 54
const PAD = 48

function ThreadCard({
  quest,
  npc,
  onSelect,
  style,
}: {
  quest: QuestData
  npc: NPC | undefined
  onSelect: () => void
  style?: CSSProperties
}) {
  const t = useTranslations("misiones")
  const status = normalizeStatus(quest)
  const locked = status === "LOCKED"
  const level = quest.requirements?.requiredLevel

  return (
    <Paper
      tilt={tiltFor(quest.id)}
      role="button"
      tabIndex={locked ? -1 : 0}
      aria-disabled={locked}
      aria-label={quest.name}
      onClick={() => !locked && onSelect()}
      onKeyDown={(event) => {
        if (locked) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "flex flex-col overflow-hidden p-3.5 pt-4 outline-none",
        !locked && "ms-pinned cursor-pointer focus-visible:ring-2 focus-visible:ring-ms-gold-2",
        locked && "cursor-default",
        STATUS_PAPER_FILTER[status],
      )}
      style={style}
    >
      <div className="pointer-events-none absolute -top-2.5 left-1/2 z-10 -translate-x-1/2">
        <Thumbtack size={18} color={CARMESI} />
      </div>

      {locked && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[3] grid place-items-center text-ms-ink-2/50">
          <Icon.Lock size={28} />
        </div>
      )}

      <div className="mb-1 flex items-center justify-between gap-2">
        <Label className={SEAL_TEXT[status]}>{t(STATUS_LABEL_KEY[status])}</Label>
        {level ? <Label>{t("questChain.level", { level })}</Label> : null}
      </div>
      <h3 className="mb-1.5 font-ms-display text-[15px] leading-tight text-ms-ink-1">{quest.name}</h3>
      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 font-ms text-[11px] italic text-ms-ink-3">
          {npc && <NpcPortrait skin={npc.skin} size={20} />}
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{npc?.name ?? "—"}</span>
        </div>
        <WaxSeal status={status} size={28} tilt={-12} />
      </div>
    </Paper>
  )
}

/**
 * La Trama — the conspiracy wall. Chains are `buildChains(quests)`, which
 * walks each quest's real `nextQuest` link; the API has no `chain` field to
 * read directly (SMARTROTOM_V3.md: no mock data).
 */
export function ThreadWall() {
  const t = useTranslations("misiones.threadWall")
  const { quests, npcs, regions, open } = useBoard()
  const { chains, loose } = buildChains(quests)

  const rowH = NODE_H + GAP_Y
  const maxLen = Math.max(1, ...chains.map((line) => line.length))
  const boardW = PAD * 2 + maxLen * NODE_W + (maxLen - 1) * GAP_X
  const boardH = PAD * 2 + chains.length * rowH - GAP_Y + 10

  const cx = (col: number) => PAD + col * (NODE_W + GAP_X) + NODE_W / 2
  const cyTop = (row: number) => PAD + row * rowH
  const cy = (row: number) => cyTop(row) + NODE_H / 2

  return (
    <div>
      {chains.length > 0 && (
        <div className="ms-cork ms-scroll overflow-x-auto overflow-y-hidden">
          <div className="relative" style={{ width: boardW, height: boardH }}>
            <svg width={boardW} height={PAD * 2 + chains.length * rowH} className="pointer-events-none absolute inset-0" aria-hidden>
              {chains.map((line, row) =>
                line.slice(0, -1).map((_quest, col) => {
                  const x1 = cx(col) + NODE_W / 2 - 6
                  const y1 = cy(row)
                  const x2 = cx(col + 1) - NODE_W / 2 + 6
                  const y2 = cy(row)
                  const sag = 26
                  const d = `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${y1 + sag} ${x2} ${y2}`
                  return (
                    <g key={`${row}-${col}`}>
                      <path d={d} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="3.5" transform="translate(1.5,3)" />
                      <path d={d} fill="none" stroke={CARMESI} strokeWidth="2.6" strokeLinecap="round" />
                      <path d={d} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" strokeDasharray="2 5" />
                    </g>
                  )
                }),
              )}
            </svg>

            {chains.map((line, row) => (
              <div key={`thread-${row}`}>
                <div
                  className="absolute font-ms-uppercase text-[10px] uppercase tracking-[.18em] text-ms-gold-1/80"
                  style={{ left: PAD, top: cyTop(row) - 26 }}
                >
                  {t("thread", {
                    index: row + 1,
                    region: regions.find((r) => r.id === line[0].category)?.name ?? "",
                  })}
                </div>
                {line.map((quest, col) => (
                  <ThreadCard
                    key={`${quest.id}-${col}`}
                    quest={quest}
                    npc={npcForQuest(npcs, quest)}
                    onSelect={() => open(quest)}
                    style={{ position: "absolute", left: cx(col) - NODE_W / 2, top: cyTop(row), width: NODE_W, height: NODE_H }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {loose.length > 0 && (
        <div className="mt-6">
          <div className="mb-3.5 flex items-center gap-3 text-ms-gold-1">
            <span className="font-ms-display text-lg">{t("looseEnds")}</span>
            <div className="h-px flex-1 bg-gradient-to-r from-ms-gold-3 to-transparent opacity-50" />
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
            {loose.map((quest) => (
              <ThreadCard key={quest.id} quest={quest} npc={npcForQuest(npcs, quest)} onSelect={() => open(quest)} style={{ height: NODE_H }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

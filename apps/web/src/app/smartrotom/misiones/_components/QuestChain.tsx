"use client"

import type { ChainLink, QuestData } from "../_types"
import { chainFor } from "../_utils/quests"
import { normalizeStatus, SEAL_TEXT, STATUS_LABEL } from "../_utils/status"
import { Label, RopePath, WaxSeal } from "./ui"

const NODE_W = 200
const GAP = 60
const PAD_X = 30

function ChainNode({ link, onSelect }: { link: ChainLink; onSelect: (quest: QuestData) => void }) {
  const { quest, rel } = link
  const status = normalizeStatus(quest)
  const isCurrent = rel === "self"
  const level = quest.requirements?.requiredLevel

  return (
    <button
      type="button"
      disabled={isCurrent}
      onClick={() => onSelect(quest)}
      className="ms-torn relative w-[200px] shrink-0 border border-ms-ink-1/25 px-3 py-2.5 text-left shadow-[inset_0_0_18px_rgba(80,50,20,.18),0_4px_8px_rgba(0,0,0,.35),0_10px_18px_-6px_rgba(0,0,0,.4)] transition-transform hover:enabled:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ms-gold-2 disabled:cursor-default motion-reduce:transition-none"
      style={{
        background: "radial-gradient(ellipse at 50% 50%, rgb(var(--ms-paper-1)), rgb(var(--ms-paper-2)) 80%, rgb(var(--ms-paper-3)))",
        opacity: status === "LOCKED" ? 0.7 : 1,
      }}
    >
      <span className="absolute -right-2 -top-2">
        <WaxSeal status={status} size={24} tilt={-12} />
      </span>
      {isCurrent && (
        <span className="absolute -top-1.5 left-2 border border-ms-gold-4 bg-ms-gold-2 px-1.5 font-ms-uppercase text-[8px] uppercase tracking-[.16em] text-[#1e120a]">
          Aquí
        </span>
      )}
      <Label className={SEAL_TEXT[status]}>{STATUS_LABEL[status]}</Label>
      <div className="mt-0.5 font-ms-display text-[13px] leading-[1.15] text-ms-ink-1">{quest.name}</div>
      {level > 0 && (
        <div className="mt-1 font-ms-uppercase text-[10px] uppercase tracking-[.12em] text-ms-ink-3">Nv. {level}</div>
      )}
    </button>
  )
}

/**
 * The rope tying one encargo to the next. The chain is real: the game stores it
 * as `quest.nextQuest` forward and `requirements.requiredQuests` back.
 */
export function QuestChain({
  quest,
  quests,
  onSelect,
}: {
  quest: QuestData
  quests: QuestData[]
  onSelect: (quest: QuestData) => void
}) {
  const chain = chainFor(quest, quests)
  if (chain.length < 2) return null

  const width = chain.length * NODE_W + (chain.length - 1) * GAP + PAD_X * 2
  const y = 56

  return (
    <div className="ms-scroll w-full overflow-x-auto pb-2">
      <div className="relative min-h-[110px] pb-2.5 pt-4" style={{ width, paddingInline: PAD_X }}>
        <svg
          viewBox={`0 0 ${width} 120`}
          width={width}
          height={120}
          aria-hidden
          className="pointer-events-none absolute inset-0"
        >
          {chain.slice(0, -1).map((_, i) => {
            const x1 = PAD_X + NODE_W * (i + 1) - 12 + i * GAP
            const x2 = PAD_X + NODE_W * (i + 1) + GAP + 12 + i * GAP
            return <RopePath key={i} d={`M ${x1} ${y} Q ${(x1 + x2) / 2} ${y + 22} ${x2} ${y}`} thickness={5} color="#7a4e22" />
          })}
          {chain.map((_, i) => {
            const cx = PAD_X + NODE_W / 2 + i * (NODE_W + GAP)
            return (
              <g key={`knot-${i}`}>
                <circle cx={cx} cy={y} r="5" fill="#1a0e07" />
                <circle cx={cx} cy={y} r="4" fill="#6b4a28" />
                <circle cx={cx - 1.5} cy={y - 1.5} r="1" fill="#c8a26a" />
              </g>
            )
          })}
        </svg>

        <div className="relative flex items-center" style={{ gap: GAP }}>
          {chain.map((link) => (
            <ChainNode key={link.quest.id} link={link} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  )
}

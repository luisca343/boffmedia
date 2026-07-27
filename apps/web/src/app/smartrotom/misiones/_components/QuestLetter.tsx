"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useBoard } from "../_hooks/useBoard"
import type { NPC, QuestData } from "../_types"
import { objectiveSprite } from "../_utils/items"
import { dialogForQuest, npcForQuest } from "../_utils/quests"
import { normalizeStatus, SEAL_FILL, STATUS_LABEL_KEY } from "../_utils/status"
import { QuestChain } from "./QuestChain"
import { RewardCard } from "./RewardCard"
import {
  Bar,
  Button,
  Divider,
  FlourishCorners,
  Icon,
  InkBlot,
  Inkwell,
  ItemSprite,
  Nail,
  NpcPortrait,
  QuillPen,
  Ribbon,
  WaxSeal,
} from "./ui"

/**
 * The encargo, read as a signed letter on the innkeeper's desk. It slides in over
 * the board; the desk, the inkwell and the quill are the frame the parchment
 * floats on.
 */
export function QuestLetter({ quest, onOpenNpc }: { quest: QuestData; onOpenNpc: (npc: NPC) => void }) {
  const t = useTranslations("misiones")
  const tLetter = useTranslations("misiones.questLetter")
  const { quests, npcs, dialogs, open, track, isTracked } = useBoard()

  const status = normalizeStatus(quest)
  const npc = npcForQuest(npcs, quest)
  const dialog = dialogForQuest(dialogs, quest)
  const level = quest.requirements?.requiredLevel
  const objectives = quest.objectives ?? []
  const rewards = quest.rewards ?? []

  return (
    <div className="ms-desk relative flex h-full flex-col overflow-hidden">
      <Button variant="dark" sm onClick={() => open(null)} className="absolute right-3.5 top-3.5 z-[12]">
        <Icon.X size={13} /> {tLetter("close")}
      </Button>

      <div className="absolute left-[18px] top-3.5 z-[11] border border-[#3a2410] bg-gradient-to-b from-[#c2a04c] to-[#6b440f] px-3 py-1 font-ms-uppercase text-[10px] uppercase tracking-[.2em] text-[#1e120a] shadow-[0_2px_3px_rgba(0,0,0,.5)]">
        {tLetter("badge")}
      </div>

      {/* The desk itself: an inkwell, a quill laid down, a blot nobody cleaned. */}
      <div className="pointer-events-none absolute bottom-3.5 left-3 z-[11] hidden lg:block">
        <Inkwell size={58} />
      </div>
      <div className="pointer-events-none absolute bottom-3.5 right-20 z-[11] hidden translate-y-5 lg:block">
        <QuillPen size={140} tilt={28} />
      </div>
      <div className="pointer-events-none absolute right-3.5 top-[90px] z-[11] hidden lg:block">
        <InkBlot size={48} tilt={-22} color="#2a1810" />
      </div>

      {/* The parchment, floating over the desk. */}
      <div
        className="relative z-[5] m-6 flex-1 overflow-hidden rounded-[2px] shadow-[inset_0_0_80px_rgba(80,50,20,.18),inset_0_0_12px_rgba(80,50,20,.12),0_4px_8px_rgba(0,0,0,.4),0_16px_36px_rgba(0,0,0,.55),0_30px_50px_-10px_rgba(0,0,0,.6)] lg:mb-[86px] lg:ml-11 lg:mr-[60px] lg:mt-11"
        style={{
          background:
            "radial-gradient(ellipse at 20% 15%, rgba(120,70,30,.06), transparent 50%)," +
            "radial-gradient(ellipse at 50% 50%, rgb(var(--ms-paper-1)), rgb(var(--ms-paper-2)) 70%, rgb(var(--ms-paper-3)))",
          transform: "rotate(-0.4deg)",
        }}
      >
        <span className="absolute left-2 top-2 z-[6]">
          <Nail size={14} />
        </span>
        <span className="absolute right-2 top-2 z-[6]">
          <Nail size={14} />
        </span>
        <span className="absolute bottom-2 left-2 z-[6]">
          <Nail size={14} />
        </span>
        <span className="absolute bottom-2 right-2 z-[6]">
          <Nail size={14} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(80,50,20,.3),inset_0_0_12px_rgba(60,30,10,.2)]"
        />
        <FlourishCorners size={56} offset={14} className="text-ms-gold-3/60" />

        <div className="ms-scroll relative z-[1] h-full overflow-auto px-6 pb-8 pt-14 sm:px-12 lg:px-[60px] lg:pt-14">
          <div className="absolute left-[22px] top-[50px] z-[4] hidden sm:block">
            <div className="relative">
              <NpcPortrait skin={npc?.skin} size={72} ring />
              <span className="absolute -bottom-2.5 -right-2.5">
                <WaxSeal status={status} size={36} tilt={-15} />
              </span>
            </div>
          </div>

          <div className="-mt-8 mb-3.5 text-center sm:ml-20">
            <Ribbon color={SEAL_FILL[status]} width={280} height={50}>
              {t(STATUS_LABEL_KEY[status])}
            </Ribbon>
          </div>

          <h1 className="mb-1 mt-4 animate-ms-fade-up text-center font-ms-display text-3xl text-ms-ink-1 motion-reduce:animate-none sm:text-4xl">
            {quest.name}
          </h1>

          <Divider glyph="❦" />

          <div className="mb-[18px] flex flex-wrap items-center justify-center gap-4 text-[13px] italic text-ms-ink-3">
            {npc && (
              <span className="inline-flex items-center gap-1">
                <Icon.Quill size={11} /> {tLetter("from")}{" "}
                <button
                  type="button"
                  onClick={() => onOpenNpc(npc)}
                  title={tLetter("viewDossier", { name: npc.name })}
                  className="border-b border-dashed border-ms-ink-1/40 font-semibold not-italic text-ms-ink-2 hover:text-ms-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ms-gold-2"
                >
                  {npc.name}
                </button>
              </span>
            )}
            {quest.category && (
              <span className="inline-flex items-center gap-1">
                <Icon.Pin size={11} /> {quest.category}
              </span>
            )}
            {level > 0 && <span className="text-ms-gold-3">{tLetter("level", { level })}</span>}
            {quest.repeatable && <span className="text-ms-gold-3">{tLetter("repeatable")}</span>}
          </div>

          <div className="animate-ms-fade-up motion-reduce:animate-none [animation-delay:.1s]">
            <p className="ms-drop-cap m-0 px-2 text-justify font-ms text-base leading-[1.7] text-ms-ink-1 [hyphens:auto]">
              {quest.logText}
            </p>
          </div>

          {objectives.length > 0 && (
            <div className="mt-[26px] animate-ms-fade-up motion-reduce:animate-none [animation-delay:.18s]">
              <div className="mb-3 text-center">
                <span className="font-ms-display text-lg tracking-[.08em] text-ms-gold-3">{tLetter("objectives")}</span>
              </div>
              <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
                {objectives.map((objective, index) => {
                  const done = objective.progress >= objective.total
                  return (
                    <li
                      key={`${objective.name}-${index}`}
                      className={`relative flex items-center gap-3.5 rounded-sm border border-ms-ink-1/20 px-3.5 py-2.5 ${
                        done ? "bg-[rgba(150,100,40,.10)]" : "bg-[rgba(255,240,200,.35)]"
                      }`}
                    >
                      <div
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-[1.5px] border-ms-ink-2 font-ms-display text-[13px] font-bold ${
                          done ? "bg-ms-ink-2 text-ms-paper-1" : "text-ms-ink-2"
                        }`}
                      >
                        {done ? <Icon.Check size={14} /> : index + 1}
                      </div>
                      <ItemSprite name={objectiveSprite(objective)} size={24} glyph="" />
                      <div className="min-w-0 flex-1">
                        <div
                          className={`mb-1 text-sm ${
                            done ? "text-ms-ink-3 line-through decoration-ms-ink-2" : "font-medium text-ms-ink-1"
                          }`}
                        >
                          {objective.name}
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Bar value={objective.progress} max={objective.total} className="flex-1" />
                          <span className="min-w-[38px] text-right font-ms-mono text-[11px] text-ms-ink-2">
                            {objective.progress}/{objective.total}
                          </span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          {rewards.length > 0 && (
            <div className="mt-[26px] animate-ms-fade-up motion-reduce:animate-none [animation-delay:.26s]">
              <div className="mb-3 text-center">
                <span className="font-ms-display text-lg tracking-[.08em] text-ms-gold-3">{tLetter("rewards")}</span>
              </div>
              <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
                {rewards.map((reward) => (
                  <RewardCard key={reward.item} reward={reward} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-[30px] animate-ms-fade-up motion-reduce:animate-none [animation-delay:.3s]">
            <QuestChain
              quest={quest}
              quests={quests}
              onSelect={(next) => open(next)}
            />
          </div>

          {dialog?.text && (
            <div className="mt-[26px] animate-ms-fade-up motion-reduce:animate-none [animation-delay:.34s]">
              <Divider glyph="✦" />
              <div className="relative mt-2.5 border border-ms-ink-1/20 bg-[rgba(255,240,200,.3)] py-3 pl-[70px] pr-3.5">
                <div className="absolute left-2.5 top-2.5">
                  <NpcPortrait skin={npc?.skin} size={48} />
                </div>
                <div className="mb-1.5 font-ms-uppercase text-[11px] uppercase tracking-[.14em] text-ms-ink-3">
                  {tLetter("wordsOf", { name: npc?.name || t("letter.unknownNpc") })}
                  {dialog.name && ` · ${dialog.name}`}
                </div>
                <p className="m-0 border-l-2 border-ms-ink-3 pl-3 text-[15px] italic leading-relaxed text-ms-ink-1">
                  “{dialog.text}”
                </p>
              </div>
            </div>
          )}

          {/* The line the game prints when the encargo is closed. */}
          {status === "COMPLETED" && quest.completeText && (
            <p className="mt-6 text-center font-ms-display text-base italic text-ms-gold-3 animate-ms-fade-up motion-reduce:animate-none [animation-delay:.38s]">
              “{quest.completeText}”
            </p>
          )}

          <div className="mt-[30px] flex animate-ms-fade-up items-center justify-end gap-3.5 motion-reduce:animate-none [animation-delay:.42s]">
            <div className="text-right">
              <div className="mb-1 text-[13px] italic text-ms-ink-3">{tLetter("signedOff")}</div>
              <div className="font-ms-display text-[22px] text-ms-ink-1">{npc?.name || tLetter("anonymous")}</div>
            </div>
            <NpcPortrait skin={npc?.skin} size={44} />
          </div>
        </div>
      </div>

      {status === "ACTIVE" && (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center gap-2.5 bg-gradient-to-b from-transparent to-black/45 p-3">
          <Button variant={isTracked(quest) ? "default" : "primary"} onClick={() => track(quest)}>
            <Icon.Pin size={13} /> {isTracked(quest) ? tLetter("tracking") : tLetter("track")}
          </Button>
          <Link href="/smartrotom/misiones/mapa">
            <Button variant="dark">
              <Icon.Map size={13} /> {tLetter("goToMap")}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { GameStage } from "../_components/GameStage"
import { GameTopBar } from "../_components/GameTopBar"
import { Button, Icon, Modal, Panel, Skeleton, StatCard, Tag } from "../_components/ui"
import { PuzzleBoard } from "./_components/PuzzleBoard"
import { useSlidingPuzzle } from "./_hooks/useSlidingPuzzle"

export default function PuzlePage() {
  const t = useTranslations("arcade")
  const game = useSlidingPuzzle()
  const [help, setHelp] = useState(false)

  return (
    <div className="mt-4">
      <GameTopBar title={t("gameTopBar.titles.puzle")} accent="lime" onHelp={() => setHelp(true)} onReset={game.shuffle} />

      <GameStage accent="lime">
        <div className="mx-auto flex max-w-[35rem] flex-col gap-4">
          <Panel tone="deep" innerClassName="p-4 md:p-[1.125rem]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-white/10 px-1.5 pb-3.5">
              <span className="font-ar-display text-[0.6875rem] text-ar-lime">▸ {t("puzle.slidingPuzzle")}</span>
              <span className="font-ar-mono text-[0.6875rem] uppercase text-ar-ink-dim">3 × 3</span>
              {game.isComplete ? (
                <Tag tone="lime">{t("puzle.solved")}</Tag>
              ) : (
                <Tag tone="ghost">{t("puzle.inProgress")}</Tag>
              )}
            </div>

            {game.imageLoaded ? (
              <PuzzleBoard
                pieces={game.pieces}
                columns={game.columns}
                isComplete={game.isComplete}
                onMove={game.movePiece}
              />
            ) : (
              <Skeleton className="mx-auto h-[19.25rem] w-[19.25rem] rounded-[14px]" />
            )}

            {game.isComplete && (
              <div className="mt-4 animate-ar-pop rounded-xl border border-ar-lime/50 bg-ar-lime/[.12] p-4 text-center">
                <p className="m-0 inline-flex items-center gap-2 font-ar text-[0.9375rem] font-semibold text-ar-lime">
                  <Icon.Trophy s={18} />
                  {t("puzle.completed", { moves: game.moves })}
                </p>
              </div>
            )}
          </Panel>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              kicker={t("puzle.moves")}
              value={String(game.moves)}
              icon={<Icon.Joystick s={16} />}
              tone="lime"
            />
            <StatCard
              kicker={t("puzle.pieces")}
              value={`${game.pieces.filter((p) => p.id === p.position).length}/${game.pieces.length}`}
              sub={t("puzle.inPlace")}
              icon={<Icon.Grid s={16} />}
              tone="cyan"
            />
          </div>

          <Button
            variant="primary"
            size="md"
            full
            icon={<Icon.Reset s={14} />}
            onClick={game.shuffle}
            disabled={!game.imageLoaded}
          >
            {t("puzle.shuffle")}
          </Button>
        </div>
      </GameStage>

      <Modal open={help} onClose={() => setHelp(false)} kicker={t("games.puzle.title")} title={t("puzle.howToPlay")}>
        <ul className="m-0 list-disc space-y-2 pl-5">
          {t.raw("puzle.rules").map((rule: string) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}

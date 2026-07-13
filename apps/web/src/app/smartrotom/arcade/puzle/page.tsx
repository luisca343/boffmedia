"use client"

import { useState } from "react"
import { GameStage } from "../_components/GameStage"
import { GameTopBar } from "../_components/GameTopBar"
import { Button, Icon, Modal, Panel, Skeleton, StatCard, Tag } from "../_components/ui"
import { PuzzleBoard } from "./_components/PuzzleBoard"
import { useSlidingPuzzle } from "./_hooks/useSlidingPuzzle"

export default function PuzlePage() {
  const game = useSlidingPuzzle()
  const [help, setHelp] = useState(false)

  return (
    <div className="mt-4">
      <GameTopBar title="PUZLE" accent="lime" onHelp={() => setHelp(true)} onReset={game.shuffle} />

      <GameStage accent="lime">
        <div className="mx-auto flex max-w-[560px] flex-col gap-4">
          <Panel tone="deep" innerClassName="p-4 md:p-[18px]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-white/10 px-1.5 pb-3.5">
              <span className="font-ar-display text-[11px] text-ar-lime">▸ Puzle deslizante</span>
              <span className="font-ar-mono text-[11px] uppercase text-ar-ink-dim">3 × 3</span>
              {game.isComplete ? (
                <Tag tone="lime">Resuelto</Tag>
              ) : (
                <Tag tone="ghost">En curso</Tag>
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
              <Skeleton className="mx-auto h-[308px] w-[308px] rounded-[14px]" />
            )}

            {game.isComplete && (
              <div className="mt-4 animate-ar-pop rounded-xl border border-ar-lime/50 bg-ar-lime/[.12] p-4 text-center">
                <p className="m-0 inline-flex items-center gap-2 font-ar text-[15px] font-semibold text-ar-lime">
                  <Icon.Trophy s={18} />
                  ¡Puzle completado en {game.moves} movimientos!
                </p>
              </div>
            )}
          </Panel>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              kicker="Movimientos"
              value={String(game.moves)}
              icon={<Icon.Joystick s={16} />}
              tone="lime"
            />
            <StatCard
              kicker="Piezas"
              value={`${game.pieces.filter((p) => p.id === p.position).length}/${game.pieces.length}`}
              sub="En su sitio"
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
            Barajar
          </Button>
        </div>
      </GameStage>

      <Modal open={help} onClose={() => setHelp(false)} kicker="Puzle" title="¿Cómo jugar?">
        <ul className="m-0 list-disc space-y-2 pl-5">
          <li>Haz clic en una pieza contigua al hueco para deslizarla.</li>
          <li>Recompón la imagen original en los menos movimientos posibles.</li>
          <li>«Barajar» reparte un tablero nuevo, siempre resoluble.</li>
        </ul>
      </Modal>
    </div>
  )
}

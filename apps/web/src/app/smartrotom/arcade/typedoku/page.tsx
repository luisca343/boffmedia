"use client"

import { useState } from "react"
import { GameStage } from "../_components/GameStage"
import { GameTopBar } from "../_components/GameTopBar"
import { Button, Icon, Modal, Panel, Tag } from "../_components/ui"
import { SudokuGrid } from "./_components/SudokuGrid"
import { TypePad } from "./_components/TypePad"
import { useTypedoku } from "./_hooks/useTypedoku"

export default function TypedokuPage() {
  const game = useTypedoku()
  const [help, setHelp] = useState(false)

  return (
    <div className="mt-4">
      <GameTopBar
        title="TYPEDOKU"
        accent="cyan"
        onHelp={() => setHelp(true)}
        onReset={game.newGame}
      />

      <GameStage accent="cyan">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4">
          <Panel tone="deep" innerClassName="p-4 md:p-[18px]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-white/10 px-1.5 pb-3.5">
              <span className="font-ar-display text-[11px] text-ar-cyan">▸ Sudoku de tipos</span>
              <span className="font-ar-mono text-[11px] uppercase text-ar-ink-dim">
                Cada fila, columna y caja, sin repetir
              </span>
              <Tag tone={game.isNotesMode ? "magenta" : "ghost"}>
                Notas {game.isNotesMode ? "ON" : "OFF"}
              </Tag>
            </div>

            <SudokuGrid
              grid={game.grid}
              selectedCell={game.selectedCell}
              onCellClick={game.handleCellClick}
            />

            {game.isComplete && (
              <div className="mt-4 animate-ar-pop rounded-xl border border-ar-lime/50 bg-ar-lime/[.12] p-4 text-center">
                <p className="m-0 inline-flex items-center gap-2 font-ar text-[15px] font-semibold text-ar-lime">
                  <Icon.Trophy s={18} />
                  ¡Felicidades! Has completado el TypeDoku
                </p>
              </div>
            )}
          </Panel>

          <Panel tone="void" tight>
            <div className="mb-3 font-ar-display text-[9px] uppercase text-ar-magenta-2">Tipos</div>
            <TypePad onSelect={game.handleTypeSelect} isNotesMode={game.isNotesMode} />
          </Panel>

          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="cyan" size="sm" icon={<Icon.Reset s={12} />} onClick={game.newGame}>
              Nuevo juego (N)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon.Chevron s={12} dir="left" />}
              onClick={game.handleUndo}
              disabled={!game.canUndo}
            >
              Deshacer (Ctrl+Z)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconRight={<Icon.Chevron s={12} dir="right" />}
              onClick={game.handleRedo}
              disabled={!game.canRedo}
            >
              Rehacer (Ctrl+Y)
            </Button>
            <Button
              variant="amber"
              size="sm"
              icon={<Icon.Sparkle s={12} />}
              onClick={game.handleHint}
            >
              Pista (H)
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Icon.Info s={12} />}
              onClick={game.handleNoteHint}
            >
              Pista de notas (P)
            </Button>
            <Button
              variant={game.isNotesMode ? "primary" : "ghost"}
              size="sm"
              icon={<Icon.Grid s={12} />}
              onClick={game.toggleNotesMode}
            >
              Modo notas: {game.isNotesMode ? "ON" : "OFF"} (M)
            </Button>
          </div>
        </div>
      </GameStage>

      <Modal open={help} onClose={() => setHelp(false)} kicker="Typedoku" title="¿Cómo jugar?">
        <ul className="m-0 list-disc space-y-2 pl-5">
          <li>Rellena la cuadrícula sin repetir un tipo en la misma fila, columna o caja de 3×3.</li>
          <li>Selecciona una casilla y elige un tipo del panel, o pulsa su inicial en el teclado.</li>
          <li>Muévete por el tablero con las flechas.</li>
          <li>
            <b>M</b> alterna el modo notas, <b>P</b> anota los tipos posibles y <b>H</b> revela la
            casilla seleccionada.
          </li>
          <li>
            <b>N</b> empieza una partida nueva; <b>Ctrl+Z</b> y <b>Ctrl+Y</b> deshacen y rehacen.
          </li>
        </ul>
      </Modal>
    </div>
  )
}

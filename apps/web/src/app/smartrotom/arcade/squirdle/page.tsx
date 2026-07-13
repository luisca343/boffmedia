"use client"

import { useState } from "react"
import { GameStage } from "../_components/GameStage"
import { GameTopBar } from "../_components/GameTopBar"
import { Modal, Panel, Skeleton } from "../_components/ui"
import { AttemptList } from "./_components/AttemptList"
import { AttemptsPanel } from "./_components/AttemptsPanel"
import { GuessInput } from "./_components/GuessInput"
import { Legend } from "./_components/Legend"
import { ResultPanel } from "./_components/ResultPanel"
import { TypeTracker } from "./_components/TypeTracker"
import { useSquirdleGame } from "./_hooks/useSquirdleGame"
import { MAX_GUESSES } from "./_utils/compare"

export default function SquirdlePage() {
  const game = useSquirdleGame()
  const [help, setHelp] = useState(false)

  return (
    <div className="mt-4">
      <GameTopBar title="SQUIRDLE" accent="cyan" onHelp={() => setHelp(true)} onReset={game.reset} />

      {/* Unclipped: the guess autocomplete drops out of the panel, and the panel
          sits at the bottom of the stage — so both would otherwise cut it off. */}
      <GameStage accent="cyan" clip={false}>
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_260px] lg:gap-5">
          <Panel tone="deep" clip={false} innerClassName="p-4 md:p-[18px]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-white/10 px-1.5 pb-3.5">
              <span className="font-ar-display text-[11px] text-ar-cyan">▸ Enigma</span>
              <span className="font-ar-mono text-[11px] uppercase text-ar-ink-dim">
                Adivina la criatura oculta
              </span>
              <span className="font-ar-display text-[11px] text-ar-magenta-2">
                {MAX_GUESSES} intentos
              </span>
            </div>

            {game.loading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <AttemptList
                guesses={game.guesses}
                target={game.target}
                gameOver={game.gameOver}
                nameOf={game.nameOf}
              />
            )}

            <div className="mt-4 flex flex-col gap-3">
              <ResultPanel
                message={game.message}
                won={game.won}
                gameOver={game.gameOver}
                onReset={game.reset}
              />
              <GuessInput
                value={game.currentGuess}
                onChange={game.onGuessChange}
                onSubmit={game.submitGuess}
                suggestions={game.suggestions}
                onPick={game.pickSuggestion}
                nameOf={game.nameOf}
                attempt={game.guesses.length + 1}
                disabled={game.gameOver || game.loading}
              />
            </div>
          </Panel>

          <div className="flex flex-col gap-3">
            <AttemptsPanel used={game.guesses.length} remaining={game.remaining} />
            <TypeTracker
              types={game.allTypes}
              statuses={game.typeStatuses}
              isDoubleType={game.isDoubleType}
            />
            <Legend />
          </div>
        </div>
      </GameStage>

      <Modal open={help} onClose={() => setHelp(false)} kicker="Squirdle" title="¿Cómo jugar?">
        <ul className="m-0 list-disc space-y-2 pl-5">
          <li>Adivina cuál es el Pokémon misterioso en menos de {MAX_GUESSES} intentos.</li>
          <li>Con cada intento, recibirás pistas sobre las características del Pokémon.</li>
          <li>Una casilla verde indica que la característica es correcta.</li>
          <li>▲ indica que el valor objetivo es mayor.</li>
          <li>▼ indica que el valor objetivo es menor.</li>
          <li>Una casilla ámbar en un tipo indica que ese tipo está en la otra posición.</li>
        </ul>
      </Modal>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { GameStage } from "../_components/GameStage"
import { GameTopBar } from "../_components/GameTopBar"
import { Button, Icon, Modal, Panel, Tag } from "../_components/ui"
import { SudokuGrid } from "./_components/SudokuGrid"
import { TypePad } from "./_components/TypePad"
import { useTypedoku } from "./_hooks/useTypedoku"

export default function TypedokuPage() {
  const t = useTranslations("arcade")
  const game = useTypedoku()
  const [help, setHelp] = useState(false)

  return (
    <div className="mt-4">
      <GameTopBar
        title={t("gameTopBar.titles.typedoku")}
        accent="cyan"
        onHelp={() => setHelp(true)}
        onReset={game.newGame}
      />

      <GameStage accent="cyan">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4">
          <Panel tone="deep" innerClassName="p-4 md:p-[18px]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-white/10 px-1.5 pb-3.5">
              <span className="font-ar-display text-[11px] text-ar-cyan">▸ {t("typedoku.sudokuOfTypes")}</span>
              <span className="font-ar-mono text-[11px] uppercase text-ar-ink-dim">
                {t("typedoku.eachRowColumn")}
              </span>
              <Tag tone={game.isNotesMode ? "magenta" : "ghost"}>
                {t("typedoku.notes", { state: game.isNotesMode ? "ON" : "OFF" })}
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
                  {t("typedoku.congratulations")}
                </p>
              </div>
            )}
          </Panel>

          <Panel tone="void" tight>
            <div className="mb-3 font-ar-display text-[9px] uppercase text-ar-magenta-2">{t("typedoku.types")}</div>
            <TypePad onSelect={game.handleTypeSelect} isNotesMode={game.isNotesMode} />
          </Panel>

          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="cyan" size="sm" icon={<Icon.Reset s={12} />} onClick={game.newGame}>
              {t("typedoku.newGame")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon.Chevron s={12} dir="left" />}
              onClick={game.handleUndo}
              disabled={!game.canUndo}
            >
              {t("typedoku.undo")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconRight={<Icon.Chevron s={12} dir="right" />}
              onClick={game.handleRedo}
              disabled={!game.canRedo}
            >
              {t("typedoku.redo")}
            </Button>
            <Button
              variant="amber"
              size="sm"
              icon={<Icon.Sparkle s={12} />}
              onClick={game.handleHint}
            >
              {t("typedoku.hint")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Icon.Info s={12} />}
              onClick={game.handleNoteHint}
            >
              {t("typedoku.noteHint")}
            </Button>
            <Button
              variant={game.isNotesMode ? "primary" : "ghost"}
              size="sm"
              icon={<Icon.Grid s={12} />}
              onClick={game.toggleNotesMode}
            >
              {t("typedoku.notesMode", { state: game.isNotesMode ? "ON" : "OFF" })}
            </Button>
          </div>
        </div>
      </GameStage>

      <Modal open={help} onClose={() => setHelp(false)} kicker={t("games.typedoku.title")} title={t("typedoku.howToPlay")}>
        <ul className="m-0 list-disc space-y-2 pl-5">
          <li>{t("typedoku.rules.fillGrid")}</li>
          <li>{t("typedoku.rules.selectTile")}</li>
          <li>{t("typedoku.rules.moveArrows")}</li>
          <li>
            {t.rich("typedoku.rules.toggleNotes", {
              boldM: (c) => <b>{c}</b>,
              boldP: (c) => <b>{c}</b>,
              boldH: (c) => <b>{c}</b>,
            })}
          </li>
          <li>
            {t.rich("typedoku.rules.newGame", {
              boldN: (c) => <b>{c}</b>,
              boldCtrlZ: (c) => <b>{c}</b>,
              boldCtrlY: (c) => <b>{c}</b>,
            })}
          </li>
        </ul>
      </Modal>
    </div>
  )
}

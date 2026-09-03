"use client"

import * as React from "react"
import { Button, ConfirmDialog, StatChip, ToolHeader, toast, useFullscreen } from "@boffmedia/ui"
import { useSorteos } from "./useSorteos"
import { useSorteosShortcuts } from "./useSorteosShortcuts"
import { SorteosStage } from "./SorteosStage"
import { SorteosRoster } from "./SorteosRoster"
import { SorteosSettings } from "./SorteosSettings"
import { SorteosHistory } from "./SorteosHistory"
import { type SrtDrawHandle } from "@boffmedia/ui/giveaways"
import { useToolT, SORTEOS_NS } from "../i18n"

export function SorteosView() {
  const t = useToolT(SORTEOS_NS)
  const s = useSorteos()
  const {
    entrants,
    history,
    weighted,
    exclude,
    winnerCount,
    sound,
    drawMode,
    phase,
    draw,
    pool,
    maxWinners,
    effCount,
    totalWeight,
    wonNames,
    setWeighted,
    setExclude,
    setWinnerCount,
    setSound,
    setDrawMode,
    addOne,
    addBulk,
    rename,
    setWeight,
    removeOne,
    shuffle,
    clearAll,
    resetHistory,
    runDraw,
    onLand,
    drawAgain,
    removeDrawn,
  } = s

  const { ref: stageRef, isFullscreen, enter: enterFullscreen, exit: exitFullscreen, toggle: toggleFullscreen } = useFullscreen()
  const drawRef = React.useRef<SrtDrawHandle | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const [clearConfirm, setClearConfirm] = React.useState(false)
  const [historyConfirm, setHistoryConfirm] = React.useState(false)

  const handleClearAll = () => {
    clearAll()
    setClearConfirm(false)
  }

  const handleResetHistory = () => {
    resetHistory()
    setHistoryConfirm(false)
  }

  const handleRemoveDrawn = () => {
    const count = removeDrawn()
    if (count > 0) {
      toast({ msg: t("toastRemoved", { n: count }), tone: "ok", icon: "check" })
    }
  }

  // Register keyboard shortcuts
  useSorteosShortcuts({
    enabled: true,
    phase,
    canDraw: pool.length > 0,
    onDraw: runDraw,
    onSkip: () => drawRef.current?.skip(),
    onAgain: drawAgain,
    isFullscreen,
    onExitFullscreen: exitFullscreen,
  })

  return (
    <main className="pb-[0.625rem]">
      <ToolHeader
        title={
          <>
            {t("titlePre")} <em>{t("titleEm")}</em>
          </>
        }
        sub={t("sub")}
        meta={
          <>
            <StatChip icon="users" value={entrants.length} label={t("participants")} />
            <StatChip icon="trophy" value={history.length} label={t("rounds")} />
          </>
        }
        actions={
          <>
            {entrants.length > 0 && (
              <Button variant="ghost" size="sm" icon="fullscreen" onClick={toggleFullscreen}>
                {isFullscreen ? t("presentationExit") : t("presentation")}
              </Button>
            )}
            {(entrants.length > 0 || history.length > 0) && (
              <Button variant="ghost" size="sm" icon="trash" onClick={() => setClearConfirm(true)}>
                {t("clear")}
              </Button>
            )}
          </>
        }
      />

      {/* Stage — full width */}
      <SorteosStage
        ref={stageRef}
        phase={phase}
        draw={draw}
        entrants={entrants}
        pool={pool}
        weighted={weighted}
        exclude={exclude}
        effCount={effCount}
        wonNames={wonNames}
        sound={sound}
        isFullscreen={isFullscreen}
        roundNumber={history.length}
        drawRef={drawRef}
        drawMode={drawMode}
        onDrawModeChange={setDrawMode}
        onFocusAdd={() => inputRef.current?.focus()}
        onRunDraw={runDraw}
        onSoundChange={setSound}
        onLand={onLand}
        onDrawAgain={drawAgain}
        onRemoveDrawn={handleRemoveDrawn}
        onTogglePresentation={toggleFullscreen}
      />

      {/* Grid: Roster + Settings */}
      <div className="grid gap-[1.125rem] min-[961px]:grid-cols-[minmax(0,1fr)_22.5rem] mt-[1.125rem]">
        <SorteosRoster
          entrants={entrants}
          weighted={weighted}
          wonNames={wonNames}
          totalWeight={totalWeight}
          inputFocusRef={inputRef}
          onRename={rename}
          onWeight={setWeight}
          onRemove={removeOne}
          onAddOne={addOne}
          onAddBulk={addBulk}
          onShuffle={shuffle}
        />
        <SorteosSettings
          winners={effCount}
          maxWinners={maxWinners}
          weighted={weighted}
          exclude={exclude}
          sound={sound}
          onWinnersChange={setWinnerCount}
          onWeightedChange={setWeighted}
          onExcludeChange={setExclude}
          onSoundChange={setSound}
        />
      </div>

      {/* History */}
      <SorteosHistory history={history} onClearHistory={() => setHistoryConfirm(true)} />

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={clearConfirm}
        onClose={() => setClearConfirm(false)}
        title={t("confirmClearTitle")}
        body={t("confirmClearBody", { n: entrants.length, r: history.length })}
        confirmLabel={t("confirmClearOk")}
        cancelLabel={t("cancel")}
        tone="error"
        onConfirm={handleClearAll}
      />
      <ConfirmDialog
        open={historyConfirm}
        onClose={() => setHistoryConfirm(false)}
        title={t("confirmHistoryTitle")}
        body={t("confirmHistoryBody", { r: history.length })}
        confirmLabel={t("confirmHistoryOk")}
        cancelLabel={t("cancel")}
        tone="warning"
        onConfirm={handleResetHistory}
      />
    </main>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button, Icon, Panel, Tag } from "../../_components/ui"
import { GameTopBar } from "../../_components/GameTopBar"
import GameGrid from "./GameGrid"
import Scoreboard from "./Scoreboard"
import Messages from "./Messages"
import MemoPanel from "./MemoPanel"
import ScorePopup from "./ScorePopup"
import { Cell, RowColInfo } from "../types"
import { LEVEL_CONFIGS } from "../config"
import ConfirmationDialog from "./ConfirmationDialog"
import { RulesModal } from "./RulesModal"

const GRID_SIZE = 5

export default function VoltorbFlipGame() {
  const t = useTranslations("arcade")
  const router = useRouter()
  const [grid, setGrid] = useState<Cell[][]>([])
  const [rowInfo, setRowInfo] = useState<RowColInfo[]>([])
  const [colInfo, setColInfo] = useState<RowColInfo[]>([])
  const [level, setLevel] = useState(1)
  const [roundScore, setRoundScore] = useState(0)
  const [totalCoins, setTotalCoins] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [memoMode, setMemoMode] = useState(false)
  const [selectedMark, setSelectedMark] = useState(0)
  const [consecutiveLevelWins, setConsecutiveLevelWins] = useState(0)
  const [flippedMultipliers, setFlippedMultipliers] = useState(0)
  const [lastScoreIncrease, setLastScoreIncrease] = useState(0)
  const [showConfirmQuit, setShowConfirmQuit] = useState(false)
  const [showConfirmNew, setShowConfirmNew] = useState(false)
  const [showLevelComplete, setShowLevelComplete] = useState(false)
  const [showCoinLossAnimation, setShowCoinLossAnimation] = useState(false)
  const [lostCoins, setLostCoins] = useState(0)
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [showConfirmStop, setShowConfirmStop] = useState(false)

  useEffect(() => {
    initializeGame()
  }, [level])

  function initializeGame() {
    const levelIndex = Math.max(level - 1, 0)
    const levelConfigs = LEVEL_CONFIGS[levelIndex]
    const config = levelConfigs[Math.floor(Math.random() * levelConfigs.length)]
    const newGrid: Cell[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({
            value: 1,
            revealed: false,
            marks: [],
          }))
      )

    let voltorbsPlaced = 0
    let x2sPlaced = 0
    let x3sPlaced = 0

    while (
      voltorbsPlaced < config.voltorbs ||
      x2sPlaced < config.x2s ||
      x3sPlaced < config.x3s
    ) {
      const row = Math.floor(Math.random() * GRID_SIZE)
      const col = Math.floor(Math.random() * GRID_SIZE)
      if (newGrid[row][col].value === 1) {
        if (voltorbsPlaced < config.voltorbs) {
          newGrid[row][col].value = 0
          voltorbsPlaced++
        } else if (x2sPlaced < config.x2s) {
          newGrid[row][col].value = 2
          x2sPlaced++
        } else if (x3sPlaced < config.x3s) {
          newGrid[row][col].value = 3
          x3sPlaced++
        }
      }
    }

    setGrid(newGrid)
    setRoundScore(0)
    setGameOver(false)
    setGameWon(false)
    setFlippedMultipliers(0)
    setShowLevelComplete(false)
    setShowCoinLossAnimation(false)
    setLostCoins(0)
    setConsecutiveLevelWins(0)
    updateRowColInfo(newGrid)
  }

  function updateRowColInfo(grid: Cell[][]) {
    const newRowInfo: RowColInfo[] = []
    const newColInfo: RowColInfo[] = []

    for (let i = 0; i < GRID_SIZE; i++) {
      let rowCoins = 0
      let rowVoltorbs = 0
      let colCoins = 0
      let colVoltorbs = 0

      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j].value === 0) rowVoltorbs++
        else rowCoins += grid[i][j].value

        if (grid[j][i].value === 0) colVoltorbs++
        else colCoins += grid[j][i].value
      }

      newRowInfo.push({ coins: rowCoins, voltorbs: rowVoltorbs })
      newColInfo.push({ coins: colCoins, voltorbs: colVoltorbs })
    }

    setRowInfo(newRowInfo)
    setColInfo(newColInfo)
  }

  function handleCellClick(row: number, col: number) {
    if (gameOver || gameWon) return

    const newGrid = [...grid]
    const cell = newGrid[row][col]

    if (memoMode) {
      if (!cell.marks.includes(selectedMark)) {
        cell.marks.push(selectedMark)
      } else {
        cell.marks = cell.marks.filter((mark) => mark !== selectedMark)
      }
      setGrid(newGrid)
      return
    }

    if (cell.revealed) return

    cell.revealed = true
    setGrid(newGrid)

    if (cell.value === 0) {
      handleGameOver(newGrid)
    } else {
      const newRoundScore = roundScore === 0 ? cell.value : roundScore * cell.value
      const scoreIncrease = newRoundScore - roundScore
      setLastScoreIncrease(scoreIncrease)
      setRoundScore(newRoundScore)
      setTotalCoins((prev) => prev + scoreIncrease)
      setFlippedMultipliers((prev) => prev + 1)
      checkWinCondition(newGrid)
    }
  }

  function handleGameOver(grid: Cell[][]) {
    revealAllCells(grid)
    setGameOver(true)
    setConsecutiveLevelWins(0)
    setLostCoins(roundScore + totalCoins)
    setShowCoinLossAnimation(true)
    setRoundScore(0)
    setTotalCoins(0)
  }

  function revealAllCells(grid: Cell[][]) {
    const revealedGrid = grid.map((row) => row.map((cell) => ({ ...cell, revealed: true })))
    setGrid(revealedGrid)
  }

  function checkWinCondition(grid: Cell[][]) {
    const allMultipliersRevealed = grid.every((row) =>
      row.every((cell) => cell.revealed || cell.value === 0 || cell.value === 1)
    )

    if (allMultipliersRevealed) {
      revealAllCells(grid)
      setGameWon(true)
      setShowLevelComplete(true)
      setConsecutiveLevelWins((prev) => prev + 1)
    }
  }

  function handleQuit() {
    if (gameOver) {
      router.push("/smartrotom/arcade")
    } else {
      setShowConfirmQuit(true)
    }
  }

  function handleConfirmQuit() {
    router.push("/smartrotom/arcade")
  }

  function handleNewGame() {
    if (gameOver) {
      resetGame()
    } else {
      setShowConfirmNew(true)
    }
  }

  function handleStopOrRestart() {
    if (gameOver) {
      const level = calculateLevelRegression()
      setLevel(level)
      setTotalCoins(0)
      initializeGame()
    } else if (gameWon) {
      handleNextLevel()
    } else {
      setShowConfirmStop(true)
    }
  }

  function handleConfirmNewGame() {
    resetGame()
  }

  function handleCancelNewGame() {
    setShowConfirmNew(false)
  }

  function resetGame() {
    setTotalCoins(0)
    const newLevel = Math.min(level, flippedMultipliers)
    setLevel(newLevel)
    setShowConfirmNew(false)
    setConsecutiveLevelWins(0)
    initializeGame()
  }

  function handleNextLevel() {
    if (consecutiveLevelWins === 4 && flippedMultipliers >= 8) {
      setLevel(8)
    } else if (level < 7) {
      setLevel((prev) => prev + 1)
    }
    setConsecutiveLevelWins(0)
    initializeGame()
  }

  function handleToggleMemoMode() {
    setMemoMode(!memoMode)
  }

  function handleKeepCoins() {
    setShowConfirmQuit(true)
    setShowLevelComplete(false)
  }

  function handleConfirmStop() {
    const newTotalCoins = totalCoins + roundScore
    setTotalCoins(newTotalCoins)
    setLevel(calculateLevelRegression())
    setShowConfirmStop(false)
    initializeGame()
  }

  function calculateLevelRegression() {
    const regressedLevel = Math.min(level, flippedMultipliers)
    const nextLevel = Math.max(regressedLevel, 1)
    return nextLevel
  }

  function handleCancelStop() {
    setShowConfirmStop(false)
  }

  // The primary control changes job with the run: bank what you have, take the
  // next board, or start over after a Voltorb.
  const action = gameOver
    ? { label: t("voltorb.playAgain"), variant: "cyan" as const, icon: <Icon.Reset s={14} /> }
    : gameWon
      ? { label: t("voltorb.nextLevel"), variant: "cyan" as const, icon: <Icon.Chevron s={14} /> }
      : { label: t("voltorb.cashOut"), variant: "amber" as const, icon: <Icon.Coin s={16} /> }

  const bombs = colInfo.reduce((sum, info) => sum + info.voltorbs, 0)
  const difficulty = "▲".repeat(Math.min(Math.ceil(level / 2), 4))

  return (
    <>
      <GameTopBar
        title={t("gameTopBar.titles.voltorb")}
        accent="magenta"
        onHelp={() => setShowRulesModal(true)}
        onReset={handleNewGame}
        actions={
          // The coins banked THIS session — game state, not an account balance.
          // The arcade has no currency endpoint (deferred/arcade.md).
          <span
            aria-label={t("voltorb.coinsAria", { count: totalCoins })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ar-amber/35 bg-black/45 px-2.5 py-1.5 font-ar-mono text-[0.75rem] font-bold tabular-nums text-ar-amber"
          >
            <Icon.Coin s={14} />
            {totalCoins}
          </span>
        }
      />

      <div className="ar-scanlines relative bg-[radial-gradient(80%_60%_at_50%_0%,rgb(var(--ar-magenta)/.18),rgb(var(--ar-void))_60%)] p-3.5 md:p-6">
        <div aria-hidden className="ar-horizon opacity-40" />

        <div className="relative z-[2] grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_16.25rem] lg:gap-5">
          <Panel tone="deep" innerClassName="p-3 md:p-[1.125rem]">
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-dashed border-white/10 px-1.5 pb-3.5 pt-1">
              <span className="font-ar-display text-[0.625rem] text-ar-magenta-2">
                ▸ {t("voltorb.cardsKicker", { count: flippedMultipliers })}
              </span>
              <span className="hidden font-ar-mono text-[0.6875rem] text-ar-ink-dim md:inline">
                5×5 · {t("voltorb.difficulty", { level: difficulty })}
              </span>
              <span className="font-ar-display text-[0.625rem] text-ar-cyan">{t("voltorb.bombs", { count: bombs })}</span>
            </div>

            <GameGrid
              grid={grid}
              rowInfo={rowInfo}
              colInfo={colInfo}
              onCellClick={handleCellClick}
              level={level}
              roundScore={roundScore}
            />

            <div className="mt-[1.125rem] flex flex-wrap justify-center gap-2">
              <Tag tone="cyan">{t("voltorb.cardsFlipped", { count: flippedMultipliers })}</Tag>
              <Tag tone="amber">{t("voltorb.combo", { score: roundScore })}</Tag>
              <Tag tone="magenta">⚡ {t("voltorb.bombCount", { count: bombs })}</Tag>
            </div>
          </Panel>

          <div className="flex min-w-0 flex-col gap-3">
            <Scoreboard roundScore={roundScore} totalCoins={totalCoins} level={level} />

            <MemoPanel
              memoMode={memoMode}
              selectedMark={selectedMark}
              onToggleMemoMode={handleToggleMemoMode}
              onSelectMark={setSelectedMark}
            />

            <Button
              variant={action.variant}
              size="md"
              full
              icon={action.icon}
              onClick={handleStopOrRestart}
            >
              {action.label}
            </Button>
            <Button
              variant="outline"
              size="sm"
              full
              icon={<Icon.Info s={12} />}
              onClick={() => setShowRulesModal(true)}
            >
              {t("voltorb.viewRules")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              full
              icon={<Icon.X s={12} />}
              onClick={handleQuit}
            >
              {t("voltorb.quitGame")}
            </Button>
          </div>
        </div>

        <div className="relative z-[2] mt-4 flex min-h-[6.25rem] items-center justify-center">
          <Messages
            gameOver={gameOver}
            gameWon={gameWon}
            showLevelComplete={showLevelComplete}
            onNextLevel={handleNextLevel}
            onQuit={handleKeepCoins}
            lostCoins={lostCoins}
          />
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showConfirmQuit}
        onClose={() => setShowConfirmQuit(false)}
        onConfirm={handleConfirmQuit}
        titleKey="voltorb.quitConfirm"
        descriptionKey="voltorb.quitDescription"
        descriptionValues={{ count: totalCoins + roundScore }}
        confirmKey="voltorb.quit"
        cancelKey="voltorb.keep"
        variant="quit"
      />

      <ConfirmationDialog
        isOpen={showConfirmNew}
        onClose={handleCancelNewGame}
        onConfirm={handleConfirmNewGame}
        titleKey="voltorb.newGameConfirm"
        descriptionKey="voltorb.newGameDescription"
        confirmKey="voltorb.new"
        cancelKey="voltorb.keep"
        variant="new"
      />

      <ConfirmationDialog
        isOpen={showConfirmStop}
        onClose={handleCancelStop}
        onConfirm={handleConfirmStop}
        titleKey="voltorb.cashOutConfirm"
        descriptionKey="voltorb.cashOutDescription"
        descriptionValues={{ count: roundScore }}
        confirmKey="voltorb.cashOut"
        cancelKey="voltorb.keep"
        variant="new"
      />

      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />

      <ScorePopup scoreIncrease={lastScoreIncrease} />
    </>
  )
}

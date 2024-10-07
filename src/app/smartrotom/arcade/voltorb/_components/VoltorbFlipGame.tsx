"use client";

import { useState, useEffect } from "react";
import { Coins, RefreshCw, X, Info, HandCoins, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import GameGrid from "./GameGrid";
import Scoreboard from "./Scoreboard";
import Messages from "./Messages";
import MemoPanel from "./MemoPanel";
import ScorePopup from "./ScorePopup";
import { Cell, RowColInfo } from "./types";
import { LEVEL_CONFIGS } from "./config";
import ConfirmationDialog from "./ConfirmationDialog";
import { RainbowText } from "../../_components/RainbowText";
import { RulesModal } from "./RulesModal";
import VoltorbImage from "./VoltorbIcon";

const GRID_SIZE = 5;

export default function VoltorbFlipGame() {
  const router = useRouter();
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [rowInfo, setRowInfo] = useState<RowColInfo[]>([]);
  const [colInfo, setColInfo] = useState<RowColInfo[]>([]);
  const [level, setLevel] = useState(1);
  const [roundScore, setRoundScore] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [memoMode, setMemoMode] = useState(false);
  const [selectedMark, setSelectedMark] = useState(0);
  const [consecutiveLevelWins, setConsecutiveLevelWins] = useState(0);
  const [flippedMultipliers, setFlippedMultipliers] = useState(0);
  const [lastScoreIncrease, setLastScoreIncrease] = useState(0);
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showCoinLossAnimation, setShowCoinLossAnimation] = useState(false);
  const [lostCoins, setLostCoins] = useState(0);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showConfirmStop, setShowConfirmStop] = useState(false);

  useEffect(() => {
    initializeGame();
  }, [level]);

  function initializeGame() {
    const levelIndex = Math.max(level - 1, 0);
    const levelConfigs = LEVEL_CONFIGS[levelIndex];
    const config =
      levelConfigs[Math.floor(Math.random() * levelConfigs.length)];
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
      );

    let voltorbsPlaced = 0;
    let x2sPlaced = 0;
    let x3sPlaced = 0;

    while (
      voltorbsPlaced < config.voltorbs ||
      x2sPlaced < config.x2s ||
      x3sPlaced < config.x3s
    ) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (newGrid[row][col].value === 1) {
        if (voltorbsPlaced < config.voltorbs) {
          newGrid[row][col].value = 0;
          voltorbsPlaced++;
        } else if (x2sPlaced < config.x2s) {
          newGrid[row][col].value = 2;
          x2sPlaced++;
        } else if (x3sPlaced < config.x3s) {
          newGrid[row][col].value = 3;
          x3sPlaced++;
        }
      }
    }

    setGrid(newGrid);
    setRoundScore(0);
    setGameOver(false);
    setGameWon(false);
    setFlippedMultipliers(0);
    setShowLevelComplete(false);
    setShowCoinLossAnimation(false);
    setLostCoins(0);
    setConsecutiveLevelWins(0);
    updateRowColInfo(newGrid);
  }

  function updateRowColInfo(grid: Cell[][]) {
    const newRowInfo: RowColInfo[] = [];
    const newColInfo: RowColInfo[] = [];

    for (let i = 0; i < GRID_SIZE; i++) {
      let rowCoins = 0;
      let rowVoltorbs = 0;
      let colCoins = 0;
      let colVoltorbs = 0;

      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j].value === 0) rowVoltorbs++;
        else rowCoins += grid[i][j].value;

        if (grid[j][i].value === 0) colVoltorbs++;
        else colCoins += grid[j][i].value;
      }

      newRowInfo.push({ coins: rowCoins, voltorbs: rowVoltorbs });
      newColInfo.push({ coins: colCoins, voltorbs: colVoltorbs });
    }

    setRowInfo(newRowInfo);
    setColInfo(newColInfo);
  }

  function handleCellClick(row: number, col: number) {
    if (gameOver || gameWon) return;

    const newGrid = [...grid];
    const cell = newGrid[row][col];

    if (memoMode) {
      if (!cell.marks.includes(selectedMark)) {
        cell.marks.push(selectedMark);
      } else {
        cell.marks = cell.marks.filter((mark) => mark !== selectedMark);
      }
      setGrid(newGrid);
      return;
    }

    if (cell.revealed) return;

    cell.revealed = true;
    setGrid(newGrid);

    if (cell.value === 0) {
      handleGameOver(newGrid);
    } else {
      const newRoundScore =
        roundScore === 0 ? cell.value : roundScore * cell.value;
      const scoreIncrease = newRoundScore - roundScore;
      setLastScoreIncrease(scoreIncrease);
      setRoundScore(newRoundScore);
      setTotalCoins((prev) => prev + scoreIncrease);
      setFlippedMultipliers((prev) => prev + 1);
      checkWinCondition(newGrid);
    }
  }

  function handleGameOver(grid: Cell[][]) {
    revealAllCells(grid);
    setGameOver(true);
    setConsecutiveLevelWins(0);
    setLostCoins(roundScore + totalCoins);
    setShowCoinLossAnimation(true);
    setRoundScore(0);
    setTotalCoins(0);
  }

  function revealAllCells(grid: Cell[][]) {
    const revealedGrid = grid.map((row) =>
      row.map((cell) => ({ ...cell, revealed: true }))
    );
    setGrid(revealedGrid);
  }

  function checkWinCondition(grid: Cell[][]) {
    const allMultipliersRevealed = grid.every((row) =>
      row.every((cell) => cell.revealed || cell.value === 0 || cell.value === 1)
    );

    if (allMultipliersRevealed) {
      revealAllCells(grid);
      setGameWon(true);
      setShowLevelComplete(true);
      setConsecutiveLevelWins((prev) => prev + 1);
    }
  }

  function handleQuit() {
    if (gameOver) {
      router.push("/arcade");
    } else {
      setShowConfirmQuit(true);
    }
  }

  function handleConfirmQuit() {
    alert(`Has obtenido ${totalCoins} monedas en total.`);
    router.push("/arcade");
  }

  function handleCancelQuit() {
    setShowConfirmQuit(false);
  }

  function handleNewGame() {
    if (gameOver) {
      resetGame();
    } else {
      setShowConfirmNew(true);
    }
  }

  function handleStopOrRestart() {
    if (gameOver) {
      // Restart the game from level 1
      setLevel(1);
      setTotalCoins(0);
      initializeGame();
    } else if (gameWon) {
      handleNextLevel();
    } else {
      setShowConfirmStop(true);
    }
  }

  function handleConfirmNewGame() {
    alert(`Has obtenido ${totalCoins} monedas en total.`);
    resetGame();
  }

  function handleCancelNewGame() {
    setShowConfirmNew(false);
  }

  function resetGame() {
    setTotalCoins(0);
    // Implement level regression here
    const newLevel = Math.min(level, flippedMultipliers);
    setLevel(newLevel);
    setShowConfirmNew(false);
    setConsecutiveLevelWins(0);
    initializeGame();
  }

  function handleNextLevel() {
    if (consecutiveLevelWins === 4 && flippedMultipliers >= 8) {
      setLevel(8);
    } else if (level < 7) {
      setLevel((prev) => prev + 1);
    }
    setConsecutiveLevelWins(0);
    initializeGame();
  }

  function handleToggleMemoMode() {
    setMemoMode(!memoMode);
  }

  function handleKeepCoins() {
    setShowConfirmQuit(true);
    setShowLevelComplete(false);
  }
  function handleConfirmStop() {
    const newTotalCoins = totalCoins + roundScore;
    setTotalCoins(newTotalCoins);
    setLevel(calculateLevelRegression());
    setShowConfirmStop(false);
    initializeGame();
  }

  function calculateLevelRegression() {
    console.log("== LEVEL REGRESSION ==");
    console.log("Level:", level);
    console.log("Flipped Multipliers:", flippedMultipliers);
    const regressedLevel = Math.min(level, flippedMultipliers);
    console.log("Regressed Level:", regressedLevel);
    const nextLevel = Math.max(regressedLevel, 1);
    console.log("Next Level:", nextLevel);
    return nextLevel;
  }

  function handleCancelStop() {
    setShowConfirmStop(false);
  }

  function getActionButtonText() {
    if (gameOver) {
      return (
        <>
          <RefreshCw className="w-5 h-5" />
          <span>Reiniciar</span>
        </>
      );
    } else if (gameWon) {
      return (
        <>
          <ArrowRight className="w-5 h-5" /> {/* Changed icon */}
          <span>Continuar</span>
        </>
      );
    } else {
      return (
        <>
          <HandCoins className="w-5 h-5" />
          <span>Parar</span>
        </>
      );
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="flex flex-col w-fit mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-stretch justify-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Left Side Container */}
          <div className="flex flex-col space-y-4 w-full lg:w-64">
            <div className="flex-grow flex flex-col justify-between space-y-4">
              {/* Scoreboard Container */}
              <div className="flex-shrink-0  bg-gray-800 bg-opacity-80 border-4 border-yellow-500 rounded-lg pt-2 p-4">
                <RainbowText text="Puntuación" size="md" />
                <Scoreboard
                  roundScore={roundScore}
                  totalCoins={totalCoins}
                  level={level}
                />
              </div>

              {/* Memo Panel Container */}
              <div className="flex-shrink-0 flex flex-col justify-center items-center  bg-gray-800 bg-opacity-80 border-4 border-yellow-500 rounded-lg pt-2 p-4">
                <RainbowText text="Notas" size="md" />
                <MemoPanel
                  memoMode={memoMode}
                  selectedMark={selectedMark}
                  onToggleMemoMode={handleToggleMemoMode}
                  onSelectMark={setSelectedMark}
                />
              </div>

              {/* Buttons Container */}
              <div className="mt-auto  bg-gray-800 bg-opacity-80 border-4 border-yellow-500 rounded-lg pt-2 p-4">
                <RainbowText text="Botones" size="md" />
                <div className="flex flex-col space-y-2">
                  <button
                    className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded flex items-center justify-center space-x-2"
                    onClick={handleStopOrRestart}
                  >
                    {getActionButtonText()}
                  </button>

                  <button
                    className="bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-4 rounded flex items-center justify-center space-x-2"
                    onClick={handleQuit}
                  >
                    <X className="w-5 h-5" />
                    <span>Salir</span>
                  </button>

                  <button
                    className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded flex items-center justify-center space-x-2"
                    onClick={() => setShowRulesModal(true)}
                  >
                    <Info className="w-5 h-5" />
                    <span>Info</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Game Grid Container */}
          <div className="bg-gray-800 bg-opacity-80 border-4 border-yellow-500 rounded-lg p-6">
            <GameGrid
              grid={grid}
              rowInfo={rowInfo}
              colInfo={colInfo}
              onCellClick={handleCellClick}
            />
          </div>
        </div>

        {/* Messages Container */}
        {(gameOver || gameWon || showLevelComplete) && (
          <div className="bg-gray-800 bg-opacity-80 border-4 border-yellow-500 rounded-lg p-4 mt-4 w-full">
            <Messages
              gameOver={gameOver}
              gameWon={gameWon}
              showLevelComplete={showLevelComplete}
              onNextLevel={handleNextLevel}
              onQuit={handleKeepCoins}
              lostCoins={lostCoins}
            />
          </div>
        )}
      </div>
      <AnimatePresence>
        {showCoinLossAnimation && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: 50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-500 text-4xl font-bold flex items-center justify-center"
          >
            <VoltorbImage size="xl" className="mr-2" />
            <span className="ml-2">-{lostCoins}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationDialog
        isOpen={showConfirmQuit}
        onClose={() => setShowConfirmQuit(false)}
        onConfirm={handleConfirmQuit}
        title="¿Estás seguro que quieres salir?"
        description={`Te llevarás ${totalCoins} monedas en total.`}
        confirmText="Sí, salir"
        cancelText="No, seguir jugando"
        variant="quit"
      />

      <ConfirmationDialog
        isOpen={showConfirmNew}
        onClose={() => setShowConfirmNew(false)}
        onConfirm={handleConfirmNewGame}
        title="¿Estás seguro que quieres empezar un nuevo juego?"
        description="Perderás tu progreso actual y volverás al nivel 1."
        confirmText="Sí, nuevo juego"
        cancelText="No, seguir jugando"
        variant="new"
      />

      <ConfirmationDialog
        isOpen={showConfirmStop}
        onClose={handleCancelStop}
        onConfirm={handleConfirmStop}
        title="¿Estás seguro que quieres parar?"
        description={`Ganarás ${roundScore} monedas y comenzarás una nueva ronda en el nivel ${calculateLevelRegression()}.`}
        confirmText="Sí, parar"
        cancelText="No, seguir jugando"
        variant="new"
      />

      <RulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      <ScorePopup scoreIncrease={lastScoreIncrease} />
    </div>
  );
}

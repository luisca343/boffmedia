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
      router.push("/smartrotom/arcade");
    } else {
      setShowConfirmQuit(true);
    }
  }

  function handleConfirmQuit() {
    alert(`Has obtenido ${totalCoins} monedas en total.`);
    router.push("/smartrotom/arcade");
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
      //setLevel(1);
      const level = calculateLevelRegression();
      setLevel(level);
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
    const regressedLevel = Math.min(level, flippedMultipliers);
    const nextLevel = Math.max(regressedLevel, 1);
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {/* Main game grid - takes most space */}
        <div className="col-span-5 bg-indigo-900/30 rounded-lg p-2 border border-indigo-700/40">
          <GameGrid 
            grid={grid} 
            rowInfo={rowInfo} 
            colInfo={colInfo} 
            onCellClick={handleCellClick} 
          />
        </div>
        
        {/* Side panel with controls and info */}
        <div className="md:col-span-2 flex flex-col gap-2">
          {/* Score display */}
          <div className="bg-indigo-900/30 rounded-lg p-2 border border-indigo-700/40">
            <Scoreboard 
              roundScore={roundScore} 
              totalCoins={totalCoins} 
              level={level} 
            />
          </div>
          
          {/* Memo controls */}
          <div className="bg-indigo-900/30 rounded-lg p-2 border border-indigo-700/40">
            <MemoPanel 
              memoMode={memoMode} 
              selectedMark={selectedMark} 
              onToggleMemoMode={handleToggleMemoMode} 
              onSelectMark={setSelectedMark} 
            />
          </div>
          
          {/* Action buttons */}
          <div className="bg-indigo-900/30 rounded-lg p-2 border border-indigo-700/40">
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleStopOrRestart}
                className={`w-full py-1.5 rounded-md flex items-center justify-center text-sm font-medium ${
                  gameOver || gameWon 
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white' 
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                }`}
              >
                {gameOver ? 'Volver a jugar' : gameWon ? 'Siguiente nivel' : 'Cobrar monedas'}
              </button>
              
              <button
                onClick={() => setShowRulesModal(true)}
                className="w-full py-1.5 rounded-md bg-purple-800 hover:bg-purple-700 text-white flex items-center justify-center text-sm font-medium"
              >
                <Info className="w-3 h-3 mr-1" /> Ver reglas
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Game status messages - positioned statically but with enough space */}
      <div className="mt-3 min-h-[100px] flex items-center justify-center">
        <Messages
          gameOver={gameOver}
          gameWon={gameWon}
          showLevelComplete={showLevelComplete}
          onNextLevel={handleNextLevel}
          onQuit={handleKeepCoins}
          lostCoins={lostCoins}
        />
      </div>
      
      {/* Make dialogs and modals more compact */}
      <ConfirmationDialog
        isOpen={showConfirmQuit}
        onClose={() => setShowConfirmQuit(false)}
        onConfirm={handleConfirmQuit}
        title="¿Salir del juego?"
        description={`Te llevarás ${totalCoins} monedas.`}
        confirmText="Salir"
        cancelText="Seguir"
        variant="quit"
      />
  
      <ConfirmationDialog
        isOpen={showConfirmNew}
        onClose={handleCancelNewGame}
        onConfirm={handleConfirmNewGame}
        title="¿Nuevo juego?"
        description="Perderás tu progreso actual."
        confirmText="Nuevo"
        cancelText="Seguir"
        variant="new"
      />
  
      <ConfirmationDialog
        isOpen={showConfirmStop}
        onClose={handleCancelStop}
        onConfirm={handleConfirmStop}
        title="¿Cobrar monedas?"
        description={`Ganarás ${roundScore} monedas.`}
        confirmText="Cobrar"
        cancelText="Seguir"
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
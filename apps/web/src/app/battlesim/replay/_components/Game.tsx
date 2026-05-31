"use client"
import { useEffect, useRef, useState } from "react";
import { env } from "@/config/env.public";
import { ReplayControls } from "./ReplayControls";
import { ASPECT_RATIO } from "../../_utils/viewUtils";
import { PokemonIdent, Protocol } from "@pkmn/protocol";
import { useGameState } from "../../_hooks/useGameState";
import useViewportWidth from "@/services/useViewPortWidth";
import { useBattleFlow } from "../../_hooks/useBattleFlow";
import { BattleCanvas } from "../../_components/BattleCanvas";
import { moveAction, } from "../../_utils/battleActions";
import { ReplayData } from "../../types";
import { sanitizeHtml } from "../../_utils/sanitizeHtml";
import { countActions } from "../../_utils/replayUtils";
import { ReplayErrorBoundary } from "./ReplayErrorBoundary";
import BattlePreview from "../../_components/BattlePreview";

// Replay Loader component for when no replay data is provided
function ReplayLoader({ onReplayLoad }: { onReplayLoad: (data: ReplayData) => void }) {
  const [replayText, setReplayText] = useState("");
  const [error, setError] = useState("");

  const handleLoadReplay = () => {
    try {
      if (!replayText.trim()) {
        throw new Error("Please paste a valid replay text");
      }

      const text = replayText.trim();

      // Basic validation: check for required PS replay protocol lines
      const hasPlayer = text.includes('|player|');
      const hasTurn = text.includes('|turn|') || text.includes('|start|');
      
      if (!hasPlayer || !hasTurn) {
        throw new Error("Invalid replay format. Expected Pokémon Showdown replay text with |player| and |turn| lines.");
      }

      const mockReplayData: ReplayData = {
        side1: "Player 1",
        side2: "Player 2",
        team1: "",
        team2: "",
        replay: text,
        winner: 0,
        createdAt: new Date().toISOString()
      };

      onReplayLoad(mockReplayData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-surface-800 rounded-lg max-w-3xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4 text-surface-50">Load Pokémon Showdown Replay</h2>
      
      <div className="w-full mb-4">
        <textarea
          value={replayText}
          onChange={(e) => setReplayText(e.target.value)}
          placeholder="Paste the entire replay text here"
          className="w-full h-64 p-3 border rounded bg-surface-700 text-surface-50 border-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
        />
      </div>
      
      {error && (
        <div className="w-full mb-4 p-2 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-100">
          {error}
        </div>
      )}
      
      <button
        onClick={handleLoadReplay}
        className="w-full p-2 bg-primary-600 text-white rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        Load Replay
      </button>
      
      <p className="mt-4 text-sm text-surface-300">
        Copy and paste the complete replay text from Pokémon Showdown
      </p>
    </div>
  );
}

export function Game({battleName = 'medalla_doku', replayData}: {battleName?: string, replayData?: ReplayData}) {
  // State to hold loaded replay data
  const [loadedReplayData, setLoadedReplayData] = useState<ReplayData | undefined>(replayData);
  // State to track if battle has been started, regardless of current play state
  const [battleStarted, setBattleStarted] = useState<boolean>(false);
  
  const { battle, setBattle, battleLog, currentAction, scene, htmlLog, isPlaying, messageBar,
    turnInput, newTurn, settingTurn, lastTurn, simulatedAttack, logVisible, pov, setBattleLog,
    setCurrentAction, setScene, setHtmlLog: setLog, setIsPlaying, setMessageBar, setTurnInput,
    setNewTurn, setSettingTurn, setLastTurn, setSimulatedAttack, setLogVisible, setPov, setCurrentTurn, initScene} = useGameState(loadedReplayData);
  
  const battleFlow = useBattleFlow(
    battle, setBattle, battleLog, currentAction, scene, isPlaying, newTurn, lastTurn,
    settingTurn, pov, setCurrentAction, setLog, setIsPlaying, setMessageBar, setSettingTurn);
  
  // Refs
  const battleCanvasRef = useRef<any>(null);
  const logRef = useRef<HTMLDivElement>(null);
  
  // Canvas width
  const [, canvasWidth] = useViewportWidth();
  
  // Should show the preview overlay - only if battle is turn 0, not playing, and hasn't been started yet
  const showPreviewOverlay = battle.turn === 0 && !isPlaying && !battleStarted;
  
  // Track when the user first presses play
  useEffect(() => {
    if (isPlaying && !battleStarted) {
      setBattleStarted(true);
    }
  }, [isPlaying, battleStarted]);
  
  // Scroll log to bottom when updated
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [htmlLog]);

  async function simulateAttack() {
    // Mark battle as started when simulating attack
    setBattleStarted(true);
    await moveAction(battle, scene, 'p1a' as PokemonIdent, simulatedAttack, 'p2a' as PokemonIdent);
  }  

  if(!loadedReplayData) {
    return <ReplayLoader onReplayLoad={setLoadedReplayData} />;
  }
  
  return (
    <ReplayErrorBoundary>
    <div className="flex">
    <div className="flex flex-col relative">
      {/* Battle Canvas is always rendered */}
      <BattleCanvas 
        battle={battle} 
        pov={pov} 
        messageBar={messageBar} 
        ref={battleCanvasRef} 
        showPreviewOverlay={showPreviewOverlay}
        setBattleStarted={setBattleStarted}
        setIsPlaying={setIsPlaying}
        currentAction={currentAction}
        battleLog={battleLog}
        showFullInfo={false}
        initScene={initScene}
      />

      <ReplayControls 
        battle={battle}
        isPlaying={isPlaying}
        setIsPlaying={(playing) => {
          // Mark battle as started if playing
          if (playing) {
            setBattleStarted(true);
          }
          setIsPlaying(playing);
        }}
        setCurrentTurn={(turn) => {
          const battleStarted = turn! > 0;
          setBattleStarted(battleStarted);
          setCurrentTurn(turn);
        }}
        pov={pov}
        setPov={setPov}
        simulateAttack={simulateAttack}
        simulatedAttack={simulatedAttack}
        setSimulatedAttack={setSimulatedAttack}
        turnInput={turnInput}
        setTurnInput={setTurnInput}
        lastTurn={lastTurn}
        logVisible={logVisible}
        setLogVisible={setLogVisible}
        countActions={countActions}
        setCurrentAction={setCurrentAction}
      />
    </div>
    <div className="flex flex-col">
      {logVisible && (
          <div 
            className="w-[400px] bg-surface-800 p-2 overflow-y-auto text-surface-50 h-full" 
            ref={logRef} 
            style={{height:`${canvasWidth * ASPECT_RATIO}px`}}
          >
            {htmlLog.map((line, index) => (
              <div key={index} dangerouslySetInnerHTML={{ __html: sanitizeHtml(line) }} />
            ))}
          </div>
        )}
      <div className="bg-surface-800 flex-1" />
      </div>
    </div>
    {env.NODE_ENV === 'development' && (
      <div className="mt-4">
        <h3 className="text-lg font-bold mb-2">Debug Information</h3>
        <div className="bg-surface-800 p-4 rounded">
          <div>Current Action: {currentAction}</div>
          <div>Current Turn: {battle.turn}</div>
          <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
          <div>Setting Turn: {settingTurn ? 'Yes' : 'No'}</div>
          <div>Battle Started: {battleStarted ? 'Yes' : 'No'}</div>
          <div>Show Preview: {showPreviewOverlay ? 'Yes' : 'No'}</div>
        </div>
      </div>
    )}
    </ReplayErrorBoundary>
  );
}

export default Game;
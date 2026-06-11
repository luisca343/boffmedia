"use client"
import { useEffect, useRef, useState, useMemo } from "react";
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
import { countActions } from "../../_utils/replayUtils";
import { ReplayErrorBoundary } from "./ReplayErrorBoundary";
import { BSXTick } from '@/components/boffmedia/primitives';
import { toBSXTicks } from "../../_utils/toBSXMon";

const VISIBLE_TICK_LIMIT = 200;

function ReplayLoader({ onReplayLoad }: { onReplayLoad: (data: ReplayData) => void }) {
  const [replayText, setReplayText] = useState("");
  const [error, setError] = useState("");

  const handleLoadReplay = () => {
    try {
      if (!replayText.trim()) throw new Error("Please paste a valid replay text");
      const text = replayText.trim();
      const hasPlayer = text.includes('|player|');
      const hasTurn = text.includes('|turn|') || text.includes('|start|');
      if (!hasPlayer || !hasTurn) throw new Error("Invalid replay format. Expected Pokémon Showdown replay text with |player| and |turn| lines.");
      onReplayLoad({
        side1: "Player 1", side2: "Player 2", team1: "", team2: "",
        replay: text, winner: 0, createdAt: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-lg max-w-3xl mx-auto mt-10"
      style={{ background: 'var(--surface-2)' }}>
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>Load Pokémon Showdown Replay</h2>
      <div className="w-full mb-4">
        <textarea
          value={replayText}
          onChange={(e) => setReplayText(e.target.value)}
          placeholder="Paste the entire replay text here"
          className="w-full h-64 p-3 rounded font-mono text-sm"
          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
        />
      </div>
      {error && (
        <div className="w-full mb-4 p-2 rounded" style={{ background: 'color-mix(in srgb, var(--rose-500) 20%, transparent)', border: '1px solid color-mix(in srgb, var(--rose-500) 50%, transparent)', color: 'var(--rose-300)' }}>
          {error}
        </div>
      )}
      <button
        onClick={handleLoadReplay}
        className="w-full p-2 rounded font-medium"
        style={{ background: 'var(--accent)', color: 'var(--text)', border: '1px solid var(--border)' }}
      >
        Load Replay
      </button>
      <p className="mt-4 text-sm" style={{ color: 'var(--text-dim)' }}>
        Copy and paste the complete replay text from Pokémon Showdown
      </p>
    </div>
  );
}

export function Game({battleName = 'medalla_doku', replayData}: {battleName?: string, replayData?: ReplayData}) {
  const [loadedReplayData, setLoadedReplayData] = useState<ReplayData | undefined>(replayData);
  const [battleStarted, setBattleStarted] = useState<boolean>(false);
  const [showAllLogs, setShowAllLogs] = useState<boolean>(false);

  const { battle, setBattle, battleLog, currentAction, scene, htmlLog, isPlaying, messageBar,
    turnInput, newTurn, settingTurn, lastTurn, simulatedAttack, logVisible, pov, setBattleLog,
    setCurrentAction, setScene, setHtmlLog: setLog, setIsPlaying, setMessageBar, setTurnInput,
    setNewTurn, setSettingTurn, setLastTurn, setSimulatedAttack, setLogVisible, setPov, setCurrentTurn, initScene,
    battleComplete, setBattleComplete} = useGameState(loadedReplayData);

  const battleFlow = useBattleFlow(
    battle, setBattle, battleLog, currentAction, scene, isPlaying, newTurn, lastTurn,
    settingTurn, pov, setCurrentAction, setLog, setIsPlaying, setMessageBar, setSettingTurn, setBattleComplete);

  const battleCanvasRef = useRef<any>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const [, canvasWidth] = useViewportWidth();

  const showPreviewOverlay = battle.turn === 0 && !isPlaying && !battleStarted;

  useEffect(() => {
    if (isPlaying && !battleStarted) setBattleStarted(true);
  }, [isPlaying, battleStarted]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [htmlLog]);

  async function simulateAttack() {
    setBattleStarted(true);
    await moveAction(battle, scene, 'p1a' as PokemonIdent, simulatedAttack, 'p2a' as PokemonIdent);
  }

  const bsxTicks = useMemo(() => toBSXTicks(htmlLog), [htmlLog]);

  if(!loadedReplayData) {
    return <ReplayLoader onReplayLoad={setLoadedReplayData} />;
  }

  return (
    <ReplayErrorBoundary>
    <div className="flex gap-4 p-4" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Left: Canvas + Controls */}
      <div className="flex flex-col gap-3 shrink-0">
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
          battleComplete={battleComplete}
        />

        <ReplayControls
          battle={battle}
          isPlaying={isPlaying}
          setIsPlaying={(playing) => {
            if (playing) setBattleStarted(true);
            else setBattleComplete(false);
            setIsPlaying(playing);
          }}
          setCurrentTurn={(turn) => {
            setBattleStarted(turn! > 0);
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

      {/* Right: Tick Log */}
      <div className="flex-1 min-w-0">
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div
            className="overflow-y-auto"
            ref={logRef}
            style={{ maxHeight: `${canvasWidth * ASPECT_RATIO * 0.5}px`, background: 'var(--surface)' }}
          >
            {!logVisible && (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-dim)' }}>
                Log hidden — toggle with the eye button
              </p>
            )}
            {logVisible && bsxTicks.length > VISIBLE_TICK_LIMIT && !showAllLogs && (
              <button
                onClick={() => setShowAllLogs(true)}
                className="w-full p-1 mb-1 text-xs font-mono"
                style={{ color: 'var(--text-muted)', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}
              >
                Show all {bsxTicks.length} events (showing last {VISIBLE_TICK_LIMIT})
              </button>
            )}
            {logVisible && (showAllLogs ? bsxTicks : bsxTicks.slice(-VISIBLE_TICK_LIMIT)).map((ev, i) => (
              <BSXTick key={i} ev={ev as any} />
            ))}
          </div>
        </div>
      </div>
    </div>

    {env.NODE_ENV === 'development' && (
      <div className="mt-4 px-4 pb-4" style={{ color: 'var(--text-dim)' }}>
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Debug Information</h3>
        <div className="p-4 rounded space-y-1 text-sm" style={{ background: 'var(--surface-2)' }}>
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

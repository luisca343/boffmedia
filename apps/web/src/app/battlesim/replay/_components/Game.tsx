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
import { toBSXTicks } from "../../_utils/toBSXMon";
import { BattleLogPanel, REPLAY_TICK_LIMIT } from "../../_components/BattleLogPanel";
import { setReplaySpeed } from "../../_utils/replaySpeed";
import { useTranslations } from "next-intl";
import { AchievementService } from "@/services/api/smartrotom/achievementsService";
import type { TimelineMarker } from "./ReplayControls";

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
  const t = useTranslations('battlesim');
  const [loadedReplayData, setLoadedReplayData] = useState<ReplayData | undefined>(replayData);
  const [battleStarted, setBattleStarted] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [savedReplayId, setSavedReplayId] = useState<number | null>(null);
  const [savingReplay, setSavingReplay] = useState(false);

  // Manual save for pasted replays (server-loaded ones are already persisted).
  const canSaveReplay = !!loadedReplayData && !replayData && !savedReplayId;
  const handleSaveReplay = async () => {
    if (!loadedReplayData || savingReplay) return;
    setSavingReplay(true);
    try {
      const winnerMatch = loadedReplayData.replay.match(/\|win\|(.+)/);
      const res = await AchievementService.createReplay({
        side1: loadedReplayData.side1 || 'Player 1',
        side2: loadedReplayData.side2 || 'Player 2',
        team1: typeof loadedReplayData.team1 === 'string' ? loadedReplayData.team1 : '',
        team2: typeof loadedReplayData.team2 === 'string' ? loadedReplayData.team2 : '',
        replay: loadedReplayData.replay,
        winner: winnerMatch?.[1]?.trim() || 'unknown',
      });
      if (res.data?.replayId) setSavedReplayId(res.data.replayId);
    } finally {
      setSavingReplay(false);
    }
  };

  useEffect(() => {
    setReplaySpeed(speed);
    return () => setReplaySpeed(1);
  }, [speed]);

  const { battle, setBattle, battleLog, currentAction, scene, htmlLog, isPlaying, messageBar,
    turnInput, newTurn, settingTurn, lastTurn, simulatedAttack, logVisible, pov, setBattleLog,
    setCurrentAction, setScene, setHtmlLog: setLog, setIsPlaying, setMessageBar, setTurnInput,
    setNewTurn, setSettingTurn, setLastTurn, setSimulatedAttack, setLogVisible, setPov, setCurrentTurn, initScene,
    battleComplete, setBattleComplete} = useGameState(loadedReplayData);

  const battleFlow = useBattleFlow(
    battle, setBattle, battleLog, currentAction, scene, isPlaying, newTurn, lastTurn,
    settingTurn, pov, setCurrentAction, setLog, setIsPlaying, setMessageBar, setSettingTurn, setBattleComplete);

  const battleCanvasRef = useRef<any>(null);

  const [, canvasWidth] = useViewportWidth();

  const showPreviewOverlay = battle.turn === 0 && !isPlaying && !battleStarted;

  useEffect(() => {
    if (isPlaying && !battleStarted) setBattleStarted(true);
  }, [isPlaying, battleStarted]);

  async function simulateAttack() {
    setBattleStarted(true);
    await moveAction(battle, scene, 'p1a' as PokemonIdent, simulatedAttack, 'p2a' as PokemonIdent);
  }

  const bsxTicks = useMemo(() => toBSXTicks(htmlLog), [htmlLog]);

  // Timeline markers: one per turn for KOs and switches.
  const markers = useMemo<TimelineMarker[]>(() => {
    const out: TimelineMarker[] = [];
    let turn = 0;
    const seenSwitch = new Set<number>();
    for (const ev of bsxTicks) {
      if (ev.turn != null) { turn = ev.turn; continue; }
      if (ev.kind === 'ko') out.push({ turn, kind: 'ko' });
      else if (ev.kind === 'switch' && !seenSwitch.has(turn)) {
        seenSwitch.add(turn);
        out.push({ turn, kind: 'switch' });
      }
    }
    return out;
  }, [bsxTicks]);

  if(!loadedReplayData) {
    return <ReplayLoader onReplayLoad={setLoadedReplayData} />;
  }

  return (
    <ReplayErrorBoundary>
    <div className="flex flex-col lg:flex-row gap-4 p-4" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Left: Canvas + Controls */}
      <div className="flex flex-col gap-3 shrink-0 min-w-0">
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
          countActions={() => countActions(battleLog)}
          setCurrentAction={setCurrentAction}
          speed={speed}
          setSpeed={setSpeed}
          markers={markers}
        />

        {(canSaveReplay || savedReplayId || savingReplay) && (
          <div className="flex items-center gap-3">
            {canSaveReplay && (
              <button
                onClick={handleSaveReplay}
                disabled={savingReplay}
                className="bsx-focus px-4 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium disabled:opacity-50"
                style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                💾 {savingReplay ? t('end.savingReplay') : t('end.saveReplay')}
              </button>
            )}
            {savedReplayId && (
              <span className="text-sm" style={{ color: 'var(--emerald-400)' }}>
                {t('end.replaySaved')} — /battlesim/replay/{savedReplayId}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Tick Log */}
      <div className="flex-1 min-w-0">
        {logVisible ? (
          <BattleLogPanel
            ticks={bsxTicks}
            limit={REPLAY_TICK_LIMIT}
            maxHeight={canvasWidth * ASPECT_RATIO * 0.7}
            activeTurn={!isPlaying && battle.turn > 0 ? battle.turn : undefined}
          />
        ) : (
          <p className="text-xs text-center py-4 rounded-[var(--radius)]" style={{ color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
            Log hidden — toggle with the eye button
          </p>
        )}
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

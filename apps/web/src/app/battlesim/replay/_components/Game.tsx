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
  const t = useTranslations('battlesim');
  const [replayText, setReplayText] = useState("");
  const [error, setError] = useState("");

  const handleLoadReplay = () => {
    try {
      if (!replayText.trim()) throw new Error(t('replays.loader.errorEmpty'));
      const text = replayText.trim();
      const hasPlayer = text.includes('|player|');
      const hasTurn = text.includes('|turn|') || text.includes('|start|');
      if (!hasPlayer || !hasTurn) throw new Error(t('replays.loader.errorFormat'));
      onReplayLoad({
        side1: "Player 1", side2: "Player 2", team1: "", team2: "",
        replay: text, winner: 0, createdAt: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('replays.loader.errorUnknown'));
    }
  };

  return (
    <div data-ds="boffmedia" className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-center border border-solid border-line bg-panel p-6 text-txt cut-corner cut-corner-edge [--cut-line:var(--line)]">
      <h2 className="mb-4 text-[22px]">{t('replays.loader.title')}</h2>
      <textarea
        value={replayText}
        onChange={(e) => setReplayText(e.target.value)}
        placeholder={t('replays.loader.placeholder')}
        className="mb-4 h-64 w-full border border-solid border-line-2 bg-base p-3 font-mono text-[13px] text-txt outline-none focus:border-accent"
      />
      {error && (
        <div className="mb-4 w-full border border-solid border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft p-2 font-mono text-[12px] text-bad">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleLoadReplay}
        className="cut [--cut:8px] w-full bg-accent p-2.5 font-display text-[14px] font-bold uppercase leading-none tracking-[0.04em] text-accent-ink transition-[filter] hover:brightness-110 focus-visible:outline-none"
      >
        {t('replays.loader.load')}
      </button>
      <p className="mt-4 font-mono text-[11px] text-txt-dim">{t('replays.loader.hint')}</p>
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
    <div data-ds="boffmedia" className="flex flex-col gap-4 bg-base p-4 text-txt lg:flex-row">
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
                type="button"
                onClick={handleSaveReplay}
                disabled={savingReplay}
                className="border border-solid border-line-2 bg-panel px-4 py-1.5 font-mono text-[12px] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted transition-colors hover:border-accent-line hover:text-txt disabled:opacity-50 focus-visible:outline-none"
              >
                💾 {savingReplay ? t('end.savingReplay') : t('end.saveReplay')}
              </button>
            )}
            {savedReplayId && (
              <span className="font-mono text-[12px] text-ok">
                {t('end.replaySaved')} — /pokemon/battlesim/replay/{savedReplayId}
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
          <p className="border border-solid border-line py-4 text-center font-mono text-[11px] text-txt-dim">
            {t('replays.logHidden')}
          </p>
        )}
      </div>
    </div>

    {env.NODE_ENV === 'development' && (
      <div className="mt-4 px-4 pb-4" style={{ color: 'var(--text-dim)' }}>
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Debug Information</h3>
        <div className="p-4 rounded space-y-1 text-sm" style={{ background: 'var(--layer-2)' }}>
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

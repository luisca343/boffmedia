"use client"
import { useEffect, useRef, useState, useMemo } from "react";
import { toolApi } from "@boffmedia/tool-kit";

import { ReplayControls } from "./ReplayControls";
import { ASPECT_RATIO } from "../../engine/viewUtils";
import { PokemonIdent, Protocol } from "@pkmn/protocol";
import { useGameState } from "../../useGameState";
import { useViewportWidth } from '../../lib/useViewportWidth';
import { useBattleFlow } from "../../useBattleFlow";
import { BattleCanvas } from "../BattleCanvas";
import { moveAction, } from "../../engine/battleActions";
import { ReplayData } from "../../engine/types";
import { countActions } from "../../engine/replayUtils";
import { ReplayErrorBoundary } from "./ReplayErrorBoundary";
import { toBSXTicks, makeLogTranslator } from "../../engine/toBSXMon";
import { BattleLogPanel, REPLAY_TICK_LIMIT } from "../BattleLogPanel";
import { setReplaySpeed } from "../../engine/replaySpeed";
import { useToolT, BATTLESIM_NS } from '../../i18n';
import { Banner, Button, Icon, Textarea } from "@boffmedia/ui";
import { BsimSection, BSIM_PAGE_NARROW } from "../bsim-kit";
import { useBsimNavMaybe } from "../../nav";

import type { TimelineMarker } from "./ReplayControls";

function ReplayLoader({ onReplayLoad }: { onReplayLoad: (data: ReplayData) => void }) {
  const t = useToolT(BATTLESIM_NS);
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
        side1: t('replays.loader.side1'), side2: t('replays.loader.side2'), team1: "", team2: "",
        replay: text, winner: 0, createdAt: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('replays.loader.errorUnknown'));
    }
  };

  // The section card every other screen in the tool uses, at the tool's narrow
  // measure. This was a hand-rolled panel with a bare `<h2 className="text-[22px]">`
  // that got its weight, its italic and its uppercase from apps/web's
  // `[data-ds] h2` rule — a rule that exists on the website and nowhere in the
  // launcher, where the title rendered as 22px body text.
  return (
    <div className={BSIM_PAGE_NARROW}>
      <BsimSection icon="play" title={t('replays.loader.title')}>
        <div className="grid gap-3">
          <Textarea
            value={replayText}
            onChange={(e) => { setReplayText(e.target.value); if (error) setError(""); }}
            placeholder={t('replays.loader.placeholder')}
            aria-label={t('replays.loader.title')}
            aria-invalid={error ? true : undefined}
            spellCheck={false}
            className="min-h-[220px] font-mono text-[12.5px] leading-[1.5]"
          />
          {error && <Banner tone="error">{error}</Banner>}
          <Button variant="pri" icon="upload" className="w-full" disabled={!replayText.trim()} onClick={handleLoadReplay}>
            {t('replays.loader.load')}
          </Button>
          <p className="m-0 text-center font-mono text-[10px] leading-[1.4] text-txt-dim">{t('replays.loader.hint')}</p>
        </div>
      </BsimSection>
    </div>
  );
}

// `battleName` is accepted and unused: apps/web's passport modal still passes
// one. It used to DEFAULT to 'medalla_doku', a specific battle from someone's
// test data that every caller silently inherited.
export function Game({replayData}: {battleName?: string, replayData?: ReplayData}) {
  const t = useToolT(BATTLESIM_NS);
  const nav = useBsimNavMaybe();
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
      const res = await toolApi().request<{ data?: { replayId?: string } }>('/smartrotom/replay/create', {
        method: 'POST',
        body: JSON.stringify({
          side1: loadedReplayData.side1 || 'Player 1',
          side2: loadedReplayData.side2 || 'Player 2',
          team1: typeof loadedReplayData.team1 === 'string' ? loadedReplayData.team1 : '',
          team2: typeof loadedReplayData.team2 === 'string' ? loadedReplayData.team2 : '',
          replay: loadedReplayData.replay,
          winner: winnerMatch?.[1]?.trim() || 'unknown',
        }),
      });
      if (res.data?.replayId) setSavedReplayId(parseInt(res.data.replayId, 10));
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

  const translateLog = useMemo(() => makeLogTranslator(t), [t]);
  const bsxTicks = useMemo(() => toBSXTicks(htmlLog, translateLog), [htmlLog, translateLog]);

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
    <div data-ds="boffmedia" className="flex flex-col gap-4 text-txt lg:flex-row">
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
              <Button size="sm" icon="download" loading={savingReplay} disabled={savingReplay} onClick={() => void handleSaveReplay()}>
                {savingReplay ? t('end.savingReplay') : t('end.saveReplay')}
              </Button>
            )}
            {savedReplayId && (
              <>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ok">
                  <Icon name="check" size={13} />{t('end.replaySaved')}
                </span>
                {/* The address used to be printed raw, as text nobody could
                    click. The tool owns a nav seam; this is what it is for. */}
                {nav && (
                  <Button size="sm" icon="play" onClick={() => nav.push('replayDetail', { id: String(savedReplayId), source: 'liga' })}>
                    {t('end.watchReplay')}
                  </Button>
                )}
              </>
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
          <p className="cut-tag cut-tag-edge [--cut-tag:8px] [--cut-line:var(--line)] m-0 border border-solid border-line py-4 text-center font-mono text-[11px] text-txt-dim">
            {t('replays.logHidden')}
          </p>
        )}
      </div>
    </div>

    {/* Debug section removed - env not available in tool context */}
    </ReplayErrorBoundary>
  );
}

export default Game;

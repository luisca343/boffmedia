"use client"
import { useCallback, useEffect, useRef, useState, useMemo, type ComponentType, type ReactNode } from "react";
import { toolApi } from "@boffmedia/tool-kit";

import { ReplayControls } from "./ReplayControls";
import { PokemonIdent } from "@pkmn/protocol";
import { useGameState } from "../../useGameState";
import { useBattleFlow } from "../../useBattleFlow";
import { BattleCanvas } from "../BattleCanvas";
import { BattleShell } from "../BattleShell";
import { BattleHeader } from "../BattleHeader";
import { LogChatRail, type RailTab } from "../LogChatRail";
import { moveAction, } from "../../engine/battleActions";
import { ReplayData } from "../../engine/types";
import { countActions, getParticipantName } from "../../engine/replayUtils";
import { ReplayErrorBoundary } from "./ReplayErrorBoundary";
import { toBSXTicks, makeLogTranslator, toTeamHP } from "../../engine/toBSXMon";
import { usePkmnLabels } from "../../lib/pkmn-label";
import { REPLAY_TICK_LIMIT } from "../bx-kit";
import { setReplaySpeed } from "../../engine/replaySpeed";
import { useToolT, BATTLESIM_NS } from '../../i18n';
import { Banner, Button, Icon, Textarea, useFullscreen, cn } from "@boffmedia/ui";
import { BsimSection, BSIM_PAGE_NARROW, BSIM_FOCUS } from "../bsim-kit";
import { useMeasuredLayout } from "../../lib/battle-layout";
import { BattleAudioProvider } from "../../lib/BattleAudioProvider";
import type { BSXScore } from "../../useBSXLayout";
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
  // measure. This was a hand-rolled panel with a bare `<h2 className="text-[1.375rem]">`
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
            className="min-h-[13.75rem] font-mono text-[0.78125rem] leading-[1.5]"
          />
          {error && <Banner tone="error">{error}</Banner>}
          <Button variant="pri" icon="upload" className="w-full" disabled={!replayText.trim()} onClick={handleLoadReplay}>
            {t('replays.loader.load')}
          </Button>
          <p className="m-0 text-center font-mono text-[0.625rem] leading-[1.4] text-txt-dim">{t('replays.loader.hint')}</p>
        </div>
      </BsimSection>
    </div>
  );
}

// `battleName` is accepted and unused: apps/web's passport modal still passes
// one. It used to DEFAULT to 'medalla_doku', a specific battle from someone's
// test data that every caller silently inherited.
export function Game({replayData, shell: Shell}: {
  battleName?: string,
  replayData?: ReplayData,
  /**
   * Page chrome for the LOADER only (the lobby passes `BsimScreenShell`).
   *
   * The player itself never takes a wrapper: it is a `--tool-vh` frame with its
   * own bar, and a scrolling page body around one turns the field back into the
   * postage stamp this screen used to be.
   */
  shell?: ComponentType<{ children?: ReactNode }>,
}) {
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

  const pkmn = usePkmnLabels();

  const { battle, setBattle, battleLog, currentAction, scene, htmlLog, isPlaying, messageBar,
    turnInput, newTurn, settingTurn, lastTurn, simulatedAttack, logVisible, pov, setBattleLog,
    setCurrentAction, setScene, setHtmlLog: setLog, setIsPlaying, setMessageBar, setTurnInput,
    setNewTurn, setSettingTurn, setLastTurn, setSimulatedAttack, setLogVisible, setPov, setCurrentTurn, initScene,
    battleComplete, setBattleComplete} = useGameState(loadedReplayData);

  const battleFlow = useBattleFlow(
    battle, setBattle, battleLog, currentAction, scene, isPlaying, newTurn, lastTurn,
    settingTurn, pov, setCurrentAction, setLog, setIsPlaying, setMessageBar, setSettingTurn, setBattleComplete);

  // The speed control reaches the SCENE, not only the sleep between lines: an
  // acceleration of 8 makes every animation resolve immediately, which is what
  // the top speed has always claimed to do and never did (the ledger's "replay
  // speed only divides sleep").
  useEffect(() => {
    scene?.setAcceleration(speed);
  }, [scene, speed]);

  // The shell measures itself, exactly as `LiveBattle` does: the layout kind is
  // a function of the frame's own width, never of the window's, so the player
  // is the same three-stance composition inside a tool page, a launcher window
  // or a modal.
  const shellNode = useRef<HTMLDivElement | null>(null);
  const { ref: fsRef, isFullscreen, toggle: toggleFullscreen } = useFullscreen<HTMLDivElement>();
  const setShell = useCallback((node: HTMLDivElement | null) => { shellNode.current = node; fsRef(node); }, [fsRef]);
  const layout = useMeasuredLayout(shellNode);
  const [railOpen, setRailOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'actions' | RailTab>('actions');

  const showPreviewOverlay = battle.turn === 0 && !isPlaying && !battleStarted;

  useEffect(() => {
    if (isPlaying && !battleStarted) setBattleStarted(true);
  }, [isPlaying, battleStarted]);

  async function simulateAttack() {
    setBattleStarted(true);
    await moveAction(battle, scene, 'p1a' as PokemonIdent, simulatedAttack, 'p2a' as PokemonIdent);
  }

  const translateLog = useMemo(() => makeLogTranslator(t, pkmn.names), [t, pkmn.names]);
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

  // The two score plates the bar draws, from the replay's own sides. A live
  // battle gets these out of `useBSXLayout`; a replay has no request and no
  // timers, so the same three fields are read straight off the battle.
  const scoreFor = useCallback((side: typeof battle.p1, fallback: string): BSXScore => {
    const team = toTeamHP(side.team, (side as { totalPokemon?: number }).totalPokemon);
    const raw = getParticipantName(side.name || '').trim();
    // A side the protocol never named answers "Unknown" — an English word in a
    // Spanish UI that says less than "TU" does.
    const name = !raw || raw === 'Unknown' ? fallback : raw;
    return { name, av: name[0]?.toUpperCase() || '?', team, alive: team.filter((m) => !m.fnt).length, total: team.length };
  }, []);

  const you = pov === 0 ? battle.p1 : battle.p2;
  const foe = pov === 0 ? battle.p2 : battle.p1;
  // Recomputed on every log line rather than memoised on the battle: the battle
  // object is MUTATED in place by the engine (see `BattleCanvas`'s `revision`
  // note), so an identity-keyed memo would freeze both plates at turn zero.
  const scoreYou = scoreFor(you, t('battle.you'));
  const scoreFoe = scoreFor(foe, t('battle.foe'));

  if (!loadedReplayData) {
    const loader = <ReplayLoader onReplayLoad={setLoadedReplayData} />;
    return Shell ? <Shell>{loader}</Shell> : loader;
  }

  const goBack = nav ? () => { if (!nav.back()) nav.replace('hub', {}); } : undefined;

  const header = (
    <BattleHeader
      mode="replay" onBack={goBack} turn={battle.turn} layout={layout}
      you={scoreYou} foe={scoreFoe}
      onToggleRail={() => setRailOpen((v) => !v)} railOpen={railOpen}
      onToggleLog={isFullscreen ? () => setLogVisible(!logVisible) : undefined} logHidden={!logVisible}
      isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen}
    />
  );

  const canvas = (
    <BattleCanvas
      battle={battle}
      pov={pov}
      messageBar={messageBar}
      showPreviewOverlay={showPreviewOverlay}
      setBattleStarted={setBattleStarted}
      setIsPlaying={setIsPlaying}
      currentAction={currentAction}
      battleLog={battleLog}
      showFullInfo={false}
      initScene={initScene}
      battleComplete={battleComplete}
      fit="contain"
      compact={layout === 'mobile'}
    />
  );

  // The dock band. In a live battle this is `BxDock`; here it is the transport
  // — same place, same translucent band over the field's lower edge, so the
  // field keeps the whole frame instead of a column beside a log.
  const dock = (
    <div className="flex min-w-0 flex-col gap-2 p-2 sm:p-3">
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
        <div className="flex flex-wrap items-center gap-3">
          {canSaveReplay && (
            <Button size="sm" icon="download" loading={savingReplay} disabled={savingReplay} onClick={() => void handleSaveReplay()}>
              {savingReplay ? t('end.savingReplay') : t('end.saveReplay')}
            </Button>
          )}
          {savedReplayId && (
            <>
              <span className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] text-ok">
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
  );

  // The eye button in the transport still hides the log — it just hides the
  // RAIL now, and the shell hands the field the column it frees. The header
  // carries the same switch in fullscreen, where the transport band is the one
  // thing a viewer is not looking at.
  const rail = logVisible ? (
    <LogChatRail
      ticks={bsxTicks}
      limit={REPLAY_TICK_LIMIT}
      activeTurn={!isPlaying && battle.turn > 0 ? battle.turn : undefined}
      tab={layout === 'mobile' && mobileTab !== 'actions' ? mobileTab : undefined}
      onTabChange={(tab) => { if (layout === 'mobile') setMobileTab(tab); }}
      onClose={layout === 'desktop' ? undefined : () => { setRailOpen(false); setMobileTab('actions'); }}
    />
  ) : undefined;

  const mobileTabs = rail ? (
    <div role="tablist" aria-label={t('battle.header.openLog')} className="flex h-11 shrink-0 items-stretch border-t border-solid border-line bg-base">
      {(['actions', 'log'] as Array<'actions' | RailTab>).map((tab) => {
        const on = mobileTab === tab;
        return (
          <button key={tab} type="button" role="tab" aria-selected={on} tabIndex={on ? 0 : -1} onClick={() => setMobileTab(tab)}
            className={cn(BSIM_FOCUS, 'relative flex flex-1 items-center justify-center gap-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.08em] transition-colors duration-[140ms] focus-visible:outline-offset-[-3px]',
              on ? 'text-txt [box-shadow:inset_0_2px_0_var(--accent)]' : 'text-txt-dim')}>
            {tab === 'actions' ? t('battle.rail.actions') : t('battle.rail.log')}
          </button>
        );
      })}
    </div>
  ) : undefined;

  return (
    <ReplayErrorBoundary>
      {/* `display:contents` — the scope attribute the two apps/web embeds rely
          on must not become a box, or it would break the shell's height chain. */}
      <div data-ds="boffmedia" className="contents">
        <BattleAudioProvider>
          <BattleShell
            ref={setShell} layout={layout} fullscreen={isFullscreen}
            header={header} canvas={canvas} dock={dock}
            rail={rail} railOpen={layout === 'tablet' ? railOpen : mobileTab !== 'actions'} mobileTabs={mobileTabs}
          />
        </BattleAudioProvider>
      </div>
    </ReplayErrorBoundary>
  );
}

export default Game;

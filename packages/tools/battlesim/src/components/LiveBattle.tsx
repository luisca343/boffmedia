'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ConfirmDialog, useFullscreen, cn } from '@boffmedia/ui';
import { useToolT, BATTLESIM_NS } from '../i18n';
import { BattleShell } from './BattleShell';
import { BattleHeader } from './BattleHeader';
import { BattleCanvas, type CanvasSession } from './BattleCanvas';
import { BxDock } from './BxDock';
import { BattlePreview } from './BattlePreview';
import { BattleEndScreen } from './BattleEndScreen';
import { LogChatRail, useUnreadChat, type RailChat, type RailTab } from './LogChatRail';
import { BSIM_FOCUS } from './bsim-kit';
import { useBSXLayout } from '../useBSXLayout';
import { useMeasuredLayout } from '../lib/battle-layout';
import { toBSXMon } from '../engine/toBSXMon';
import { getParticipantName } from '../engine/replayUtils';
import type { BattleSessionState } from '../engine/BattleSession';
import type { TargetingState, EndAction } from '../lib/battle-types';
import { BattleAudioProvider, useBattleAudioState, useBattleAudioControls } from '../lib/BattleAudioProvider';
import { useRoomVisible } from '../lib/room-visibility';
import { playMusic, selectTrackForBattle, stopMusic } from '../engine/BattleAudio';

export interface LiveBattleProps {
  state: BattleSessionState;
  /**
   * The session behind `state`, for the canvas's commit handshake (see
   * `BattleCanvas`'s layout effect on `[revision]`). Optional: without it the
   * engine falls back to its own 64 ms timer, which works but animates a frame
   * ahead of the DOM on a slow commit. Room views should pass their session.
   */
  session?: CanvasSession | null;
  pov: 0 | 1;
  mode: 'ai' | 'pvp' | 'showdown';
  formatLabel?: string;
  roomLabel?: string;
  onChoice: (choice: string) => void;
  onUndo?: () => void;
  /** Confirmed forfeit (the dialog lives here). */
  onForfeit?: () => void;
  /** Leave the room for another screen. The room itself stays open. */
  onBack: () => void;
  initScene: (el: HTMLElement) => void;
  chat?: RailChat;
  spectator?: boolean;
  spectatorCount?: number;
  endActions: EndAction[];
  /** Connection notices etc., shown above the dock. */
  banner?: ReactNode;
}

type MobileTab = 'actions' | RailTab;

/**
 * The one live-battle composition every mode renders: shell + bar + canvas +
 * dock + rail + preview/end overlays + forfeit/leave guards. PlayView, the
 * PvP room and the Showdown room differ only in where their choices go.
 */
/**
 * Plays music when battle starts; stops on battle end.
 *
 * Wrapped in a safe boundary so lack of audio provider doesn't break the battle.
 */
function MusicController({ roomId, battleActive }: { roomId?: string; battleActive: boolean }) {
  const audioState = useBattleAudioState();
  const { owner } = useBattleAudioControls();
  const visible = useRoomVisible();

  // The state is read at the moment the track starts, not depended on: volume
  // and mute reach the playing element through `setMusicVolume` instead, so
  // nudging the slider does not re-run this effect.
  const stateRef = useRef(audioState);
  stateRef.current = audioState;

  const unlocked = audioState.autoplayUnlocked;

  useEffect(() => {
    // Only the room on screen plays. The others stay mounted (hidden rooms keep
    // their layout) and would otherwise all start a track over each other.
    const shouldPlay = battleActive && !!roomId && unlocked && visible;
    if (shouldPlay) {
      void playMusic(selectTrackForBattle(roomId), stateRef.current, owner);
    } else {
      // Not an `if (!battleActive)` inside the cleanup: a cleanup closes over
      // the render that created it, so when the battle ended the stale `true`
      // was read and the music played on past the end screen.
      stopMusic(owner);
    }
    return () => stopMusic(owner);
  }, [battleActive, roomId, unlocked, visible, owner]);

  return null;
}

export function LiveBattle({ state, session = null, pov, mode, formatLabel, roomLabel, onChoice, onUndo, onForfeit, onBack, initScene, chat, spectator = false, spectatorCount, endActions, banner }: LiveBattleProps) {
  const t = useToolT(BATTLESIM_NS);
  const shellNode = useRef<HTMLDivElement | null>(null);
  const { ref: fsRef, isFullscreen, toggle: toggleFullscreen } = useFullscreen<HTMLDivElement>();
  const setShell = useCallback((node: HTMLDivElement | null) => { shellNode.current = node; fsRef(node); }, [fsRef]);
  const layout = useMeasuredLayout(shellNode);

  const bsx = useBSXLayout(state, pov);
  // The ledger is on `state` whether or not a room view passed its session, so
  // the HP plates get their per-turn deltas either way; the commit handshake
  // needs the real session and degrades to the engine's own timer without one.
  const canvasSession = useMemo<CanvasSession>(() => session ?? { ledger: state.ledger }, [session, state.ledger]);
  const [targeting, setTargeting] = useState<TargetingState | null>(null);
  const [aiming, setAiming] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('actions');
  const [confirmForfeit, setConfirmForfeit] = useState(false);

  const finished = state.battleComplete || state.status === 'finished';
  const live = state.status === 'active' && !finished && !spectator;
  const chatVisible = layout === 'desktop' ? true : layout === 'tablet' ? railOpen : mobileTab === 'chat';
  const unread = useUnreadChat(chat, chatVisible && (layout === 'desktop' ? true : true));

  // A live battle still cannot survive the DOCUMENT going away — it is a worker
  // (local) or a socket (PvP) in this tab — so the reload guard stays.
  // `RoomsProvider` installs the same one for local battles running in a tab
  // that is not on screen; two listeners raise one browser prompt.
  //
  // The in-tool "you are about to abandon this battle" confirm is GONE, and
  // deliberately: going to look at your teams no longer abandons anything, the
  // room stays open in the tab bar and keeps simulating. The confirm that
  // remains is on the act that really does end a battle — closing its tab —
  // and `BsimTabBar` owns it.
  useEffect(() => {
    if (!live) return;
    const onUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [live]);

  const you = pov === 0 ? state.battle.p1 : state.battle.p2;
  const foe = pov === 0 ? state.battle.p2 : state.battle.p1;
  const timers = !!state.timerState && state.status === 'active';

  const previewOpen = bsx.requestType === 'team' && state.isWaitingForChoice && !spectator;
  const foeTeam = useMemo(() => foe.team.map((p) => toBSXMon(p)).filter((m): m is NonNullable<typeof m> => !!m), [foe.team, state.htmlLog.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const foeUnknown = Math.max(0, ((foe as { totalPokemon?: number }).totalPokemon ?? 0) - foeTeam.length);

  // A side the protocol never named answers "Unknown" — an English word in a
  // Spanish UI that says less than "TÚ" does.
  const sideName = useCallback((raw: string, fallback: string) => {
    const n = getParticipantName(raw || '').trim();
    return !n || n === 'Unknown' ? fallback : n;
  }, []);
  const youName = sideName(you.name, t('battle.you'));
  const foeName = sideName(foe.name, t('battle.foe'));
  const withName = (score: typeof bsx.bsxScoreYou, name: string) =>
    score ? { ...score, name, av: name[0]?.toUpperCase() || '?' } : score;

  // `battle.<side>.team` is only what the protocol revealed, so a random battle
  // ends with one Pokémon listed. The request knows all six — remember the last
  // one so the end screen can show the real team.
  const lastBench = useRef<typeof bsx.bsxBench>([]);
  if (bsx.bsxBench.length > 0) lastBench.current = bsx.bsxBench;

  const header = (
    <BattleHeader
      mode={mode} onBack={onBack} roomLabel={roomLabel} formatLabel={formatLabel}
      you={withName(bsx.bsxScoreYou, youName)} foe={withName(bsx.bsxScoreFoe, foeName)} turn={state.battle.turn}
      timerYou={timers ? bsx.bsxTimerYou : undefined} timerFoe={timers ? bsx.bsxTimerFoe : undefined}
      spectatorCount={spectatorCount} layout={layout}
      onToggleRail={() => setRailOpen((v) => !v)} railOpen={railOpen} railUnread={unread}
      isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen}
      showForfeit={live && !!onForfeit} onForfeit={() => setConfirmForfeit(true)}
    />
  );

  const canvas = (
    <BattleCanvas
      battle={state.battle} revision={state.revision} pov={pov} liveMode liveStatus={state.status} battleComplete={finished}
      session={canvasSession}
      initScene={initScene} fit="contain" targeting={targeting} aimedFoe={aiming} compact={layout === 'mobile'}
    />
  );

  const dock = spectator && !banner ? undefined : (
    <>
      {banner}
      {!spectator && (
        <BxDock bsx={bsx} status={state.status} isWaiting={state.isWaitingForChoice} htmlLog={state.htmlLog}
          onChoice={onChoice} onUndo={onUndo} timer={timers ? bsx.bsxTimerYou : undefined}
          onTargeting={setTargeting} onAim={setAiming} layout={layout} />
      )}
    </>
  );

  const rail = (
    <LogChatRail ticks={bsx.bsxTicks} chat={chat}
      tab={layout === 'mobile' && mobileTab !== 'actions' ? mobileTab : undefined}
      onTabChange={(tab) => { if (layout === 'mobile') setMobileTab(tab); }}
      onClose={layout === 'desktop' ? undefined : () => { setRailOpen(false); setMobileTab('actions'); }} />
  );

  const mobileTabs = (
    <div role="tablist" aria-label={t('battle.header.openLog')} className="flex h-11 shrink-0 items-stretch border-t border-solid border-line bg-base">
      {(['actions', 'log', ...(chat ? ['chat'] : [])] as MobileTab[]).map((tab) => {
        const on = mobileTab === tab;
        const label = tab === 'actions' ? t('battle.rail.actions') : tab === 'log' ? t('battle.rail.log') : t('battle.rail.chat');
        return (
          <button key={tab} type="button" role="tab" aria-selected={on} tabIndex={on ? 0 : -1} onClick={() => setMobileTab(tab)}
            className={cn(BSIM_FOCUS, 'relative flex flex-1 items-center justify-center gap-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.08em] transition-colors duration-[140ms] focus-visible:outline-offset-[-3px]',
              on ? 'text-txt [box-shadow:inset_0_2px_0_var(--accent)]' : 'text-txt-dim')}>
            {label}
            {tab === 'chat' && unread > 0 && !on && <i aria-hidden className="h-2 w-2 bg-accent [clip-path:circle(50%)]" />}
            {tab === 'chat' && unread > 0 && !on && <span className="sr-only">{t('battle.rail.unread', { count: unread })}</span>}
          </button>
        );
      })}
    </div>
  );

  const overlay = previewOpen ? (
    <BattlePreview
      team={bsx.bsxBench} foeTeam={foeTeam} foeUnknown={foeUnknown} picks={bsx.maxTeamSize} leads={bsx.activeCount}
      timer={timers ? bsx.bsxTimerYou : undefined} youName={youName} foeName={foeName}
      onConfirm={(order) => onChoice(`team ${order.join(',')}`)}
    />
  ) : finished ? (
    <BattleEndScreen battle={state.battle} pov={pov} actions={endActions} winner={state.winner}
      youTeam={lastBench.current} youName={youName} foeName={foeName} />
  ) : undefined;

  return (
    <BattleAudioProvider roomId={roomLabel}>
      <MusicController roomId={roomLabel} battleActive={!finished} />
      <BattleShell ref={setShell} layout={layout} fullscreen={isFullscreen} header={header} canvas={canvas} dock={dock}
        rail={rail} railOpen={layout === 'tablet' ? railOpen : mobileTab !== 'actions'} mobileTabs={mobileTabs} overlay={overlay}>
        <ConfirmDialog open={confirmForfeit} tone="error" title={t('connection.forfeitTitle')} body={t('connection.forfeitConfirm')} confirmLabel={t('connection.forfeitCta')}
          onConfirm={() => { setConfirmForfeit(false); onForfeit?.(); }} onClose={() => setConfirmForfeit(false)} />
      </BattleShell>
    </BattleAudioProvider>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useLiveBattleManager } from '../_hooks/useLiveBattleManager';
import { BattleCanvas } from '../_components/BattleCanvas';
import { BattleErrorBoundary } from '../_components/BattleErrorBoundary';
import { GameStageLayout } from '@/components/boffmedia/layouts/GameStageLayout';
import { ASPECT_RATIO } from '../_utils/viewUtils';
import useViewportWidth from '@/services/useViewPortWidth';
import { useBSXLayout } from '../_hooks/useBSXLayout';
import { useChoiceMechanics } from '../_hooks/useChoiceMechanics';
import { BattleHeader } from '../_components/BattleHeader';
import { BattleConnectionState } from '../_components/BattleConnectionState';
import { BattleStage } from '../_components/BattleStage';
import { BattleActionDock } from '../_components/BattleActionDock';
import { BattleLogPanel } from '../_components/BattleLogPanel';
import { useFullscreen } from '../_hooks/useFullscreen';

const BATTLE_FORMATS = [
  { value: 'gen9randomdoublesbattle', label: 'Gen 9 Random Doubles Battle' },
  { value: 'gen9randombattle', label: 'Gen 9 Random Battle' },
  { value: 'gen8randombattle', label: 'Gen 8 Random Battle' },
  { value: 'gen7randombattle', label: 'Gen 7 Random Battle' },
  { value: 'gen6randombattle', label: 'Gen 6 Random Battle' },
  { value: 'gen9nationaldex', label: 'National Dex' },
] as const;

export default function PlayPage() {
  const t = useTranslations('battlesim');
  const {
    sessions,
    activeRoomId,
    activeSession,
    createBattle,
    switchTab,
    closeTab,
    makeChoice,
    forfeit,
    initScene,
  } = useLiveBattleManager();

  const [battleStarted, setBattleStarted] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('gen9randombattle');
  const [, canvasWidth] = useViewportWidth();
  const { ref: fullscreenRef, isFullscreen, toggle: toggleFullscreen } = useFullscreen<HTMLDivElement>();

  const session = activeSession;
  const state = session?.getState();
  const bsx = useBSXLayout(state ?? null);
  const [aimingFoe, setAimingFoe] = useState(false);

  const handleCreateBattle = () => {
    setBattleStarted(true);
    createBattle(selectedFormat);
  };

  const handlePlayAgain = () => {
    setBattleStarted(false);
    createBattle(selectedFormat);
  };

  const handleInitScene = useCallback((el: HTMLElement) => {
    if (activeRoomId) {
      initScene(activeRoomId, el);
    }
  }, [activeRoomId, initScene]);

  const { activeMechanic, setActiveMechanic, makeChoiceWithMechanic } = useChoiceMechanics(
    useCallback((choice: string) => { if (state) makeChoice(state.roomId, choice); }, [makeChoice, state])
  );

  // Idle state
  if (!session || !state) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] overflow-hidden px-4 py-10">
        {/* Grid dot background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(var(--grid-dot) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse at center 20%, black, transparent 75%)',
          }}
        />
        {/* Radial glow */}
        <div
          aria-hidden="true"
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, color-mix(in srgb, var(--cyan-400) 16%, transparent), transparent 70%)' }}
        />

        <div className="relative z-10 mx-auto max-w-4xl flex flex-col gap-8">
          {/* Hero header */}
          <header className="flex flex-col gap-2">
            <span className="font-mono font-bold text-t-3xs tracking-[.3em] uppercase" style={{ color: 'var(--cyan-400)' }}>
              ⚔️ {t('play.overline')}
            </span>
            <h1
              className="font-display font-black italic uppercase text-5xl md:text-6xl tracking-[.02em]"
              style={{ color: 'var(--text)', textShadow: '0 0 36px color-mix(in srgb, var(--cyan-400) 35%, transparent)' }}
            >
              {t('play.title')}
            </h1>
            <p className="text-lg max-w-[52ch]" style={{ color: 'var(--text-muted)' }}>
              {t('play.subtitle')}
            </p>
          </header>

          {/* Format cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BATTLE_FORMATS.map((fmt, i) => {
              const isSelected = selectedFormat === fmt.value;
              return (
                <button
                  key={fmt.value}
                  onClick={() => setSelectedFormat(fmt.value)}
                  className="group relative flex flex-col justify-end overflow-hidden rounded-[var(--radius-lg)] p-5 text-left transition-transform duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan-400)]"
                  style={{
                    background: `linear-gradient(150deg, color-mix(in srgb, var(--cyan-400) ${isSelected ? 22 : 12}%, var(--surface)), var(--surface) 60%)`,
                    border: `1px solid color-mix(in srgb, var(--cyan-400) ${isSelected ? 55 : 22}%, var(--border))`,
                    boxShadow: isSelected ? '0 0 24px -8px color-mix(in srgb, var(--cyan-400) 40%, transparent)' : undefined,
                  }}
                >
                  {/* Accent stripe */}
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-0 h-0.5 transition-all duration-[var(--dur)] ease-[var(--ease)]"
                    style={{
                      width: isSelected ? '70%' : '35%',
                      background: 'linear-gradient(90deg, var(--cyan-400), transparent)',
                    }}
                  />
                  <span
                    className="font-mono font-bold text-t-4xs tracking-[.22em] uppercase mb-1.5"
                    style={{ color: 'var(--cyan-400)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    {fmt.label}
                  </span>
                  {isSelected && (
                    <span
                      className="mt-1 font-mono font-bold text-t-4xs tracking-[.14em] uppercase"
                      style={{ color: 'var(--cyan-400)' }}
                    >
                      ▶ {t('play.selected')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Start button */}
          <div className="flex justify-start">
            <button
              onClick={handleCreateBattle}
              className="px-10 py-3 rounded-[var(--radius)] font-bold text-base uppercase tracking-[.1em] transition-all duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan-400)]"
              style={{
                background: 'var(--accent)',
                color: 'var(--text)',
                boxShadow: '0 4px 20px -6px color-mix(in srgb, var(--cyan-400) 50%, transparent)',
              }}
            >
              {t('play.start')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Connecting state
  if (state.status === 'connecting') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <BattleTabs
          sessions={sessions}
          activeRoomId={activeRoomId!}
          onSwitch={switchTab}
          onClose={closeTab}
          onNew={handleCreateBattle}
        />
        <BattleConnectionState kind="connecting" message={t('connection.connectingServer')} />
      </div>
    );
  }

  // Error state
  if (state.status === 'error') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <BattleTabs
          sessions={sessions}
          activeRoomId={activeRoomId!}
          onSwitch={switchTab}
          onClose={closeTab}
          onNew={handleCreateBattle}
        />
        <BattleConnectionState kind="error" message={state.error ?? t('connection.unknownError')} onRetry={handleCreateBattle} />
      </div>
    );
  }

  // Active or finished battle
  const timersActive = !!state.timerState && state.status === 'active';
  const header = (
    <>
      <BattleTabs
        sessions={sessions}
        activeRoomId={activeRoomId!}
        onSwitch={switchTab}
        onClose={closeTab}
        onNew={handleCreateBattle}
      />
      <BattleHeader
        mode="ai"
        roomId={state.roomId ? `${state.roomId.slice(0, 8)}...` : undefined}
        formatLabel={BATTLE_FORMATS.find((f) => f.value === selectedFormat)?.label}
        timerP1={timersActive ? bsx.bsxTimerP1 : undefined}
        timerP2={timersActive ? bsx.bsxTimerP2 : undefined}
        showForfeit={state.status === 'active'}
        onForfeit={() => forfeit(state.roomId)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
    </>
  );

  const rail = (
    <BattleLogPanel ticks={bsx.bsxTicks} maxHeight={canvasWidth * ASPECT_RATIO} />
  );

  const dock = (
    <BattleActionDock
      bsx={bsx}
      status={state.status}
      isWaiting={state.isWaitingForChoice && state.battle.turn >= 1}
      htmlLog={state.htmlLog}
      onChoice={(choice) => makeChoice(state.roomId, choice)}
      onAimMove={(i) => setAimingFoe(i != null)}
      onMoveChoice={(i) => makeChoiceWithMechanic(`move ${i}`)}
      activeMechanic={activeMechanic}
      setActiveMechanic={setActiveMechanic}
    />
  );

  const postBattle = state.status === 'finished' ? (
    <div className="flex items-center justify-center gap-3 py-2">
      {state.replayId && (
        <Link href={`/battlesim/replay/${state.replayId}`}
          className="px-6 py-2 rounded-md font-medium transition-colors"
          style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
          {t('end.watchReplay')}
        </Link>
      )}
    </div>
  ) : null;

  return (
    <GameStageLayout ref={fullscreenRef} header={header} rail={rail} dock={dock} footer={postBattle} fullscreen={isFullscreen}>
      <BattleStage bsx={bsx} fullscreen={isFullscreen}>
        <BattleErrorBoundary>
          <BattleCanvas
            battle={state.battle}
            pov={0}
            messageBar={state.messageBar}
            showPreviewOverlay={state.battle.turn === 0 && !battleStarted}
            setBattleStarted={setBattleStarted}
            setIsPlaying={() => {}}
            currentAction={0}
            battleLog={null}
            initScene={handleInitScene}
            aimedFoe={aimingFoe}
            liveMode={true}
            liveStatus={state.status}
            onPlayAgain={handlePlayAgain}
            battleComplete={state.battleComplete}
            canvasWidth={isFullscreen ? (typeof window !== 'undefined' ? window.innerWidth : undefined) : undefined}
            fullscreen={isFullscreen}
          />
        </BattleErrorBoundary>
      </BattleStage>
    </GameStageLayout>
  );
}

// ─── Battle Tabs Component ───

function BattleTabs({
  sessions,
  activeRoomId,
  onSwitch,
  onClose,
  onNew,
}: {
  sessions: Map<string, any>;
  activeRoomId: string;
  onSwitch: (roomId: string) => void;
  onClose: (roomId: string) => void;
  onNew: () => void;
}) {
  const t = useTranslations('battlesim');
  const sessionEntries = Array.from(sessions.entries());

  return (
    <div
      className="flex items-center gap-1 rounded-lg p-1 overflow-x-auto"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      {sessionEntries.map(([roomId, session]) => {
        const isActive = roomId === activeRoomId;
        const st = session.getState();
        const label = st.status === 'finished'
          ? (st.winner === 'Player' ? t('play.won') : st.winner === 'tie' ? t('play.tie') : t('play.lost'))
          : t('play.turn', { turn: st.battle.turn });

        return (
          <div
            key={roomId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors"
            style={{
              background: isActive ? 'var(--surface-3)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-muted)',
            }}
            onClick={() => onSwitch(roomId)}
          >
            <span className="truncate max-w-[100px]">{roomId.slice(0, 8)}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: st.status === 'active' ? 'color-mix(in srgb, var(--emerald-500) 20%, transparent)' :
                  st.status === 'finished' ? 'var(--surface-3)' :
                  st.status === 'connecting' ? 'color-mix(in srgb, var(--amber-500) 20%, transparent)' :
                  'color-mix(in srgb, var(--rose-500) 20%, transparent)',
                color: st.status === 'active' ? 'var(--emerald-400)' :
                  st.status === 'finished' ? 'var(--text-dim)' :
                  st.status === 'connecting' ? 'var(--amber-400)' :
                  'var(--rose-400)',
              }}
            >
              {label}
            </span>
            {sessions.size > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(roomId); }}
                className="ml-1 text-xs"
                style={{ color: 'var(--text-dim)' }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={onNew}
        className="px-3 py-1.5 rounded-md text-sm transition-colors"
        style={{ color: 'var(--text-dim)' }}
      >
        {t('play.newTab')}
      </button>
    </div>
  );
}

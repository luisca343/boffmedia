'use client';

import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useLiveBattleManager } from '../_hooks/useLiveBattleManager';
import { BattleCanvas } from '../_components/BattleCanvas';
import { GameStageLayout } from '@/components/boffmedia-v2/layouts/GameStageLayout';
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>{t('play.title')}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{t('play.subtitle')}</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
            style={{ background: 'var(--card-bg)', border: 'var(--card-border)', color: 'var(--text)' }}
          >
            {BATTLE_FORMATS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
            ))}
          </select>
          <button
            onClick={handleCreateBattle}
            className="px-8 py-3 rounded-lg text-lg font-semibold transition-colors shadow-lg"
            style={{ background: 'var(--secondary)', color: 'var(--text)', border: '1px solid var(--border)', boxShadow: '0 4px 14px -4px var(--border)' }}
          >
            {t('play.start')}
          </button>
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
      isWaiting={state.isWaitingForChoice}
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
          style={{ background: 'var(--layer-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
          {t('end.watchReplay')}
        </Link>
      )}
    </div>
  ) : null;

  return (
    <GameStageLayout ref={fullscreenRef} header={header} rail={rail} dock={dock} footer={postBattle} fullscreen={isFullscreen}>
      <BattleStage bsx={bsx} fullscreen={isFullscreen}>
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
          canvasWidth={isFullscreen ? window.innerWidth : undefined}
          fullscreen={isFullscreen}
        />
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
      style={{ background: 'var(--layer-2)', border: '1px solid var(--border)' }}
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
              background: isActive ? 'var(--layer-3)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-muted)',
            }}
            onClick={() => onSwitch(roomId)}
          >
            <span className="truncate max-w-[100px]">{roomId.slice(0, 8)}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: st.status === 'active' ? 'color-mix(in srgb, var(--emerald-500) 20%, transparent)' :
                  st.status === 'finished' ? 'var(--layer-3)' :
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

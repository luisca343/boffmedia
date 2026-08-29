'use client';

import { useTranslations } from 'next-intl';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLiveBattleManager } from '@/app/battlesim/_hooks/useLiveBattleManager';
import { BattleCanvas } from '@/app/battlesim/_components/BattleCanvas';
import { ASPECT_RATIO } from '@/app/battlesim/_utils/viewUtils';
import useViewportWidth from '@/services/useViewPortWidth';
import { useBSXLayout } from '@/app/battlesim/_hooks/useBSXLayout';
import { useChoiceMechanics } from '@/app/battlesim/_hooks/useChoiceMechanics';
import { BattleHeader } from '@/app/battlesim/_components/BattleHeader';
import { BattleConnectionState } from '@/app/battlesim/_components/BattleConnectionState';
import { BattleStage } from '@/app/battlesim/_components/BattleStage';
import { BattleActionDock } from '@/app/battlesim/_components/BattleActionDock';
import { BattleLogPanel } from '@/app/battlesim/_components/BattleLogPanel';
import { useFullscreen } from '@/hooks/useFullscreen';
import { cn } from '@/lib/utils';
import { DkSelect } from '@/components/boffmedia/ui/tools/datakit';
import { Empty, Icon } from '@boffmedia/ui';
import { BattleShell } from '../../_components/BattleShell';
import { BSIM_FORMATS } from '../../_lib/bsim-data';

const LOBBY_HREF = '/pokemon/battlesim';

function PlayInner() {
  const t = useTranslations('battlesim');
  const searchParams = useSearchParams();
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
  const queryFormat = searchParams.get('format');
  const [selectedFormat, setSelectedFormat] = useState<string>(
    queryFormat && BSIM_FORMATS.some((f) => f.value === queryFormat) ? queryFormat : BSIM_FORMATS[0].value,
  );
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

  // Auto-launch when the lobby passed a format (single-click launch from the chassis).
  const [autoLaunched, setAutoLaunched] = useState(false);
  useEffect(() => {
    if (queryFormat && !autoLaunched && !session) {
      setAutoLaunched(true);
      setBattleStarted(true);
      createBattle(queryFormat);
    }
  }, [queryFormat, autoLaunched, session, createBattle]);

  const handlePlayAgain = () => {
    setBattleStarted(false);
    createBattle(selectedFormat);
  };

  const handleInitScene = useCallback((el: HTMLElement) => {
    if (activeRoomId) initScene(activeRoomId, el);
  }, [activeRoomId, initScene]);

  const { activeMechanic, setActiveMechanic, makeChoiceWithMechanic } = useChoiceMechanics(
    useCallback((choice: string) => { if (state) makeChoice(state.roomId, choice); }, [makeChoice, state]),
  );

  // Idle state — direct navigation without a format.
  if (!session || !state) {
    // Not a header — an idle state reached by direct navigation without a
    // format. It is an `Empty`, which is why it keeps a heading while the
    // other battlesim views (App surfaces) lost theirs.
    return (
      <Empty icon="sword" title={t('play.title')} lead={t('play.subtitle')} className="min-h-[60vh]">
        <div className="mx-auto flex w-full max-w-[320px] flex-col items-stretch gap-3">
          <DkSelect
            value={selectedFormat}
            onChange={setSelectedFormat}
            ariaLabel={t('app.lobby.formatLabel')}
            options={BSIM_FORMATS.map((f) => ({ value: f.value, label: f.label }))}
          />
          <button
            type="button"
            onClick={handleCreateBattle}
            className="cut [--cut:10px] flex items-center justify-center gap-2 bg-accent p-4 font-display text-[17px] font-extrabold italic uppercase leading-none tracking-[0.04em] text-accent-ink transition-[filter,transform] hover:-translate-y-px hover:brightness-110 focus-visible:outline-none"
          >
            <Icon name="sword" size={20} />{t('play.start')}
          </button>
        </div>
      </Empty>
    );
  }

  if (state.status === 'connecting') {
    return (
      <div className="flex flex-col gap-4 p-4 text-txt">
        <BattleTabs sessions={sessions} activeRoomId={activeRoomId!} onSwitch={switchTab} onClose={closeTab} onNew={handleCreateBattle} />
        <BattleConnectionState kind="connecting" message={t('connection.connectingServer')} />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col gap-4 p-4 text-txt">
        <BattleTabs sessions={sessions} activeRoomId={activeRoomId!} onSwitch={switchTab} onClose={closeTab} onNew={handleCreateBattle} />
        <BattleConnectionState kind="error" message={state.error ?? t('connection.unknownError')} onRetry={handleCreateBattle} backHref={LOBBY_HREF} />
      </div>
    );
  }

  const timersActive = !!state.timerState && state.status === 'active';
  const header = (
    <>
      <BattleTabs sessions={sessions} activeRoomId={activeRoomId!} onSwitch={switchTab} onClose={closeTab} onNew={handleCreateBattle} />
      <BattleHeader
        mode="ai"
        backHref={LOBBY_HREF}
        roomId={state.roomId ? `${state.roomId.slice(0, 8)}...` : undefined}
        formatLabel={BSIM_FORMATS.find((f) => f.value === selectedFormat)?.label}
        timerP1={timersActive ? bsx.bsxTimerP1 : undefined}
        timerP2={timersActive ? bsx.bsxTimerP2 : undefined}
        showForfeit={state.status === 'active'}
        onForfeit={() => forfeit(state.roomId)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
    </>
  );

  const rail = <BattleLogPanel ticks={bsx.bsxTicks} maxHeight={canvasWidth * ASPECT_RATIO} />;

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

  const postBattle = state.status === 'finished' && state.replayId ? (
    <div className="flex items-center justify-center gap-3 py-2">
      <a
        href={`/pokemon/battlesim/replay/${state.replayId}`}
        className="border border-solid border-line-2 bg-panel px-6 py-2 font-mono text-[12px] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted transition-colors hover:border-accent-line hover:text-txt"
      >
        {t('end.watchReplay')}
      </a>
    </div>
  ) : null;

  return (
    <BattleShell ref={fullscreenRef} header={header} rail={rail} dock={dock} footer={postBattle} fullscreen={isFullscreen}>
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
    </BattleShell>
  );
}

export function BsimPlayView() {
  return (
    <Suspense>
      <PlayInner />
    </Suspense>
  );
}

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
    <div className="flex items-center gap-1 overflow-x-auto border border-solid border-line bg-base p-1">
      {sessionEntries.map(([roomId, session]) => {
        const isActive = roomId === activeRoomId;
        const st = session.getState();
        const label = st.status === 'finished'
          ? (st.winner === 'Player' ? t('play.won') : st.winner === 'tie' ? t('play.tie') : t('play.lost'))
          : t('play.turn', { turn: st.battle.turn });
        const tone = st.status === 'active' ? 'text-ok' : st.status === 'finished' ? 'text-txt-dim' : st.status === 'connecting' ? 'text-warn' : 'text-bad';
        return (
          <div
            key={roomId}
            onClick={() => onSwitch(roomId)}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] transition-colors',
              isActive ? 'bg-panel text-txt' : 'text-txt-muted hover:text-txt',
            )}
          >
            <span className="max-w-[100px] truncate">{roomId.slice(0, 8)}</span>
            <span className={cn('font-bold uppercase tracking-[0.06em]', tone)}>{label}</span>
            {sessions.size > 1 && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onClose(roomId); }} className="ml-1 text-txt-dim hover:text-bad">×</button>
            )}
          </div>
        );
      })}
      <button type="button" onClick={onNew} className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-txt-dim hover:text-txt">
        {t('play.newTab')}
      </button>
    </div>
  );
}

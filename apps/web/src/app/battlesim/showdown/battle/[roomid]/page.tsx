'use client';

import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useShowdownBattle, getGlobalUsername } from '../../../_hooks/useShowdownBattle';
import { BattleCanvas } from '../../../_components/BattleCanvas';
import { BattleErrorBoundary } from '../../../_components/BattleErrorBoundary';
import { GameStageLayout } from '@/components/boffmedia/layouts/GameStageLayout';
import useViewportWidth from '@/services/useViewPortWidth';
import { ASPECT_RATIO } from '../../../_utils/viewUtils';
import { useBSXLayout } from '../../../_hooks/useBSXLayout';
import { BattleHeader } from '../../../_components/BattleHeader';
import { BattleConnectionState } from '../../../_components/BattleConnectionState';
import { useChoiceMechanics } from '../../../_hooks/useChoiceMechanics';
import { BattleStage } from '../../../_components/BattleStage';
import { BattleActionDock } from '../../../_components/BattleActionDock';
import { LogChatRail } from '../../../_components/LogChatRail';
import { useFullscreen } from '../../../_hooks/useFullscreen';

export default function ShowdownBattlePage({
  params,
}: {
  params: Promise<{ roomid: string }>;
}) {
  const { roomid } = use(params);
  const decodedRoomId = decodeURIComponent(roomid);
  const t = useTranslations('battlesim');

  const {
    status,
    username,
    session,
    chatMessages,
    spectatorCount,
    error,
    reconnectInfo,
    sendChoice,
    cancelChoice,
    forfeit,
    sendChat,
    initScene,
    saveShowdownReplay,
  } = useShowdownBattle(decodedRoomId, { autoCreateSession: true });

  const [savedReplayId, setSavedReplayId] = useState<number | null>(null);
  const [savingReplay, setSavingReplay] = useState(false);
  const { activeMechanic, setActiveMechanic, makeChoiceWithMechanic: sendChoiceWithMechanic } = useChoiceMechanics(
    useCallback((choice: string) => sendChoice(choice), [sendChoice])
  );
  const [, canvasWidth] = useViewportWidth();
  const [battleStarted, setBattleStarted] = useState(false);
  const { ref: fullscreenRef, isFullscreen, toggle: toggleFullscreen } = useFullscreen<HTMLDivElement>();

  const state = session?.getState();
  const bsx = useBSXLayout(state ?? null);
  const [aimingFoe, setAimingFoe] = useState(false);

  const myName = username?.trim() || getGlobalUsername()?.trim();
  const p1Name = state?.battle?.p1?.name?.trim();
  const p2Name = state?.battle?.p2?.name?.trim();
  const pov: 0 | 1 = p1Name === myName ? 0 : p2Name === myName ? 1 : 0;
  const povRef = useRef<0 | 1>(0);
  if (p1Name || p2Name) {
    povRef.current = pov;
  }

  const handleInitScene = useCallback(
    (el: HTMLElement) => {
      initScene(el, povRef.current);
    },
    [initScene],
  );

  useEffect(() => {
    if (session && (p1Name || p2Name)) {
      const gameEl = document.getElementById('game');
      if (gameEl) {
        initScene(gameEl, povRef.current);
      }
    }
  }, [p1Name, p2Name, session, initScene, pov]);

  const handleForfeit = () => {
    if (confirm('Are you sure you want to forfeit?')) {
      forfeit();
    }
  };

  useEffect(() => {
    if (state?.battleComplete && !savedReplayId && !savingReplay) {
      setSavingReplay(true);
      saveShowdownReplay().then((id) => {
        if (id) setSavedReplayId(id);
        setSavingReplay(false);
      });
    }
  }, [state?.battleComplete, savedReplayId, savingReplay, saveShowdownReplay]);

  if (!session || !state || status === 'connecting' || status === 'authenticating' || status === 'joining') {
    const message =
      status === 'connecting' ? t('connection.connectingShowdown')
      : status === 'authenticating' ? t('connection.authenticating')
      : status === 'joining' ? t('connection.joiningBattle')
      : t('connection.waitingBattle');
    return (
      <BattleConnectionState
        kind={reconnectInfo ? 'reconnecting' : 'connecting'}
        message={message}
        detail={reconnectInfo ? t('connection.reconnecting', { attempt: reconnectInfo.attempt, max: reconnectInfo.maxAttempts }) : undefined}
        backHref="/battlesim/showdown"
      />
    );
  }

  if (status === 'error' || state.status === 'error') {
    return (
      <BattleConnectionState
        kind="error"
        message={error || state.error || t('connection.unknownError')}
        backHref="/battlesim/showdown"
      />
    );
  }

  const isMyTurn = state.isWaitingForChoice && state.battle.turn >= 1;
  const trapMsg = state.currentRequest?.active?.[0]?.trapped ? t('dock.trapped') : '';
  // Spectator: both player names known and neither matches the logged-in user.
  const isSpectator = !!p1Name && !!p2Name && myName !== p1Name && myName !== p2Name;

  const timersActive = !!state.timerState && state.status === 'active';
  const header = (
    <BattleHeader
      mode="showdown"
      backHref="/battlesim/showdown"
      roomId={decodedRoomId}
      username={username || undefined}
      opponentName={pov === 0 ? p2Name : p1Name}
      spectatorCount={spectatorCount}
      timerP1={timersActive ? Math.ceil(state.timerState!.p1.turnRemaining / 1000) : undefined}
      timerP2={timersActive ? Math.ceil(state.timerState!.p2.turnRemaining / 1000) : undefined}
      showForfeit={state.status === 'active' && !isSpectator}
      onForfeit={handleForfeit}
      isFullscreen={isFullscreen}
      onToggleFullscreen={toggleFullscreen}
    />
  );

  const rightPanel = (
    <LogChatRail
      ticks={bsx.bsxTicks}
      maxHeight={canvasWidth * ASPECT_RATIO * 0.82}
      chat={{
        messages: chatMessages,
        onSend: (msg) => sendChat(msg),
        disabled: state.status !== 'active',
      }}
    />
  );

  const dock = isSpectator ? null : (
    <BattleActionDock
      bsx={bsx}
      status={state.status}
      isWaiting={isMyTurn}
      htmlLog={state.htmlLog}
      onChoice={(choice) => sendChoice(choice)}
      onUndo={cancelChoice}
      onAimMove={(i) => setAimingFoe(i != null)}
      onMoveChoice={(i) => sendChoiceWithMechanic(`move ${i}`)}
      activeMechanic={activeMechanic}
      setActiveMechanic={setActiveMechanic}
      switchLabel={`${t('dock.switch')}${trapMsg}`}
    />
  );

  const postBattle = state.status === 'finished' ? (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="text-center">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
          {state.winner === username ? t('end.youWon') : state.winner === 'tie' ? t('end.itsATie') : t('end.playerWon', { name: state.winner ?? '' })}
        </h2>
      </div>
      {savingReplay && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('end.savingReplay')}</p>}
      {savedReplayId && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm" style={{ color: 'var(--emerald-400)' }}>{t('end.replaySaved')}</p>
          <Link href={`/battlesim/replay/${savedReplayId}`}
            className="px-6 py-2 rounded-md font-medium transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            {t('end.watchReplay')}
          </Link>
        </div>
      )}
      <Link href="/battlesim/showdown"
        className="px-6 py-2 rounded-md font-medium transition-colors"
        style={{ background: 'var(--accent)', color: 'var(--text)', border: '1px solid var(--border)' }}>
        {t('connection.backToLobby')}
      </Link>
    </div>
  ) : null;

  return (
    <GameStageLayout ref={fullscreenRef} header={header} rail={rightPanel} dock={dock} footer={postBattle} fullscreen={isFullscreen}>
      <BattleStage bsx={bsx} fullscreen={isFullscreen}>
        <BattleErrorBoundary>
          <BattleCanvas
            battle={state.battle}
            pov={pov}
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
            battleComplete={state.battleComplete}
            username={username}
            canvasWidth={isFullscreen ? (typeof window !== 'undefined' ? window.innerWidth : undefined) : undefined}
            fullscreen={isFullscreen}
          />
        </BattleErrorBoundary>
      </BattleStage>
    </GameStageLayout>
  );
}

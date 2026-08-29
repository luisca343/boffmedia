'use client';

import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@boffmedia/ui';
import { useState, useRef, useEffect, useCallback, use } from 'react';
import { useShowdownBattle, getGlobalUsername } from '@/app/battlesim/_hooks/useShowdownBattle';
import { BattleCanvas } from '@/app/battlesim/_components/BattleCanvas';
import useViewportWidth from '@/services/useViewPortWidth';
import { ASPECT_RATIO } from '@/app/battlesim/_utils/viewUtils';
import { useBSXLayout } from '@/app/battlesim/_hooks/useBSXLayout';
import { BattleHeader } from '@/app/battlesim/_components/BattleHeader';
import { BattleConnectionState } from '@/app/battlesim/_components/BattleConnectionState';
import { useChoiceMechanics } from '@/app/battlesim/_hooks/useChoiceMechanics';
import { BattleStage } from '@/app/battlesim/_components/BattleStage';
import { BattleActionDock } from '@/app/battlesim/_components/BattleActionDock';
import { LogChatRail } from '@/app/battlesim/_components/LogChatRail';
import { useFullscreen } from '@/hooks/useFullscreen';
import type { BattleRequest } from '@/app/battlesim/types';
import { BattleShell } from '../../../../_components/BattleShell';

const LOBBY_HREF = '/pokemon/battlesim/showdown';

export function BsimShowdownRoomView({ params }: { params: Promise<{ roomid: string }> }) {
  const { roomid } = use(params);
  const decodedRoomId = decodeURIComponent(roomid);
  const t = useTranslations('battlesim');

  const {
    status, username, session, chatMessages, spectatorCount, error, reconnectInfo,
    sendChoice, cancelChoice, forfeit, sendChat, initScene, saveShowdownReplay,
  } = useShowdownBattle(decodedRoomId, { autoCreateSession: true });

  const [savedReplayId, setSavedReplayId] = useState<number | null>(null);
  const [savingReplay, setSavingReplay] = useState(false);
  const { activeMechanic, setActiveMechanic, makeChoiceWithMechanic: sendChoiceWithMechanic } = useChoiceMechanics(
    useCallback((choice: string) => sendChoice(choice), [sendChoice]),
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
  if (p1Name || p2Name) povRef.current = pov;

  const handleInitScene = useCallback((el: HTMLElement) => { initScene(el, povRef.current); }, [initScene]);

  useEffect(() => {
    if (session && (p1Name || p2Name)) {
      const gameEl = document.getElementById('game');
      if (gameEl) initScene(gameEl, povRef.current);
    }
  }, [p1Name, p2Name, session, initScene, pov]);

  // Forfeiting ends the match with no undo, so it asks in a real dialog
  // rather than a native confirm the battle canvas cannot style.
  const [confirmForfeit, setConfirmForfeit] = useState(false);
  const handleForfeit = () => setConfirmForfeit(true);
  const doForfeit = () => { setConfirmForfeit(false); forfeit(); };

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
        backHref={LOBBY_HREF}
      />
    );
  }

  if (status === 'error' || state.status === 'error') {
    return <BattleConnectionState kind="error" message={error || state.error || t('connection.unknownError')} backHref={LOBBY_HREF} />;
  }

  const isMyTurn = state.isWaitingForChoice;
  const trapMsg = (state.currentRequest as BattleRequest | null)?.active?.[0]?.trapped ? t('dock.trapped') : '';
  const isSpectator = !!p1Name && !!p2Name && myName !== p1Name && myName !== p2Name;

  const timersActive = !!state.timerState && state.status === 'active';
  const header = (
    <BattleHeader
      mode="showdown"
      backHref={LOBBY_HREF}
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
      chat={{ messages: chatMessages, onSend: (msg) => sendChat(msg), disabled: state.status !== 'active' }}
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
      <h2 className="text-[20px]">
        {state.winner === username ? t('end.youWon') : state.winner === 'tie' ? t('end.itsATie') : t('end.playerWon', { name: state.winner ?? '' })}
      </h2>
      {savingReplay && <p className="text-[13px] text-txt-muted">{t('end.savingReplay')}</p>}
      {savedReplayId && (
        <a href={`/pokemon/battlesim/replay/${savedReplayId}`} className="border border-solid border-line-2 bg-panel px-6 py-2 font-mono text-[12px] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted transition-colors hover:border-accent-line hover:text-txt">
          {t('end.watchReplay')}
        </a>
      )}
      <a href={LOBBY_HREF} className="cut [--cut:4px] bg-accent px-6 py-2 font-display text-[13px] font-bold uppercase leading-none tracking-[0.04em] text-accent-ink transition-[filter] hover:brightness-110">
        {t('connection.backToLobby')}
      </a>
    </div>
  ) : null;

  return (
    <BattleShell ref={fullscreenRef} header={header} rail={rightPanel} dock={dock} footer={postBattle} fullscreen={isFullscreen}>
      <BattleStage bsx={bsx} fullscreen={isFullscreen}>
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
          canvasWidth={isFullscreen ? window.innerWidth : undefined}
          fullscreen={isFullscreen}
        />
      </BattleStage>

      <ConfirmDialog
        open={confirmForfeit}
        tone="error"
        title={t('connection.forfeitTitle')}
        body={t('connection.forfeitConfirm')}
        confirmLabel={t('connection.forfeitCta')}
        onConfirm={doForfeit}
        onClose={() => setConfirmForfeit(false)}
      />
    </BattleShell>
  );
}

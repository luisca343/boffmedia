'use client';

import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Protocol } from '@pkmn/protocol';
import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env.public';
import { BattleCanvas } from '../../../_components/BattleCanvas';
import { GameStageLayout } from '@/components/boffmedia/layouts/GameStageLayout';
import { BattleSession } from '../../../_utils/BattleSession';
import useViewportWidth from '@/services/useViewPortWidth';
import { ASPECT_RATIO } from '../../../_utils/viewUtils';
import { useBSXLayout } from '../../../_hooks/useBSXLayout';
import { useChoiceMechanics } from '../../../_hooks/useChoiceMechanics';
import { BattleHeader } from '../../../_components/BattleHeader';
import { BattleConnectionState } from '../../../_components/BattleConnectionState';
import { BattleStage } from '../../../_components/BattleStage';
import { BattleActionDock } from '../../../_components/BattleActionDock';
import { LogChatRail } from '../../../_components/LogChatRail';
import { useFullscreen } from '../../../_hooks/useFullscreen';
import type { ChatPanelMessage } from '../../../_components/ChatPanel';

function getGlobalSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  return (window as any).__pvp_socket ?? null;
}

export default function PvPBattlePage({
  params,
}: {
  params: Promise<{ roomid: string }>;
}) {
  const { roomid } = use(params);
  const decodedRoomId = decodeURIComponent(roomid);
  const t = useTranslations('battlesim');

  const [session, setSession] = useState<BattleSession | null>(null);
  const [side, setSide] = useState<'p1' | 'p2'>('p1');
  const [savedReplayId, setSavedReplayId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatPanelMessage[]>([]);
  const [savingReplay, setSavingReplay] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false);
  const [, canvasWidth] = useViewportWidth();
  const [, forceUpdate] = useState(0);
  const sceneInitialized = useRef(false);
  const { ref: fullscreenRef, isFullscreen, toggle: toggleFullscreen } = useFullscreen<HTMLDivElement>();

  const triggerUpdate = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  useEffect(() => {
    const socket = getGlobalSocket();
    if (!socket) return;

    const storedSide = localStorage.getItem(`pvp_side_${decodedRoomId}`) as 'p1' | 'p2' | null;
    if (storedSide) {
      setSide(storedSide);
    }

    let sess = (window as any).__pvp_sessions?.[decodedRoomId];
    if (!sess) {
      sess = new BattleSession(decodedRoomId, {
        onUpdate: triggerUpdate,
        onRequest: () => triggerUpdate(),
        onBattleEnd: () => triggerUpdate(),
      });
      sess.status = 'active';
      if (!(window as any).__pvp_sessions) {
        (window as any).__pvp_sessions = {};
      }
      (window as any).__pvp_sessions[decodedRoomId] = sess;
    } else {
      sess.callbacks = {
        onUpdate: triggerUpdate,
        onRequest: () => triggerUpdate(),
        onBattleEnd: () => triggerUpdate(),
      };
    }
    setSession(sess);

    const handleProtocol = (data: { roomId: string; line: string }) => {
      if (data.roomId === decodedRoomId) {
        sess.addLine(data.line);
        triggerUpdate();
      }
    };

    const handleRequest = (data: { roomId: string; request: Protocol.Request }) => {
      if (data.roomId === decodedRoomId) {
        sess.handleRequest(data.request);
        triggerUpdate();
      }
    };

    const handleBattleEnd = (data: { roomId: string; winner: string; replay: string; replayId?: number }) => {
      if (data.roomId === decodedRoomId) {
        sess.winner = data.winner;
        sess.replay = data.replay;
        sess.replayId = data.replayId ?? null;
        sess.status = 'finished';
        sess.battleComplete = true;
        sess.isWaitingForChoice = false;
        sess.currentRequest = null;
        (sess.battle as any).winner = data.winner;
        triggerUpdate();
      }
    };

    const handleTimerUpdate = (data: { roomId: string; p1: any; p2: any; activeSide: any }) => {
      if (data.roomId === decodedRoomId) {
        sess.timerState = { p1: data.p1, p2: data.p2, activeSide: data.activeSide };
        triggerUpdate();
      }
    };

    const handleChatMessage = (data: { roomId: string; sender: string; message: string; timestamp: number }) => {
      if (data.roomId === decodedRoomId) {
        setChatMessages((prev) => [...prev, { sender: data.sender, message: data.message, timestamp: data.timestamp }]);
      }
    };

    socket.on('chatMessage', handleChatMessage);
    socket.on('protocol', handleProtocol);
    socket.on('request', handleRequest);
    socket.on('battleEnd', handleBattleEnd);
    socket.on('timerUpdate', handleTimerUpdate);

    const handleSpectateJoined = (data: { roomId: string; replay: string; status: string; currentRequest?: Protocol.Request | null }) => {
      if (data.roomId === decodedRoomId && data.replay) {
        for (const line of data.replay.split('\n')) {
          if (line.trim()) sess.addLine(line);
        }
        if (data.currentRequest) sess.handleRequest(data.currentRequest);
        triggerUpdate();
      }
    };
    socket.on('spectateJoined', handleSpectateJoined);
    socket.emit('spectate', { roomId: decodedRoomId });

    return () => {
      socket.off('chatMessage', handleChatMessage);
      socket.off('protocol', handleProtocol);
      socket.off('request', handleRequest);
      socket.off('battleEnd', handleBattleEnd);
      socket.off('timerUpdate', handleTimerUpdate);
      socket.off('spectateJoined', handleSpectateJoined);
    };
  }, [decodedRoomId, triggerUpdate]);

  const handleInitScene = useCallback(
    (el: HTMLElement) => {
      if (session && !sceneInitialized.current) {
        session.initScene(el, side === 'p1' ? 0 : 1);
        sceneInitialized.current = true;
        triggerUpdate();
      }
    },
    [session, side, triggerUpdate],
  );

  const handleMakeChoice = useCallback(
    (choice: string) => {
      const socket = getGlobalSocket();
      if (socket && session) {
        socket.emit('makeChoice', { roomId: decodedRoomId, choice });
        session.isWaitingForChoice = false;
        session.currentRequest = null;
        session.resumeAfterChoice();
        triggerUpdate();
      }
    },
    [session, decodedRoomId, triggerUpdate],
  );

  const { activeMechanic, setActiveMechanic, makeChoiceWithMechanic } = useChoiceMechanics(
    useCallback((choice: string) => handleMakeChoice(choice), [handleMakeChoice])
  );

  const handleUndo = useCallback(() => {
    const socket = getGlobalSocket();
    if (socket) socket.emit('undoChoice', { roomId: decodedRoomId });
  }, [decodedRoomId]);

  const handleSendChat = useCallback(
    (message: string) => {
      const socket = getGlobalSocket();
      if (socket) socket.emit('chatMessage', { roomId: decodedRoomId, message });
    },
    [decodedRoomId],
  );

  const handleForfeit = useCallback(() => {
    if (confirm('Are you sure you want to forfeit?')) {
      const socket = getGlobalSocket();
      if (socket) socket.emit('forfeit', { roomId: decodedRoomId });
    }
  }, [decodedRoomId]);

  const state = session?.getState();
  const bsx = useBSXLayout(state ?? null);
  const [aimingFoe, setAimingFoe] = useState(false);

  const pov = state ? (side === 'p1' ? 0 : 1) : 0;
  const opponentName = pov === 0 ? (state?.battle.p2?.name || 'Opponent') : (state?.battle.p1?.name || 'Opponent');

  if (!session || !state) {
    return <BattleConnectionState kind="loading" message={t('connection.loadingBattle')} backHref="/battlesim/pvp" />;
  }

  if (state.status === 'error') {
    return <BattleConnectionState kind="error" message={state.error ?? t('connection.unknownError')} backHref="/battlesim/pvp" />;
  }

  const timersActive = !!state.timerState && state.status === 'active';
  const header = (
    <BattleHeader
      mode="pvp"
      backHref="/battlesim/pvp"
      roomId={`${decodedRoomId.slice(0, 8)}...`}
      opponentName={opponentName}
      timerP1={timersActive ? Math.ceil(state.timerState!.p1.turnRemaining / 1000) : undefined}
      timerP2={timersActive ? Math.ceil(state.timerState!.p2.turnRemaining / 1000) : undefined}
      showForfeit={state.status === 'active'}
      onForfeit={handleForfeit}
      isFullscreen={isFullscreen}
      onToggleFullscreen={toggleFullscreen}
    />
  );

  const rail = (
    <LogChatRail
      ticks={bsx.bsxTicks}
      maxHeight={canvasWidth * ASPECT_RATIO * 0.82}
      chat={{
        messages: chatMessages,
        onSend: handleSendChat,
        disabled: state.status !== 'active',
      }}
    />
  );

  const dock = (
    <BattleActionDock
      bsx={bsx}
      status={state.status}
      isWaiting={state.isWaitingForChoice}
      htmlLog={state.htmlLog}
      onChoice={handleMakeChoice}
      onUndo={handleUndo}
      onAimMove={(i) => setAimingFoe(i != null)}
      onMoveChoice={(i) => makeChoiceWithMechanic(`move ${i}`)}
      activeMechanic={activeMechanic}
      setActiveMechanic={setActiveMechanic}
    />
  );

  const postBattle = state.status === 'finished' ? (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="text-center">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
          {state.winner === (pov === 0 ? state.battle.p1?.name : state.battle.p2?.name)
            ? t('end.youWon')
            : state.winner === 'tie'
              ? t('end.itsATie')
              : t('end.playerWon', { name: state.winner ?? '' })}
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
      <Link href="/battlesim/pvp"
        className="px-6 py-2 rounded-md font-medium transition-colors"
        style={{ background: 'var(--accent)', color: 'var(--text)', border: '1px solid var(--border)' }}>
        {t('end.playAgain')}
      </Link>
    </div>
  ) : null;

  return (
    <GameStageLayout ref={fullscreenRef} header={header} rail={rail} dock={dock} footer={postBattle} fullscreen={isFullscreen}>
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
          canvasWidth={isFullscreen ? window.innerWidth : undefined}
          fullscreen={isFullscreen}
        />
      </BattleStage>
    </GameStageLayout>
  );
}

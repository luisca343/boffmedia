'use client';

import { useToolT, BATTLESIM_NS } from '../i18n';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Protocol } from '@pkmn/protocol';
import { BattleSession } from '../engine/BattleSession';
import { BattleConnectionState } from '../components/BattleConnectionState';
import type { ChatPanelMessage } from '../components/ChatPanel';
import { useBsimNav, useBsimBackOrHub } from '../nav';
import { Button } from '@boffmedia/ui';
import { LiveBattle } from '../components/LiveBattle';
import { BSIM_FORMATS } from '../lib/bsim-data';
import { toId } from '../lib/bx-helpers';
import type { EndAction } from '../lib/battle-types';
import { usePvpSocket } from './PvpSocketProvider';

export function BsimPvpRoomView() {
  // The address comes from the nav seam, not from a route prop: the
  // launcher has no router to supply one, and `params: Promise<...>` is a
  // Next App Router signature this package must not depend on.
  const nav = useBsimNav();
  const backOrHub = useBsimBackOrHub();
  const roomid = nav.params.roomId ?? "";
  const decodedRoomId = decodeURIComponent(roomid);
  const t = useToolT(BATTLESIM_NS);
  // The socket belongs to the provider above the screen switch, not to this
  // mount: the lobby opened it, and navigating here must not have closed it.
  // `connection` / `opponentConnected` are what the shell shows mid-battle.
  // `pvp` also carries `connection` and `opponentConnected` for the shell to
  // show mid-battle — see PvpSocketProvider for what each value means.
  const pvp = usePvpSocket();
  const { socket, connection, getRoomSession, setRoomSession, getRoomSide, connect: connectPvp } = pvp;

  // A deep link straight into a room (a reload, a restored address) arrives with
  // no socket at all, because nothing opened one. Ask for it here too.
  useEffect(() => { void connectPvp(); }, [connectPvp]);

  const [session, setSession] = useState<BattleSession | null>(null);
  const [side, setSide] = useState<'p1' | 'p2'>('p1');
  const [chatMessages, setChatMessages] = useState<ChatPanelMessage[]>([]);
  const [, forceUpdate] = useState(0);
  const sceneInitialized = useRef(false);

  const triggerUpdate = useCallback(() => { forceUpdate((n) => n + 1); }, []);

  useEffect(() => {
    if (!socket) return;

    const storedSide = getRoomSide(decodedRoomId);
    if (storedSide) setSide(storedSide);

    let sess = getRoomSession(decodedRoomId);
    if (!sess) {
      // The PvP server paces this battle exactly as Showdown does — it will not
      // send the next turn until both players have chosen — so the viewer must
      // not be the brake. Without this, anything that arrives while you are
      // still deciding (most importantly the opponent forfeiting, or the
      // battle ending) is queued behind your own choice and never shown.
      sess = new BattleSession(decodedRoomId, {
        onUpdate: triggerUpdate, onRequest: () => triggerUpdate(), onBattleEnd: () => triggerUpdate(),
      });
      sess.livePaced = true;
      sess.status = 'active';
      setRoomSession(decodedRoomId, sess);
    } else {
      sess.callbacks = { onUpdate: triggerUpdate, onRequest: () => triggerUpdate(), onBattleEnd: () => triggerUpdate() };
    }
    setSession(sess);

    const handleProtocol = (data: { roomId: string; line: string }) => {
      if (data.roomId === decodedRoomId) { sess.addLine(data.line); triggerUpdate(); }
    };
    const handleRequest = (data: { roomId: string; request: Protocol.Request }) => {
      if (data.roomId === decodedRoomId) { sess.handleRequest(data.request); triggerUpdate(); }
    };
    const handleBattleEnd = (data: { roomId: string; winner: string; replay: string; replayId?: number }) => {
      if (data.roomId === decodedRoomId) {
        sess.winner = data.winner; sess.replay = data.replay; sess.replayId = data.replayId ?? null;
        sess.status = 'finished'; sess.battleComplete = true; sess.isWaitingForChoice = false; sess.currentRequest = null;
        (sess.battle as any).winner = data.winner; triggerUpdate();
      }
    };
    const handleTimerUpdate = (data: { roomId: string; p1: any; p2: any; activeSide: any }) => {
      if (data.roomId === decodedRoomId) { sess.timerState = { p1: data.p1, p2: data.p2, activeSide: data.activeSide }; triggerUpdate(); }
    };
    const handleChatMessage = (data: { roomId: string; sender: string; message: string; timestamp: number }) => {
      if (data.roomId === decodedRoomId) setChatMessages((prev) => [...prev, { sender: data.sender, message: data.message, timestamp: data.timestamp }]);
    };
    const handleSpectateJoined = (data: { roomId: string; replay: string; status: string; currentRequest?: Protocol.Request | null }) => {
      if (data.roomId === decodedRoomId && data.replay) {
        for (const line of data.replay.split('\n')) if (line.trim()) sess.addLine(line);
        if (data.currentRequest) sess.handleRequest(data.currentRequest);
        triggerUpdate();
      }
    };

    socket.on('chatMessage', handleChatMessage);
    socket.on('protocol', handleProtocol);
    socket.on('request', handleRequest);
    socket.on('battleEnd', handleBattleEnd);
    socket.on('timerUpdate', handleTimerUpdate);
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
  }, [socket, decodedRoomId, triggerUpdate, getRoomSession, setRoomSession, getRoomSide]);

  const handleInitScene = useCallback((el: HTMLElement) => {
    if (session && !sceneInitialized.current) {
      session.initScene(el, side === 'p1' ? 0 : 1);
      sceneInitialized.current = true;
      triggerUpdate();
    }
  }, [session, side, triggerUpdate]);

  const handleMakeChoice = useCallback((choice: string) => {
    if (socket && session) {
      socket.emit('makeChoice', { roomId: decodedRoomId, choice });
      session.isWaitingForChoice = false;
      session.currentRequest = null;
      session.resumeAfterChoice();
      triggerUpdate();
    }
  }, [socket, session, decodedRoomId, triggerUpdate]);

  const handleUndo = useCallback(() => {
    socket?.emit('undoChoice', { roomId: decodedRoomId });
  }, [socket, decodedRoomId]);

  const handleSendChat = useCallback((message: string) => {
    socket?.emit('chatMessage', { roomId: decodedRoomId, message });
  }, [socket, decodedRoomId]);

  const handleForfeit = useCallback(() => {
    socket?.emit('forfeit', { roomId: decodedRoomId });
  }, [socket, decodedRoomId]);

  const state = session?.getState();
  const pov: 0 | 1 = side === 'p1' ? 0 : 1;

  if (!session || !state) {
    // Two different waits wearing one face before: no socket yet (connecting)
    // and a socket with no protocol yet (joining the room).
    return (
      <BattleConnectionState
        kind={socket ? 'loading' : 'connecting'}
        message={socket ? t('connection.loadingBattle') : t('connection.connectingServer')}
      >
        <Button variant="ghost" onClick={backOrHub}>{t('connection.backToLobby')}</Button>
      </BattleConnectionState>
    );
  }
  // Not while the battle is over: the socket closing after the last turn is
  // housekeeping, not a failure the player needs a screen about.
  if (connection === 'lost' && state.status !== 'finished') {
    return (
      <BattleConnectionState
        kind="error"
        message={t('errors.connect_failed.lead')}
        onRetry={() => void connectPvp()}
      >
        <Button variant="ghost" onClick={backOrHub}>{t('connection.backToLobby')}</Button>
      </BattleConnectionState>
    );
  }
  if (state.status === 'error') {
    return (
      <BattleConnectionState kind="error" message={state.error ?? t('connection.unknownError')}>
        <Button variant="ghost" onClick={backOrHub}>{t('connection.backToLobby')}</Button>
      </BattleConnectionState>
    );
  }

  // The lobby pre-selects `format`; the room only knows the tier line, so it
  // is mapped back to a format id when one matches.
  const tier = String((state.battle as any).tier ?? '');
  const format = BSIM_FORMATS.find((f) => f.label === tier || f.value === toId(tier))?.value;
  const endActions: EndAction[] = [
    { id: 'rematch', label: t('battle.end.rematch'), variant: 'pri', icon: 'sword', onClick: () => nav.push('pvp', format ? { format } : {}) },
    ...(state.replayId ? [{ id: 'replay', label: t('battle.end.watchReplay'), variant: 'default' as const, icon: 'play' as const, onClick: () => nav.push('replayDetail', { id: String(state.replayId) }) }] : []),
    { id: 'lobby', label: t('battle.end.backToLobby'), variant: 'ghost', onClick: () => nav.replace('pvp', {}) },
  ];

  return (
    <LiveBattle
      state={state}
      pov={pov}
      mode="pvp"
      roomLabel={decodedRoomId.slice(0, 8)}
      formatLabel={format ? BSIM_FORMATS.find((f) => f.value === format)?.label : undefined}
      onChoice={handleMakeChoice}
      onUndo={handleUndo}
      onForfeit={handleForfeit}
      onBack={backOrHub}
      initScene={handleInitScene}
      chat={{ messages: chatMessages, onSend: handleSendChat, disabled: state.status !== 'active' }}
      endActions={endActions}
      banner={connection === 'reconnecting' ? (
        <p role="status" className="m-0 flex items-center gap-2 border-b border-solid border-warn bg-warn-soft px-3 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt">
          <i aria-hidden className="h-2 w-2 bg-warn [clip-path:circle(50%)] animate-[bm-pulse_1.4s_ease-in-out_infinite] motion-reduce:animate-none" />{t('battle.header.connecting')}
        </p>
      ) : undefined}
    />
  );
}

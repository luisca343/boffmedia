'use client';

/**
 * One PvP battle, on the stream the provider is already receiving.
 *
 * This screen used to be the socket's subscriber: it attached `protocol`,
 * `request`, `battleEnd`, `timerUpdate` and `spectateJoined` handlers in an
 * effect whose dependencies included the provider's context value, and emitted
 * `spectate` every time that effect re-ran. Three bugs lived in that one effect
 * (C1-C3): the opening request arrived before the listener existed, the replay
 * was `addLine`d onto an already-populated battle, and a transport flicker
 * re-joined the room. Ownership now sits in `PvpSocketProvider` / `PvpInbox`;
 * what is left here is "adopt a session, render it, send choices".
 */

import { useToolT, BATTLESIM_NS } from '../i18n';
import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { BattleSession } from '../engine/BattleSession';
import { BattleConnectionState } from '../components/BattleConnectionState';
import type { ChatPanelMessage } from '../components/ChatPanel';
import { useBsimNav, useBsimBackOrHub } from '../nav';
import { Button } from '@boffmedia/ui';
import { LiveBattle } from '../components/LiveBattle';
import { BSIM_FORMATS } from '../lib/bsim-data';
import { toId } from '../lib/bx-helpers';
import type { EndAction } from '../lib/battle-types';
import { usePvpActions, usePvpTransport } from './PvpSocketProvider';

export function BsimPvpRoomView() {
  // The address comes from the nav seam, not from a route prop: the
  // launcher has no router to supply one, and `params: Promise<...>` is a
  // Next App Router signature this package must not depend on.
  const nav = useBsimNav();
  const backOrHub = useBsimBackOrHub();
  const roomid = nav.params.roomId ?? "";
  const decodedRoomId = decodeURIComponent(roomid);
  const t = useToolT(BATTLESIM_NS);

  // Two hooks, deliberately: the ACTIONS never change identity (so the join
  // effect below keys on the socket and the room id and nothing else), while
  // the transport half re-renders the screen when the connection state moves.
  const actions = usePvpActions();
  const { socket, connection, connect: connectPvp } = usePvpTransport();
  const { getRoomSession, setRoomSession, getRoomSide, getRoom, attachSession, joinRoom, subscribeRoom } = actions;

  // A deep link straight into a room (a reload, a restored address) arrives with
  // no socket at all, because nothing opened one. Ask for it here too.
  useEffect(() => { void connectPvp(); }, [connectPvp]);

  const [session, setSession] = useState<BattleSession | null>(null);
  const [, forceUpdate] = useState(0);
  const sceneInitialized = useRef(false);

  const triggerUpdate = useCallback(() => { forceUpdate((n) => n + 1); }, []);

  // The inbox is the room's record; this is how a change to it reaches React.
  const subscribeToRoom = useCallback(
    (listener: () => void) => subscribeRoom(decodedRoomId, listener),
    [subscribeRoom, decodedRoomId],
  );
  // The inbox mutates its record in place, so `revision` is what changes.
  useSyncExternalStore(
    subscribeToRoom,
    () => getRoom(decodedRoomId)?.revision ?? 0,
    () => 0,
  );
  const room = getRoom(decodedRoomId);

  /**
   * Adopt (or create) the session, then enter the room's stream.
   *
   * `[socket, decodedRoomId]` and nothing else. This used to list five context
   * getters that were rebuilt on every transport status change, so a reconnect
   * banner appearing was enough to re-emit `spectate` and re-apply the replay.
   */
  useEffect(() => {
    if (!socket) return;

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
      sess.callbacks = { ...sess.callbacks, onUpdate: triggerUpdate, onRequest: () => triggerUpdate(), onBattleEnd: () => triggerUpdate() };
    }
    setSession(sess);

    // Everything buffered for this room — the opening `|player|`/`|request|`
    // lines most of all — is delivered by this call, in order, through
    // `acceptFrame`. `onGap` is wired by the inbox, not here.
    attachSession(decodedRoomId, sess);
    // The stored side is a HINT for the first paint only; `resumed.side` /
    // `spectateJoined.side` is what actually reaches `setViewerSide` (H6).
    joinRoom(decodedRoomId, getRoomSide(decodedRoomId));
  }, [socket, decodedRoomId, triggerUpdate, getRoomSession, setRoomSession, getRoomSide, attachSession, joinRoom]);

  // The server's word, falling back to the stored hint until it speaks.
  const side = room?.side ?? getRoomSide(decodedRoomId) ?? 'p1';
  const pov: 0 | 1 = side === 'p2' ? 1 : 0;

  const handleInitScene = useCallback((el: HTMLElement) => {
    if (session && !sceneInitialized.current) {
      session.initScene(el, pov);
      sceneInitialized.current = true;
      triggerUpdate();
    }
  }, [session, pov, triggerUpdate]);

  /**
   * The choice, with the rqid of the request it answers.
   *
   * Through the session rather than a bare `socket.emit`: the rqid lives on the
   * request the session is currently prompting for, and a choice without one is
   * accepted by the server for whatever turn it happens to be on (H2). A
   * rejected choice comes back as `error { code: 'stale_choice' }` and the
   * inbox re-prompts.
   */
  const handleMakeChoice = useCallback((choice: string) => {
    if (!socket || !session) return;
    session.makeChoice(choice, socket);
    triggerUpdate();
  }, [socket, session, triggerUpdate]);

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
  const chatMessages: ChatPanelMessage[] = room?.chat ?? [];

  if (!session || !state) {
    // Three different waits wearing one face before: no socket yet
    // (connecting), a socket with no protocol yet (joining the room), and
    // waiting on the server's copy of a battle we have lost frames from
    // (resyncing) — which is NOT "reconnecting", because the connection is up
    // and the chat is still arriving.
    return (
      <BattleConnectionState
        kind={!socket ? 'connecting' : room?.resyncing ? 'resyncing' : 'loading'}
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
  const tier = String((state.battle as any).tier ?? room?.format ?? '');
  const format = BSIM_FORMATS.find((f) => f.label === tier || f.value === toId(tier))?.value;
  // The replay button reads `replayId` — the row the gateway wrote for THIS
  // player — and is offered only when there is one. It used to read a `replay`
  // field the server has never sent, so the button was permanently dead (M2).
  const replayId = state.replayId ?? room?.replayId ?? null;
  const endActions: EndAction[] = [
    { id: 'rematch', label: t('battle.end.rematch'), variant: 'pri', icon: 'sword', onClick: () => nav.push('pvp', format ? { format } : {}) },
    ...(replayId ? [{ id: 'replay', label: t('battle.end.watchReplay'), variant: 'default' as const, icon: 'play' as const, onClick: () => nav.push('replayDetail', { id: String(replayId) }) }] : []),
    { id: 'lobby', label: t('battle.end.backToLobby'), variant: 'ghost', onClick: () => nav.replace('pvp', {}) },
  ];

  const notice = room?.resyncing
    ? t('battle.header.resyncing')
    : connection === 'reconnecting'
      ? t('battle.header.connecting')
      : null;

  return (
    <LiveBattle
      state={state}
      session={session}
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
      banner={notice ? (
        <p role="status" className="m-0 flex items-center gap-2 border-b border-solid border-warn bg-warn-soft px-3 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt">
          <i aria-hidden className="h-2 w-2 bg-warn [clip-path:circle(50%)] animate-[bm-pulse_1.4s_ease-in-out_infinite] motion-reduce:animate-none" />{notice}
        </p>
      ) : undefined}
    />
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useToolSession } from '@boffmedia/tool-kit';

import { attachListeners, waitForConnect } from './engine/battleSocket';
import { usePvpActions, usePvpTransport } from './pvp/PvpSocketProvider';
import type { BattleSession } from './engine/BattleSession';

export type MatchmakingStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'searching'
  | 'matchFound'
  | 'inBattle'
  | 'error';

export interface PendingChallenge {
  from: string;
  format: string;
}

/**
 * Things the server tells us that are worth a toast rather than a screen.
 *
 * Returned as one "last event" record with a monotonic `seq` instead of via
 * callbacks: the view renders the toast in an effect keyed on `seq`, so an
 * identical event twice in a row still fires, and the hook does not have to
 * carry the caller's presentation choices.
 */
export interface PvpNotice {
  seq: number;
  kind: 'challengeSent' | 'challengeRejected' | 'challengeAccepted';
  name: string;
}

/**
 * Matchmaking, on the socket the PvP provider owns.
 *
 * The hook used to open and close its own socket, which is why the battle room
 * — a different mount — never had one. Identity still comes from the ticket the
 * socket presents; there is no `register` handshake and no self-assigned client
 * id, which is precisely what used to make the identity forgeable.
 */
export function usePvPMatchmaking() {
  const { socket, connect: openSocket, error: socketError } = usePvpTransport();
  // Stable: the side is recorded through the provider so `PvpInbox` and the
  // room screen read the SAME value, rather than each keeping its own guess.
  const { setRoomSide } = usePvpActions();

  const [status, setStatus] = useState<MatchmakingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  // The name other players challenge you by. It IS the account, so it comes
  // from the session rather than from localStorage.
  const session = useToolSession();
  const playerId = session.user?.name ?? null;
  const [queueFormat, setQueueFormat] = useState<string | null>(null);
  /** Your place in the queue, as `queueJoined` reports it. */
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  /** When the current search started, for the elapsed timer. */
  const [queueStartedAt, setQueueStartedAt] = useState<number | null>(null);
  /** Server-side legality complaints, kept apart from transport errors: these
   *  have a different fix (edit the team) and belong in a banner, not a state. */
  const [teamProblems, setTeamProblems] = useState<string[]>([]);
  const [pendingChallenges, setPendingChallenges] = useState<PendingChallenge[]>([]);
  const [notice, setNotice] = useState<PvpNotice | null>(null);
  const [activeSession, setActiveSessionState] = useState<BattleSession | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<'p1' | 'p2' | null>(null);
  const seq = useRef(0);

  const setActiveSession = useCallback((next: BattleSession | null, roomId?: string) => {
    setActiveSessionState(next);
    if (roomId) setActiveRoomId(roomId);
  }, []);

  const push = useCallback((kind: PvpNotice['kind'], name: string) => {
    seq.current += 1;
    setNotice({ seq: seq.current, kind, name });
  }, []);

  /** Opens the shared socket. Idempotent — the provider dedupes. */
  const connect = useCallback(async () => {
    setStatus((s) => (s === 'idle' ? 'connecting' : s));
    const next = await openSocket();
    if (!next) setStatus('error');
    return next;
  }, [openSocket]);

  // The provider owns the transport, so a failure to open it is reported there.
  useEffect(() => {
    if (socketError) {
      setError(socketError);
      setStatus('error');
    }
  }, [socketError]);

  // Listeners follow the socket, not the mount: the provider's socket survives
  // a navigation, so re-subscribing has to be keyed on the instance.
  useEffect(() => {
    if (!socket) return;
    if (socket.connected) setStatus((s) => (s === 'searching' || s === 'inBattle' ? s : 'connected'));

    return attachListeners(socket, [
      ['connect', () => { setStatus((s) => (s === 'searching' || s === 'inBattle' ? s : 'connected')); setError(null); }],
      ['battleCreated', (data: { roomId: string; format: string; side?: 'p1' | 'p2' }) => {
        // The server states the side; the store is only a hint for the first
        // paint after a reload (H6).
        if (data.side === 'p1' || data.side === 'p2') setRoomSide(data.roomId, data.side);
        setActiveSide(data.side ?? 'p1');
        setActiveRoomId(data.roomId);
        setQueuePosition(null);
        setQueueStartedAt(null);
        setStatus('inBattle');
      }],
      ['queueJoined', (data: { format: string; position: number }) => {
        setQueueFormat(data.format);
        // Discarded before, so the queue panel had nothing to say beyond a
        // spinner. `getQueueSize` is 1-based on the server.
        setQueuePosition(Number.isFinite(data.position) ? data.position : null);
        setQueueStartedAt(Date.now());
        setStatus('searching');
        setError(null);
        setTeamProblems([]);
      }],
      ['queueLeft', () => { setQueueFormat(null); setQueuePosition(null); setQueueStartedAt(null); setStatus('connected'); }],
      ['challengeReceived', (data: { from: string; format: string }) => {
        setPendingChallenges((prev) => [...prev.filter((c) => c.from !== data.from), { from: data.from, format: data.format }]);
      }],
      ['challengeSent', (data: { to?: string }) => { setError(null); push('challengeSent', data?.to ?? ''); }],
      ['challengeRejected', (data: { by: string }) => { push('challengeRejected', data.by); setError(`rejected_by:${data.by}`); setTimeout(() => setError(null), 6000); }],
      ['teamRejected', (data: { problems: string[] }) => {
        setTeamProblems(Array.isArray(data?.problems) ? data.problems : []);
        setStatus('connected');
        setQueueStartedAt(null);
        setQueuePosition(null);
      }],
      ['resumed', (data: { roomId: string; side: 'p1' | 'p2' }) => {
        if (data.side === 'p1' || data.side === 'p2') setRoomSide(data.roomId, data.side);
        setActiveSide(data.side);
        setActiveRoomId(data.roomId);
        setStatus('inBattle');
      }],
      // The server sends a CODE, never an internal message.
      ['error', (data: { code?: string }) => { setError(data?.code ?? 'unknown'); setTimeout(() => setError(null), 6000); }],
      ['disconnect', () => { setStatus((s) => (s === 'inBattle' ? s : 'idle')); }],
    ]);
  }, [socket, push, setRoomSide]);

  const joinQueue = useCallback(async (format: string, team?: string) => {
    setTeamProblems([]);
    const next = await connect();
    if (!next) return;
    if (!next.connected) {
      try {
        await waitForConnect(next, 8000);
      } catch {
        setStatus('error');
        setError('connect_failed');
        return;
      }
    }
    next.emit('joinQueue', { format, team });
  }, [connect]);

  const leaveQueue = useCallback(() => {
    socket?.emit('leaveQueue');
    setQueueFormat(null);
    setQueuePosition(null);
    setQueueStartedAt(null);
    setStatus(socket?.connected ? 'connected' : 'idle');
  }, [socket]);

  const challengePlayer = useCallback(async (targetName: string, format: string, team?: string) => {
    setTeamProblems([]);
    const next = await connect();
    if (!next) return;
    next.emit('challengePlayer', { targetName, format, team });
  }, [connect]);

  const acceptChallenge = useCallback(async (fromName: string, team?: string) => {
    const next = await connect();
    if (!next) return;
    next.emit('acceptChallenge', { fromName, team });
    setPendingChallenges((prev) => prev.filter((c) => c.from !== fromName));
    push('challengeAccepted', fromName);
  }, [connect, push]);

  const rejectChallenge = useCallback(async (fromName: string) => {
    const next = await connect();
    if (!next) return;
    next.emit('rejectChallenge', { fromName });
    setPendingChallenges((prev) => prev.filter((c) => c.from !== fromName));
  }, [connect]);

  /**
   * Forfeit from the LOBBY (a stale room the player wants rid of).
   *
   * There is deliberately no `makeChoice` here any more: a choice has to carry
   * the `rqid` of the request it answers, that rqid lives on the session, and
   * the session belongs to the room screen — so `session.makeChoice(choice,
   * socket)` is the only correct way to send one (H2). A second, rqid-less
   * path on this hook was an invitation to submit a choice the server would
   * accept for whichever turn it happened to be on.
   */
  const forfeit = useCallback((roomId: string) => {
    socket?.emit('forfeit', { roomId });
  }, [socket]);

  return {
    status,
    error,
    playerId,
    queueFormat,
    queuePosition,
    queueStartedAt,
    teamProblems,
    notice,
    pendingChallenges,
    activeSession,
    activeRoomId,
    activeSide,
    connect,
    joinQueue,
    leaveQueue,
    challengePlayer,
    acceptChallenge,
    rejectChallenge,
    forfeit,
    setActiveSession,
  };
}

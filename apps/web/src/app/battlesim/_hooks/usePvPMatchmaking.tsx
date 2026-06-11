'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { BattleSession } from '../_utils/BattleSession';
import { getOrCreateSocket, registerListenersOnce, waitForConnect } from '../_utils/battleSocket';

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

export function usePvPMatchmaking() {
  const socketRef = useRef<Socket | null>(null);

  const [status, setStatus] = useState<MatchmakingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [queueFormat, setQueueFormat] = useState<string | null>(null);
  const [pendingChallenges, setPendingChallenges] = useState<PendingChallenge[]>([]);
  const [activeSession, setActiveSessionState] = useState<BattleSession | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<'p1' | 'p2' | null>(null);

  const setActiveSession = useCallback((session: BattleSession | null, roomId?: string) => {
    setActiveSessionState(session);
    if (roomId) setActiveRoomId(roomId);
  }, []);

  const connect = useCallback(() => {
    const socket = getOrCreateSocket('pvp');
    socketRef.current = socket;

    let clientId = localStorage.getItem('battlesim_client_id');
    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem('battlesim_client_id', clientId);
    }

    registerListenersOnce('pvp', [
      ['connect', () => { socket.emit('register', { clientId }); }],
      ['connected', (data: { playerId: string; reconnected?: boolean }) => { setPlayerId(data.playerId); setStatus('connected'); setError(null); }],
      ['battleCreated', (data: { roomId: string; format: string; mode?: string; side?: 'p1' | 'p2' }) => { if (data.mode === 'pvp' && data.side) { setActiveSide(data.side); } else { setActiveSide('p1'); } setActiveRoomId(data.roomId); setStatus('inBattle'); }],
      ['queueJoined', (data: { format: string; position: number }) => { setQueueFormat(data.format); setStatus('searching'); setError(null); }],
      ['queueLeft', () => { setQueueFormat(null); setStatus('connected'); }],
      ['queueStatus', (_data: Record<string, number>) => {}],
      ['challengeReceived', (data: { from: string; format: string }) => { setPendingChallenges((prev) => [...prev, { from: data.from, format: data.format }]); }],
      ['challengeSent', (_data: { to: string; format: string }) => {}],
      ['challengeRejected', (data: { by: string }) => { setError(`Challenge rejected by ${data.by}`); setTimeout(() => setError(null), 3000); }],
      ['error', (data: { message: string; roomId?: string }) => { setError(data.message); setTimeout(() => setError(null), 5000); }],
      ['disconnect', () => { setStatus('idle'); }],
    ]);
  }, []);

  const joinQueue = useCallback((format: string) => {
    connect();
    const socket = socketRef.current;
    if (!socket) return;

    if (!socket.connected) {
      waitForConnect(socket, 5000).then(() => { socket.emit('joinQueue', { format }); }).catch(() => {});
      return;
    }
    socket.emit('joinQueue', { format });
  }, [connect]);

  const leaveQueue = useCallback(() => {
    socketRef.current?.emit('leaveQueue');
    setQueueFormat(null);
    setStatus('connected');
  }, []);

  const challengePlayer = useCallback((targetPlayerId: string, format: string) => {
    socketRef.current?.emit('challengePlayer', { targetPlayerId, format });
  }, []);

  const acceptChallenge = useCallback((fromPlayerId: string) => {
    socketRef.current?.emit('acceptChallenge', { fromPlayerId });
    setPendingChallenges((prev) => prev.filter((c) => c.from !== fromPlayerId));
  }, []);

  const rejectChallenge = useCallback((fromPlayerId: string) => {
    socketRef.current?.emit('rejectChallenge', { fromPlayerId });
    setPendingChallenges((prev) => prev.filter((c) => c.from !== fromPlayerId));
  }, []);

  const makeChoice = useCallback((roomId: string, choice: string) => {
    socketRef.current?.emit('makeChoice', { roomId, choice });
  }, []);

  const forfeit = useCallback((roomId: string) => {
    socketRef.current?.emit('forfeit', { roomId });
  }, []);

  return {
    status,
    error,
    playerId,
    queueFormat,
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
    makeChoice,
    forfeit,
    setActiveSession,
  };
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env.public';
import { BattleSession } from '../_utils/BattleSession';

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

function getGlobalSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  return (window as any).__pvp_socket ?? null;
}
function setGlobalSocket(socket: Socket | null) {
  if (typeof window === 'undefined') return;
  (window as any).__pvp_socket = socket;
}
function getEventsRegistered(): boolean {
  if (typeof window === 'undefined') return false;
  return (window as any).__pvp_events_registered ?? false;
}
function setEventsRegistered(val: boolean) {
  if (typeof window === 'undefined') return;
  (window as any).__pvp_events_registered = val;
}

export function usePvPMatchmaking() {
  const socketRef = useRef<Socket | null>(getGlobalSocket());

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
    const existing = getGlobalSocket();
    if (existing?.connected) {
      socketRef.current = existing;
      setStatus('connected');
      return;
    }
    if (existing) {
      existing.connect();
      socketRef.current = existing;
      return;
    }

    setStatus('connecting');
    const API_BASE_URL = env.NEXT_PUBLIC_API;
    let clientId = localStorage.getItem('battlesim_client_id');
    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem('battlesim_client_id', clientId);
    }

    const socket = io(`${API_BASE_URL}/battle`);
    setGlobalSocket(socket);
    socketRef.current = socket;

    if (!getEventsRegistered()) {
      setEventsRegistered(true);

      socket.on('connect', () => {
        socket.emit('register', { clientId });
      });

      socket.on('connected', (data: { playerId: string; reconnected?: boolean }) => {
        setPlayerId(data.playerId);
        setStatus('connected');
        setError(null);
      });

      socket.on('battleCreated', (data: { roomId: string; format: string; mode?: string; side?: 'p1' | 'p2' }) => {
        if (data.mode === 'pvp' && data.side) {
          setActiveSide(data.side);
        } else {
          setActiveSide('p1');
        }
        setActiveRoomId(data.roomId);
        setStatus('inBattle');
      });

      socket.on('queueJoined', (data: { format: string; position: number }) => {
        setQueueFormat(data.format);
        setStatus('searching');
        setError(null);
      });

      socket.on('queueLeft', () => {
        setQueueFormat(null);
        setStatus('connected');
      });

      socket.on('queueStatus', (_data: Record<string, number>) => {});

      socket.on('challengeReceived', (data: { from: string; format: string }) => {
        setPendingChallenges((prev) => [...prev, { from: data.from, format: data.format }]);
      });

      socket.on('challengeSent', (_data: { to: string; format: string }) => {});

      socket.on('challengeRejected', (data: { by: string }) => {
        setError(`Challenge rejected by ${data.by}`);
        setTimeout(() => setError(null), 3000);
      });

      socket.on('error', (data: { message: string; roomId?: string }) => {
        setError(data.message);
        setTimeout(() => setError(null), 5000);
      });

      socket.on('disconnect', () => {
        setStatus('idle');
      });
    }
  }, []);

  const joinQueue = useCallback((format: string) => {
    if (!socketRef.current?.connected) {
      connect();
      setTimeout(() => {
        socketRef.current?.emit('joinQueue', { format });
      }, 500);
      return;
    }
    socketRef.current.emit('joinQueue', { format });
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

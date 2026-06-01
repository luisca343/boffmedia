'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Protocol } from '@pkmn/protocol';
import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env.public';
import { BattleSession, BattleSessionState } from '../_utils/BattleSession';

// Singleton socket — survives React strict mode
function getGlobalSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  return (window as any).__battlesim_socket ?? null;
}
function setGlobalSocket(socket: Socket | null) {
  if (typeof window === 'undefined') return;
  (window as any).__battlesim_socket = socket;
}
function getEventsRegistered(): boolean {
  if (typeof window === 'undefined') return false;
  return (window as any).__battlesim_events_registered ?? false;
}
function setEventsRegistered(val: boolean) {
  if (typeof window === 'undefined') return;
  (window as any).__battlesim_events_registered = val;
}

export function useLiveBattleManager() {
  const socketRef = useRef<Socket | null>(getGlobalSocket());
  const sessionsRef = useRef<Map<string, BattleSession>>(new Map());
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const triggerUpdate = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  const getSession = useCallback((roomId: string): BattleSession | undefined => {
    return sessionsRef.current.get(roomId);
  }, []);

  const getActiveSession = useCallback((): BattleSession | undefined => {
    if (!activeRoomId) return undefined;
    return sessionsRef.current.get(activeRoomId);
  }, [activeRoomId]);

  const connect = useCallback(() => {
    const existing = getGlobalSocket();
    if (existing?.connected) {
      socketRef.current = existing;
      return;
    }
    if (existing) {
      existing.connect();
      socketRef.current = existing;
      return;
    }

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

      socket.on('connected', () => {});

      socket.on('battleCreated', (data: { roomId: string; format: string }) => {
        const session = sessionsRef.current.get(data.roomId);
        if (session) {
          session.status = 'active';
          triggerUpdate();
        }
      });

      socket.on('protocol', (data: { roomId: string; line: string }) => {
        const session = sessionsRef.current.get(data.roomId);
        if (session) {
          session.addLine(data.line);
        }
      });

      socket.on('request', (data: { roomId: string; request: Protocol.Request }) => {
        const session = sessionsRef.current.get(data.roomId);
        if (session) {
          session.handleRequest(data.request);
          triggerUpdate();
        }
      });

      socket.on('battleEnd', (data: { roomId: string; winner: string; replay: string; replayId?: number }) => {
        const session = sessionsRef.current.get(data.roomId);
        if (session) {
          session.winner = data.winner;
          session.replay = data.replay;
          session.replayId = data.replayId ?? null;
          session.status = 'finished';
          session.isWaitingForChoice = false;
          session.currentRequest = null;
          session.battleComplete = true;
          // Set battle.winner so BattleEndScreen can determine the result
          (session.battle as any).winner = data.winner;
          triggerUpdate();
        }
      });

      socket.on('timerUpdate', (data: { roomId: string; p1: any; p2: any; activeSide: any }) => {
        const session = sessionsRef.current.get(data.roomId);
        if (session) {
          session.timerState = { p1: data.p1, p2: data.p2, activeSide: data.activeSide };
          triggerUpdate();
        }
      });

      socket.on('error', (data: { message: string; roomId?: string }) => {
        if (data.roomId) {
          const session = sessionsRef.current.get(data.roomId);
          if (session) {
            session.error = data.message;
            session.status = 'error';
            triggerUpdate();
          }
        }
      });

      socket.on('disconnect', () => {});
    }
  }, [triggerUpdate]);

  const createBattle = useCallback((format?: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      connect();
      const checkConnected = setInterval(() => {
        if (socketRef.current?.connected) {
          clearInterval(checkConnected);
          doCreate(socketRef.current!, format);
        }
      }, 100);
      setTimeout(() => clearInterval(checkConnected), 5000);
      return;
    }
    doCreate(socket, format);
  }, [connect, triggerUpdate]);

  const doCreate = useCallback((socket: Socket, format?: string) => {
    // Generate roomId client-side so we can create the session immediately
    const roomId = crypto.randomUUID();

    const session = new BattleSession(roomId, {
      onUpdate: triggerUpdate,
      onRequest: () => triggerUpdate(),
      onBattleEnd: () => triggerUpdate(),
    });
    session.status = 'connecting';
    sessionsRef.current.set(roomId, session);
    setActiveRoomId(roomId);
    triggerUpdate();

    // Tell server to create with this roomId
    socket.emit('createBattle', { format: format || 'gen9randombattle', roomId });
  }, [triggerUpdate]);

  const switchTab = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
  }, []);

  const closeTab = useCallback((roomId: string) => {
    const session = sessionsRef.current.get(roomId);
    if (session && session.status === 'active') {
      session.forfeit(socketRef.current!);
    }
    sessionsRef.current.delete(roomId);
    if (activeRoomId === roomId) {
      const remaining = Array.from(sessionsRef.current.keys());
      setActiveRoomId(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
    triggerUpdate();
  }, [activeRoomId, triggerUpdate]);

  const makeChoice = useCallback((roomId: string, choice: string) => {
    const session = sessionsRef.current.get(roomId);
    if (session && socketRef.current) {
      session.makeChoice(choice, socketRef.current);
      triggerUpdate();
    }
  }, [triggerUpdate]);

  const forfeitBattle = useCallback((roomId: string) => {
    const session = sessionsRef.current.get(roomId);
    if (session && socketRef.current) {
      session.forfeit(socketRef.current);
    }
  }, []);

  const initSceneForRoom = useCallback((roomId: string, element: HTMLElement) => {
    const session = sessionsRef.current.get(roomId);
    if (session) {
      session.initScene(element);
      triggerUpdate();
    }
  }, [triggerUpdate]);

  return {
    sessions: sessionsRef.current,
    activeRoomId,
    activeSession: getActiveSession(),
    getSession,
    createBattle,
    switchTab,
    closeTab,
    connect,
    makeChoice,
    forfeit: forfeitBattle,
    initScene: initSceneForRoom,
  };
}

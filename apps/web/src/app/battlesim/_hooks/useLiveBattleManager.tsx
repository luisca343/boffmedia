'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Protocol } from '@pkmn/protocol';
import { Socket } from 'socket.io-client';
import { BattleSession, BattleSessionState } from '../_utils/BattleSession';
import { getOrCreateSocket, getSocket, registerListenersOnce, waitForConnect } from '../_utils/battleSocket';

export function useLiveBattleManager() {
  const socketRef = useRef<Socket | null>(getSocket('battle'));
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
    const socket = getOrCreateSocket('battle');
    socketRef.current = socket;

    let clientId = localStorage.getItem('battlesim_client_id');
    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem('battlesim_client_id', clientId);
    }

    registerListenersOnce('battle', [
      ['connect', () => { socket.emit('register', { clientId }); }],
      ['connected', () => {}],
      ['battleCreated', (data: { roomId: string; format: string }) => { const session = sessionsRef.current.get(data.roomId); if (session) { session.status = 'active'; triggerUpdate(); } }],
      ['protocol', (data: { roomId: string; line: string }) => { const session = sessionsRef.current.get(data.roomId); if (session) { session.addLine(data.line); triggerUpdate(); } }],
      ['request', (data: { roomId: string; request: Protocol.Request }) => { const session = sessionsRef.current.get(data.roomId); if (session) { session.handleRequest(data.request); triggerUpdate(); } }],
      ['battleEnd', (data: { roomId: string; winner: string; replay: string; replayId?: number }) => { const session = sessionsRef.current.get(data.roomId); if (session) { session.handleBattleEnd(data); triggerUpdate(); } }],
      ['timerUpdate', (data: { roomId: string; p1: any; p2: any; activeSide: any }) => { const session = sessionsRef.current.get(data.roomId); if (session) { session.timerState = { p1: data.p1, p2: data.p2, activeSide: data.activeSide }; triggerUpdate(); } }],
      ['error', (data: { message: string; roomId?: string }) => { if (data.roomId) { const session = sessionsRef.current.get(data.roomId); if (session) { session.error = data.message; session.status = 'error'; triggerUpdate(); } } }],
      ['disconnect', () => {}],
    ]);
  }, [triggerUpdate]);

  const createBattle = useCallback((format?: string) => {
    connect();
    const socket = socketRef.current;
    if (!socket) return;

    if (!socket.connected) {
      waitForConnect(socket, 5000).then(() => doCreate(socket, format)).catch(() => {});
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

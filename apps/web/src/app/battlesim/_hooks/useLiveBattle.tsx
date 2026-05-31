'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Battle } from '@pkmn/client';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { Protocol } from '@pkmn/protocol';
import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import { env } from '@/config/env.public';
import { Scene } from '../_utils/Scene';
import { useBattleFlow } from './useBattleFlow';

// Battle store — same pattern as useGameState.tsx
// Zustand triggers re-renders even when the object reference is the same
// (React useState bails out on same reference, skipping status bar updates)
interface LiveBattleStore {
  battle: Battle;
  setBattle: (battle: Battle) => void;
}
const useLiveBattleStore = create<LiveBattleStore>((set) => ({
  battle: new Battle(new Generations(Dex as any) as any),
  setBattle: (battle: Battle) => set({ battle }),
}));

// Use window to store socket — survives React strict mode and module boundaries
// Guard against SSR where window doesn't exist
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

export type LiveBattleStatus = 'idle' | 'connecting' | 'active' | 'finished' | 'error';

export interface LiveBattleState {
  roomId: string | null;
  status: LiveBattleStatus;
  battle: Battle;
  scene: Scene | null;
  currentRequest: Protocol.Request | null;
  isWaitingForChoice: boolean;
  htmlLog: string[];
  messageBar: string[];
  winner: string | null;
  replay: string | null;
  error: string | null;
}

export function useLiveBattle() {
  const socketRef = useRef<Socket | null>(getGlobalSocket());
  const roomIdRef = useRef<string | null>(null);
  const battleRef = useRef<Battle>(new Battle(new Generations(Dex as any) as any));
  const { battle, setBattle } = useLiveBattleStore();
  const [scene, setScene] = useState<Scene | null>(null);
  const [roomId, setRoomIdRaw] = useState<string | null>(null);
  const [status, setStatus] = useState<LiveBattleStatus>('idle');

  const setRoomId = useCallback((id: string | null) => {
    roomIdRef.current = id;
    setRoomIdRaw(id);
  }, []);
  const [currentRequest, setCurrentRequest] = useState<Protocol.Request | null>(null);
  const [isWaitingForChoice, setIsWaitingForChoice] = useState(false);
  const [htmlLog, setHtmlLog] = useState<string[]>([]);
  const [messageBar, setMessageBar] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [replay, setReplay] = useState<string | null>(null);
  const [replayId, setReplayId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timerState, setTimerState] = useState<{
    p1: { turnRemaining: number; totalRemaining: number };
    p2: { turnRemaining: number; totalRemaining: number };
    activeSide: 'p1' | 'p2' | null;
  } | null>(null);
  const [animateMode, setAnimateMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('battlesim_animate_mode');
    return stored !== 'instant';
  });

  // useBattleFlow in live mode
  const battleFlow = useBattleFlow(
    battle,
    setBattle,
    null, // battleLog — not used in live mode
    0, // currentAction — not used in live mode
    scene,
    false, // isPlaying — not used in live mode
    0, // newTurn
    0, // lastTurn
    false, // settingTurn
    0, // pov
    () => {}, // setCurrentAction — not used in live mode
    setHtmlLog,
    () => {}, // setIsPlaying — not used in live mode
    setMessageBar,
    () => {}, // setSettingTurn — not used in live mode
    {
      liveMode: true,
      animateMode,
      onRequest: (request) => {
        setCurrentRequest(request);
        setIsWaitingForChoice(true);
      },
      onBattleEnd: (w) => {
        setWinner(w);
        setStatus('finished');
      },
      isWaitingForChoice,
      setIsWaitingForChoice,
    },
  );

  const toggleAnimateMode = useCallback(() => {
    setAnimateMode((prev) => {
      const next = !prev;
      localStorage.setItem('battlesim_animate_mode', next ? 'animated' : 'instant');
      return next;
    });
  }, []);

  const initScene = useCallback((gameElement: HTMLElement) => {
    if (!scene && gameElement) {
      const battleScene = new Scene(battle, gameElement);
      setScene(battleScene);
    }
  }, [battle, scene]);

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
    setStatus('connecting');
    setError(null);
    const API_BASE_URL = env.NEXT_PUBLIC_API;
    // Send a stable clientId so server recognizes us across reconnects
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

      socket.on('connected', (data: { playerId: string }) => {
      });

      socket.on('battleCreated', (data: { roomId: string; format: string }) => {
        setRoomId(data.roomId);
        setStatus('active');
      });

      socket.on('protocol', (data: { roomId: string; line: string }) => {
        battleFlow.addLine(data.line);
      });

      socket.on('request', (data: { roomId: string; request: Protocol.Request }) => {
        setCurrentRequest(data.request);
        setIsWaitingForChoice(true);
      });

      socket.on('battleEnd', (data: { roomId: string; winner: string; replay: string; replayId?: number }) => {
        setWinner(data.winner);
        setReplay(data.replay);
        setReplayId(data.replayId ?? null);
        setStatus('finished');
      });

      socket.on('timerUpdate', (data: { roomId: string; p1: { turnRemaining: number; totalRemaining: number }; p2: { turnRemaining: number; totalRemaining: number }; activeSide: 'p1' | 'p2' | null }) => {
        setTimerState({ p1: data.p1, p2: data.p2, activeSide: data.activeSide });
      });

      socket.on('error', (data: { message: string; roomId?: string }) => {
        console.error('[LiveBattle] Error:', data.message);
        setError(data.message);
      });

      socket.on('disconnect', () => {
      });
    }

    socket.on('connected', (data: { playerId: string }) => {
    });

    socket.on('battleCreated', (data: { roomId: string; format: string }) => {
      setRoomId(data.roomId);
      setStatus('active');
    });

    socket.on('protocol', (data: { roomId: string; line: string }) => {
      battleFlow.addLine(data.line);
    });

    socket.on('request', (data: { roomId: string; request: Protocol.Request }) => {
      setCurrentRequest(data.request);
      setIsWaitingForChoice(true);
    });

    socket.on('battleEnd', (data: { roomId: string; winner: string; replay: string; replayId?: number }) => {
      setWinner(data.winner);
      setReplay(data.replay);
      setReplayId(data.replayId ?? null);
      setStatus('finished');
    });

    socket.on('timerUpdate', (data: { roomId: string; p1: { turnRemaining: number; totalRemaining: number }; p2: { turnRemaining: number; totalRemaining: number }; activeSide: 'p1' | 'p2' | null }) => {
      setTimerState({ p1: data.p1, p2: data.p2, activeSide: data.activeSide });
    });

    socket.on('error', (data: { message: string; roomId?: string }) => {
      console.error('[LiveBattle] Error:', data.message);
      setError(data.message);
      setStatus('error');
    });

    socket.on('disconnect', () => {
      if (status === 'active') {
        setError('Disconnected from server');
      }
    });
  }, [battleFlow, status]);

  const createBattle = useCallback((format?: string) => {
    // Don't create if we already have a battle
    if (roomIdRef.current) {
      setStatus('active');
      return;
    }
    setTimerState(null);
    if (!socketRef.current?.connected) {
      connect();
      // Wait for connection, then create
      const checkConnected = setInterval(() => {
        if (socketRef.current?.connected) {
          clearInterval(checkConnected);
          socketRef.current.emit('createBattle', { format: format || 'gen9randombattle' });
        }
      }, 100);
      // Timeout after 5s
      setTimeout(() => clearInterval(checkConnected), 5000);
      return;
    }
    socketRef.current.emit('createBattle', { format: format || 'gen9randombattle' });
  }, [connect]);

  const makeChoice = useCallback((choice: string) => {
    const currentRoomId = roomIdRef.current;
    if (!socketRef.current?.connected || !currentRoomId) return;

    socketRef.current.emit('makeChoice', { roomId: currentRoomId, choice });
    setIsWaitingForChoice(false);
    setCurrentRequest(null);
    battleFlow.resumeAfterChoice();
  }, [battleFlow]);

  const forfeit = useCallback(() => {
    const currentRoomId = roomIdRef.current;
    if (!socketRef.current?.connected || !currentRoomId) return;

    socketRef.current.emit('forfeit', { roomId: currentRoomId });
  }, []);

  // No cleanup — socket persists across React strict mode mounts
  // Socket will be garbage collected when page navigates away

  return {
    // State
    roomId,
    status,
    battle,
    scene,
    currentRequest,
    isWaitingForChoice,
    htmlLog,
    messageBar,
    winner,
    replay,
    replayId,
    error,
    timerState,
    animateMode,

    // Actions
    createBattle,
    makeChoice,
    forfeit,
    connect,
    initScene,
    toggleAnimateMode,
  };
}

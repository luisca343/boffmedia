'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Battle } from '@pkmn/client';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { Protocol } from '@pkmn/protocol';
import { Socket } from 'socket.io-client';
import { create } from 'zustand';
import { Scene } from '../_utils/Scene';
import { useBattleFlow } from './useBattleFlow';
import { getOrCreateSocket, getSocket, registerListenersOnce, waitForConnect } from '../_utils/battleSocket';
import type { SocketChannel } from '../_utils/battleSocket';

// Battle store — same pattern as useGameState.tsx
interface LiveBattleStore {
  battle: Battle;
  setBattle: (battle: Battle) => void;
}
const useLiveBattleStore = create<LiveBattleStore>((set) => ({
  battle: new Battle(new Generations(Dex as any) as any),
  setBattle: (battle: Battle) => set({ battle }),
}));

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
  const socketRef = useRef<Socket | null>(getSocket('battle'));
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
  const [battleComplete, setBattleComplete] = useState(false);
  const [replay, setReplay] = useState<string | null>(null);
  const [replayId, setReplayId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timerState, setTimerState] = useState<{
    p1: { turnRemaining: number; totalRemaining: number };
    p2: { turnRemaining: number; totalRemaining: number };
    activeSide: 'p1' | 'p2' | null;
  } | null>(null);

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
    setBattleComplete,
    {
      liveMode: true,
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

  const initScene = useCallback((gameElement: HTMLElement) => {
    if (!scene && gameElement) {
      const battleScene = new Scene(battle, gameElement);
      setScene(battleScene);
    }
  }, [battle, scene]);

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
      ['connected', (_data: { playerId: string }) => {}],
      ['battleCreated', (data: { roomId: string; format: string }) => { setRoomId(data.roomId); setStatus('active'); }],
      ['protocol', (data: { roomId: string; line: string }) => { battleFlow.addLine(data.line); }],
      ['request', (data: { roomId: string; request: Protocol.Request }) => { setCurrentRequest(data.request); setIsWaitingForChoice(true); }],
      ['battleEnd', (data: { roomId: string; winner: string; replay: string; replayId?: number }) => { setWinner(data.winner); setReplay(data.replay); setReplayId(data.replayId ?? null); setStatus('finished'); }],
      ['timerUpdate', (data: { roomId: string; p1: { turnRemaining: number; totalRemaining: number }; p2: { turnRemaining: number; totalRemaining: number }; activeSide: 'p1' | 'p2' | null }) => { setTimerState({ p1: data.p1, p2: data.p2, activeSide: data.activeSide }); }],
      ['error', (data: { message: string; roomId?: string }) => { console.error('[LiveBattle] Error:', data.message); setError(data.message); }],
      ['disconnect', () => {}],
    ]);
  }, [battleFlow, status]);

  const createBattle = useCallback((format?: string) => {
    if (roomIdRef.current) {
      setStatus('active');
      return;
    }
    setTimerState(null);
    connect();
    const socket = socketRef.current;
    if (!socket) return;

    const emitCreate = () => {
      socket.emit('createBattle', { format: format || 'gen9randombattle' });
    };

    if (!socket.connected) {
      waitForConnect(socket, 5000).then(emitCreate).catch(() => {});
      return;
    }
    emitCreate();
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
    battleComplete,

    // Actions
    setBattleComplete,
    createBattle,
    makeChoice,
    forfeit,
    connect,
    initScene,
  };
}

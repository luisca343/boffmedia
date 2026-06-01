'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Protocol } from '@pkmn/protocol';
import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env.public';
import { ShowdownBaseSession, ChatMessage } from '../_utils/ShowdownBaseSession';

export interface ChallengeRequest {
  from: string;
  format: string;
  timestamp: number;
}

export type ShowdownStatus =
  | 'idle'
  | 'connecting'
  | 'authenticating'
  | 'authenticated'
  | 'joining'
  | 'active'
  | 'finished'
  | 'error'
  | 'reconnecting';

export interface ShowdownBattleState {
  roomId: string | null;
  status: ShowdownStatus;
  username: string | null;
  session: ShowdownBaseSession | null;
  chatMessages: ChatMessage[];
  error: string | null;
  reconnectInfo: { attempt: number; maxAttempts: number } | null;
}

const SHOWDOWN_SOCKET_KEY = '__showdown_socket';

function getGlobalSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  return (window as any)[SHOWDOWN_SOCKET_KEY] ?? null;
}

function setGlobalSocket(socket: Socket | null) {
  if (typeof window === 'undefined') return;
  (window as any)[SHOWDOWN_SOCKET_KEY] = socket;
}

const SHOWDOWN_SESSIONS_KEY = '__showdown_sessions';
function getGlobalSessions(): Map<string, ShowdownBaseSession> {
  if (typeof window === 'undefined') return new Map();
  if (!(window as any)[SHOWDOWN_SESSIONS_KEY]) {
    (window as any)[SHOWDOWN_SESSIONS_KEY] = new Map();
  }
  return (window as any)[SHOWDOWN_SESSIONS_KEY];
}

const SHOWDOWN_LINES_KEY = '__showdown_lines';
function getGlobalLines(): Map<string, string[]> {
  if (typeof window === 'undefined') return new Map();
  if (!(window as any)[SHOWDOWN_LINES_KEY]) {
    (window as any)[SHOWDOWN_LINES_KEY] = new Map();
  }
  return (window as any)[SHOWDOWN_LINES_KEY];
}

export const SHOWDOWN_USERNAME_KEY = '__showdown_username';
export function getGlobalUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return (window as any)[SHOWDOWN_USERNAME_KEY] ?? null;
}
function setGlobalUsername(name: string | null) {
  if (typeof window === 'undefined') return;
  (window as any)[SHOWDOWN_USERNAME_KEY] = name;
}

export interface UseShowdownBattleOptions {
  autoCreateSession?: boolean;
  onBattleFound?: (roomId: string) => void;
}

export function useShowdownBattle(
  roomId?: string,
  options?: UseShowdownBattleOptions,
) {
  const autoCreateSession = options?.autoCreateSession ?? true;
  const onBattleFoundRef = useRef(options?.onBattleFound);
  onBattleFoundRef.current = options?.onBattleFound;

  const socketRef = useRef<Socket | null>(getGlobalSocket());
  const sessionRef = useRef<ShowdownBaseSession | null>(null);
  const challstrRef = useRef<string>('');
  const joinedRoomsRef = useRef<Set<string>>(new Set());
  const statusRef = useRef<ShowdownStatus>('idle');

  const [status, setStatusState] = useState<ShowdownStatus>('idle');
  const setStatus = useCallback((s: ShowdownStatus) => {
    statusRef.current = s;
    setStatusState(s);
  }, []);

  const [username, setUsername] = useState<string | null>(null);
  const [session, setSession] = useState<ShowdownBaseSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [lobbyChat, setLobbyChat] = useState<ChatMessage[]>([]);
  const [challstr, setChallstr] = useState<string>('');
  const [challenges, setChallenges] = useState<ChallengeRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reconnectInfo, setReconnectInfo] = useState<{
    attempt: number;
    maxAttempts: number;
  } | null>(null);
  const [, forceUpdate] = useState(0);

  const triggerUpdate = useCallback(() => {
    forceUpdate((n) => n + 1);
    if (sessionRef.current) {
      setChatMessages([...sessionRef.current.chatMessages]);
    }
  }, []);

  const handleShowdownMessage = useCallback((data: string) => {
    let roomid = 'lobby';
    let messageData = data;

    if (messageData.charAt(0) === '>') {
      const nlIndex = messageData.indexOf('\n');
      if (nlIndex >= 0) {
        roomid = toRoomid(messageData.substring(1, nlIndex));
        messageData = messageData.substring(nlIndex + 1);
      }
    }

    const lines = messageData.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      const parsed = Protocol.parseLine(line) as any;
      if (!parsed) continue;

      const msgType = parsed[0];
      // Skip noisy message types
      const noisy = ['join', 'leave', 'c', 'c:'];
      if (!noisy.includes(msgType)) {
        console.log(`[Showdown] Processing [${roomid}]: ${msgType}`, parsed.slice(0, 3));
      }

      // Store all battle lines globally for replay
      if (roomid !== 'lobby' && roomid !== 'global') {
        const globalLines = getGlobalLines();
        if (!globalLines.has(roomid)) globalLines.set(roomid, []);
        globalLines.get(roomid)!.push(line);
      }

      switch (msgType) {
        case 'challstr': {
          challstrRef.current = parsed[1];
          setChallstr(parsed[1]);
          break;
        }

        case 'updateuser': {
          const newName = parsed[1]?.trim();
          const isGuest = !newName || newName.startsWith('Guest');
          if (!isGuest) {
            setUsername(newName);
            setStatus('authenticated');
            setGlobalUsername(newName);
            // Explicitly join lobby after login
            if (socketRef.current?.connected) {
              console.log('[Showdown] joining lobby after login');
              socketRef.current.emit('sendToShowdown', '|/join lobby');
            }
          } else {
            setUsername(newName || null);
            // Stay in current status — don't mark as authenticated for guests
          }
          break;
        }

        case 'updatesearch': {
          console.log('[Showdown] updatesearch:', parsed[1]);
          break;
        }

        case 'popup': {
          console.warn('[Showdown] PS popup:', parsed.slice(1));
          setError(`PS: ${parsed.slice(1).join(' ')}`);
          break;
        }

        case 'pm': {
          // |pm| SENDER|RECEIVER|MESSAGE|FORMAT|||
          const pmSender = (parsed[1] as string)?.trim();
          const pmMessage = (parsed[3] as string) || '';
          const pmFormat = (parsed[4] as string) || '';
          console.log('[Showdown] PM:', { from: pmSender, message: pmMessage, format: pmFormat });

          if (pmMessage.startsWith('/challenge')) {
            const format = pmFormat || pmMessage.replace('/challenge', '').trim();
            setChallenges((prev) => {
              // Don't add duplicate challenges from the same user
              if (prev.some((c) => c.from === pmSender)) return prev;
              return [...prev, { from: pmSender, format, timestamp: Date.now() }];
            });
          }
          break;
        }

        case 'init': {
          if (parsed[1] === 'battle') {
            joinedRoomsRef.current.add(roomid);
            // Store session globally so battle page can pick it up
            const globalSessions = getGlobalSessions();
            if (autoCreateSession && (roomid === roomId || !roomId)) {
              let session = globalSessions.get(roomid);
              if (!session || session.roomId !== roomid) {
                session = new ShowdownBaseSession(
                  roomid,
                  { onUpdate: triggerUpdate, onRequest: () => triggerUpdate(), onBattleEnd: () => triggerUpdate() },
                  socketRef.current!,
                );
                globalSessions.set(roomid, session);
              }
              sessionRef.current = session;
              setSession(session);
              setStatus('active');
            } else if (!autoCreateSession) {
              // Lobby: create session globally but don't set it locally
              if (!globalSessions.has(roomid)) {
                const session = new ShowdownBaseSession(
                  roomid,
                  { onUpdate: triggerUpdate, onRequest: () => triggerUpdate(), onBattleEnd: () => triggerUpdate() },
                  socketRef.current!,
                );
                globalSessions.set(roomid, session);
              }
            }
            // Always notify about found battles (for lobby navigation)
            onBattleFoundRef.current?.(roomid);
          }
          break;
        }

        case 'deinit': {
          joinedRoomsRef.current.delete(roomid);
          if (sessionRef.current?.roomId === roomid) {
            sessionRef.current = null;
            setSession(null);
            setStatus('idle');
          }
          break;
        }

        case 'request': {
          // Route to local session or global session
          const reqSession = sessionRef.current?.roomId === roomid
            ? sessionRef.current
            : getGlobalSessions().get(roomid);
          if (reqSession) {
            // Store request for transfer to battle page
            try {
              const request = JSON.parse(parsed[1]) as Protocol.Request;
              (reqSession as any).pendingShowdownRequest = request;
            } catch {}
            // Add as a line — processLine handles request via the buffer
            reqSession.addLine(line);
          }
          break;
        }

        case 'win':
        case 'tie': {
          const winSession = sessionRef.current?.roomId === roomid
            ? sessionRef.current
            : getGlobalSessions().get(roomid);
          if (winSession) {
            winSession.addLine(line);
          }
          break;
        }

        case 'c':
        case 'c:': {
          if (sessionRef.current?.roomId === roomid) {
            sessionRef.current.handleChatLine(line);
            triggerUpdate();
          } else {
            const chatSession = getGlobalSessions().get(roomid);
            if (chatSession) {
              chatSession.handleChatLine(line);
              triggerUpdate();
            } else if (roomid === 'lobby') {
              // Track lobby chat separately
              const { args } = Protocol.parseBattleLine(line);
              const isTimestamp = args[0] === 'c:';
              setLobbyChat((prev) => [
                ...prev,
                {
                  sender: (isTimestamp ? args[2] : args[1]) as string,
                  message: (isTimestamp ? args[3] : args[2]) as string,
                  timestamp: isTimestamp ? Number(args[1]) || Date.now() : Date.now(),
                },
              ]);
            }
          }
          break;
        }

        case 'rated':
        case 'rule':
        case 'teamsize':
        case 'gen':
        case 'tier':
        case 'clearpoke':
        case 'poke':
        case 'start': {
          const setupSession = sessionRef.current?.roomId === roomid
            ? sessionRef.current
            : getGlobalSessions().get(roomid);
          if (setupSession) {
            setupSession.addLine(line);
          }
          break;
        }

        default: {
          const defaultSession = sessionRef.current?.roomId === roomid
            ? sessionRef.current
            : getGlobalSessions().get(roomid);
          if (defaultSession) {
            defaultSession.addLine(line);
          }
          break;
        }
      }
    }
  }, [roomId, triggerUpdate]);

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
    const socket = io(`${API_BASE_URL}/showdown`);
    setGlobalSocket(socket);
    socketRef.current = socket;

    socket.on('connected', () => {
      console.log('[Showdown] Socket.IO connected, emitting connectToShowdown');
      socket.emit('connectToShowdown');
    });

    socket.on('showdownConnected', () => {
      console.log('[Showdown] PS WebSocket connected');
      // Only set authenticating if not already authenticated
      if (statusRef.current !== 'authenticated' && statusRef.current !== 'active') {
        setStatus('authenticating');
      }
    });

    socket.on('showdownMessage', (data: string) => {
      // Skip noisy raw messages (join, leave, chat)
      const firstLine = data.split('\n')[0];
      if (!firstLine.startsWith('|J|') && !firstLine.startsWith('|L|') && !firstLine.startsWith('|c:') && !firstLine.startsWith('|c|')) {
        console.log('[Showdown] Message from PS:', data.substring(0, 100));
      }
      handleShowdownMessage(data);
    });

    socket.on('showdownDisconnected', (data: { code: number; reason?: string }) => {
      console.log('[Showdown] PS WebSocket disconnected:', data);
      if (statusRef.current !== 'reconnecting') {
        setError('Disconnected from Showdown server');
      }
    });

    socket.on(
      'showdownReconnecting',
      (data: { attempt: number; maxAttempts: number; delayMs: number }) => {
        setStatus('reconnecting');
        setReconnectInfo({ attempt: data.attempt, maxAttempts: data.maxAttempts });
      },
    );

    socket.on('showdownReconnectFailed', () => {
      setError('Failed to reconnect to Showdown server');
      setStatus('error');
      setReconnectInfo(null);
    });

    socket.on('loginSuccess', (_cmd: string) => {
      setUsername(null);
      setStatus('authenticated');
    });

    socket.on('loginError', (msg: string) => {
      setError(msg);
      setStatus('error');
    });

    socket.on('disconnect', () => {
      if (statusRef.current !== 'reconnecting') {
        setStatus('idle');
      }
    });
  }, [handleShowdownMessage, setStatus]);

  const login = useCallback((user: string, password: string) => {
    console.log('[Showdown] login called', { user, hasChallstr: !!challstrRef.current, connected: socketRef.current?.connected });
    if (!challstrRef.current) {
      console.warn('[Showdown] login blocked: no challstr');
      setError('No challstr received yet');
      return;
    }
    if (!socketRef.current?.connected) {
      console.warn('[Showdown] login blocked: not connected');
      setError('Not connected to server');
      return;
    }
    console.log('[Showdown] emitting login event');
    socketRef.current.emit('login', {
      username: user,
      password,
      challstr: challstrRef.current,
    });
  }, []);

  const joinBattle = useCallback(
    (targetRoomId: string) => {
      if (!socketRef.current?.connected) {
        setError('Not connected to Showdown');
        return;
      }
      setStatus('joining');
      socketRef.current.emit('sendToShowdown', `|/join ${targetRoomId}`);
    },
    [],
  );

  const findBattle = useCallback(
    (format = 'gen9randombattle') => {
      console.log('[Showdown] findBattle called', {
        connected: socketRef.current?.connected,
        status: statusRef.current,
        username,
      });
      if (!socketRef.current?.connected) {
        console.warn('[Showdown] findBattle blocked: not connected');
        setError('Not connected to Showdown');
        return;
      }
      console.log('[Showdown] emitting sendToShowdown:', `/search ${format}`);
      setStatus('joining');
      socketRef.current.emit('sendToShowdown', `|/search ${format}`);
    },
    [username, setStatus],
  );

  const acceptChallenge = useCallback((from: string) => {
    if (!socketRef.current?.connected) return;
    console.log('[Showdown] accepting challenge from:', from);
    socketRef.current.emit('sendToShowdown', `|/accept ${from}`);
    setChallenges((prev) => prev.filter((c) => c.from !== from));
    setStatus('joining');
  }, [setStatus]);

  const rejectChallenge = useCallback((from: string) => {
    if (!socketRef.current?.connected) return;
    console.log('[Showdown] rejecting challenge from:', from);
    socketRef.current.emit('sendToShowdown', `|/reject ${from}`);
    setChallenges((prev) => prev.filter((c) => c.from !== from));
  }, []);

  const sendChoice = useCallback((choice: string) => {
    if (!sessionRef.current) return;
    sessionRef.current.makeChoice(choice, socketRef.current!);
    triggerUpdate();
  }, [triggerUpdate]);

  const forfeit = useCallback(() => {
    if (!sessionRef.current) return;
    sessionRef.current.forfeit(socketRef.current!);
  }, []);

  const sendChat = useCallback((message: string) => {
    if (!socketRef.current?.connected || !sessionRef.current) return;
    socketRef.current.emit(
      'sendToShowdown',
      `${sessionRef.current.roomId}|${message}`,
    );
  }, []);

  const leaveRoom = useCallback((targetRoomId?: string) => {
    const rid = targetRoomId || sessionRef.current?.roomId;
    if (!rid || !socketRef.current?.connected) return;
    socketRef.current.emit('sendToShowdown', `/leave ${rid}`);
    joinedRoomsRef.current.delete(rid);
    if (sessionRef.current?.roomId === rid) {
      sessionRef.current = null;
      setSession(null);
    }
  }, []);

  const sendRaw = useCallback((message: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('sendToShowdown', message);
  }, []);

  const initScene = useCallback(
    (gameElement: HTMLElement, pov: 0 | 1 = 0) => {
      if (sessionRef.current && gameElement) {
        sessionRef.current.initScene(gameElement, pov);
        triggerUpdate();
      }
    },
    [triggerUpdate],
  );

  // Auto-connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Pick up existing global session for this room (created by lobby hook)
  useEffect(() => {
    if (autoCreateSession && roomId) {
      const globalSessions = getGlobalSessions();
      const globalLines = getGlobalLines();
      const existing = globalSessions.get(roomId);
      const lines = globalLines.get(roomId) || [];
      if (existing && lines.length > 0) {
        console.log(`[Showdown] Picked up existing session for ${roomId}, replaying ${lines.length} lines`);
        // Create a fresh session
        const newSession = new ShowdownBaseSession(
          roomId,
          { onUpdate: triggerUpdate, onRequest: () => triggerUpdate(), onBattleEnd: () => triggerUpdate() },
          socketRef.current!,
        );
        newSession.status = 'active';
        // Replay lines directly on the battle object to populate state
        for (const line of lines) {
          const { args, kwArgs } = Protocol.parseBattleLine(line);
          if (args[0] === 'request') continue; // Skip request lines
          try {
            newSession.battle.add(args, kwArgs);
          } catch {}
        }
        // Also store the raw lines for the session's buffer (for scene init)
        (newSession as any).psLines = lines;
        // Transfer chat messages and request
        newSession.chatMessages = existing.chatMessages;
        const pendingRequest = (existing as any).pendingShowdownRequest;
        if (pendingRequest) {
          (newSession as any).pendingShowdownRequest = pendingRequest;
        }
        // Replace in global store
        globalSessions.set(roomId, newSession);
        sessionRef.current = newSession;
        setSession(newSession);
        setStatus('active');
        joinedRoomsRef.current.add(roomId);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-join room if provided and authenticated
  useEffect(() => {
    if (
      autoCreateSession &&
      roomId &&
      status === 'authenticated' &&
      !joinedRoomsRef.current.has(roomId) &&
      !sessionRef.current
    ) {
      joinBattle(roomId);
    }
  }, [roomId, status, joinBattle, autoCreateSession]);

  return {
    status,
    username,
    session,
    chatMessages,
    lobbyChat,
    challenges,
    error,
    reconnectInfo,
    challstr,
    connect,
    login,
    joinBattle,
    findBattle,
    acceptChallenge,
    rejectChallenge,
    sendChoice,
    forfeit,
    sendChat,
    leaveRoom,
    sendRaw,
    initScene,
  };
}

function toRoomid(roomid: string): string {
  return roomid.replace(/[^a-zA-Z0-9-]+/g, '').toLowerCase();
}

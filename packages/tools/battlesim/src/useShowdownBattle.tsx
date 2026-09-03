'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Protocol } from '@pkmn/protocol';
import { Socket } from 'socket.io-client';
import { ShowdownBaseSession, ChatMessage } from './engine/ShowdownBaseSession';
import { toolApi } from '@boffmedia/tool-kit';
import { openBattleSocket, attachListeners } from './engine/battleSocket';

export interface ChallengeRequest {
  from: string;
  format: string;
  timestamp: number;
}

export interface ShowdownFormat {
  name: string;
  section: string;
  rated: boolean;
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

/**
 * Room state that has to outlive a screen, WITHOUT living on `window`.
 *
 * The lobby and a battle room are two different screens, so a session started
 * in one has to still be there when the other mounts — that is why these were
 * globals. Module scope gives the same lifetime (one page load) while being
 * unreachable from outside the package, uncollidable with anything else on the
 * page, and reset by a real reload.
 *
 * The username was the sharpest problem: `window.__showdown_username` outlived
 * a sign-out, so the next account inherited the previous player's PS name.
 * `resetShowdownState()` is called when the relay disconnects, which is what
 * makes that impossible now.
 */
const showdownSessions = new Map<string, ShowdownBaseSession>();
const showdownLines = new Map<string, string[]>();
let showdownUsername: string | null = null;

function getGlobalSessions(): Map<string, ShowdownBaseSession> {
  return showdownSessions;
}

function getGlobalLines(): Map<string, string[]> {
  return showdownLines;
}

export function getGlobalUsername(): string | null {
  return showdownUsername;
}

function setGlobalUsername(name: string | null) {
  showdownUsername = name;
}

/** Clears everything the relay accumulated. Called on disconnect. */
export function resetShowdownState(): void {
  showdownSessions.clear();
  showdownLines.clear();
  showdownUsername = null;
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

  const socketRef = useRef<Socket | null>(null);
  const detachRef = useRef<(() => void) | null>(null);
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
  const [formats, setFormats] = useState<ShowdownFormat[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [spectatorCount, setSpectatorCount] = useState(0);
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
              socketRef.current.emit('sendToShowdown', '|/join lobby');
            }
          } else {
            setUsername(newName || null);
            // Stay in current status — don't mark as authenticated for guests
          }
          break;
        }

        case 'updatesearch': {
          break;
        }

        case 'formats': {
          // |formats|FORMATS_JSON — only on lobby hook (autoCreateSession=false)
          if (!autoCreateSession) {
            try {
              const raw = typeof parsed[1] === 'string' ? parsed[1] : JSON.stringify(parsed[1]);
              const parsed_formats = JSON.parse(raw);
              // PS sends formats as: [["Section", ["Format1", rated, ...], ...], ...]
              const result: ShowdownFormat[] = [];
              let currentSection = '';
              for (const entry of parsed_formats) {
                if (typeof entry === 'string') {
                  currentSection = entry;
                } else if (Array.isArray(entry) && typeof entry[0] === 'string') {
                  result.push({
                    name: entry[0],
                    section: currentSection,
                    rated: entry[1] === 1,
                  });
                }
              }
              setFormats(result);
            } catch {
            }
          }
          break;
        }

        case 'users': {
          // |users|COUNT,USER1,USER2,... — lobby user list
          if (roomid === 'lobby') {
            const usersStr = parsed[1] as string;
            if (usersStr) {
              const parts = usersStr.split(',');
              // First element is the count, rest are usernames
              setOnlineUsers(parts.slice(1).map((u: string) => u.trim()).filter(Boolean));
            }
          }
          break;
        }

        case 'popup': {
          setError(`PS: ${parsed.slice(1).join(' ')}`);
          break;
        }

        case 'pm': {
          // |pm| SENDER|RECEIVER|MESSAGE|FORMAT|||
          const pmSender = (parsed[1] as string)?.trim();
          const pmMessage = (parsed[3] as string) || '';
          const pmFormat = (parsed[4] as string) || '';

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

        case 'spectator': {
          if (roomid === roomId) {
            setSpectatorCount((prev) => prev + 1);
          }
          break;
        }

        case 'spectatorleave': {
          if (roomid === roomId) {
            setSpectatorCount((prev) => Math.max(0, prev - 1));
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

  const connect = useCallback(async () => {
    if (socketRef.current) return;
    let socket;
    try {
      // The relay requires a Boffmedia session now (§5.1.5): it opens a real
      // upstream socket to Pokémon Showdown per client, so leaving it open made
      // this API a public PS proxy.
      socket = await openBattleSocket('/showdown');
    } catch {
      setError('signin_required');
      setStatus('error');
      return;
    }
    socketRef.current = socket;

    detachRef.current = attachListeners(socket, [
      ['connected', () => { socket.emit('connectToShowdown'); }],
      ['showdownConnected', () => { if (statusRef.current !== 'authenticated' && statusRef.current !== 'active') { setStatus('authenticating'); } }],
      ['showdownMessage', (data: string) => { handleShowdownMessage(data); }],
      ['showdownDisconnected', () => { if (statusRef.current !== 'reconnecting') { setError('Disconnected from Showdown server'); } }],
      ['showdownReconnecting', (data: { attempt: number; maxAttempts: number; delayMs: number }) => {
        setStatus('reconnecting');
        setReconnectInfo({ attempt: data.attempt, maxAttempts: data.maxAttempts });
        // The challstr belongs to the PREVIOUS upstream connection. Reusing it
        // after a reconnect makes /trn fail with a stale challenge, which
        // presented as a login that silently never completed.
        challstrRef.current = '';
      }],
      ['showdownReconnectFailed', () => { setError('Failed to reconnect to Showdown server'); setStatus('error'); setReconnectInfo(null); }],
      ['loginSuccess', () => { setStatus('authenticated'); }],
      // `|nametaken|` and a failed login both arrive here; the form has to come
      // back so the player can try again rather than sitting on "connecting".
      ['loginError', (msg: string) => { setError(msg); setStatus('idle'); }],
      ['disconnect', () => { if (statusRef.current !== 'reconnecting') { setStatus('idle'); resetShowdownState(); } }],
    ]);
  }, [handleShowdownMessage, setStatus]);

  // One relay socket per mount; nothing survives on `window` any more.
  useEffect(() => {
    return () => {
      detachRef.current?.();
      detachRef.current = null;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const login = useCallback((user: string, password: string) => {
    if (!challstrRef.current) {
      setError('No challstr received yet');
      return;
    }
    if (!socketRef.current?.connected) {
      setError('Not connected to server');
      return;
    }
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
      if (!socketRef.current?.connected) {
        setError('Not connected to Showdown');
        return;
      }
      setStatus('joining');
      socketRef.current.emit('sendToShowdown', `|/search ${format}`);
    },
    [username, setStatus],
  );

  const acceptChallenge = useCallback((from: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('sendToShowdown', `|/accept ${from}`);
    setChallenges((prev) => prev.filter((c) => c.from !== from));
    setStatus('joining');
  }, [setStatus]);

  const rejectChallenge = useCallback((from: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('sendToShowdown', `|/reject ${from}`);
    setChallenges((prev) => prev.filter((c) => c.from !== from));
  }, []);

  const sendChoice = useCallback((choice: string) => {
    if (!sessionRef.current) return;
    sessionRef.current.makeChoice(choice, socketRef.current!);
    triggerUpdate();
  }, [triggerUpdate]);

  const cancelChoice = useCallback(() => {
    if (!sessionRef.current) return;
    sessionRef.current.undoChoice();
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
  }, []);

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

  const saveShowdownReplay = useCallback(async (): Promise<number | null> => {
    const sess = sessionRef.current;
    if (!sess || !sess.battleComplete) return null;

    const lines = sess.psLines || getGlobalLines().get(sess.roomId) || [];
    if (lines.length === 0) return null;

    // Extract player names and teams from protocol lines
    let side1 = '';
    let side2 = '';
    const team1Pokes: string[] = [];
    const team2Pokes: string[] = [];
    let currentPlayer = 0;

    for (const line of lines) {
      const { args } = Protocol.parseBattleLine(line);
      if (args[0] === 'player') {
        const pNum = (args[1] as string) === 'p1' ? 1 : 2;
        const pName = args[2] as string;
        if (pNum === 1) side1 = pName;
        else side2 = pName;
      }
      if (args[0] === 'poke') {
        const owner = (args[1] as string) || '';
        const details = (args[2] as string) || '';
        const pokeName = details.split(',')[0].trim();
        if (owner === 'p1') team1Pokes.push(pokeName);
        else if (owner === 'p2') team2Pokes.push(pokeName);
      }
    }

    if (!side1 || !side2) return null;

    const replay = lines.join('\n');
    const winner = sess.winner || 'tie';

    try {
      // `.data`: this controller is enveloped ({success, statusCode, data})
      // and toolApi().request returns the raw body without unwrapping it.
      const res = await toolApi().request<{ data?: { replayId?: number } }>(
        '/smartrotom/achievement/create-replay',
        {
          method: 'POST',
          auth: 'required',
          body: {
            side1,
            side2,
            team1: JSON.stringify(team1Pokes),
            team2: JSON.stringify(team2Pokes),
            replay,
            winner,
          },
        },
      );
      const replayId = res?.data?.replayId;
      if (typeof replayId === 'number') {
        sess.replayId = replayId;
        triggerUpdate();
        return replayId;
      }
    } catch {
      // Saving a replay is a nice-to-have on top of a battle that already
      // happened: a failure here must not take the room down with it.
    }
    return null;
  }, [triggerUpdate]);

  return {
    status,
    username,
    session,
    chatMessages,
    lobbyChat,
    challenges,
    formats,
    onlineUsers,
    spectatorCount,
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
    cancelChoice,
    forfeit,
    sendChat,
    leaveRoom,
    sendRaw,
    initScene,
    saveShowdownReplay,
  };
}

function toRoomid(roomid: string): string {
  return roomid.replace(/[^a-zA-Z0-9-]+/g, '').toLowerCase();
}

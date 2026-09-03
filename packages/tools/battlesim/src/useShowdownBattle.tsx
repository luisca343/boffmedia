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
  /**
   * Whether PS will accept a `/search` for it. Challenge-only and custom
   * formats are in the list but cannot be laddered, so a matchmaking control
   * that offers them offers a button that does nothing.
   */
  searchable: boolean;
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

/**
 * ONE relay socket for the whole tool, for the same reason the sessions above
 * are shared — and this is the half the migration lost.
 *
 * The lobby and a battle room are two different screens, each calling this
 * hook, and each used to open its OWN `/showdown` socket. The API opens a real
 * upstream connection to Pokémon Showdown per socket, so that made the room a
 * SECOND, anonymous PS connection: it had never sent `/trn`, was not in the
 * battle room, and was not the connection the lobby's `/search` had matched.
 * Everything the room sends — `/choose`, `/undo`, `/forfeit`, chat — went out
 * on it and was dropped on the floor, while the battle's own protocol kept
 * arriving on the lobby's socket. The old code got this right by accident, via
 * a `window.__showdown_socket` singleton; `getOrCreateSocket` is what this
 * restores, without the global.
 *
 * Refcounted rather than never closed: the last screen to let go closes the
 * socket, which is what tells the API to drop the upstream PS connection.
 */
let relaySocket: Socket | null = null;
let relayPending: Promise<Socket> | null = null;
let relayRefs = 0;

async function acquireRelaySocket(): Promise<Socket> {
  if (!relaySocket && !relayPending) {
    // The relay requires a Boffmedia session now (§5.1.5): it opens a real
    // upstream socket to Pokémon Showdown per client, so leaving it open made
    // this API a public PS proxy.
    relayPending = openBattleSocket('/showdown')
      .then((socket) => {
        // Bound to the SOCKET and not to a mount, because `connectToShowdown`
        // must be sent exactly once per connection: asking a live relay again
        // tears down the upstream PS connection the first ask established.
        // Two screens awaiting this same open would both attach before
        // `connected` fires, so "the first caller" is not a safe test — owning
        // it here is.
        socket.on('connected', () => { socket.emit('connectToShowdown'); });
        relaySocket = socket;
        relayPending = null;
        return socket;
      })
      .catch((error) => {
        relayPending = null;
        throw error;
      });
  }
  const socket = relaySocket ?? (await relayPending!);
  relayRefs += 1;
  return socket;
}

/**
 * Who PROCESSES a frame. Exactly one hook per room, and one for the lobby.
 *
 * The relay socket is shared (above), and the lobby screen stays mounted
 * underneath an open battle - it is the base LAYER, not a screen the room
 * replaced. So both `useShowdownBattle` instances receive every
 * `showdownMessage` and, before this, both ran the whole handler on it: every
 * battle line was pushed to `showdownLines` twice and `addLine`d twice, so the
 * log printed each turn twice, and the duplicate `|request|` flipped the
 * session into `waiting` - which diverts everything after it into
 * `pendingBuffer`, and is why HP only moved when the turn resolved instead of
 * as each hit landed.
 *
 * The rule: a battle room belongs to the screen showing it; while no such
 * screen is open the lobby owns it, which is what lets a battle be created and
 * `onBattleFound` fire at all. Lobby and global frames are always the lobby's.
 */
const roomOwners = new Map<string, object>();
let lobbyOwner: object | null = null;

function releaseRelaySocket(): void {
  relayRefs = Math.max(0, relayRefs - 1);
  if (relayRefs > 0) return;
  relaySocket?.close();
  relaySocket = null;
  relayPending = null;
}

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
  const releaseRef = useRef<(() => void) | null>(null);
  // A stable identity for this mount, so ownership survives every re-render
  // without being state that could trigger one.
  const selfRef = useRef<object>({});
  // `connect` is async, so "have I got a socket yet" is not the same question
  // as "am I already getting one". Without this, a double-invoked mount effect
  // (StrictMode) runs `connect` twice before the first await settles: two
  // acquires, and the second overwrites `detachRef` so the FIRST set of
  // listeners is never removed — every relay message then handled twice.
  const connectingRef = useRef(false);
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

    // One processor per frame. See `roomOwners`.
    const self = selfRef.current;
    // Ownership governs BATTLE frames, which mutate a shared session and must be
    // applied exactly once. Lobby and global frames are pure per-hook state
    // (challstr, the username, the format list, lobby chat) and every mount
    // needs its own copy of them: gating those was how the room screen ended up
    // stuck on "authenticating" forever, since `updateuser` — the only thing
    // that reports a completed login — was being dropped before it got there.
    // The one SIDE EFFECT among them is gated separately, below.
    const isRoomFrame = roomid !== 'lobby' && roomid !== 'global';
    const lobbyIsMine = lobbyOwner === self;
    if (isRoomFrame) {
      const owner = roomOwners.get(roomid);
      if (owner ? owner !== self : lobbyIsMine !== true) return;
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
            // Explicitly join lobby after login. Lobby owner ONLY: this is the
            // one side effect in a global frame, and every mounted hook now
            // sees those, so an ungated emit would join once per open screen.
            if (lobbyIsMine && socketRef.current?.connected) {
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
          // Only the lobby hook: it owns the matchmaking control.
          //
          // NOT JSON. `|formats|` is a flat, pipe-delimited list and this used
          // to `JSON.parse` it inside a silent `catch {}`, so the throw was
          // swallowed and the list stayed empty forever — the screen sat on
          // "Cargando formatos…" and the search button never enabled. The real
          // shape, captured from sim3.psim.us:
          //
          //   |formats|,1|S/V Singles|[Gen 9] Random Battle,4f|[Gen 9] OU,e|,1|S/V Doubles|…
          //
          // A field starting with "," is a column marker and the NEXT field is
          // the section name; every other field is `NAME,<hex flags>`. Note
          // that `Protocol.parseLine` does NOT split this: it hands back
          // ["formats", "<the whole rest>"], so the split happens here.
          if (!autoCreateSession) {
            const raw = typeof parsed[1] === 'string' ? parsed[1] : '';
            const result: ShowdownFormat[] = [];
            let section = '';
            let expectSection = false;

            for (const field of raw.split('|')) {
              if (!field) continue;
              if (field.startsWith(',')) {
                // Two markers can run together (some servers lead with `,LL`
                // for "no ladder"), so stay in the expecting state rather than
                // taking the second marker for a section name.
                expectSection = true;
                continue;
              }
              if (expectSection) {
                section = field;
                expectSection = false;
                continue;
              }
              // PS's own flag encoding: bit 1 = team supplied by the server
              // (a random format), bit 2 = may be searched for on the ladder,
              // bit 16 = unrated.
              const comma = field.lastIndexOf(',');
              const flags = comma > 0 ? Number.parseInt(field.slice(comma + 1), 16) : Number.NaN;
              const named = Number.isNaN(flags) ? field : field.slice(0, comma);
              if (!named) continue;
              result.push({
                name: named,
                section,
                rated: Number.isNaN(flags) ? true : (flags & 16) === 0,
                searchable: Number.isNaN(flags) ? true : (flags & 2) !== 0,
              });
            }

            if (result.length > 0) setFormats(result);
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
                session.setViewerName(getGlobalUsername());
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
                session.setViewerName(getGlobalUsername());
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
    if (socketRef.current || connectingRef.current) return;
    connectingRef.current = true;
    let socket: Socket;
    try {
      socket = await acquireRelaySocket();
    } catch {
      connectingRef.current = false;
      setError('signin_required');
      setStatus('error');
      return;
    }
    connectingRef.current = false;
    // Read BEFORE the listeners go on: a screen that finds the relay already
    // connected has missed everything that got it there.
    const joinedLive = socket.connected;
    socketRef.current = socket;
    releaseRef.current = releaseRelaySocket;

    detachRef.current = attachListeners(socket, [
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

    // Such a screen would sit on 'idle' — which the room renders as
    // "connecting" forever. The relay's own state is the answer: a username
    // means the login already succeeded.
    if (joinedLive) {
      const name = getGlobalUsername();
      if (name) {
        setUsername(name);
        setStatus('authenticated');
      } else {
        setStatus('authenticating');
      }
    }
  }, [handleShowdownMessage, setStatus]);

  // The socket is SHARED (see `acquireRelaySocket`), so a screen leaving lets
  // go of its reference rather than closing it out from under the other one.
  useEffect(() => {
    return () => {
      detachRef.current?.();
      detachRef.current = null;
      releaseRef.current?.();
      releaseRef.current = null;
      socketRef.current = null;
    };
  }, []);

  /**
   * Log in as the PLAYER, with their own Showdown identity.
   *
   * `password` is optional: omitted, the relay takes Showdown's
   * `getassertion` path and claims the name as an unregistered one, which is
   * what the official client does for someone without an account. Passing an
   * empty string is the same thing as passing nothing — it is normalised here
   * so a blank field cannot be sent as a real (wrong) password.
   *
   * Nothing about this is remembered by the hook: the password goes straight
   * into the emit and is never held in state, stored, or logged.
   */
  const login = useCallback((user: string, password?: string) => {
    if (!challstrRef.current) {
      setError('No challstr received yet');
      return;
    }
    if (!socketRef.current?.connected) {
      setError('Not connected to server');
      return;
    }
    setStatus('authenticating');
    socketRef.current.emit('login', {
      username: user,
      ...(password ? { password } : {}),
      challstr: challstrRef.current,
    });
  }, [setStatus]);

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
        // Kept fresh here rather than only at construction: the name is known
        // before any battle starts, but a session adopted from the lobby was
        // built by a different mount and this is the cheap way to be sure the
        // one on screen knows whose side it is showing.
        sessionRef.current.setViewerName(username || getGlobalUsername());
        sessionRef.current.initScene(gameElement, pov);
        triggerUpdate();
      }
    },
    [triggerUpdate, username],
  );

  // Claimed BEFORE the socket is opened, so no frame can arrive unowned.
  useEffect(() => {
    const self = selfRef.current;
    if (autoCreateSession && roomId) {
      // Normalised the same way the incoming frames are, so a room id that
      // reached this screen through a URL cannot claim a key no frame matches
      // and silently leave the room unowned (and therefore double-processed).
      const key = toRoomid(roomId);
      // Last mount wins: a room reopened after a reload is the live one.
      roomOwners.set(key, self);
      return () => {
        if (roomOwners.get(key) === self) roomOwners.delete(key);
      };
    }
    if (!autoCreateSession) {
      if (!lobbyOwner) lobbyOwner = self;
      return () => {
        if (lobbyOwner === self) lobbyOwner = null;
      };
    }
    return undefined;
  }, [autoCreateSession, roomId]);

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
      // NOT `socketRef.current`: this effect runs on the same mount as the one
      // that calls `connect()`, and `connect` is async — so the ref is still
      // null here, and the session was being built around it. Every choice the
      // room then submitted threw on `null.emit`. The relay is a module
      // singleton the lobby has already opened by the time this branch can be
      // taken (it needs the lobby's session and lines to exist at all).
      const relay = socketRef.current ?? relaySocket;
      if (existing && lines.length > 0 && relay) {
        // Create a fresh session
        const newSession = new ShowdownBaseSession(
          roomId,
          { onUpdate: triggerUpdate, onRequest: () => triggerUpdate(), onBattleEnd: () => triggerUpdate() },
          relay,
        );
        newSession.setViewerName(getGlobalUsername());
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

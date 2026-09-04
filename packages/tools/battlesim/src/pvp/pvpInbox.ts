/**
 * The PvP wire, routed. One owner, one inbox per room, no React.
 *
 * WHAT THIS REPLACES. Every screen that cared about a room attached its own
 * `protocol` / `battleEnd` / `spectateJoined` listeners to the shared socket and
 * re-emitted `spectate` whenever its effect re-ran — which was on every provider
 * identity change, i.e. on every transport status flicker. Three things followed
 * from that, and they are C1-C3 in the audit:
 *
 *   - the opening `|request|` was delivered before the room screen existed, so
 *     the first turn had no move list until something else forced a resync;
 *   - `spectateJoined`'s replay was `addLine`d onto a Battle that had already
 *     followed the same lines, so HP, boosts and the log were applied twice;
 *   - nothing ever sent `resume`, so the gateway's grace timer forfeited a
 *     player whose tunnel blinked.
 *
 * THE RULE HERE. The provider subscribes ONCE per socket instance and hands
 * every frame to this module. A room's frames are buffered until a session
 * exists to receive them, and are buffered again while a resync is in flight —
 * so nothing is dropped, nothing is applied twice, and the screen can mount
 * whenever it likes. A full log NEVER goes through `addLine`: `resync` rebuilds
 * the client state from scratch and is idempotent, which is the only form of
 * "catch me up" that can be sent twice safely.
 *
 * Pure on purpose: the provider is the only React in the PvP transport, and
 * everything worth testing about the netcode is in here.
 */

import type { BattleSession } from '../engine/BattleSession';

export type PvpSide = 'p1' | 'p2';

/**
 * What the inbox needs of a session.
 *
 * A `Pick` of the real class rather than a hand-written shape: it stays honest
 * when the engine moves, and a real `BattleSession` is assignable to it, so the
 * tests drive the actual engine instead of a mock of it.
 */
export type PvpInboxSession = Pick<
  BattleSession,
  | 'acceptFrame'
  | 'resync'
  | 'setViewerSide'
  | 'handleRequest'
  | 'callbacks'
  | 'winner'
  | 'replayId'
  | 'replay'
  | 'status'
  | 'isWaitingForChoice'
  | 'currentRequest'
  | 'timerState'
  | 'sequence'
>;

/** Anything that can carry a message back to the gateway. */
export interface PvpInboxTransport {
  emit(event: string, payload?: unknown): void;
}

export interface PvpChatEntry {
  sender: string;
  message: string;
  timestamp: number;
}

export interface PvpTimerState {
  p1: { turnRemaining: number; totalRemaining: number };
  p2: { turnRemaining: number; totalRemaining: number };
  activeSide: PvpSide | null;
}

export interface PvpRoomInbox {
  roomId: string;
  /**
   * Bumped on every change to this record.
   *
   * The inbox mutates its rooms in place — a session is a live object and
   * copying it would be a second copy of the battle — so a React screen has no
   * identity change to notice. This is the value `useSyncExternalStore` reads.
   */
  revision: number;
  /** Null until a screen adopts or creates one. */
  session: PvpInboxSession | null;
  /** Frames held because there is no session yet, or a resync is in flight. */
  buffered: Array<{ seq: number; line: string }>;
  /**
   * The AUTHORITY on which side the viewer plays: `resumed.side` /
   * `spectateJoined.side` / `battleCreated.side`. localStorage is a hint for the
   * first paint and nothing more (H6) — it survives a sign-out, and a spectator
   * has no stored side at all.
   */
  side: PvpSide | null;
  /** Whether the viewer is watching rather than playing. */
  spectator: boolean;
  status: 'active' | 'finished';
  format: string | null;
  winner: string | null;
  replayId: number | null;
  /** The last `|request|` line seen, for re-promotion after a rejected choice. */
  lastRequestLine: string | null;
  /** True between asking the server to catch us up and its answer arriving. */
  resyncing: boolean;
  /** A full log that arrived before a session existed to receive it. */
  pendingResync: { lines: string[]; seq: number } | null;
  chat: PvpChatEntry[];
  timer: PvpTimerState | null;
}

export interface PvpProtocolFrame {
  roomId: string;
  seq?: number;
  line: string;
}

export interface PvpResumedFrame {
  roomId: string;
  side?: PvpSide | null;
  status?: string;
  replay?: string[] | string;
  seq?: number;
  format?: string;
}

export interface PvpBattleEndFrame {
  roomId: string;
  seq?: number;
  winner?: string;
  replayId?: number | null;
}

export interface PvpErrorFrame {
  roomId?: string;
  code?: string;
}

const REQUEST_PREFIX = '|request|';

/** Codes that mean "that choice is not the one I am waiting for". */
const CHOICE_REJECTED = new Set(['stale_choice', 'no_request']);

function warn(...args: unknown[]): void {
  console.warn('[battlesim]', ...args);
}

function toLines(replay: string[] | string | undefined): string[] {
  if (!replay) return [];
  const raw = Array.isArray(replay) ? replay : replay.split('\n');
  return raw.filter((line) => line && line.trim().length > 0);
}

export function createRoomInbox(roomId: string): PvpRoomInbox {
  return {
    roomId,
    revision: 0,
    session: null,
    buffered: [],
    side: null,
    spectator: false,
    status: 'active',
    format: null,
    winner: null,
    replayId: null,
    lastRequestLine: null,
    resyncing: false,
    pendingResync: null,
    chat: [],
    timer: null,
  };
}

export class PvpInbox {
  private readonly rooms = new Map<string, PvpRoomInbox>();
  private readonly listeners = new Map<string, Set<() => void>>();

  constructor(private transport: PvpInboxTransport | null = null) {}

  /** The socket changed (a reconnect opened a new one). */
  setTransport(transport: PvpInboxTransport | null): void {
    this.transport = transport;
  }

  // ── room registry ─────────────────────────────────────────────────────────

  /** The room's inbox, created empty if this is the first anyone has heard of it. */
  room(roomId: string): PvpRoomInbox {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = createRoomInbox(roomId);
      this.rooms.set(roomId, room);
    }
    return room;
  }

  peek(roomId: string): PvpRoomInbox | null {
    return this.rooms.get(roomId) ?? null;
  }

  all(): PvpRoomInbox[] {
    return [...this.rooms.values()];
  }

  forget(roomId: string): void {
    this.rooms.delete(roomId);
    this.listeners.delete(roomId);
  }

  clear(): void {
    this.rooms.clear();
    this.listeners.clear();
  }

  /** Re-render hook for the screen showing a room. Returns the unsubscriber. */
  subscribe(roomId: string, listener: () => void): () => void {
    let set = this.listeners.get(roomId);
    if (!set) {
      set = new Set();
      this.listeners.set(roomId, set);
    }
    set.add(listener);
    return () => {
      set!.delete(listener);
    };
  }

  private changed(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) room.revision++;
    const set = this.listeners.get(roomId);
    if (!set) return;
    for (const listener of set) {
      try {
        listener();
      } catch (e) {
        warn('inbox listener threw', roomId, e);
      }
    }
  }

  // ── sessions ──────────────────────────────────────────────────────────────

  /**
   * A screen has a session for this room: give it everything held for it.
   *
   * The `onGap` wiring lives here rather than at the four places a session is
   * built, because "a frame went missing" has exactly one correct answer and it
   * is this module's (ask the server for the log, apply it through `resync`).
   */
  attachSession(roomId: string, session: PvpInboxSession): PvpRoomInbox {
    const room = this.room(roomId);
    room.session = session;
    session.callbacks.onGap = (lastSeq: number, seq: number) => {
      warn(`gap in room ${roomId}: had ${lastSeq}, got ${seq} — resyncing`);
      this.requestResync(roomId);
    };
    if (room.side) session.setViewerSide(room.side);
    if (room.winner !== null) session.winner = room.winner;
    if (room.replayId !== null) session.replayId = room.replayId;

    if (room.pendingResync) {
      const { lines, seq } = room.pendingResync;
      room.pendingResync = null;
      this.applyResync(room, lines, seq);
    }
    this.flush(room);
    this.changed(roomId);
    return room;
  }

  detachSession(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room?.session) return;
    room.session.callbacks.onGap = undefined;
    room.session = null;
  }

  // ── incoming frames ───────────────────────────────────────────────────────

  handleProtocol(frame: PvpProtocolFrame): void {
    if (!frame?.roomId || typeof frame.line !== 'string') {
      warn('malformed protocol frame', frame);
      return;
    }
    const room = this.room(frame.roomId);
    const seq = typeof frame.seq === 'number' ? frame.seq : -1;

    if (frame.line.startsWith(REQUEST_PREFIX)) room.lastRequestLine = frame.line;

    // No session yet, or one is being rebuilt: hold the frame. Feeding it to a
    // battle that is about to be thrown away is how a resync lost the turns
    // that arrived while it was in flight.
    if (!room.session || room.resyncing) {
      this.buffer(room, seq, frame.line);
      this.changed(frame.roomId);
      return;
    }

    room.session.acceptFrame(typeof frame.seq === 'number' ? frame.seq : undefined, frame.line);
    this.changed(frame.roomId);
  }

  /** `resumed` (player) and `spectateJoined` (watcher) are the same act. */
  handleResumed(frame: PvpResumedFrame, kind: 'resumed' | 'spectateJoined' = 'resumed'): void {
    if (!frame?.roomId) {
      warn('malformed', kind, 'frame', frame);
      return;
    }
    const room = this.room(frame.roomId);
    room.resyncing = false;
    room.spectator = kind === 'spectateJoined' && !frame.side;
    // The SERVER decides which side you are, including for a player who
    // reconnected as a spectator of their own battle.
    if (frame.side === 'p1' || frame.side === 'p2') room.side = frame.side;
    if (frame.format) room.format = frame.format;
    if (frame.status === 'finished' || frame.status === 'ended') room.status = 'finished';

    const lines = toLines(frame.replay);
    const seq = typeof frame.seq === 'number' ? frame.seq : lines.length - 1;

    if (!room.session) {
      // Held, not dropped: the room screen has not mounted yet and `resync` is
      // the only way this log may ever be applied.
      room.pendingResync = { lines, seq };
      this.rememberLastRequest(room, lines);
      this.changed(frame.roomId);
      return;
    }

    this.applyResync(room, lines, seq);
    this.flush(room);
    this.changed(frame.roomId);
  }

  handleBattleEnd(frame: PvpBattleEndFrame): void {
    if (!frame?.roomId) {
      warn('malformed battleEnd frame', frame);
      return;
    }
    const room = this.room(frame.roomId);
    room.status = 'finished';
    room.winner = frame.winner ?? null;
    room.replayId = typeof frame.replayId === 'number' ? frame.replayId : null;
    // ONLY the bookkeeping. `battleComplete`, `hasWinEvent` and the end screen
    // belong to `BattleSession`, which reaches them when the `|win|` line has
    // been through the queue like every other line (M3). Setting them here
    // raced the flush and showed the end screen over a half-played last turn.
    if (room.session) {
      room.session.winner = room.winner;
      room.session.replayId = room.replayId;
    }
    this.changed(frame.roomId);
  }

  handleChat(frame: { roomId?: string; sender?: string; message?: string; timestamp?: number }): void {
    if (!frame?.roomId) return;
    const room = this.room(frame.roomId);
    room.chat = [
      ...room.chat,
      {
        sender: frame.sender ?? '',
        message: frame.message ?? '',
        timestamp: frame.timestamp ?? Date.now(),
      },
    ];
    this.changed(frame.roomId);
  }

  handleTimer(frame: { roomId?: string; p1?: any; p2?: any; activeSide?: any }): void {
    if (!frame?.roomId) return;
    const room = this.room(frame.roomId);
    room.timer = { p1: frame.p1, p2: frame.p2, activeSide: frame.activeSide ?? null };
    if (room.session) room.session.timerState = room.timer;
    this.changed(frame.roomId);
  }

  /**
   * A server-side refusal.
   *
   * `stale_choice` means the choice we sent did not answer the request the
   * server is actually waiting on — a double-click, or a click that landed just
   * after the timer picked for us. The dock has already cleared itself (the
   * session assumes a sent choice is accepted), so the prompt has to come back
   * or the player is looking at a battle with no way to act in it.
   *
   * Restored DIRECTLY rather than through `handleRequest`: the session dedupes
   * on rqid for the life of the battle, so re-offering a request it has already
   * seen is a no-op by design — which is the right behaviour for a request PS
   * re-sends, and the wrong one here. Re-feeding the `|request|` LINE would be
   * a duplicate seq and dropped for the same reason.
   *
   * `no_request` means the server has nothing outstanding at all: clear the
   * waiting state and wait for the next `|request|` to arrive on the stream.
   */
  handleError(frame: PvpErrorFrame): void {
    const code = frame?.code ?? 'unknown';
    if (!frame?.roomId) {
      warn('server error', code);
      return;
    }
    const room = this.room(frame.roomId);
    if (!CHOICE_REJECTED.has(code)) {
      warn(`server error in room ${frame.roomId}:`, code);
      this.changed(frame.roomId);
      return;
    }

    warn(`choice rejected in room ${frame.roomId}: ${code}`);
    const session = room.session;
    if (!session) return;
    session.isWaitingForChoice = false;
    session.currentRequest = null;

    const request = code === 'stale_choice' && room.lastRequestLine
      ? parseRequestLine(room.lastRequestLine)
      : null;
    if (request) {
      session.currentRequest = request;
      session.isWaitingForChoice = true;
      session.callbacks.onRequest(request);
    }
    session.callbacks.onUpdate();
    this.changed(frame.roomId);
  }

  // ── outgoing ──────────────────────────────────────────────────────────────

  /**
   * "Catch me up on this room."
   *
   * `resume` for a room we hold a side in, `spectate` otherwise — the two
   * gateway verbs differ only in whether they clear the disconnect grace timer
   * and hand back the player's own view.
   */
  requestResync(roomId: string): void {
    const room = this.room(roomId);
    if (room.resyncing) return;
    room.resyncing = true;
    this.emitJoin(room);
    this.changed(roomId);
  }

  /** The screen for a room is opening. Idempotent. */
  join(roomId: string, sideHint?: PvpSide | null): void {
    const room = this.room(roomId);
    if (!room.side && (sideHint === 'p1' || sideHint === 'p2')) room.side = sideHint;
    if (room.resyncing) return;
    room.resyncing = true;
    this.emitJoin(room);
    this.changed(roomId);
  }

  /**
   * The socket came back. Every tracked room has to be re-entered or the
   * gateway forfeits the ones we hold a side in (C2) — and the frames we missed
   * while the tunnel was down are only ever recoverable through a full log.
   */
  resumeAll(): void {
    for (const room of this.rooms.values()) {
      if (room.status === 'finished') continue;
      room.resyncing = true;
      this.emitJoin(room);
      this.changed(room.roomId);
    }
  }

  private emitJoin(room: PvpRoomInbox): void {
    const transport = this.transport;
    if (!transport) {
      warn('no transport to resync room', room.roomId);
      room.resyncing = false;
      return;
    }
    // A side means we are a PLAYER of this room, whatever the screen thinks.
    transport.emit(room.side ? 'resume' : 'spectate', { roomId: room.roomId });
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private buffer(room: PvpRoomInbox, seq: number, line: string): void {
    // A duplicate frame (a resend, a second subscription that has since been
    // removed) must not be stored twice: the buffer is replayed through
    // `acceptFrame`, which would drop the second copy anyway, but a buffer that
    // grows on every resend is its own problem.
    if (seq >= 0 && room.buffered.some((f) => f.seq === seq)) return;
    room.buffered.push({ seq, line });
  }

  private flush(room: PvpRoomInbox): void {
    const session = room.session;
    if (!session || room.buffered.length === 0) return;
    const held = room.buffered;
    room.buffered = [];
    // Ordered, because a socket that reconnects mid-frame can deliver out of
    // order and `acceptFrame` treats a backwards seq as a duplicate.
    held.sort((a, b) => a.seq - b.seq);
    for (const frame of held) {
      session.acceptFrame(frame.seq >= 0 ? frame.seq : undefined, frame.line);
    }
  }

  private applyResync(room: PvpRoomInbox, lines: string[], seq: number): void {
    const session = room.session;
    if (!session) return;
    if (room.side) session.setViewerSide(room.side);
    this.rememberLastRequest(room, lines);
    // ONE call, never a loop of addLine (C1): `resync` throws the whole client
    // state away and rebuilds it, so the same log twice lands on the same
    // battle instead of a doubled one.
    session.resync(lines, { seq });
    if (room.winner !== null) session.winner = room.winner;
    if (room.replayId !== null) session.replayId = room.replayId;
    if (room.timer) session.timerState = room.timer;
  }

  private rememberLastRequest(room: PvpRoomInbox, lines: string[]): void {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].startsWith(REQUEST_PREFIX)) {
        room.lastRequestLine = lines[i];
        return;
      }
    }
  }
}

/** `|request|{json}` -> the parsed request, or null with a warning. */
export function parseRequestLine(line: string): any | null {
  if (!line.startsWith(REQUEST_PREFIX)) return null;
  const json = line.slice(REQUEST_PREFIX.length);
  if (!json.trim()) return null;
  try {
    return JSON.parse(json);
  } catch (e) {
    warn('malformed |request| JSON', line, e);
    return null;
  }
}

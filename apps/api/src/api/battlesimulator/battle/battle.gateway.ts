import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { isKnownFormat, validateTeam, unpackTeam } from '@boffmedia/battle-core';

import { env } from '@/config/env';
import { allowedOrigins } from '@/config/cors-origins';
import { BattleRoom, type RoomPlayer } from './battle.room';
import { MatchmakingService } from './matchmaking.service';
import { BattleTicketService, type BattlePrincipal } from '../battle-ticket.service';
import { BattlesimRepository } from '../battlesim.repository';

/**
 * PvP battles over a websocket.
 *
 * WHAT THIS FIXES. The gateway had no authentication at all. `JwtAuthGuard` is
 * global but returns true for a non-HTTP context, so it never applied here;
 * identity was the `clientId` string the client sent in `register`, which meant
 * anyone could claim to be anyone, take over another player's room through
 * `reconnect`, and read their battle. `cors: true` bypassed the origin
 * allowlist on top of that.
 *
 * Now: a socket presents a 60-second ticket minted over the authenticated HTTP
 * path (`POST battlesimulator/ws-ticket`), `io.use` verifies it once at
 * connection time, and `socket.data.user` is the ONLY identity any handler
 * reads. No handler takes an id from its payload.
 *
 * Fan-out is through real socket.io rooms rather than a hand-rolled loop over a
 * Map, which is also what makes spectating work: a spectator joins the room and
 * receives live protocol like everyone else, instead of the one-shot snapshot
 * they used to get and then never an update again.
 */

/** Per-account limits. Generous for a person, hostile to a script. */
const MAX_ROOMS_PER_USER = 3;
const CREATE_WINDOW_MS = 60_000;
const MAX_CREATES_PER_WINDOW = 10;
/** How long a finished room sticks around so both players can read the result. */
const ROOM_TTL_AFTER_END_MS = 5 * 60_000;
const REAPER_INTERVAL_MS = 60_000;
/** A disconnected player may come back to a live battle for this long. */
const RECONNECT_GRACE_MS = 30_000;
/** An unanswered challenge stops being answerable. */
const CHALLENGE_TTL_MS = 2 * 60_000;

declare module 'socket.io' {
  interface Socket {
    /** Set once, by the middleware, from a signed ticket. Never from a payload. */
    battleUser?: BattlePrincipal;
  }
}

@WebSocketGateway({
  namespace: '/battle',
  // NOT `cors: true`. socket.io does its own CORS, so the wildcard here
  // bypassed `app.enableCors()` entirely and left the namespace open to any
  // origin on the internet.
  cors: { origin: allowedOrigins(env.NODE_ENV === 'production'), credentials: false },
})
export class BattleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  /** roomId -> room. */
  private rooms = new Map<string, BattleRoom>();
  /** userId -> roomIds they hold a side in. */
  private userRooms = new Map<number, Set<string>>();
  /** userId -> createBattle timestamps inside the current window. */
  private createLog = new Map<number, number[]>();
  /** userId -> timer that forfeits their rooms if they do not come back. */
  private graceTimers = new Map<number, NodeJS.Timeout>();
  /** "challengerId:targetId" -> the offer. Reaped with the rooms. */
  private pendingChallenges = new Map<
    string,
    { from: BattlePrincipal; to: BattlePrincipal; format: string; team?: string; at: number }
  >();
  /** userId -> their live sockets. One account can have two tabs open. */
  private connections = new Map<number, Set<Socket>>();
  private reaper: NodeJS.Timeout | null = null;

  constructor(
    private readonly logger: Logger,
    private readonly matchmaking: MatchmakingService,
    private readonly tickets: BattleTicketService,
    private readonly repo: BattlesimRepository,
  ) {}

  afterInit(server: Server): void {
    // The whole authentication story, in one place: a connection either proves
    // who it is here or never reaches a handler.
    server.use((socket: Socket, next: (err?: Error) => void) => {
      const ticket = (socket.handshake.auth as { ticket?: unknown } | undefined)?.ticket;
      if (typeof ticket !== 'string' || !ticket) {
        next(new Error('unauthorized'));
        return;
      }
      try {
        socket.battleUser = this.tickets.verify(ticket);
        next();
      } catch {
        // The client's response to every failure here is the same — get a new
        // ticket — so the reason is not worth leaking.
        next(new Error('unauthorized'));
      }
    });

    this.reaper = setInterval(() => this.reap(), REAPER_INTERVAL_MS);
    this.reaper.unref?.();
  }

  handleConnection(client: Socket): void {
    // The middleware has already run, so an unauthenticated socket never
    // reaches here — but a socket with no identity is still not registered.
    const user = client.battleUser;
    if (!user) return;
    const set = this.connections.get(user.userId) ?? new Set<Socket>();
    set.add(client);
    this.connections.set(user.userId, set);
  }

  handleDisconnect(client: Socket): void {
    const user = client.battleUser;
    if (!user) return;

    const set = this.connections.get(user.userId);
    if (set) {
      set.delete(client);
      if (!set.size) this.connections.delete(user.userId);
    }
    // Another tab is still connected, so this is not a disconnect for the
    // account and nothing should be forfeited.
    if (this.connections.has(user.userId)) return;

    this.matchmaking.leaveQueue(user.userId);

    const held = this.userRooms.get(user.userId);
    if (!held?.size) return;

    // A dropped connection is not a forfeit yet: reconnects are common and a
    // battle should survive a tunnel. If they do not `resume` in time, every
    // live room they hold is conceded so the opponent is not stuck.
    const existing = this.graceTimers.get(user.userId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.graceTimers.delete(user.userId);
      for (const roomId of [...(this.userRooms.get(user.userId) ?? [])]) {
        const room = this.rooms.get(roomId);
        const side = room?.sideOf(user.userId);
        if (room && side && room.status === 'active') {
          void room.forfeit(side);
        }
      }
    }, RECONNECT_GRACE_MS);
    timer.unref?.();
    this.graceTimers.set(user.userId, timer);
  }

  // ── matchmaking ───────────────────────────────────────────────────────────

  @SubscribeMessage('joinQueue')
  async handleJoinQueue(
    client: Socket,
    payload: { format?: unknown; team?: unknown },
  ): Promise<void> {
    const user = client.battleUser;
    if (!user) return;

    const format = typeof payload?.format === 'string' ? payload.format : '';
    if (!isKnownFormat(format)) {
      client.emit('error', { code: 'unknown_format' });
      return;
    }

    const team = typeof payload?.team === 'string' ? payload.team : undefined;
    const problems = this.checkTeam(format, team);
    if (problems) {
      // The one place a detailed message IS the answer: the player has to know
      // which Pokémon is illegal to fix it.
      client.emit('teamRejected', { format, problems });
      return;
    }

    if ((this.userRooms.get(user.userId)?.size ?? 0) >= MAX_ROOMS_PER_USER) {
      client.emit('error', { code: 'too_many_battles' });
      return;
    }

    const match = this.matchmaking.joinQueue({
      playerId: String(user.userId),
      socketId: client.id,
      format,
      joinedAt: Date.now(),
      team,
      name: user.name,
    });

    if (!match) {
      client.emit('queueJoined', { format, position: this.matchmaking.getQueueSize(format) });
      return;
    }

    await this.createRoom(
      { userId: Number(match.player1.playerId), name: match.player1.name ?? 'Player', team: match.player1.team },
      { userId: Number(match.player2.playerId), name: match.player2.name ?? 'Player', team: match.player2.team },
      match.format,
    );
  }

  @SubscribeMessage('leaveQueue')
  handleLeaveQueue(client: Socket): void {
    const user = client.battleUser;
    if (!user) return;
    this.matchmaking.leaveQueue(user.userId);
    client.emit('queueLeft');
  }

  // ── direct challenges ─────────────────────────────────────────────────────
  //
  // Addressed by USERNAME, which is the account-era replacement for the
  // client-generated id players used to copy to each other. A challenge only
  // works between two people who are both online, so the target is resolved
  // against the live connection map rather than the database — there is nothing
  // useful to look up about someone who is not here.

  @SubscribeMessage('challengePlayer')
  handleChallenge(
    client: Socket,
    payload: { targetName?: unknown; format?: unknown; team?: unknown },
  ): void {
    const user = client.battleUser;
    if (!user) return;

    const format = typeof payload?.format === 'string' ? payload.format : '';
    if (!isKnownFormat(format)) {
      client.emit('error', { code: 'unknown_format' });
      return;
    }

    const targetName = String(payload?.targetName ?? '').trim().slice(0, 32);
    const target = this.findConnectedByName(targetName);
    if (!target || target.userId === user.userId) {
      // Same answer for "not online", "no such account" and "yourself": none of
      // them is worth confirming to someone probing for usernames.
      client.emit('error', { code: 'player_unavailable' });
      return;
    }

    const team = typeof payload?.team === 'string' ? payload.team : undefined;
    const problems = this.checkTeam(format, team);
    if (problems) {
      client.emit('teamRejected', { format, problems });
      return;
    }

    this.pendingChallenges.set(`${user.userId}:${target.userId}`, {
      from: user,
      to: target,
      format,
      team,
      at: Date.now(),
    });

    this.emitToUser(target.userId, 'challengeReceived', { from: user.name, format });
    client.emit('challengeSent', { to: target.name, format });
  }

  @SubscribeMessage('acceptChallenge')
  async handleAcceptChallenge(
    client: Socket,
    payload: { fromName?: unknown; team?: unknown },
  ): Promise<void> {
    const user = client.battleUser;
    if (!user) return;

    const fromName = String(payload?.fromName ?? '').trim();
    const challenger = this.findConnectedByName(fromName);
    const key = challenger ? `${challenger.userId}:${user.userId}` : '';
    const challenge = key ? this.pendingChallenges.get(key) : undefined;
    if (!challenge || !challenger) {
      client.emit('error', { code: 'challenge_expired' });
      return;
    }
    this.pendingChallenges.delete(key);

    const team = typeof payload?.team === 'string' ? payload.team : undefined;
    const problems = this.checkTeam(challenge.format, team);
    if (problems) {
      client.emit('teamRejected', { format: challenge.format, problems });
      return;
    }

    this.matchmaking.leaveQueue(challenger.userId);
    this.matchmaking.leaveQueue(user.userId);

    await this.createRoom(
      { userId: challenger.userId, name: challenger.name, team: challenge.team },
      { userId: user.userId, name: user.name, team },
      challenge.format,
    );
  }

  @SubscribeMessage('rejectChallenge')
  handleRejectChallenge(client: Socket, payload: { fromName?: unknown }): void {
    const user = client.battleUser;
    if (!user) return;
    const challenger = this.findConnectedByName(String(payload?.fromName ?? '').trim());
    if (!challenger) return;
    const key = `${challenger.userId}:${user.userId}`;
    if (this.pendingChallenges.delete(key)) {
      this.emitToUser(challenger.userId, 'challengeRejected', { by: user.name });
    }
  }

  // ── in-battle ─────────────────────────────────────────────────────────────

  @SubscribeMessage('makeChoice')
  async handleMakeChoice(
    client: Socket,
    payload: { roomId?: unknown; choice?: unknown },
  ): Promise<void> {
    const ctx = this.contextFor(client, payload?.roomId);
    if (!ctx) return;
    const choice = typeof payload?.choice === 'string' ? payload.choice.slice(0, 120) : '';
    if (!choice) return;
    await ctx.room.choose(ctx.side, choice);
  }

  @SubscribeMessage('undoChoice')
  async handleUndoChoice(client: Socket, payload: { roomId?: unknown }): Promise<void> {
    const ctx = this.contextFor(client, payload?.roomId);
    if (!ctx) return;
    await ctx.room.undo(ctx.side);
  }

  @SubscribeMessage('forfeit')
  async handleForfeit(client: Socket, payload: { roomId?: unknown }): Promise<void> {
    const ctx = this.contextFor(client, payload?.roomId);
    if (!ctx) return;
    await ctx.room.forfeit(ctx.side);
  }

  @SubscribeMessage('chatMessage')
  handleChat(client: Socket, payload: { roomId?: unknown; message?: unknown }): void {
    const ctx = this.contextFor(client, payload?.roomId);
    if (!ctx) return;
    const text = String(payload?.message ?? '').trim().slice(0, 300);
    if (!text) return;
    // `sender` is the authenticated name, not anything the client supplied.
    this.server.to(ctx.room.id).emit('chatMessage', {
      roomId: ctx.room.id,
      sender: ctx.user.name,
      message: text,
      timestamp: Date.now(),
    });
  }

  /**
   * Rejoin a battle after a reconnect.
   *
   * Replaces `reconnect{playerId, roomId}`, which took over whatever account
   * the payload named. This one only ever resumes the socket's OWN side.
   */
  @SubscribeMessage('resume')
  handleResume(client: Socket, payload: { roomId?: unknown }): void {
    const user = client.battleUser;
    if (!user) return;
    const roomId = typeof payload?.roomId === 'string' ? payload.roomId : '';
    const room = this.rooms.get(roomId);
    const side = room?.sideOf(user.userId) ?? null;
    if (!room || !side) {
      client.emit('error', { code: 'not_in_battle' });
      return;
    }

    const timer = this.graceTimers.get(user.userId);
    if (timer) {
      clearTimeout(timer);
      this.graceTimers.delete(user.userId);
    }

    void client.join(roomId);
    client.emit('resumed', {
      roomId,
      side,
      status: room.status,
      replay: room.replay,
    });
    const pending = room.currentRequest(side);
    if (pending) client.emit('request', { roomId, request: pending });
  }

  /**
   * Watch a battle you are not in.
   *
   * Joins the socket.io room, so from here on the spectator receives the same
   * live `protocol` stream as the players. Previously this returned one
   * snapshot and then nothing, which looked like a frozen battle.
   */
  @SubscribeMessage('spectate')
  handleSpectate(client: Socket, payload: { roomId?: unknown }): void {
    if (!client.battleUser) return;
    const roomId = typeof payload?.roomId === 'string' ? payload.roomId : '';
    const room = this.rooms.get(roomId);
    if (!room) {
      client.emit('error', { code: 'battle_not_found' });
      return;
    }
    void client.join(roomId);
    client.emit('spectateJoined', {
      roomId,
      status: room.status,
      replay: room.replay,
      format: room.format,
    });
  }

  // ── internals ─────────────────────────────────────────────────────────────

  /** Resolves the socket's room and side, or emits and returns null. */
  private contextFor(
    client: Socket,
    rawRoomId: unknown,
  ): { user: BattlePrincipal; room: BattleRoom; side: 'p1' | 'p2' } | null {
    const user = client.battleUser;
    if (!user) return null;
    const roomId = typeof rawRoomId === 'string' ? rawRoomId : '';
    const room = this.rooms.get(roomId);
    if (!room) {
      client.emit('error', { code: 'battle_not_found' });
      return null;
    }
    const side = room.sideOf(user.userId);
    if (!side) {
      // Covers both "not your battle" and spectators trying to act.
      client.emit('error', { code: 'not_in_battle' });
      return null;
    }
    return { user, room, side };
  }

  /** Server-side legality, the half a client cannot be trusted with (D12). */
  private checkTeam(format: string, packed?: string): string[] | null {
    if (!packed) return null;
    const team = unpackTeam(packed);
    if (!team) return ['El equipo no se pudo leer.'];
    const result = validateTeam(format, team);
    return result.ok ? null : result.problems;
  }

  private rateLimited(userId: number): boolean {
    const now = Date.now();
    const recent = (this.createLog.get(userId) ?? []).filter((t) => now - t < CREATE_WINDOW_MS);
    if (recent.length >= MAX_CREATES_PER_WINDOW) {
      this.createLog.set(userId, recent);
      return true;
    }
    recent.push(now);
    this.createLog.set(userId, recent);
    return false;
  }

  private async createRoom(p1: RoomPlayer, p2: RoomPlayer, format: string): Promise<void> {
    if (this.rateLimited(p1.userId) || this.rateLimited(p2.userId)) return;

    const roomId = randomUUID();
    const room = new BattleRoom(
      roomId,
      format,
      p1,
      p2,
      {
        onProtocol: (line) => this.server.to(roomId).emit('protocol', { roomId, line }),
        // A request is private to one side — it names that player's whole team
        // — so it goes to their socket, never to the room.
        onRequestP1: (request) => this.emitToUser(p1.userId, 'request', { roomId, request }),
        onRequestP2: (request) => this.emitToUser(p2.userId, 'request', { roomId, request }),
        onTimerUpdate: (state) => this.server.to(roomId).emit('timerUpdate', { roomId, ...state }),
        onError: (code) => this.server.to(roomId).emit('error', { roomId, code }),
        onBattleEnd: (result) => {
          void this.persistReplay(room, result.winner, result.log);
          this.server.to(roomId).emit('battleEnd', { roomId, winner: result.winner });
          this.release(roomId);
        },
      },
      this.logger,
    );

    this.rooms.set(roomId, room);
    this.hold(p1.userId, roomId);
    this.hold(p2.userId, roomId);

    for (const [userId, side] of [
      [p1.userId, 'p1'],
      [p2.userId, 'p2'],
    ] as const) {
      for (const socket of this.socketsOf(userId)) void socket.join(roomId);
      this.emitToUser(userId, 'battleCreated', { roomId, format, side });
    }

    try {
      await room.start();
    } catch (error) {
      this.logger.error(
        `[battle ${roomId}] failed to start: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      this.server.to(roomId).emit('error', { roomId, code: 'battle_start_failed' });
      this.rooms.delete(roomId);
      this.release(roomId);
    }
  }

  /** Every connected socket belonging to an account. */
  private socketsOf(userId: number): Socket[] {
    return [...(this.connections.get(userId) ?? [])];
  }

  /** An online account by display name, case-insensitively. */
  private findConnectedByName(name: string): BattlePrincipal | null {
    if (!name) return null;
    const wanted = name.toLowerCase();
    for (const sockets of this.connections.values()) {
      for (const socket of sockets) {
        if (socket.battleUser?.name.toLowerCase() === wanted) return socket.battleUser;
      }
    }
    return null;
  }

  private emitToUser(userId: number, event: string, payload: unknown): void {
    for (const socket of this.socketsOf(userId)) socket.emit(event, payload);
  }

  private hold(userId: number, roomId: string): void {
    const set = this.userRooms.get(userId) ?? new Set<string>();
    set.add(roomId);
    this.userRooms.set(userId, set);
  }

  /** Drops the room from both players' holdings; the room object itself is
   *  kept until the reaper takes it, so a late `resume` still finds the result. */
  private release(roomId: string): void {
    for (const [userId, set] of this.userRooms) {
      if (set.delete(roomId) && set.size === 0) this.userRooms.delete(userId);
    }
  }

  /**
   * Persists the finished battle for BOTH accounts.
   *
   * The old path wrote display names into `rotom_replays.side1/side2` and never
   * called `createUserReplay`, so a PvP battle produced a row nobody owned and
   * neither player could find.
   */
  private async persistReplay(room: BattleRoom, winner: string, log: string): Promise<void> {
    try {
      await this.repo.recordPvpReplay({
        format: room.format,
        p1: room.p1,
        p2: room.p2,
        winner,
        log,
        playedAt: Date.now(),
      });
    } catch (error) {
      // A lost replay must not take the battle's ending down with it.
      this.logger.error(
        `[battle ${room.id}] replay not saved: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  /** Frees finished rooms. Without this the Maps only ever grew. */
  private reap(): void {
    const now = Date.now();
    for (const [roomId, room] of this.rooms) {
      if (room.finishedAt && now - room.finishedAt > ROOM_TTL_AFTER_END_MS) {
        this.rooms.delete(roomId);
        this.release(roomId);
      }
    }
    for (const [key, challenge] of this.pendingChallenges) {
      if (now - challenge.at > CHALLENGE_TTL_MS) this.pendingChallenges.delete(key);
    }
    for (const [userId, stamps] of this.createLog) {
      const recent = stamps.filter((t) => now - t < CREATE_WINDOW_MS);
      if (recent.length) this.createLog.set(userId, recent);
      else this.createLog.delete(userId);
    }
  }
}

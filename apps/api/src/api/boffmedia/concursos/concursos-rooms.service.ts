import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Subject } from 'rxjs';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import type {
  ConcursosRoomDto,
  ConcursosConfigurationDto,
  ConcursosRecoverySettingsDto,
  ConcursosEntityDto,
  ConcursosActionDto,
  StartConcursosGameDto,
} from './concursos.dto';
import { recoverySettings } from './concursos-recovery-settings';
import { ConcursosGame, gameConflict } from './concursos-game';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MEMBER_IDLE_MS = 15_000;
const ROOM_LIFETIME_MS = 4 * 60 * 60_000;
const CLOSED_RETENTION_MS = 60_000;
const CAPACITY = 4;
const MAX_ROOMS = 100;

type Member = {
  id: string;
  nickname: string;
  seenAt: number;
  sockets: Set<symbol>;
  socketSeen: boolean;
  lostAt?: number;
  groupId?: string;
};
type Room = {
  code: string;
  hostHash: string;
  mode: 'individual' | 'teams';
  pacing: 'automatic' | 'directed';
  resultSeconds: number;
  game?: ConcursosGame;
  createdAt: number;
  hostSeenAt: number;
  recoverySettings: ConcursosRecoverySettingsDto;
  hostSockets: Set<symbol>;
  hostSocketSeen: boolean;
  hostLostAt?: number;
  closedAt?: number;
  members: Map<string, Member>;
};

/** Bounded ephemeral rooms with an authoritative game and participant-private views.
 * Bearer capabilities belong to one host/member and are not Boffmedia accounts.
 * The short code discovers a room; it never grants host or reconnect authority. */
@Injectable()
export class ConcursosRoomsService {
  readonly changed = new Subject<string>();

  private publish(snapshot: ConcursosRoomDto): ConcursosRoomDto {
    this.changed.next(snapshot.code);
    return snapshot;
  }

  private readonly rooms = new Map<string, Room>();
  private readonly hosts = new Map<string, string>();
  private readonly createWindows = new Map<
    string,
    { count: number; until: number }
  >();

  private actor(token: string | null): string {
    if (!token || !/^[a-f0-9]{48}$/.test(token)) {
      throw new UnauthorizedException(
        userError(ApiErrorCode.CONCURSOS_ACCESS, 'invalid room capability'),
      );
    }
    return createHash('sha256').update(token).digest('hex');
  }

  private sweep(now: number): void {
    for (const [code, room] of this.rooms) {
      if (room.closedAt === undefined && room.hostSocketSeen) {
        // Native host sends an application heartbeat every second. Explicit socket
        // close starts grace immediately; silence uses last confirmed activity.
        if (room.hostLostAt === undefined && now - room.hostSeenAt >= 1500)
          room.hostLostAt = room.hostSeenAt;
      }
      for (const member of room.members.values()) {
        if (member.lostAt === undefined) {
          const timeout = member.socketSeen ? 1500 : MEMBER_IDLE_MS;
          if (now - member.seenAt >= timeout)
            member.lostAt = member.socketSeen
              ? member.seenAt
              : member.seenAt + timeout;
        }
      }
      if (room.closedAt === undefined) this.syncGame(room, now);
      if (
        room.closedAt === undefined &&
        (now - (room.hostLostAt ?? room.hostSeenAt) >=
          room.recoverySettings.hostRetentionMinutes * 60_000 ||
          now - room.createdAt >= ROOM_LIFETIME_MS)
      ) {
        room.closedAt = now;
      }
      if (
        room.closedAt !== undefined &&
        now - room.closedAt >= CLOSED_RETENTION_MS
      ) {
        this.rooms.delete(code);
        if (this.hosts.get(room.hostHash) === code)
          this.hosts.delete(room.hostHash);
      }
    }
    for (const [key, window] of this.createWindows) {
      if (now >= window.until) this.createWindows.delete(key);
    }
  }

  private syncGame(room: Room, now = Date.now()) {
    const absent = new Map<string, number>();
    for (const member of room.members.values())
      if (member.lostAt !== undefined) absent.set(member.id, member.lostAt);
    room.game?.syncPresence(
      absent,
      now,
      room.hostSocketSeen && room.hostLostAt !== undefined
        ? room.hostLostAt + room.recoverySettings.hostGraceSeconds * 1000
        : undefined,
    );
  }
  private touchMember(member: Member) {
    member.seenAt = Date.now();
    member.lostAt = undefined;
  }

  private get(code: string): Room {
    this.sweep(Date.now());
    const room = this.rooms.get(code);
    if (!room)
      throw new NotFoundException(
        userError(ApiErrorCode.CONCURSOS_NOT_FOUND, 'room not found'),
      );
    return room;
  }

  private view(
    room: Room,
    role: 'host' | 'player',
    member?: Member,
  ): ConcursosRoomDto {
    const game =
      room.closedAt === undefined ? room.game?.view(member?.id) : undefined;
    return {
      hostConnected: room.hostLostAt === undefined,
      recoverySettings: structuredClone(room.recoverySettings),
      mode: room.mode,
      pacing: room.pacing,
      resultSeconds: room.resultSeconds,
      entities: this.entities(room).map((e) => ({
        ...e,
        memberIds: [...e.memberIds],
      })),
      ...(game && { game }),
      code: room.code,
      status:
        room.closedAt !== undefined
          ? 'closed'
          : room.game
            ? 'playing'
            : 'lobby',
      capacity: CAPACITY,
      role,
      ...(member && { memberId: member.id }),
      members:
        room.closedAt === undefined
          ? Array.from(room.members.values(), (player) => ({
              id: player.id,
              nickname: player.nickname,
              entityId: room.mode === 'individual' ? player.id : player.groupId,
              connected: player.lostAt === undefined,
            }))
          : [],
    };
  }

  create(
    token: string | null,
    source: string,
    settings?: ConcursosRecoverySettingsDto,
  ): ConcursosRoomDto {
    const profile = recoverySettings(settings);
    const actor = this.actor(token);
    const now = Date.now();
    this.sweep(now);
    const previous = this.hosts.get(actor);
    if (previous) {
      const room = this.rooms.get(previous);
      if (room && room.closedAt === undefined) {
        room.hostSeenAt = now;
        return this.publish(this.view(room, 'host'));
      }
    }
    const window = this.createWindows.get(source);
    if (
      this.rooms.size >= MAX_ROOMS ||
      (window?.count ?? 0) >= 5 ||
      (!window && this.createWindows.size >= 256)
    ) {
      throw new HttpException(
        userError(ApiErrorCode.CONCURSOS_BUSY, 'room creation limit'),
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (window) window.count += 1;
    else this.createWindows.set(source, { count: 1, until: now + 60_000 });
    let code: string;
    do {
      code = Array.from(
        { length: 6 },
        () => ALPHABET[randomInt(ALPHABET.length)],
      ).join('');
    } while (this.rooms.has(code));
    const room: Room = {
      code,
      hostHash: actor,
      mode: 'individual',
      pacing: 'automatic',
      resultSeconds: 8,
      createdAt: now,
      hostSeenAt: now,
      recoverySettings: profile,
      hostSockets: new Set(),
      hostSocketSeen: false,
      members: new Map(),
    };
    this.rooms.set(code, room);
    this.hosts.set(actor, code);
    return this.publish(this.view(room, 'host'));
  }

  join(code: string, token: string | null, nickname: string): ConcursosRoomDto {
    const actor = this.actor(token);
    const room = this.get(code);
    if (room.closedAt !== undefined)
      throw new ConflictException(
        userError(ApiErrorCode.CONCURSOS_CLOSED, 'room closed'),
      );
    if (room.hostHash === actor)
      throw new ForbiddenException(
        userError(
          ApiErrorCode.CONCURSOS_ACCESS,
          'host capability cannot join as player',
        ),
      );
    const previous = room.members.get(actor);
    if (previous) {
      if (previous.nickname !== nickname)
        throw new ConflictException(
          userError(ApiErrorCode.CONCURSOS_NAME, 'reconnect nickname changed'),
        );
      this.touchMember(previous);
      this.syncGame(room);
      return this.publish(this.view(room, 'player', previous));
    }
    if (room.game) gameConflict();
    if (room.members.size >= CAPACITY)
      throw new ConflictException(
        userError(ApiErrorCode.CONCURSOS_FULL, 'room full'),
      );
    if (
      Array.from(room.members.values()).some(
        (member) =>
          member.nickname.toLocaleLowerCase() === nickname.toLocaleLowerCase(),
      )
    ) {
      throw new ConflictException(
        userError(ApiErrorCode.CONCURSOS_NAME, 'nickname already used'),
      );
    }
    const member: Member = {
      id: randomUUID(),
      nickname,
      seenAt: Date.now(),
      sockets: new Set(),
      socketSeen: false,
    };
    room.members.set(actor, member);
    return this.publish(this.view(room, 'player', member));
  }

  read(code: string, token: string | null, touch = true): ConcursosRoomDto {
    const actor = this.actor(token);
    const room = this.get(code);
    if (room.hostHash === actor) {
      if (touch && room.closedAt === undefined) {
        room.hostSeenAt = Date.now();
        room.hostLostAt = undefined;
      }
      this.syncGame(room);
      return this.view(room, 'host');
    }
    const member = room.members.get(actor);
    if (!member)
      throw new ForbiddenException(
        userError(ApiErrorCode.CONCURSOS_ACCESS, 'not a room member'),
      );
    if (touch) this.touchMember(member);
    this.syncGame(room);
    return this.view(room, 'player', member);
  }

  close(code: string, token: string | null): ConcursosRoomDto {
    const actor = this.actor(token);
    const room = this.get(code);
    if (room.hostHash !== actor)
      throw new ForbiddenException(
        userError(ApiErrorCode.CONCURSOS_ACCESS, 'host required'),
      );
    room.closedAt ??= Date.now();
    return this.publish(this.view(room, 'host'));
  }

  leave(code: string, token: string | null): ConcursosRoomDto {
    const actor = this.actor(token);
    const room = this.get(code);
    const member = room.members.get(actor);
    if (!member)
      throw new ForbiddenException(
        userError(ApiErrorCode.CONCURSOS_ACCESS, 'not a room member'),
      );
    if (
      room.game &&
      room.game.stage !== 'finished' &&
      room.closedAt === undefined
    )
      gameConflict();
    room.members.delete(actor);
    return this.publish(this.view(room, 'player', member));
  }
  socketOpened(code: string, token: string, connection: symbol) {
    const actor = this.actor(token);
    const room = this.get(code);
    if (actor === room.hostHash && room.closedAt === undefined) {
      room.hostSockets.add(connection);
      room.hostSocketSeen = true;
      room.hostSeenAt = Date.now();
      room.hostLostAt = undefined;
    } else {
      const member = room.members.get(actor);
      if (!member || room.closedAt !== undefined) return;
      member.sockets.add(connection);
      member.socketSeen = true;
      this.touchMember(member);
    }
    this.syncGame(room);
    this.changed.next(code);
  }
  socketClosed(code: string, token: string, connection: symbol) {
    const room = this.rooms.get(code);
    if (!room || room.closedAt !== undefined) return;
    const actor = this.actor(token);
    if (actor === room.hostHash) {
      if (!room.hostSockets.delete(connection)) return;
      if (!room.hostSockets.size) room.hostLostAt ??= Date.now();
    } else {
      const member = room.members.get(actor);
      if (!member || !member.sockets.delete(connection)) return;
      if (!member.sockets.size) member.lostAt ??= Date.now();
    }
    // The normal sweep applies all losses together before evaluating game rules.
    this.changed.next(code);
  }
  private entities(room: Room): ConcursosEntityDto[] {
    if (room.game) return room.game.entities;
    const members = Array.from(room.members.values());
    if (room.mode === 'individual')
      return members.map((m) => ({
        id: m.id,
        label: m.nickname,
        memberIds: [m.id],
        score: 0,
      }));
    return ['team-1', 'team-2'].map((id, index) => {
      const ids = members.filter((m) => m.groupId === id).map((m) => m.id);
      return {
        id,
        label: String(index + 1),
        memberIds: ids,
        ...(ids[0] && { captainId: ids[0] }),
        score: 0,
      };
    });
  }
  private context(code: string, token: string | null) {
    const actor = this.actor(token);
    const room = this.get(code);
    if (room.closedAt !== undefined) gameConflict();
    const host = actor === room.hostHash;
    const member = room.members.get(actor);
    if (!host && !member)
      throw new ForbiddenException(
        userError(ApiErrorCode.CONCURSOS_ACCESS, 'not a room member'),
      );
    if (host) {
      room.hostSeenAt = Date.now();
      room.hostLostAt = undefined;
    }
    if (member) this.touchMember(member);
    this.syncGame(room);
    return { room, host, member };
  }
  configure(
    code: string,
    token: string | null,
    configuration: ConcursosConfigurationDto | 'individual' | 'teams',
  ) {
    const { room, host } = this.context(code, token);
    if (!host)
      throw new ForbiddenException(
        userError(ApiErrorCode.CONCURSOS_ACCESS, 'host required'),
      );
    if (room.game) gameConflict();
    const body =
      typeof configuration === 'string'
        ? { mode: configuration }
        : configuration;
    if (
      !body ||
      !Object.keys(body).length ||
      (body.mode !== undefined &&
        !['individual', 'teams'].includes(body.mode)) ||
      (body.pacing !== undefined &&
        !['automatic', 'directed'].includes(body.pacing)) ||
      (body.resultSeconds !== undefined &&
        (!Number.isInteger(body.resultSeconds) ||
          body.resultSeconds < 3 ||
          body.resultSeconds > 30))
    )
      gameConflict();
    const profile =
      body.recoverySettings === undefined
        ? room.recoverySettings
        : recoverySettings(body.recoverySettings);
    room.recoverySettings = profile;
    if (body.mode !== undefined) room.mode = body.mode;
    if (body.pacing !== undefined) room.pacing = body.pacing;
    if (body.resultSeconds !== undefined)
      room.resultSeconds = body.resultSeconds;
    return this.publish(this.view(room, 'host'));
  }
  group(code: string, token: string | null, entityId: string) {
    const { room, member } = this.context(code, token);
    if (
      !member ||
      room.mode !== 'teams' ||
      room.game ||
      !['team-1', 'team-2'].includes(entityId)
    )
      gameConflict();
    member.groupId = entityId;
    return this.publish(this.view(room, 'player', member));
  }
  startGame(code: string, token: string | null, body: StartConcursosGameDto) {
    const { room, host } = this.context(code, token);
    if (!host)
      throw new ForbiddenException(
        userError(ApiErrorCode.CONCURSOS_ACCESS, 'host required'),
      );
    if (!room.game) {
      if (
        room.mode === 'teams' &&
        Array.from(room.members.values()).some((m) => !m.groupId)
      )
        gameConflict();
      room.game = new ConcursosGame(
        this.entities(room),
        structuredClone(body.questions),
        room.mode,
        room.pacing,
        room.resultSeconds,
        structuredClone(room.recoverySettings),
      );
    }
    this.syncGame(room);
    return this.publish(this.view(room, 'host'));
  }
  action(code: string, token: string | null, body: ConcursosActionDto) {
    const { room, host, member } = this.context(code, token);
    if (!room.game) gameConflict();
    room.game.act(member?.id, body);
    return this.publish(this.view(room, host ? 'host' : 'player', member));
  }
}

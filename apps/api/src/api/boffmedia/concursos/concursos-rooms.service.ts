import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import type { ConcursosRoomDto } from './concursos.dto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const HOST_IDLE_MS = 90_000;
const MEMBER_IDLE_MS = 15_000;
const ROOM_LIFETIME_MS = 4 * 60 * 60_000;
const CLOSED_RETENTION_MS = 60_000;
const CAPACITY = 4;
const MAX_ROOMS = 100;

type Member = { id: string; nickname: string; seenAt: number };
type Room = {
  code: string;
  hostHash: string;
  createdAt: number;
  hostSeenAt: number;
  closedAt?: number;
  members: Map<string, Member>;
};

/** First increment: a bounded, ephemeral lobby. No contest data or answers here.
 * Bearer capabilities belong to one host/member and are not Boffmedia accounts.
 * The short code discovers a room; it never grants host or reconnect authority. */
@Injectable()
export class ConcursosRoomsService {
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
      if (
        room.closedAt === undefined &&
        (now - room.hostSeenAt >= HOST_IDLE_MS ||
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
    return {
      code: room.code,
      status: room.closedAt === undefined ? 'lobby' : 'closed',
      capacity: CAPACITY,
      role,
      ...(member && { memberId: member.id }),
      members:
        room.closedAt === undefined
          ? Array.from(room.members.values(), (player) => ({
              id: player.id,
              nickname: player.nickname,
              connected: Date.now() - player.seenAt < MEMBER_IDLE_MS,
            }))
          : [],
    };
  }

  create(token: string | null, source: string): ConcursosRoomDto {
    const actor = this.actor(token);
    const now = Date.now();
    this.sweep(now);
    const previous = this.hosts.get(actor);
    if (previous) {
      const room = this.rooms.get(previous);
      if (room && room.closedAt === undefined) {
        room.hostSeenAt = now;
        return this.view(room, 'host');
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
      createdAt: now,
      hostSeenAt: now,
      members: new Map(),
    };
    this.rooms.set(code, room);
    this.hosts.set(actor, code);
    return this.view(room, 'host');
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
      previous.seenAt = Date.now();
      return this.view(room, 'player', previous);
    }
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
    const member: Member = { id: randomUUID(), nickname, seenAt: Date.now() };
    room.members.set(actor, member);
    return this.view(room, 'player', member);
  }

  read(code: string, token: string | null): ConcursosRoomDto {
    const actor = this.actor(token);
    const room = this.get(code);
    if (room.hostHash === actor) {
      if (room.closedAt === undefined) room.hostSeenAt = Date.now();
      return this.view(room, 'host');
    }
    const member = room.members.get(actor);
    if (!member)
      throw new ForbiddenException(
        userError(ApiErrorCode.CONCURSOS_ACCESS, 'not a room member'),
      );
    member.seenAt = Date.now();
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
    return this.view(room, 'host');
  }

  leave(code: string, token: string | null): ConcursosRoomDto {
    const actor = this.actor(token);
    const room = this.get(code);
    const member = room.members.get(actor);
    if (!member)
      throw new ForbiddenException(
        userError(ApiErrorCode.CONCURSOS_ACCESS, 'not a room member'),
      );
    room.members.delete(actor);
    return this.view(room, 'player', member);
  }
}

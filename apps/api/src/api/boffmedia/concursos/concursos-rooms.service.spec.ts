import { ConcursosRoomsService } from './concursos-rooms.service';
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
const token = (n: number) => n.toString(16).padStart(48, '0');

describe('Concursos room-code lobby', () => {
  let rooms: ConcursosRoomsService;
  let now: number;
  beforeEach(() => {
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    rooms = new ConcursosRoomsService();
  });
  afterEach(() => jest.restoreAllMocks());
  it('creates a short room code without an account and retries without another room', () => {
    const first = rooms.create(token(1), 'source');
    expect(first.code).toMatch(/^[A-HJ-NP-Z]{6}$/);
    expect(first).toMatchObject({
      role: 'host',
      status: 'lobby',
      members: [],
      capacity: 4,
    });
    expect(rooms.create(token(1), 'source').code).toBe(first.code);
    expect(JSON.stringify(first)).not.toContain(token(1));
    expect(first).not.toHaveProperty('hostHash');
  });
  it.each([null, '', 'short', 'a'.repeat(47), 'A'.repeat(48), 'a'.repeat(49)])(
    'requires a strong anonymous capability (%s)',
    (invalid) => {
      expect(() => rooms.create(invalid, 'source')).toThrow(
        UnauthorizedException,
      );
    },
  );
  it('does not grant host authority or reconnect identity through a code or nickname', () => {
    const host = rooms.create(token(1), 'source');
    const member = rooms.join(host.code, token(2), 'Lucía');
    expect(member).toMatchObject({
      role: 'player',
      memberId: expect.any(String),
    });
    expect(() => rooms.close(host.code, token(2))).toThrow(ForbiddenException);
    expect(() => rooms.read(host.code, token(3))).toThrow(ForbiddenException);
    expect(() => rooms.join(host.code, token(3), 'lucía')).toThrow(
      ConflictException,
    );
    expect(() => rooms.join(host.code, token(1), 'Host')).toThrow(
      ForbiddenException,
    );
    const view = rooms.read(host.code, token(1));
    expect(view.members[0]).toEqual({
      id: member.memberId,
      nickname: 'Lucía',
      connected: true,
      entityId: member.memberId,
    });
    expect(JSON.stringify(view)).not.toContain(token(2));
  });
  it('recovers the same member on retry and refresh, without consuming another seat', () => {
    const { code } = rooms.create(token(1), 'source');
    const first = rooms.join(code, token(2), 'Lucía');
    expect(rooms.join(code, token(2), 'Lucía').memberId).toBe(first.memberId);
    expect(rooms.read(code, token(2)).memberId).toBe(first.memberId);
    expect(rooms.read(code, token(1)).members).toHaveLength(1);
    expect(() => rooms.join(code, token(2), 'Changed')).toThrow(
      ConflictException,
    );
  });
  it('admits four members, rejects overflow and lets a member free their own seat', () => {
    const { code } = rooms.create(token(1), 'source');
    for (let i = 2; i < 6; i++) rooms.join(code, token(i), 'Player ' + i);
    expect(() => rooms.join(code, token(6), 'Overflow')).toThrow(
      ConflictException,
    );
    rooms.leave(code, token(2));
    expect(() => rooms.read(code, token(2))).toThrow(ForbiddenException);
    expect(rooms.join(code, token(6), 'New').members).toHaveLength(4);
    expect(() => rooms.leave(code, token(1))).toThrow(ForbiddenException);
  });
  it('marks disconnected members, restores presence and never adds another seat', () => {
    const { code } = rooms.create(token(1), 'source');
    const first = rooms.join(code, token(2), 'Ana');
    now += 15_000;
    expect(rooms.read(code, token(1)).members[0].connected).toBe(false);
    expect(rooms.read(code, token(2)).members[0]).toMatchObject({
      connected: true,
      id: first.memberId,
    });
  });
  it('closes on host departure and refuses new players; old guests see the closure', () => {
    const { code } = rooms.create(token(1), 'source');
    rooms.join(code, token(2), 'Ana');
    expect(rooms.close(code, token(1)).status).toBe('closed');
    expect(rooms.close(code, token(1)).status).toBe('closed');
    expect(rooms.read(code, token(2))).toMatchObject({
      status: 'closed',
      members: [],
    });
    expect(() => rooms.join(code, token(3), 'New')).toThrow(ConflictException);
    now += 60_000;
    expect(() => rooms.read(code, token(1))).toThrow();
  });
  it('expires a missing host even while a guest remains active, and cannot revive it', () => {
    const { code } = rooms.create(token(1), 'source');
    rooms.join(code, token(2), 'Ana');
    now += 10 * 60_000;
    expect(rooms.read(code, token(2)).status).toBe('closed');
    expect(rooms.read(code, token(1)).status).toBe('closed');
    expect(rooms.create(token(1), 'source').code).not.toBe(code);
  });
  it('uses a finite room lifetime despite host heartbeats', () => {
    const { code } = rooms.create(token(1), 'source');
    for (let i = 0; i < 240; i++) {
      now += 60_000;
      rooms.read(code, token(1));
    }
    expect(rooms.read(code, token(1)).status).toBe('closed');
  });
  it('bounds anonymous room creation and rate-window storage', () => {
    for (let i = 1; i <= 5; i++) rooms.create(token(i), 'one source');
    expect(() => rooms.create(token(6), 'one source')).toThrow(HttpException);
    now += 60_000;
    expect(rooms.create(token(6), 'one source').code).toBeTruthy();
    for (let i = 7; i <= 100; i++) rooms.create(token(i), 'source ' + i);
    expect(() => rooms.create(token(101), 'another')).toThrow(HttpException);
  });
  it('returns a snapshot that cannot mutate the authoritative roster', () => {
    const { code } = rooms.create(token(1), 'source');
    rooms.join(code, token(2), 'Ana');
    rooms.read(code, token(1)).members[0].nickname = 'Changed';
    expect(rooms.read(code, token(1)).members[0].nickname).toBe('Ana');
  });
});

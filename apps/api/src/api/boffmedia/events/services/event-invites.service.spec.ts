import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventInvitesService } from './event-invites.service';
import { EventInvitesRepository } from '../repositories/event-invites.repository';

// The atomic conditional UPDATE in the repository is the arbiter of "is this
// invite still redeemable". These tests pin the service to trusting it — the
// failure mode being guarded is a service that re-derives validity from the
// row it read, which loses every race.

const invite = (over: Record<string, unknown> = {}) => ({
  id: 1,
  code: 'ABCDEF0123456789ABCD',
  eventId: 42,
  createdBy: 3,
  expiresAt: null,
  maxUses: 1,
  uses: 0,
  revoked: false,
  createdAt: new Date('2026-08-01T00:00:00Z'),
  ...over,
});

describe('EventInvitesService', () => {
  let service: EventInvitesService;
  let repo: jest.Mocked<EventInvitesRepository>;

  beforeEach(() => {
    repo = {
      create: jest.fn().mockResolvedValue(undefined),
      findByCode: jest.fn().mockResolvedValue(invite()),
      findByEvent: jest.fn().mockResolvedValue([]),
      revoke: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<EventInvitesRepository>;

    service = new EventInvitesService(repo);
  });

  describe('create', () => {
    it('defaults maxUses to 1 and expiresAt to null', async () => {
      await service.create(42, 3);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 42, createdBy: 3, maxUses: 1, expiresAt: null }),
      );
    });

    it('honours an explicit maxUses and expiresAt', async () => {
      await service.create(42, 3, { maxUses: 25, expiresAt: '2026-09-01T12:00:00.000Z' });
      const row = repo.create.mock.calls[0][0];
      expect(row.maxUses).toBe(25);
      expect(row.expiresAt).toBeInstanceOf(Date);
      expect(row.expiresAt?.toISOString()).toBe('2026-09-01T12:00:00.000Z');
    });

    it('rejects a maxUses below 1 before touching the repository', async () => {
      await expect(service.create(42, 3, { maxUses: 0 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('generates a 20-char hex code that is not guessable from the event id', async () => {
      await service.create(42, 3);
      await service.create(42, 3);
      const codes = repo.create.mock.calls.map((c) => c[0].code);
      expect(codes[0]).toMatch(/^[0-9A-F]{20}$/);
      expect(codes[0]).not.toBe(codes[1]);
    });

    it('returns the row it just wrote', async () => {
      const created = invite({ code: 'X' });
      repo.findByCode.mockResolvedValue(created as never);
      await expect(service.create(42, 3)).resolves.toBe(created);
    });

    it('throws when the created row cannot be read back', async () => {
      repo.findByCode.mockResolvedValue(undefined);
      await expect(service.create(42, 3)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getByCode', () => {
    it('404s an unknown code', async () => {
      repo.findByCode.mockResolvedValue(undefined);
      await expect(service.getByCode('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('revoke', () => {
    it('makes a live code unusable', async () => {
      await service.revoke('ABC');
      expect(repo.revoke).toHaveBeenCalledWith('ABC');

      // After revocation the conditional UPDATE stops matching, so a redemption
      // of the same code loses even though the row still reads back.
      repo.consume.mockResolvedValue(false);
      await expect(service.consume('ABC')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('404s an unknown code and revokes nothing', async () => {
      repo.findByCode.mockResolvedValue(undefined);
      await expect(service.revoke('nope')).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.revoke).not.toHaveBeenCalled();
    });
  });

  describe('consume', () => {
    it('returns the invite when the atomic guard reports a win', async () => {
      const row = invite();
      repo.findByCode.mockResolvedValue(row as never);
      await expect(service.consume(row.code)).resolves.toBe(row);
      expect(repo.consume).toHaveBeenCalledWith(row.code);
    });

    it('404s a code that does not exist at all', async () => {
      repo.findByCode.mockResolvedValue(undefined);
      await expect(service.consume('nope')).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.consume).not.toHaveBeenCalled();
    });

    it.each([
      ['revoked', invite({ revoked: true })],
      ['exhausted', invite({ uses: 1, maxUses: 1 })],
      ['expired', invite({ expiresAt: new Date('2020-01-01T00:00:00Z') })],
    ])('throws when the guard reports 0 affected rows (%s)', async (_label, row) => {
      repo.findByCode.mockResolvedValue(row as never);
      repo.consume.mockResolvedValue(false);
      await expect(service.consume(row.code)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('trusts the guard over the row it read: a stale-looking row still wins', async () => {
      // The read is advisory. If the UPDATE matched, the redemption is valid —
      // the service must not second-guess it from a snapshot taken earlier.
      repo.findByCode.mockResolvedValue(invite({ uses: 1, maxUses: 1 }) as never);
      repo.consume.mockResolvedValue(true);
      await expect(service.consume('ABC')).resolves.toMatchObject({ eventId: 42 });
    });

    it('double-spend: of two concurrent redemptions only one wins', async () => {
      repo.findByCode.mockResolvedValue(invite() as never);
      repo.consume.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      const results = await Promise.allSettled([
        service.consume('ABC'),
        service.consume('ABC'),
      ]);

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const rejected = results.find((r) => r.status === 'rejected');
      expect((rejected as PromiseRejectedResult).reason).toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});

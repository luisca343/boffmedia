import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SharexTokensService } from './sharex-tokens.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

const row = (over: Record<string, unknown> = {}) => ({
  id: 7,
  label: 'Tester',
  tokenHash: sha256('plaintext'),
  createdBy: 1,
  usedAt: null,
  deletedAt: null,
  createdAt: new Date('2026-08-20T10:00:00Z'),
  updatedAt: new Date('2026-08-20T10:00:00Z'),
  ...over,
});

// Drizzle's builders are chainable; each terminal (`limit`, `orderBy`,
// `execute`) resolves to whatever the test queued.
const selectResult: { rows: any[] } = { rows: [] };
const insertResult: { value: any } = { value: [{ insertId: 7 }] };

const mockSelect = {
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn(() => Promise.resolve(selectResult.rows)),
  limit: jest.fn(() => Promise.resolve(selectResult.rows)),
};
const mockInsert = {
  values: jest.fn().mockReturnThis(),
  execute: jest.fn(() => Promise.resolve(insertResult.value)),
};
const mockUpdate = {
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  execute: jest.fn(() => Promise.resolve(undefined)),
};
const mockDrizzle = {
  select: jest.fn(() => mockSelect),
  insert: jest.fn(() => mockInsert),
  update: jest.fn(() => mockUpdate),
};
const mockDb = { getDrizzle: jest.fn(() => mockDrizzle) };

describe('SharexTokensService', () => {
  let service: SharexTokensService;

  beforeEach(async () => {
    jest.clearAllMocks();
    selectResult.rows = [];
    insertResult.value = [{ insertId: 7 }];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharexTokensService,
        { provide: MySQL2Service, useValue: mockDb },
      ],
    }).compile();

    service = module.get(SharexTokensService);
  });

  describe('create()', () => {
    it('returns the plaintext but stores only its SHA-256', async () => {
      selectResult.rows = [row()];

      const { token, summary } = await service.create('Tester', 1);

      // 32 random bytes as hex.
      expect(token).toMatch(/^[0-9a-f]{64}$/);

      const stored = (mockInsert.values as jest.Mock).mock.calls[0][0];
      expect(stored.tokenHash).toBe(sha256(token));
      // The plaintext must never appear in what is written.
      expect(JSON.stringify(stored)).not.toContain(token);
      expect(stored.label).toBe('Tester');
      expect(stored.createdBy).toBe(1);
      expect(summary.id).toBe(7);
    });

    it('issues a different token each time', async () => {
      selectResult.rows = [row()];
      const a = await service.create('A', null);
      const b = await service.create('B', null);
      expect(a.token).not.toBe(b.token);
    });
  });

  describe('resolve()', () => {
    it('returns the row for a token whose hash matches', async () => {
      selectResult.rows = [row()];
      await expect(service.resolve('plaintext')).resolves.toMatchObject({
        id: 7,
      });
    });

    // The revoked filter is in the WHERE clause, so a revoked token simply does
    // not come back — a caller cannot forget to check `deletedAt`.
    it('returns null when the query matches nothing', async () => {
      selectResult.rows = [];
      await expect(service.resolve('plaintext')).resolves.toBeNull();
    });

    it('returns null for an empty token without querying at all', async () => {
      await expect(service.resolve('')).resolves.toBeNull();
      expect(mockDrizzle.select).not.toHaveBeenCalled();
    });
  });

  describe('revoke()', () => {
    it('soft-deletes rather than removing, so uploads stay attributable', async () => {
      selectResult.rows = [row()];

      await service.revoke(7);

      expect(mockDrizzle.update).toHaveBeenCalled();
      const patch = (mockUpdate.set as jest.Mock).mock.calls[0][0];
      expect(patch.deletedAt).toBeInstanceOf(Date);
    });

    it('is idempotent — revoking twice does not rewrite the timestamp', async () => {
      selectResult.rows = [row({ deletedAt: new Date('2026-01-01') })];

      const summary = await service.revoke(7);

      expect(mockDrizzle.update).not.toHaveBeenCalled();
      expect(summary.revoked).toBe(true);
    });

    it('404s for an unknown id', async () => {
      selectResult.rows = [];
      await expect(service.revoke(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('list()', () => {
    it('never exposes the hash', async () => {
      selectResult.rows = [row()];

      const [summary] = await service.list();

      expect(summary).toEqual({
        id: 7,
        label: 'Tester',
        createdBy: 1,
        createdAt: expect.any(Date),
        usedAt: null,
        revoked: false,
      });
      expect(JSON.stringify(summary)).not.toContain(sha256('plaintext'));
    });
  });
});

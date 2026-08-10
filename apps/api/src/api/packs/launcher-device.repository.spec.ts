import { SQL } from 'drizzle-orm';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { LauncherDeviceRepository } from './launcher-device.repository';

// No database here. What these tests pin down is the SHAPE of the two
// conditional UPDATEs: the whole single-use guarantee of the device flow lives
// in their WHERE clauses, so a clause silently dropped in a refactor is the
// bug worth catching.

const render = (condition: unknown) =>
  new MySqlDialect().sqlToQuery(condition as SQL).sql;

interface Captured {
  set?: Record<string, unknown>;
  where?: unknown;
}

const makeDb = (affectedRows = 1) => {
  const captured: Captured = {};
  const rows: unknown[] = [];
  const db = {
    insert: jest.fn(() => ({
      values: jest.fn((v: unknown) => {
        captured.set = v as Record<string, unknown>;
        return Promise.resolve(undefined);
      }),
    })),
    select: jest.fn(() => {
      const chain: Record<string, unknown> = {};
      chain.from = jest.fn(() => chain);
      chain.where = jest.fn((c: unknown) => {
        captured.where = c;
        return chain;
      });
      chain.limit = jest.fn(() => Promise.resolve(rows));
      return chain;
    }),
    update: jest.fn(() => ({
      set: jest.fn((v: Record<string, unknown>) => {
        captured.set = v;
        return {
          where: jest.fn((c: unknown) => {
            captured.where = c;
            return Promise.resolve([{ affectedRows }]);
          }),
        };
      }),
    })),
    delete: jest.fn(() => ({
      where: jest.fn((c: unknown) => {
        captured.where = c;
        return Promise.resolve([{ affectedRows }]);
      }),
    })),
  };
  return { db, captured, rows };
};

describe('LauncherDeviceRepository', () => {
  describe('decide', () => {
    it('only flips a row that is still pending and still live', async () => {
      const { db, captured } = makeDb(1);
      const repo = new LauncherDeviceRepository(db as never);

      await expect(repo.decide('BCDF-GHJK', 'approved', 7)).resolves.toBe(true);

      expect(captured.set).toEqual({ status: 'approved', userId: 7 });
      const where = render(captured.where);
      expect(where).toContain('`user_code` = ?');
      expect(where).toContain('`status` = ?');
      // The expiry check must be inside the UPDATE — a late click on an expired
      // code cannot be stopped by a read-then-write.
      expect(where).toContain('`expires_at` > NOW()');
    });

    it('reports a loss when no row matched', async () => {
      const { db } = makeDb(0);
      const repo = new LauncherDeviceRepository(db as never);
      await expect(repo.decide('BCDF-GHJK', 'denied', 9)).resolves.toBe(false);
    });
  });

  describe('consume', () => {
    it('burns only an approved, not-yet-consumed row', async () => {
      const { db, captured } = makeDb(1);
      const repo = new LauncherDeviceRepository(db as never);

      await expect(repo.consume('dev')).resolves.toBe(true);

      expect(Object.keys(captured.set ?? {})).toEqual(['consumedAt']);
      const where = render(captured.where);
      expect(where).toContain('`device_code` = ?');
      expect(where).toContain('`status` = ?');
      // Without this clause a replayed poll would mint a second 30-day session.
      expect(where).toContain('`consumed_at` is null');
    });

    it('reports a loss on the replayed consume', async () => {
      const { db } = makeDb(0);
      const repo = new LauncherDeviceRepository(db as never);
      await expect(repo.consume('dev')).resolves.toBe(false);
    });
  });

  it('sweepExpired deletes strictly past-TTL rows', async () => {
    const { db, captured } = makeDb(3);
    const repo = new LauncherDeviceRepository(db as never);
    await repo.sweepExpired();
    expect(render(captured.where)).toContain('`expires_at` < ?');
  });
});

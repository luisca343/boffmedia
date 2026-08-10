import { SQL } from 'drizzle-orm';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { EventInvitesRepository } from './event-invites.repository';

// No database. These tests pin the WHERE clause of `consume`, which is the only
// thing standing between a single-use invite and two people redeeming it.

const render = (condition: unknown) =>
  new MySqlDialect().sqlToQuery(condition as SQL).sql;

const makeDb = (affectedRows = 1) => {
  const captured: { set?: Record<string, unknown>; where?: unknown } = {};
  const db = {
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
  };
  return { db, captured };
};

describe('EventInvitesRepository.consume', () => {
  it('increments uses only while the invite is live, and reports the win', async () => {
    const { db, captured } = makeDb(1);
    const repo = new EventInvitesRepository(db as never);

    await expect(repo.consume('ABC')).resolves.toBe(true);

    // The counter is bumped in SQL, never read-modify-written in JS.
    expect(render(captured.set?.uses)).toContain('`uses` + 1');

    const where = render(captured.where);
    expect(where).toContain('`code` = ?');
    expect(where).toContain('`revoked` = ?');
    expect(where).toContain('`uses` < ');
    expect(where).toContain('`max_uses`');
    expect(where).toContain('`expires_at` IS NULL OR');
    expect(where).toContain('`expires_at` > NOW()');
  });

  it('reports a loss when the guard matched nothing', async () => {
    const { db } = makeDb(0);
    const repo = new EventInvitesRepository(db as never);
    await expect(repo.consume('ABC')).resolves.toBe(false);
  });
});

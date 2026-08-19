import { drizzle } from 'drizzle-orm/mysql2';
import { PacksRepository } from './packs.repository';

// There is no database in this suite. Instead the repository is driven over a
// REAL drizzle builder wired to a stub mysql2 client, so the SQL it emits —
// subqueries and all — can be asserted verbatim. That catches the two failures
// that matter for entitlement: an access clause silently dropped, and the
// listing fanning out over pack_grants instead of using a correlated EXISTS.
// What it cannot prove is what MySQL does with that SQL; see the note at the
// bottom of this file for the integration coverage still owed.

const UUID = '069a79f4-44e9-4726-a5be-fca90e38aaf5';

interface Executed {
  sql: string;
  params: unknown[];
}

const harness = () => {
  const executed: Executed[] = [];
  // Rows the NEXT query resolves to, in order. mysql2 is driven with
  // rowsAsArray, so a row is an array of column values.
  const results: unknown[][][] = [];

  const run = (cfg: any, params: unknown[]) => {
    executed.push({ sql: cfg?.sql ?? cfg, params: params ?? [] });
    return Promise.resolve([results.shift() ?? [], []]);
  };

  const client: any = { query: run, execute: run };
  const repo = new PacksRepository(drizzle(client) as never);

  return {
    repo,
    executed,
    queue: (rows: unknown[][]) => results.push(rows),
    last: () => executed[executed.length - 1],
  };
};

describe('PacksRepository — entitlement derivation (query shape)', () => {
  describe('listVisibleTo', () => {
    it('unions the three access sources for an account principal', async () => {
      const h = harness();
      await h.repo.listVisibleTo({ userId: 7, mcUuid: UUID } as never);
      const { sql, params } = h.last();

      // Exactly one query: the whole decision is made in the database.
      expect(h.executed).toHaveLength(1);
      // (a) public/password kind
      expect(sql).toContain('`packs`.`access_kind` in (?, ?)');
      expect(params).toEqual(expect.arrayContaining(['public', 'password']));
      // (a) direct grant by userId
      expect(sql).toContain(
        'exists (select 1 from `pack_grants` where (`pack_grants`.`pack_id` = `packs`.`id` and `pack_grants`.`user_id` = ?))',
      );
      // (a) event membership
      expect(sql).toContain(
        'exists (select 1 from `boffmedia_event_participants`',
      );
      // Archived packs never appear.
      expect(sql).toContain('`packs`.`archived` = ?');
    });

    it('cannot fan out: every non-public source is an EXISTS, never a join', async () => {
      const h = harness();
      await h.repo.listVisibleTo({ userId: 7, mcUuid: UUID } as never);
      const { sql } = h.last();

      // A left join on the (pack_id, user_id, source) PK would list a pack once
      // per grant, so a user with both an `admin` and an `invite` grant would
      // see it twice. Correlated subqueries cannot do that.
      const outer = sql.slice(0, sql.indexOf('exists ('));
      expect(outer).not.toContain('join');
      expect(sql.match(/exists \(select 1 from/g) ?? []).toHaveLength(3);
      // Nothing selects columns out of pack_grants into the listing.
      expect(sql).not.toMatch(/select[^()]*`pack_grants`\.`source`/);
    });

    it('correlates each subquery to packs.id, not to a literal pack', async () => {
      const h = harness();
      await h.repo.listVisibleTo({ userId: 7 } as never);
      const { sql } = h.last();

      expect(sql).toContain('`pack_grants`.`pack_id` = `packs`.`id`');
      expect(sql).toContain('`pack_acl`.`pack_id` = `packs`.`id`');
      expect(sql).toContain('`boffmedia_events`.`pack_id` = `packs`.`id`');
    });

    it('resolves pack_acl through the CURRENTLY linked uuid for an account principal', async () => {
      const h = harness();
      await h.repo.listVisibleTo({
        userId: 7,
        mcUuid: 'a-stale-claim',
      } as never);
      const { sql, params } = h.last();

      // The token's mcUuid claim lives 30 days and goes stale on unlink/relink,
      // so the ACL source joins boffmedia_users on the ACCOUNT id instead.
      expect(sql).toContain(
        'inner join `boffmedia_users` on `boffmedia_users`.`uuid` = `pack_acl`.`uuid`',
      );
      expect(sql).toContain('`boffmedia_users`.`id` = ?');
      expect(sql).toContain('`boffmedia_users`.`deleted_at` is null');
      expect(params).not.toContain('a-stale-claim');
    });

    it('falls back to the raw uuid claim only for a principal with no userId', async () => {
      const h = harness();
      await h.repo.listVisibleTo({ mcUuid: UUID } as never);
      const { sql, params } = h.last();

      expect(sql).toContain('`pack_acl`.`uuid` = ?');
      expect(params).toContain(UUID);
      // No account, so no direct pack_grants source at all.
      expect(sql).not.toContain('`pack_grants`');
    });

    it('an anonymous principal sees public/password packs only', async () => {
      const h = harness();
      await h.repo.listVisibleTo({} as never);
      const { sql } = h.last();

      expect(sql).toContain('`packs`.`access_kind` in (?, ?)');
      expect(sql).not.toContain('`pack_grants`');
      expect(sql).not.toContain('`pack_acl`');
      expect(sql).not.toContain('`boffmedia_event_participants`');
    });
  });

  describe('eventMembershipExists', () => {
    it('counts only registered|confirmed participants of a live event', async () => {
      const h = harness();
      await h.repo.listVisibleTo({ userId: 7 } as never);
      const { sql, params } = h.last();

      expect(sql).toContain(
        '`boffmedia_event_participants`.`status` in (?, ?)',
      );
      // A soft-deleted event must stop conferring access.
      expect(sql).toContain('`boffmedia_events`.`deleted_at` is null');
      // Anonymous participants (no user_id) derive nothing.
      expect(sql).toContain('`boffmedia_participants`.`user_id` = ?');

      expect(params).toEqual(
        expect.arrayContaining(['registered', 'confirmed']),
      );
      expect(params).not.toContain('removed');
      expect(params).not.toContain('waitlisted');
      expect(params).not.toContain('cancelled');
    });

    it('reaches membership through the linked account for a uuid-only principal', async () => {
      const h = harness();
      await h.repo.listVisibleTo({ mcUuid: UUID } as never);
      const { sql } = h.last();

      expect(sql).toContain(
        'inner join `boffmedia_users` on `boffmedia_users`.`id` = `boffmedia_participants`.`user_id`',
      );
      expect(sql).toContain('`boffmedia_users`.`uuid` = ?');
    });
  });

  describe('hasAccess', () => {
    it('short-circuits on a direct grant without asking anything else', async () => {
      const h = harness();
      h.queue([[7]]);

      await expect(
        h.repo.hasAccess('pk1', { userId: 7 } as never),
      ).resolves.toBe(true);
      expect(h.executed).toHaveLength(1);
      expect(h.executed[0].sql).toContain('from `pack_grants`');
      expect(h.executed[0].sql).toContain('`pack_grants`.`pack_id` = ?');
    });

    it('falls through grant → acl → membership and answers false when all miss', async () => {
      const h = harness();
      h.queue([]); // grant
      h.queue([]); // acl
      h.queue([[0]]); // membership probe

      await expect(
        h.repo.hasAccess('pk1', { userId: 7, mcUuid: UUID } as never),
      ).resolves.toBe(false);
      expect(h.executed).toHaveLength(3);
      expect(h.executed[2].sql).toContain('`boffmedia_event_participants`');
      // The membership clause is bound to THIS pack, not correlated to packs.id.
      expect(h.executed[2].sql).not.toContain(
        '`boffmedia_events`.`pack_id` = `packs`.`id`',
      );
    });

    it('answers true when the membership probe matches', async () => {
      const h = harness();
      h.queue([]);
      h.queue([]);
      h.queue([[1]]);

      await expect(
        h.repo.hasAccess('pk1', { userId: 7 } as never),
      ).resolves.toBe(true);
    });

    it('answers true on a legacy ACL row reached through the linked account', async () => {
      const h = harness();
      h.queue([]); // grant miss
      h.queue([[UUID]]); // acl hit via boffmedia_users

      await expect(
        h.repo.hasAccess('pk1', {
          userId: 7,
          mcUuid: 'a-stale-claim',
        } as never),
      ).resolves.toBe(true);
      expect(h.executed[1].sql).toContain('`boffmedia_users`.`id` = ?');
      expect(h.executed[1].sql).toContain(
        '`boffmedia_users`.`deleted_at` is null',
      );
      expect(h.executed[1].params).not.toContain('a-stale-claim');
    });

    it('uses the raw uuid claim for a principal with no userId', async () => {
      const h = harness();
      h.queue([[UUID]]);

      await expect(
        h.repo.hasAccess('pk1', { mcUuid: UUID } as never),
      ).resolves.toBe(true);
      expect(h.executed[0].sql).toContain('`pack_acl`.`uuid` = ?');
      expect(h.executed[0].params).toContain(UUID);
    });

    it('answers false for an anonymous principal without running any access query', async () => {
      const h = harness();
      await expect(h.repo.hasAccess('pk1', {} as never)).resolves.toBe(false);
      expect(h.executed).toHaveLength(0);
    });
  });
});

describe('PacksRepository.claimLegacyGrants', () => {
  it('converts each legacy pack_acl row into a grant, mapping the source', async () => {
    const h = harness();
    // select packId, grantedBy, viaInvite from pack_acl
    h.queue([
      ['pk1', 3, null],
      ['pk2', null, 'INV123'],
    ]);

    await expect(h.repo.claimLegacyGrants(7, UUID)).resolves.toBe(2);

    const inserts = h.executed.filter((e) => e.sql.startsWith('insert'));
    expect(inserts).toHaveLength(2);
    expect(inserts[0].sql).toContain('`pack_grants`');
    // viaInvite null → an admin grant with no source ref.
    expect(inserts[0].params).toEqual(['pk1', 7, 'admin', null, 3]);
    // viaInvite set → an invite grant carrying the code as its source ref.
    expect(inserts[1].params).toEqual(['pk2', 7, 'invite', 'INV123', null]);
    // Re-granting an entitlement the account already has must not 500.
    expect(inserts[0].sql).toContain('on duplicate key update');
  });

  it('consumes the source rows it claimed', async () => {
    const h = harness();
    h.queue([['pk1', null, null]]);

    await h.repo.claimLegacyGrants(7, UUID);

    const del = h.executed.filter((e) => e.sql.startsWith('delete'));
    expect(del).toHaveLength(1);
    expect(del[0].sql).toContain('from `pack_acl` where `pack_acl`.`uuid` = ?');
    expect(del[0].params).toEqual([UUID]);
  });

  it('is a no-op when there are no legacy rows', async () => {
    const h = harness();
    h.queue([]);

    await expect(h.repo.claimLegacyGrants(7, UUID)).resolves.toBe(0);
    // The read happens; no insert and no delete follow it.
    expect(h.executed).toHaveLength(1);
    expect(h.executed[0].sql.startsWith('select')).toBe(true);
  });

  it('selects the pre-grants by uuid', async () => {
    const h = harness();
    h.queue([]);

    await h.repo.claimLegacyGrants(7, UUID);
    expect(h.executed[0].sql).toContain(
      'from `pack_acl` where `pack_acl`.`uuid` = ?',
    );
    expect(h.executed[0].params).toEqual([UUID]);
  });
});

// ── Not covered here, and only reachable with a live database ───────────────
// * That `listVisibleTo` really returns ONE row per pack for a user holding both
//   an `admin` and an `invite` grant. The EXISTS shape is what guarantees it;
//   only a real query proves the row count.
// * That the membership probe `select <exists ...> from (select 1) as _` yields
//   1/0 in MySQL and that `Number(row.ok)` reads it — the shape is asserted, the
//   coercion is not.
// * `grantToUser`'s ON DUPLICATE KEY UPDATE against the real composite PK
//   (pack_id, user_id, source), i.e. that an invite grant and an admin grant
//   coexist while a repeat of the same source is idempotent.
// * Whether the legacy claim and the delete are atomic: claimLegacyGrants runs
//   N inserts and one delete with NO surrounding transaction, so a crash midway
//   leaves the pack_acl rows in place (re-runnable) — benign, but unproven.

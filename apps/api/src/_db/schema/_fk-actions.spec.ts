import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { is } from 'drizzle-orm';
import { getTableConfig, MySqlTable } from 'drizzle-orm/mysql-core';

/**
 * The database audit (`docs/audits/database-audit-2026-08-19.md` §4) found two
 * FK defects that a schema edit can silently reintroduce, because both are
 * invisible in TypeScript and only bite in production:
 *
 * 1. **An inverted cascade.** `boffmedia_users.uuid -> rotom_users.uuid` was
 *    `ON DELETE CASCADE`. The cascade fires when the *referenced* row goes, so
 *    deleting one Minecraft/SmartRotom identity deleted that person's whole
 *    website account — forum posts, events, packs, grants — through the FKs
 *    hanging off it. Reading the Drizzle line does not make that obvious: the
 *    action sits on the child but describes the parent's death.
 * 2. **Nine FKs with no `onDelete` at all**, so MySQL silently chose
 *    `RESTRICT`. Not wrong, but unrecorded: nobody could tell a deliberate
 *    restrict from a forgotten one, and the delete failed at runtime instead.
 *
 * Both are fixed (see `database-remediation-2026-08-19.md`). This suite is the
 * ratchet: it reads the Drizzle definitions themselves — no MySQL, no
 * connection — so re-inverting a cascade fails CI rather than deleting
 * accounts. The rules it enforces are written down in
 * `apps/api/src/_db/CONVENTIONS.md#foreign-keys`.
 */

const SCHEMA_DIR = __dirname;

/** The three sanctioned actions. `no action` is an unrecorded decision. */
const SANCTIONED = new Set(['cascade', 'set null', 'restrict']);

type Fk = {
  /** Child table — the one carrying the column and the action. */
  table: string;
  columns: string[];
  /** Parent table — deleting a row *here* is what triggers the action. */
  references: string;
  referencedColumns: string[];
  onDelete?: string;
  onUpdate?: string;
  /** True when any child column is NOT NULL (a `set null` there is a DDL error). */
  hasNotNullColumn: boolean;
  /** True when the parent key is a player uuid, the only key that ever changes. */
  referencesUuid: boolean;
};

/**
 * Loads every table the way `drizzle-kit` does — by globbing the schema
 * directory — so a new `schema/*.ts` file is covered the day it lands instead
 * of the day someone remembers to add it to a list in here.
 */
function collectForeignKeys(): Fk[] {
  const files = readdirSync(SCHEMA_DIR).filter(
    (f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'),
  );

  const fks: Fk[] = [];

  for (const file of files) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(join(SCHEMA_DIR, file)) as Record<string, unknown>;

    for (const exported of Object.values(mod)) {
      if (!is(exported, MySqlTable)) continue;

      const config = getTableConfig(exported);

      for (const fk of config.foreignKeys) {
        const ref = fk.reference();
        fks.push({
          table: config.name,
          columns: ref.columns.map((c) => c.name),
          references: getTableConfig(ref.foreignTable).name,
          referencedColumns: ref.foreignColumns.map((c) => c.name),
          onDelete: fk.onDelete,
          onUpdate: fk.onUpdate,
          hasNotNullColumn: ref.columns.some((c) => c.notNull),
          referencesUuid: ref.foreignColumns.some(
            (c) => c.getSQLType() === 'char(36)',
          ),
        });
      }
    }
  }

  return fks;
}

const label = (fk: Fk) =>
  `${fk.table}(${fk.columns.join(',')}) -> ` +
  `${fk.references}(${fk.referencedColumns.join(',')})`;

describe('foreign key actions', () => {
  const fks = collectForeignKeys();

  it('finds the schema (guards the glob against silently matching nothing)', () => {
    // A broken require or a moved directory would make every other assertion
    // in this file pass vacuously, which is the one failure mode a ratchet
    // must not have.
    expect(fks.length).toBeGreaterThan(150);
  });

  describe('the inverted cascade (audit §4, BUG)', () => {
    const link = fks.find(
      (fk) =>
        fk.table === 'boffmedia_users' &&
        fk.columns.join(',') === 'uuid' &&
        fk.references === 'rotom_users',
    );

    it('still exists as an FK', () => {
      expect(link).toBeDefined();
    });

    it('nulls the link instead of deleting the website account', () => {
      // The website account is the durable record of the person: it owns the
      // email, the password, the OAuth ids and everything the forum hangs off.
      // A game identity is a revocable attachment to it, so losing the
      // attachment must cost the attachment and nothing else.
      expect(link?.onDelete).toBe('set null');
      expect(link?.onDelete).not.toBe('cascade');
    });

    it('follows a uuid rewrite, because the Minecraft uuid is the key', () => {
      expect(link?.onUpdate).toBe('cascade');
    });
  });

  it('never cascades a delete INTO the website account row', () => {
    // The generalisation of the bug above. `boffmedia_users` is the child in
    // exactly one relationship today, but any FK added to it later has the
    // same trap available: whatever the parent is, its removal may never take
    // the account with it.
    const cascading = fks.filter(
      (fk) => fk.table === 'boffmedia_users' && fk.onDelete === 'cascade',
    );

    expect(cascading.map(label)).toEqual([]);
  });

  it('states an onDelete on every FK (audit §4, RISK: 9 were implicit)', () => {
    // MySQL's implicit RESTRICT is a decision, so it is written down rather
    // than inferred. Nine FKs used to leave it blank, which made a hard user
    // delete impossible once that user had posted — a latent trap that only
    // soft deletes were hiding.
    const implicit = fks.filter((fk) => fk.onDelete === undefined);

    expect(implicit.map(label)).toEqual([]);
  });

  it('uses only the three sanctioned actions', () => {
    // `no action` is RESTRICT again, spelled so it reads deliberate. See
    // CONVENTIONS.md for when each of the three applies.
    const unsanctioned = fks.filter(
      (fk) => fk.onDelete !== undefined && !SANCTIONED.has(fk.onDelete),
    );

    expect(unsanctioned.map((fk) => `${label(fk)} = ${fk.onDelete}`)).toEqual(
      [],
    );
  });

  it('never sets null on a NOT NULL column', () => {
    // Not a subtle bug — a hard DDL failure, so it breaks the migration on a
    // fresh database rather than in review.
    const impossible = fks.filter(
      (fk) => fk.onDelete === 'set null' && fk.hasNotNullColumn,
    );

    expect(impossible.map(label)).toEqual([]);
  });

  it('cascades onUpdate wherever the parent key is a player uuid', () => {
    // Surrogate int PKs never change, so leaving onUpdate off there is
    // honest. Player uuids are the one key the product does rewrite, and
    // every child of one has to follow it.
    const notFollowing = fks.filter(
      (fk) => fk.referencesUuid && fk.onUpdate !== 'cascade',
    );

    expect(notFollowing.map((fk) => `${label(fk)} = ${fk.onUpdate}`)).toEqual(
      [],
    );
  });

  describe('the ten FKs the audit named', () => {
    // Pinned individually, because for these ten the *specific* action is the
    // remediation. A blanket "must be explicit" rule would let someone swap
    // restrict for cascade on `forum_posts.user_id` and stay green, which is
    // how a hard user delete would start eating threads again.
    const EXPECTED: ReadonlyArray<
      [table: string, column: string, parent: string, onDelete: string]
    > = [
      // The inverted cascade, re-asserted here so the audit's ten read as one
      // list.
      ['boffmedia_users', 'uuid', 'rotom_users', 'set null'],
      // A category with threads in it is not something an admin should be able
      // to delete by accident.
      [
        'boffmedia_forum_threads',
        'category_id',
        'boffmedia_forum_categories',
        'restrict',
      ],
      // Posts and threads are content that must outlive the author's removal.
      // Users are soft-deleted and scrubbed in place, so this never fires; it
      // is the backstop for the day someone writes a hard delete.
      ['boffmedia_forum_threads', 'user_id', 'boffmedia_users', 'restrict'],
      // A denormalised pointer for the thread list, not ownership, so it may
      // go blank.
      [
        'boffmedia_forum_threads',
        'last_post_user_id',
        'boffmedia_users',
        'set null',
      ],
      // A post has no meaning without its thread.
      [
        'boffmedia_forum_posts',
        'thread_id',
        'boffmedia_forum_threads',
        'cascade',
      ],
      ['boffmedia_forum_posts', 'user_id', 'boffmedia_users', 'restrict'],
      // A vote is a tally entry, not content: it dies with either end.
      ['boffmedia_forum_votes', 'user_id', 'boffmedia_users', 'cascade'],
      [
        'boffmedia_forum_votes',
        'thread_id',
        'boffmedia_forum_threads',
        'cascade',
      ],
      // The scraped rows survive the paste being deleted; they just stop
      // linking to it.
      [
        'tools_vgc_pastes_repository',
        'paste_id',
        'tools_vgc_pokepastes',
        'set null',
      ],
      [
        'tools_vgc_limitless_teams',
        'paste_id',
        'tools_vgc_pokepastes',
        'set null',
      ],
    ];

    it.each(EXPECTED)(
      '%s.%s -> %s is ON DELETE %s',
      (table, column, parent, onDelete) => {
        const fk = fks.find(
          (candidate) =>
            candidate.table === table &&
            candidate.columns.join(',') === column &&
            candidate.references === parent,
        );

        expect(fk).toBeDefined();
        expect(fk?.onDelete).toBe(onDelete);
      },
    );
  });
});

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { getTableColumns, is } from 'drizzle-orm';
import { getTableConfig, MySqlTable } from 'drizzle-orm/mysql-core';

import { EXCLUDED_TABLES, EXPORTED_TABLES } from './data-export.manifest';

/**
 * The ratchet behind the GDPR export.
 *
 * The export's only real claim is completeness: "this is everything we hold on
 * you". Nothing in TypeScript enforces that — a new `schema/*.ts` table simply
 * never appears in the archive, and the claim quietly becomes false while every
 * other test stays green.
 *
 * So this suite reads the Drizzle definitions the way `drizzle-kit` does, by
 * globbing the schema directory, and fails when a table is in neither list of
 * `data-export.manifest.ts`. Adding a table then costs one decision — export it,
 * or write down why not — which is exactly the cost that should be paid.
 *
 * Same technique as `_db/schema/_fk-actions.spec.ts`: no MySQL, no connection.
 */

const SCHEMA_DIR = join(__dirname, '..', '..', '..', '_db', 'schema');

/** Every physical table name Drizzle knows about. */
function collectSchemaTables(): string[] {
  const files = readdirSync(SCHEMA_DIR).filter(
    (f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'),
  );

  const names: string[] = [];

  for (const file of files) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Load schema files dynamically to auto-discover tables
    const mod = require(join(SCHEMA_DIR, file)) as Record<string, unknown>;
    for (const exported of Object.values(mod)) {
      if (!is(exported, MySqlTable)) continue;
      names.push(getTableConfig(exported).name);
    }
  }

  return names;
}

describe('data export manifest', () => {
  const schemaTables = collectSchemaTables();
  const exported = EXPORTED_TABLES.map((t) => t.table);
  const excluded = EXCLUDED_TABLES.map((t) => t.table);
  const considered = new Set([...exported, ...excluded]);

  it('finds the schema (guards the glob against silently matching nothing)', () => {
    // A moved directory or a broken require would make every assertion below
    // pass vacuously, which is the one failure mode a ratchet must not have.
    expect(schemaTables.length).toBeGreaterThan(150);
  });

  it('has a decision for every table in the schema', () => {
    // THE test. A table added without a manifest entry lands here by name, and
    // the message is the instruction: export it, or say why not.
    const undecided = schemaTables.filter((t) => !considered.has(t));

    expect(undecided).toEqual([]);
  });

  it('names no table that does not exist', () => {
    // The other direction: a renamed or dropped table leaves a manifest entry
    // that quietly selects nothing, so the export silently shrinks.
    const known = new Set(schemaTables);
    const phantom = [...exported, ...excluded].filter((t) => !known.has(t));

    expect(phantom).toEqual([]);
  });

  it('decides each table exactly once', () => {
    const seen = new Map<string, number>();
    for (const t of [...exported, ...excluded]) {
      seen.set(t, (seen.get(t) ?? 0) + 1);
    }
    const duplicated = [...seen.entries()]
      .filter(([, n]) => n > 1)
      .map(([t]) => t);

    expect(duplicated).toEqual([]);
  });

  it('points every entry at the drizzle table it names', () => {
    // `table` is the string the completeness check matches on; `drizzle` is what
    // is actually queried. A copy-paste that leaves the two disagreeing exports
    // the wrong table's rows into a section labelled with the right name.
    const mismatched = EXPORTED_TABLES.filter(
      (spec) => getTableConfig(spec.drizzle).name !== spec.table,
    ).map((spec) => `${spec.table} -> ${getTableConfig(spec.drizzle).name}`);

    expect(mismatched).toEqual([]);
  });

  it('owns every exported table by at least one column of that table', () => {
    // An ownership column borrowed from a different table produces a cross join
    // in Drizzle rather than an error, and the archive fills with other
    // people's rows.
    const foreign: string[] = [];

    for (const spec of EXPORTED_TABLES) {
      const own = new Set(
        getTableConfig(spec.drizzle).columns.map((c) => c.name),
      );
      expect(spec.ownedBy.length).toBeGreaterThan(0);
      for (const { column } of spec.ownedBy) {
        if (!own.has(column.name)) foreign.push(`${spec.table}.${column.name}`);
      }
    }

    expect(foreign).toEqual([]);
  });

  it('redacts only columns the table actually has', () => {
    // `redact` deletes by Drizzle PROPERTY name, so a typo is silent: the key
    // stays in the row and another person's uuid ships in the archive.
    const unknown: string[] = [];

    for (const spec of EXPORTED_TABLES) {
      const props = new Set(Object.keys(getTableColumns(spec.drizzle)));
      for (const prop of spec.redact ?? []) {
        if (!props.has(prop)) unknown.push(`${spec.table}.${prop}`);
      }
    }

    expect(unknown).toEqual([]);
  });

  it('explains itself: every entry carries prose a person can read', () => {
    // An export nobody can read satisfies nothing, and a "why not" nobody can
    // read satisfies less. Both strings are shipped to the user.
    const mute = [
      ...EXPORTED_TABLES.filter((t) => t.meaning.trim().length < 20).map(
        (t) => `${t.table}: meaning`,
      ),
      ...EXCLUDED_TABLES.filter((t) => t.reason.trim().length < 20).map(
        (t) => `${t.table}: reason`,
      ),
    ];

    expect(mute).toEqual([]);
  });

  describe('the other-people rule, pinned where it is easiest to lose', () => {
    const spec = (table: string) =>
      EXPORTED_TABLES.find((t) => t.table === table);

    it('exports only messages the user SENT, never the reply', () => {
      // The single most tempting shortcut in a chat export is "give them the
      // conversation". The conversation is two people.
      expect(spec('rotom_chat_messages')?.ownedBy).toEqual([
        expect.objectContaining({ key: 'mcUuid' }),
      ]);
      expect(spec('rotom_chat_messages')?.ownedBy[0].column.name).toBe(
        'sender_uuid',
      );
    });

    it('exports follows the user made, never their followers', () => {
      const follows = spec('rotom_rooker_follows');
      expect(follows?.ownedBy).toHaveLength(1);
      expect(follows?.ownedBy[0].column.name).toBe('follower_uuid');
      // The inverse would hand the user a list of everyone who follows them —
      // a set of other people's decisions, each one identifying its maker.
      expect(
        follows?.ownedBy.some((o) => o.column.name === 'followee_uuid'),
      ).toBe(false);
    });

    it('strips the counterparty from every row that has one', () => {
      const cases: ReadonlyArray<[table: string, column: string]> = [
        ['boffmedia_forum_threads', 'lastPostUserId'],
        ['tools_battlesim_replays', 'opponentUserId'],
        ['rotom_wigglypop_order_lines', 'sellerUuid'],
        ['rotom_wigglypop_reviews', 'sellerUuid'],
        ['rotom_gobierno_multas', 'issuedByUuid'],
        ['rotom_gobierno_denuncias', 'reporterUuid'],
        ['rotom_gobierno_denuncias', 'accusedUuid'],
        ['boffmedia_content_reports', 'reporterUserId'],
        ['boffmedia_content_reports', 'authorUserId'],
        ['boffmedia_moderation_sanctions', 'issuedByUserId'],
      ];

      for (const [table, column] of cases) {
        expect(spec(table)?.redact ?? []).toContain(column);
      }
    });

    it('never returns a live credential', () => {
      // Not the other-people rule, the other half of `redact`: these columns are
      // the user's own, and that is exactly why handing them back is dangerous.
      const cases: ReadonlyArray<[table: string, column: string]> = [
        ['boffmedia_users', 'password'],
        ['boffmedia_sharex_tokens', 'tokenHash'],
        ['boffmedia_event_invites', 'code'],
        ['pack_invites', 'code'],
        ['desktop_device_codes', 'deviceCode'],
        ['desktop_device_codes', 'userCode'],
      ];

      for (const [table, column] of cases) {
        expect(spec(table)?.redact ?? []).toContain(column);
      }
    });

    it('keeps every credential table out entirely', () => {
      for (const table of [
        'boffmedia_password_reset_tokens',
        'boffmedia_email_verifications',
        'boffmedia_refresh_tokens',
        'boffmedia_user_totp',
        'boffmedia_user_backup_codes',
      ]) {
        expect(excluded).toContain(table);
        expect(exported).not.toContain(table);
      }
    });
  });
});

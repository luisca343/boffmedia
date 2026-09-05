#!/usr/bin/env node
/**
 * The other half of N25: `drizzle-kit generate` was repaired by rebuilding the
 * snapshot chain, but `drizzle-kit migrate` is still unusable, and for an
 * unrelated reason -- `__drizzle_migrations` is EMPTY.
 *
 * WHAT THAT MEANS. The migrator reads exactly one row:
 *
 *     select id, hash, created_at from `__drizzle_migrations`
 *       order by created_at desc limit 1
 *
 * and then applies every migration whose folder timestamp is newer than that
 * row. With no rows at all, "newer than nothing" is all 21 of them -- against a
 * schema where all 21 are already applied. The first CREATE TABLE would fail on
 * "table already exists", and it would fail HALFWAY, having run whatever came
 * before it. So the ledger is not bookkeeping: it is the only thing standing
 * between `pnpm --filter api migrate` and a half-applied database.
 *
 * This writes the backfill that makes the ledger true. It does NOT run it --
 * owner decision 2026-09-05: a script you apply deliberately, never something
 * that writes to the migrations ledger on its own. A wrong guess about which
 * migrations are applied is silent and very hard to unwind.
 *
 * THE HASHES ARE NOT COMPUTED HERE. They come from drizzle-orm's own
 * `readMigrationFiles`, the exact function the migrator calls, so they cannot
 * drift from what it will compare against. Reimplementing "sha256 of the file"
 * would be a guess that happens to work until a drizzle release changes it.
 *
 * THE GENERATED SQL IS SAFE TO RUN TWICE AND REFUSES A NON-EMPTY LEDGER. It
 * reads the row count into a variable first and inserts only when that count is
 * zero. A database that has been partially migrated by hand therefore comes out
 * untouched rather than quietly stamped as complete -- which is the failure this
 * whole file exists to prevent, and it would be absurd to reintroduce it here.
 *
 * BEFORE YOU RUN IT, on a database you care about: this asserts that every
 * migration in the journal is already applied. That is true of this deployment
 * (migrations are applied by hand on the server, and the schema is current). It
 * is NOT true of a fresh database -- there, run the migrations, do not backfill.
 *
 * MEASURED, through drizzle's own migrator rather than by reasoning about it --
 * `MySqlDialect.migrate()` driven against a stub session that counts the
 * statements it would issue:
 *
 *   empty ledger (today)             537 statements, against a schema that has them
 *   backfilled ledger                  0
 *   backfilled minus the last one      4   (that migration's own statements)
 *
 * The third line is the one that matters: the backfill must not turn `migrate`
 * into a permanent no-op. It does not -- a genuinely pending migration still
 * runs. A fix here that made all three read 0 would look like a success.
 *
 *   node scripts/generate-migration-backfill.mjs          # write the file
 *   node scripts/generate-migration-backfill.mjs --check  # fail if it is stale
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = join(ROOT, 'apps/api');
const MIGRATIONS = join(API, 'drizzle/migrations');
const OUT = join(API, 'drizzle/backfill-drizzle-migrations.sql');

const check = process.argv.includes('--check');

// Resolved from apps/api, which is the package that owns drizzle-orm.
const require = createRequire(join(API, 'package.json'));
let readMigrationFiles;
try {
  ({ readMigrationFiles } = require('drizzle-orm/migrator'));
} catch (e) {
  console.error(
    `FAIL -- could not load drizzle-orm/migrator from apps/api (${e.message}).\n` +
      `This script deliberately uses drizzle's own reader so the hashes cannot drift\n` +
      `from what the migrator compares against. Do not replace it with a hand-rolled\n` +
      `sha256: that is a guess which works until a drizzle release changes it.\n`,
  );
  process.exit(1);
}

const journalPath = join(MIGRATIONS, 'meta/_journal.json');
if (!existsSync(journalPath)) {
  console.error(`FAIL -- ${journalPath} does not exist. This script is reading the wrong path.`);
  process.exit(1);
}
const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
const entries = journal.entries ?? [];

const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS });

// A reader that finds nothing would emit an empty, plausible-looking backfill
// that silently stamps the ledger as complete with zero rows in it.
if (migrations.length === 0) {
  console.error(
    'FAIL -- drizzle read ZERO migrations from drizzle/migrations. An empty backfill\n' +
      'is worse than none: it would create the ledger and leave it empty, which is the\n' +
      'exact state this file exists to fix.\n',
  );
  process.exit(1);
}
if (migrations.length !== entries.length) {
  console.error(
    `FAIL -- the journal lists ${entries.length} migrations but drizzle read ${migrations.length}.\n` +
      `The two disagree, so neither can be trusted to say what is applied.\n`,
  );
  process.exit(1);
}

const tagFor = (folderMillis) => {
  const hit = entries.find((e) => e.when === folderMillis);
  return hit ? hit.tag : '(not in journal)';
};

const rows = migrations
  .map(
    (m, i) =>
      `  ${i === 0 ? 'SELECT' : 'UNION ALL SELECT'} '${m.hash}', ${m.folderMillis}` +
      `  -- ${tagFor(m.folderMillis)}`,
  )
  .join('\n');

const sql = `-- GENERATED FILE -- DO NOT EDIT.
-- Source:     apps/api/drizzle/migrations (read through drizzle-orm's own readMigrationFiles)
-- Regenerate: node scripts/generate-migration-backfill.mjs
--
-- Marks the ${migrations.length} migrations in the journal as ALREADY APPLIED, so that
-- \`drizzle-kit migrate\` becomes usable instead of trying to replay all of them
-- against a schema that already has them.
--
-- RUN THIS ONLY ON A DATABASE WHERE EVERY MIGRATION IN THE JOURNAL IS ALREADY
-- APPLIED. On a fresh database, run the migrations instead -- backfilling there
-- would skip them forever and leave you with an empty schema the tooling
-- believes is current.
--
-- Safe to run twice: the insert is guarded on the ledger being empty, so a
-- non-empty ledger is left exactly as it was rather than being appended to.
--
--   mysql -u <user> -p <database> < apps/api/drizzle/backfill-drizzle-migrations.sql

CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
  id serial primary key,
  hash text not null,
  created_at bigint
);

-- Read the count BEFORE inserting anything: once the first row lands the table
-- is no longer empty, so a per-row \`WHERE NOT EXISTS\` would insert exactly one
-- migration and skip the other ${migrations.length - 1}.
SET @ledger_rows := (SELECT COUNT(*) FROM \`__drizzle_migrations\`);

INSERT INTO \`__drizzle_migrations\` (\`hash\`, \`created_at\`)
SELECT * FROM (
${rows}
) AS applied
WHERE @ledger_rows = 0;

-- What you should see: ${migrations.length} rows, and a newest \`created_at\` of
-- ${migrations[migrations.length - 1].folderMillis} (${tagFor(migrations[migrations.length - 1].folderMillis)}).
-- If \`ledger_rows_before\` is not 0, nothing was written and the ledger already
-- had content -- work out why before forcing anything.
SELECT
  @ledger_rows                                   AS ledger_rows_before,
  COUNT(*)                                       AS ledger_rows_now,
  MAX(created_at)                                AS newest_created_at
FROM \`__drizzle_migrations\`;
`;

if (check) {
  if (!existsSync(OUT)) {
    console.error(
      `FAIL -- ${OUT.replace(ROOT, '.')} does not exist.\n` +
        `Run: node scripts/generate-migration-backfill.mjs\n`,
    );
    process.exit(1);
  }
  const current = readFileSync(OUT, 'utf8');
  if (current !== sql) {
    console.error(
      `FAIL -- apps/api/drizzle/backfill-drizzle-migrations.sql is stale.\n\n` +
        `A migration was added, removed or edited since it was generated, so the file no\n` +
        `longer describes the journal. Applying a stale backfill marks the wrong set of\n` +
        `migrations as done -- and the ones it omits would then run against a schema that\n` +
        `already has them, which is the failure it exists to prevent.\n\n` +
        `Run: node scripts/generate-migration-backfill.mjs\n`,
    );
    process.exit(1);
  }
  console.log(
    `check-migration-backfill: backfill-drizzle-migrations.sql matches the journal ` +
      `(${migrations.length} migrations, newest ${tagFor(migrations[migrations.length - 1].folderMillis)}).\n`,
  );
} else {
  writeFileSync(OUT, sql, 'utf8');
  console.log(
    `Wrote apps/api/drizzle/backfill-drizzle-migrations.sql — ${migrations.length} migrations, ` +
      `newest ${tagFor(migrations[migrations.length - 1].folderMillis)}.\n\n` +
      `It is NOT applied. Run it yourself against a database where all ${migrations.length} are\n` +
      `already applied:\n\n` +
      `  mysql -u <user> -p <database> < apps/api/drizzle/backfill-drizzle-migrations.sql\n`,
  );
}
